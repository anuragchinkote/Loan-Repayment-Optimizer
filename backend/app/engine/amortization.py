"""Loan Optimizer calculation engine.

Pure financial mathematics: amortization, repayment strategies,
and loan comparisons. This module is the source of financial truth.

It is deliberately free of any UI, API, database, or CLI concerns:
it never prompts the user, writes to the terminal, terminates the
process, or logs. It is pure computation.

Money model:
    - All monetary values use ``decimal.Decimal``.
    - The EMI and scheduled payments are rounded to 2 decimal places.
    - Monthly interest is rounded to 2 decimal places.
    - Each schedule row records the lump sum actually applied that month
      (``lump_sum``) alongside the regular monthly ``payment``.
    - ``LoanResult.total_payment`` is all cash paid by the borrower:
      the sum of every monthly payment plus every applied lump sum.
    - Balances keep full Decimal precision while accumulating, so the
      final adjusted payment brings the balance to exactly zero without
      rounding drift.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from decimal import localcontext
from decimal import ROUND_CEILING
from decimal import ROUND_HALF_UP
from typing import TypeAlias

_CENT = Decimal("0.01")
_MONEY = Decimal | int | float | str

ScheduleRow: TypeAlias = dict[str, Decimal | int]


def _to_decimal(value: _MONEY) -> Decimal:
    """Convert a user-supplied value to Decimal via string conversion."""
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _monthly_rate(annual_interest_rate: _MONEY) -> Decimal:
    """Annual percent rate -> decimal monthly rate (e.g. 10 -> 0.008333...)."""
    return _to_decimal(annual_interest_rate) / Decimal("100") / Decimal("12")


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def _validate_loan_inputs(
    principal: _MONEY,
    annual_interest_rate: _MONEY,
    number_of_months: int,
) -> None:
    """Validate basic loan inputs to the engine."""
    principal_decimal = _to_decimal(principal)
    rate_decimal = _to_decimal(annual_interest_rate)

    if principal_decimal <= 0:
        raise ValueError("principal must be greater than 0")
    if rate_decimal < 0:
        raise ValueError("annual_interest_rate must be non-negative")
    if (
        isinstance(number_of_months, bool)
        or not isinstance(number_of_months, int)
        or number_of_months <= 0
    ):
        raise ValueError("number_of_months must be a positive integer")


def _validate_strategy(
    strategy: "RepaymentStrategy",
    number_of_months: int,
) -> None:
    """Validate a repayment strategy against the loan term."""
    if _to_decimal(strategy.extra_monthly_payment) < 0:
        raise ValueError("extra_monthly_payment must be non-negative")

    for event in strategy.lump_sum_events:
        if _to_decimal(event.amount) < 0:
            raise ValueError("lump-sum amount must be non-negative")
        if (
            isinstance(event.month, bool)
            or not isinstance(event.month, int)
            or event.month < 1
            or event.month > number_of_months
        ):
            raise ValueError(
                "lump-sum event month must be between 1 and "
                "number_of_months"
            )


# ---------------------------------------------------------------------------
# Strategy representation
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class LumpSumEvent:
    """A one-off additional principal payment in a given month (1-based)."""

    month: int
    amount: _MONEY


@dataclass(frozen=True)
class RepaymentStrategy:
    """A repayment plan layered on top of the baseline EMI."""

    extra_monthly_payment: _MONEY = Decimal("0")
    lump_sum_events: tuple[LumpSumEvent, ...] = ()


# ---------------------------------------------------------------------------
# Core calculations
# ---------------------------------------------------------------------------


def _annuity_payment(
    principal: Decimal,
    rate: Decimal,
    months: int,
) -> Decimal:
    """Solve the annuity formula for the monthly payment at exact precision.

    Runs under an extended Decimal context so the intermediate powers do not
    lose precision that could flip the 2-decimal rounding.
    """
    if rate == 0:
        return principal / months
    with localcontext() as context:
        context.prec = 50
        factor = (Decimal(1) + rate) ** months
        return principal * rate * factor / (factor - 1)


def calculate_emi(
    principal: _MONEY,
    annual_interest_rate: _MONEY,
    number_of_months: int,
) -> Decimal:
    """Calculate the standard Equal Monthly Installment for a fixed-rate loan.

    EMI = P * r * (1 + r)^N / ((1 + r)^N - 1)

    where P is the principal, r the monthly rate, and N the number of months.
    A 0% interest rate is handled directly. The result is rounded to 2
    decimal places, since the EMI is the actual scheduled currency payment.
    """
    _validate_loan_inputs(principal, annual_interest_rate, number_of_months)

    principal_decimal = _to_decimal(principal)
    rate = _monthly_rate(annual_interest_rate)

    emi = _annuity_payment(principal_decimal, rate, number_of_months)

    return emi.quantize(_CENT, rounding=ROUND_HALF_UP)


def _amortize(
    principal: _MONEY,
    annual_interest_rate: _MONEY,
    number_of_months: int,
    monthly_payment: Decimal,
    lump_sum_events: tuple[LumpSumEvent, ...],
) -> list[ScheduleRow]:
    """Simulate a loan month by month until the balance reaches zero.

    Order per month:
        1.  Compute interest on the opening balance.
        2.  Apply the scheduled monthly payment (capped at what is owed).
        3.  Apply any lump-sum event for that month to the remaining
            principal (also capped, so the balance never goes negative).
        4.  Record the closing balance.

    ``monthly_payment`` is the fixed planned currency payment each month;
    the final payment is clamped to the actual amount owed, so the schedule
    always ends with a closing balance of exactly zero.
    """
    rate = _monthly_rate(annual_interest_rate)

    lumps_by_month: dict[int, list[Decimal]] = {}
    for event in lump_sum_events:
        lumps_by_month.setdefault(event.month, []).append(
            _to_decimal(event.amount)
        )

    schedule: list[ScheduleRow] = []
    opening = _to_decimal(principal)
    month = 1

    while opening > 0:
        interest = (opening * rate).quantize(_CENT, rounding=ROUND_HALF_UP)
        owed = opening + interest

        payment = min(monthly_payment, owed)
        if payment >= owed:
            monthly_principal = opening
        else:
            monthly_principal = payment - interest
            if monthly_principal <= 0:
                raise ValueError(
                    "monthly payment is insufficient to cover the "
                    "monthly interest"
                )

        balance_after_monthly = opening - monthly_principal

        lump_applied = Decimal("0")
        for lump in lumps_by_month.get(month, ()):
            applied = min(lump, balance_after_monthly)
            balance_after_monthly -= applied
            lump_applied += applied

        principal_reduction = monthly_principal + lump_applied
        closing = opening - principal_reduction

        schedule.append(
            {
                "month": month,
                "opening_balance": opening,
                "payment": payment,
                "interest": interest,
                "principal": principal_reduction,
                "lump_sum": lump_applied,
                "closing_balance": closing,
            }
        )

        opening = closing
        month += 1

    return schedule


def calculate_loan_schedule(
    principal: _MONEY,
    annual_interest_rate: _MONEY,
    number_of_months: int,
) -> list[ScheduleRow]:
    """Generate the baseline amortization schedule for a fixed-rate loan.

    Each row is a dict with keys: month, opening_balance, payment, interest,
    principal, lump_sum, closing_balance. The final payment is a partial
    payment that brings the closing balance to exactly zero. In the baseline
    (no strategy), lump_sum is zero in every row.
    """
    return plan_loan(
        principal, annual_interest_rate, number_of_months
    ).schedule


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class LoanResult:
    """Aggregated outcome of simulating one loan plan."""

    monthly_payment: Decimal
    total_payment: Decimal
    total_interest: Decimal
    number_of_months: int
    schedule: list[ScheduleRow]


@dataclass(frozen=True)
class ComparisonResult:
    """Comparison between a baseline plan and a strategy plan."""

    interest_saved: Decimal
    time_saved_months: int
    payment_difference: Decimal
    baseline_total_payment: Decimal
    strategy_total_payment: Decimal
    baseline_interest: Decimal
    strategy_interest: Decimal


def plan_loan(
    principal: _MONEY,
    annual_interest_rate: _MONEY,
    number_of_months: int,
    strategy: RepaymentStrategy | None = None,
    actual_monthly_payment: _MONEY | None = None,
) -> LoanResult:
    """Simulate a loan plan.

    With no strategy this is the baseline plan: the monthly payment is the
    EMI and the loan follows the standard amortization schedule.

    With a :class:`RepaymentStrategy`, the monthly payment becomes
    base + extra_monthly_payment (and any lump-sum events are applied to
    principal as described in the module docstring).

    ``actual_monthly_payment`` overrides the base payment: instead of the
    EMI for the stated tenure, the schedule starts from the borrower's real
    current instalment. The loan then amortizes month by month until the
    balance reaches zero, so it may end before or after ``number_of_months``
    (the tenure is a contextual input, not an assumed payoff horizon).
    """
    _validate_loan_inputs(principal, annual_interest_rate, number_of_months)

    if actual_monthly_payment is None:
        base_payment = calculate_emi(
            principal, annual_interest_rate, number_of_months
        )
    else:
        base_payment = _to_decimal(actual_monthly_payment)
        if base_payment <= 0:
            raise ValueError(
                "actual_monthly_payment must be greater than 0"
            )

    if strategy is None:
        monthly_payment = base_payment
        lump_events: tuple[LumpSumEvent, ...] = ()
    else:
        _validate_strategy(strategy, number_of_months)
        monthly_payment = base_payment + _to_decimal(
            strategy.extra_monthly_payment
        )
        lump_events = strategy.lump_sum_events

    schedule = _amortize(
        principal,
        annual_interest_rate,
        number_of_months,
        monthly_payment,
        lump_events,
    )

    total_payment = sum(row["payment"] for row in schedule) + sum(
        row["lump_sum"] for row in schedule
    )
    total_interest = sum(row["interest"] for row in schedule)

    return LoanResult(
        monthly_payment=monthly_payment,
        total_payment=total_payment,
        total_interest=total_interest,
        number_of_months=len(schedule),
        schedule=schedule,
    )


def calculate_payment_for_target_term(
    principal: _MONEY,
    annual_interest_rate: _MONEY,
    target_months: int,
) -> Decimal:
    """Calculate the monthly payment needed to repay within ``target_months``.

    Uses the same annuity formula as :func:`calculate_emi` but solved for the
    payment given the desired term. The result is rounded up to the next cent
    so that the resulting schedule is guaranteed to finish within the target
    term.
    """
    _validate_loan_inputs(principal, annual_interest_rate, target_months)

    principal_decimal = _to_decimal(principal)
    rate = _monthly_rate(annual_interest_rate)

    payment = _annuity_payment(principal_decimal, rate, target_months)

    return payment.quantize(_CENT, rounding=ROUND_CEILING)


# ---------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------


def compare_schedules(
    baseline: LoanResult,
    strategy: LoanResult,
) -> ComparisonResult:
    """Compare a baseline loan plan against a strategy plan."""
    return ComparisonResult(
        interest_saved=baseline.total_interest - strategy.total_interest,
        time_saved_months=baseline.number_of_months - strategy.number_of_months,
        payment_difference=baseline.total_payment - strategy.total_payment,
        baseline_total_payment=baseline.total_payment,
        strategy_total_payment=strategy.total_payment,
        baseline_interest=baseline.total_interest,
        strategy_interest=strategy.total_interest,
    )