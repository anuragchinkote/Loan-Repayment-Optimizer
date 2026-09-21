"""Loan Optimizer API.

Thin HTTP layer over the frozen calculation engine. This module never
recomputes financials; it validates the request with Pydantic, delegates to
app.engine.amortization, and shapes the response. Monetary values are
serialized as strings.
"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.engine.amortization import (
    LoanResult,
    LumpSumEvent,
    RepaymentStrategy,
    calculate_emi,
    calculate_payment_for_target_term,
    compare_schedules,
    plan_loan,
)
from app.schemas import (
    ComparisonResponse,
    LoanPlanRequest,
    LoanPlanResponse,
    LoanResultResponse,
    ScheduleRowResponse,
    StrategyRequest,
)

app = FastAPI(title="Loan Optimizer API", version="0.1.0")

# CORS: allow the frontend's development/preview origins. Override with
# FRONTEND_ORIGINS (comma-separated) for the production origin.
DEFAULT_FRONTEND_ORIGINS = ",".join(
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
)


def _frontend_origins() -> list[str]:
    raw = os.getenv("FRONTEND_ORIGINS") or DEFAULT_FRONTEND_ORIGINS
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_frontend_origins(),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)


@app.get("/health")
def health() -> dict[str, str]:
    """Simple liveness probe."""
    return {"status": "ok"}


def _schedule_row(row: dict) -> ScheduleRowResponse:
    """Shape one engine schedule row into the response model (money as str)."""
    return ScheduleRowResponse(
        month=row["month"],
        opening_balance=str(row["opening_balance"]),
        payment=str(row["payment"]),
        interest=str(row["interest"]),
        principal=str(row["principal"]),
        lump_sum=str(row["lump_sum"]),
        closing_balance=str(row["closing_balance"]),
    )


def _loan_result(result: LoanResult) -> LoanResultResponse:
    """Shape an engine LoanResult into the response model (money as str)."""
    return LoanResultResponse(
        monthly_payment=str(result.monthly_payment),
        total_payment=str(result.total_payment),
        total_interest=str(result.total_interest),
        number_of_months=result.number_of_months,
        schedule=[_schedule_row(row) for row in result.schedule],
    )


def _build_strategy(
    strategy: StrategyRequest,
) -> RepaymentStrategy:
    """Turn a validated extra/lump-sum strategy request into an engine strategy.

    Target-term requests never reach here: they are handled in
    :func:`loan_plan` by simulating from the engine-computed required payment.
    """
    return RepaymentStrategy(
        extra_monthly_payment=strategy.extra_monthly_payment,
        lump_sum_events=tuple(
            LumpSumEvent(month=event.month, amount=event.amount)
            for event in strategy.lump_sum_events
        ),
    )


def _reject_target_combination(
    strategy: StrategyRequest,
    number_of_months: int,
) -> None:
    """Enforce the V1 target-term constraints (mutual exclusivity, term bound)."""
    if strategy.extra_monthly_payment != 0:
        raise HTTPException(
            status_code=400,
            detail="target_months cannot be combined with extra_monthly_payment",
        )
    if strategy.lump_sum_events:
        raise HTTPException(
            status_code=400,
            detail="target_months cannot be combined with lump_sum_events",
        )
    if strategy.target_months > number_of_months:
        raise HTTPException(
            status_code=400,
            detail="target_months must not exceed number_of_months",
        )


@app.post("/api/v1/loan/plan", response_model=LoanPlanResponse)
def loan_plan(payload: LoanPlanRequest) -> LoanPlanResponse:
    """Compute the baseline plan, the requested strategy, and their comparison."""
    principal = payload.principal
    annual_interest_rate = payload.annual_interest_rate
    number_of_months = payload.number_of_months
    actual = payload.current_monthly_instalment

    try:
        emi = calculate_emi(
            principal, annual_interest_rate, number_of_months
        )

        # The baseline is simulated from the borrower's actual current
        # instalment when supplied, otherwise from the EMI for the stated
        # tenure. The modeled payoff term may differ from the stated tenure.
        baseline = plan_loan(
            principal,
            annual_interest_rate,
            number_of_months,
            actual_monthly_payment=actual,
        )

        if payload.strategy is None:
            strategy_result = baseline
        elif payload.strategy.target_months is not None:
            _reject_target_combination(payload.strategy, number_of_months)
            required = calculate_payment_for_target_term(
                principal, annual_interest_rate, payload.strategy.target_months
            )
            # A target term is an absolute payment computed by the engine,
            # not an "extra" on top of the current instalment. Simulating
            # from it directly expresses both higher and lower payments
            # honestly.
            strategy_result = plan_loan(
                principal,
                annual_interest_rate,
                number_of_months,
                actual_monthly_payment=required,
            )
        else:
            strategy = _build_strategy(payload.strategy)
            strategy_result = plan_loan(
                principal,
                annual_interest_rate,
                number_of_months,
                strategy=strategy,
                actual_monthly_payment=actual,
            )

        comparison = compare_schedules(baseline, strategy_result)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return LoanPlanResponse(
        baseline=_loan_result(baseline),
        strategy=_loan_result(strategy_result),
        comparison=ComparisonResponse(
            interest_saved=str(comparison.interest_saved),
            months_saved=comparison.time_saved_months,
            payment_difference=str(comparison.payment_difference),
        ),
        standard_monthly_instalment=(
            str(emi) if actual is not None else None
        ),
    )