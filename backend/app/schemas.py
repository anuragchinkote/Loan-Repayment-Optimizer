"""Pydantic request/response models for the Loan Optimizer API.

Only request/response shaping lives here. All financial math stays in
the calculation engine (app.engine.amortization).
"""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class LumpSumEventRequest(BaseModel):
    """A one-off additional principal payment in a 1-based month."""

    model_config = {"extra": "forbid"}

    month: int = Field(gt=0, description="1-based month of the lump sum")
    amount: Decimal = Field(ge=0, description="Lump-sum amount applied to principal")


class StrategyRequest(BaseModel):
    """A repayment strategy layered on top of the baseline EMI.

    ``target_months`` is mutually exclusive with ``extra_monthly_payment``
    and ``lump_sum_events``: either pay a chosen fixed extra amount (plus
    optional lump sums), or let the engine compute the monthly payment needed
    to finish in a target term.
    """

    model_config = {"extra": "forbid"}

    extra_monthly_payment: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        description="Extra amount paid each month on top of the EMI",
    )
    lump_sum_events: list[LumpSumEventRequest] = Field(
        default_factory=list,
        description="One-off principal payments",
    )
    target_months: int | None = Field(
        default=None,
        gt=0,
        description=(
            "Desired payoff term in months; the API computes the required "
            "monthly payment via the engine. Mutually exclusive with "
            "extra_monthly_payment and lump_sum_events."
        ),
    )


class LoanPlanRequest(BaseModel):
    """Input to the loan plan endpoint."""

    model_config = {"extra": "forbid"}

    principal: Decimal = Field(gt=0, description="Loan amount")
    annual_interest_rate: Decimal = Field(
        ge=0, description="Annual interest rate in percent"
    )
    number_of_months: int = Field(
        gt=0, description="Loan term in months (1-based schedule)"
    )
    current_monthly_instalment: Decimal | None = Field(
        default=None,
        gt=0,
        description=(
            "The borrower's actual current monthly instalment. When "
            "provided, the baseline is simulated from this payment instead "
            "of the EMI for the stated tenure, and the modeled payoff term "
            "may differ from number_of_months."
        ),
    )
    strategy: StrategyRequest | None = Field(
        default=None,
        description="Optional repayment strategy; omit for baseline only",
    )


class ScheduleRowResponse(BaseModel):
    """One month of an amortization schedule."""

    month: int
    opening_balance: str
    payment: str
    interest: str
    principal: str
    lump_sum: str
    closing_balance: str


class LoanResultResponse(BaseModel):
    """Aggregated outcome of one loan plan."""

    monthly_payment: str
    total_payment: str
    total_interest: str
    number_of_months: int
    schedule: list[ScheduleRowResponse]


class ComparisonResponse(BaseModel):
    """Comparison between the baseline plan and the strategy plan."""

    interest_saved: str
    months_saved: int
    payment_difference: str


class EmiRequest(BaseModel):
    """Input to the standalone EMI endpoint (guidance before a plan exists)."""

    model_config = {"extra": "forbid"}

    principal: Decimal = Field(gt=0, description="Loan amount")
    annual_interest_rate: Decimal = Field(
        ge=0, description="Annual interest rate in percent"
    )
    number_of_months: int = Field(
        gt=0, description="Loan term in months"
    )


class EmiResponse(BaseModel):
    """The standard EMI that would clear the loan in the stated term."""

    emi: str


class LoanPlanResponse(BaseModel):
    """Full loan plan response."""

    baseline: LoanResultResponse
    strategy: LoanResultResponse
    comparison: ComparisonResponse
    standard_monthly_instalment: str | None = Field(
        default=None,
        description=(
            "The standard EMI that would clear the loan in the stated "
            "remaining tenure. Present when the request supplies a current "
            "monthly instalment, so clients can surface the non-blocking "
            "notice that the entered instalment differs from the standard "
            "amortization estimate."
        ),
    )