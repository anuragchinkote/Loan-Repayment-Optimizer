"""Tests for the Loan Optimizer calculation engine."""

from decimal import Decimal
from pathlib import Path

import pytest

from app.engine.amortization import (
    LumpSumEvent,
    RepaymentStrategy,
    calculate_emi,
    calculate_loan_schedule,
    calculate_payment_for_target_term,
    compare_schedules,
    plan_loan,
)

ENGINE_FILE = (
    Path(__file__).resolve().parents[1] / "app" / "engine" / "amortization.py"
)

BASELINE = {
    "principal": 500000,
    "annual_interest_rate": 10,
    "number_of_months": 120,
}


# ---------------------------------------------------------------------------
# EMI
# ---------------------------------------------------------------------------


def test_normal_emi():
    emi = calculate_emi(
        BASELINE["principal"],
        BASELINE["annual_interest_rate"],
        BASELINE["number_of_months"],
    )
    assert isinstance(emi, Decimal)
    assert abs(emi - Decimal("6607.53")) < Decimal("0.02")


def test_zero_interest_emi():
    assert calculate_emi(120000, 0, 12) == Decimal("10000.00")


def test_invalid_principal_raises():
    with pytest.raises(ValueError):
        calculate_emi(0, 10, 120)
    with pytest.raises(ValueError):
        calculate_emi(-500000, 10, 120)


def test_negative_interest_rate_raises():
    with pytest.raises(ValueError):
        calculate_emi(500000, -1, 120)


def test_invalid_term_raises():
    with pytest.raises(ValueError):
        calculate_emi(500000, 10, 0)
    with pytest.raises(ValueError):
        calculate_emi(500000, 10, -12)


def test_emi_accepts_numeric_input_types():
    for value in (Decimal("500000"), 500000.0, "500000"):
        emi = calculate_emi(value, 10, 120)
        assert abs(emi - Decimal("6607.53")) < Decimal("0.02")


# ---------------------------------------------------------------------------
# Baseline schedule
# ---------------------------------------------------------------------------


def test_baseline_schedule_approximately_120_payments():
    schedule = calculate_loan_schedule(**BASELINE)
    assert abs(len(schedule) - 120) == 0


def test_baseline_final_balance_is_exactly_zero():
    schedule = calculate_loan_schedule(**BASELINE)
    assert schedule[-1]["closing_balance"] == Decimal("0.00")


def test_total_principal_repaid_equals_principal():
    schedule = calculate_loan_schedule(**BASELINE)
    total_principal = sum(row["principal"] for row in schedule)
    assert total_principal == Decimal("500000.00")


def test_total_payment_equals_principal_plus_interest():
    schedule = calculate_loan_schedule(**BASELINE)
    total_payment = sum(row["payment"] for row in schedule)
    total_principal = sum(row["principal"] for row in schedule)
    total_interest = sum(row["interest"] for row in schedule)
    assert total_payment == total_principal + total_interest


def test_no_strategy_schedule_unchanged():
    plain = plan_loan(**BASELINE)
    schedule = calculate_loan_schedule(**BASELINE)
    assert plain.schedule == schedule
    assert plain.total_payment == Decimal("500000.00") + plain.total_interest

    first = plain.schedule[0]
    assert first["month"] == 1
    assert first["opening_balance"] == Decimal("500000.00")
    assert first["payment"] == Decimal("6607.54")
    assert first["interest"] == Decimal("4166.67")
    assert first["principal"] == Decimal("2440.87")
    assert first["lump_sum"] == Decimal("0.00")
    assert first["closing_balance"] == Decimal("497559.13")

    for row in plain.schedule:
        assert row["lump_sum"] == Decimal("0.00")


def test_final_partial_payment_handled():
    result = plan_loan(100000, 0, 12)
    schedule = result.schedule
    last = schedule[-1]
    assert last["closing_balance"] == Decimal("0.00")
    assert last["payment"] <= last["opening_balance"] + last["interest"]
    assert last["payment"] < result.monthly_payment


# ---------------------------------------------------------------------------
# Strategies: extra monthly payments and lump sums
# ---------------------------------------------------------------------------


def _baseline_result():
    return plan_loan(**BASELINE)


def test_extra_monthly_payment_reduces_payoff_time():
    baseline = _baseline_result()
    quick = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(extra_monthly_payment=3000),
    )
    assert quick.number_of_months < baseline.number_of_months


def test_extra_monthly_payment_reduces_total_interest():
    baseline = _baseline_result()
    quick = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(extra_monthly_payment=3000),
    )
    assert quick.total_interest < baseline.total_interest


def test_lump_sum_reduces_remaining_principal():
    baseline = _baseline_result()
    lumped = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(
            lump_sum_events=(LumpSumEvent(month=12, amount=100000),)
        ),
    )
    baseline_month_12 = baseline.schedule[11]["closing_balance"]
    lumped_month_12 = lumped.schedule[11]["closing_balance"]
    assert baseline_month_12 - lumped_month_12 == Decimal("100000.00")


def test_earlier_lump_sum_saves_more_interest():
    later = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(
            lump_sum_events=(LumpSumEvent(month=12, amount=100000),)
        ),
    )
    earlier = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(
            lump_sum_events=(LumpSumEvent(month=6, amount=100000),)
        ),
    )
    assert earlier.total_interest < later.total_interest


def test_combined_extra_payment_and_lump_sum_works():
    strategy = RepaymentStrategy(
        extra_monthly_payment=3000,
        lump_sum_events=(LumpSumEvent(month=12, amount=100000),),
    )
    result = plan_loan(**BASELINE, strategy=strategy)
    assert result.schedule[-1]["closing_balance"] == Decimal("0.00")
    assert result.number_of_months < 120
    assert result.total_interest < _baseline_result().total_interest


def test_multiple_lump_sum_events_work():
    strategy = RepaymentStrategy(
        lump_sum_events=(
            LumpSumEvent(month=12, amount=100000),
            LumpSumEvent(month=24, amount=50000),
        )
    )
    result = plan_loan(**BASELINE, strategy=strategy)
    assert result.schedule[-1]["closing_balance"] == Decimal("0.00")

    baseline = _baseline_result()
    lumped_month_12 = result.schedule[11]["closing_balance"]
    assert (
        baseline.schedule[11]["closing_balance"] - lumped_month_12
        == Decimal("100000.00")
    )

    single_after_12 = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(
            lump_sum_events=(LumpSumEvent(month=12, amount=100000),)
        ),
    )
    assert result.schedule[23]["closing_balance"] == (
        single_after_12.schedule[23]["closing_balance"] - Decimal("50000.00")
    )


def test_lump_sum_larger_than_balance_does_not_go_negative():
    strategy = RepaymentStrategy(
        lump_sum_events=(LumpSumEvent(month=1, amount=10_000_000),)
    )
    result = plan_loan(100000, 10, 12, strategy=strategy)
    for row in result.schedule:
        assert row["closing_balance"] >= 0
    assert result.schedule[-1]["closing_balance"] == Decimal("0.00")


def test_strategy_without_changes_matches_baseline():
    baseline = _baseline_result()
    blank = plan_loan(**BASELINE, strategy=RepaymentStrategy())
    assert blank.schedule == baseline.schedule
    assert blank.total_payment == baseline.total_payment
    assert blank.total_interest == baseline.total_interest
    assert blank.number_of_months == baseline.number_of_months


def test_strategy_total_payment_equals_principal_plus_interest():
    strategy = RepaymentStrategy(
        extra_monthly_payment=3000,
        lump_sum_events=(LumpSumEvent(month=12, amount=100000),),
    )
    result = plan_loan(**BASELINE, strategy=strategy)
    total_principal = sum(row["principal"] for row in result.schedule)
    assert result.total_payment == total_principal + result.total_interest
    assert total_principal == Decimal("500000.00")


def test_lump_sum_included_in_total_payment():
    strategy = RepaymentStrategy(
        lump_sum_events=(LumpSumEvent(month=12, amount=100000),)
    )
    result = plan_loan(**BASELINE, strategy=strategy)
    lump_row = result.schedule[11]
    assert lump_row["lump_sum"] == Decimal("100000.00")
    assert result.total_payment == sum(
        row["payment"] for row in result.schedule
    ) + Decimal("100000.00")


def test_oversized_lump_capped_in_total_payment():
    strategy = RepaymentStrategy(
        lump_sum_events=(LumpSumEvent(month=1, amount=10_000_000),)
    )
    result = plan_loan(100000, 10, 12, strategy=strategy)

    first = result.schedule[0]
    applied = first["lump_sum"]
    assert 0 < applied <= Decimal("100000.00")
    assert first["closing_balance"] == Decimal("0.00")

    assert result.total_payment == sum(
        row["payment"] for row in result.schedule
    ) + applied
    assert result.total_payment == Decimal("100000.00") + result.total_interest


def test_invalid_strategy_values_raise():
    with pytest.raises(ValueError):
        plan_loan(
            **BASELINE,
            strategy=RepaymentStrategy(extra_monthly_payment=-100),
        )
    with pytest.raises(ValueError):
        plan_loan(
            **BASELINE,
            strategy=RepaymentStrategy(
                lump_sum_events=(LumpSumEvent(month=1, amount=-100),)
            ),
        )
    with pytest.raises(ValueError):
        plan_loan(
            **BASELINE,
            strategy=RepaymentStrategy(
                lump_sum_events=(LumpSumEvent(month=0, amount=100),)
            ),
        )
    with pytest.raises(ValueError):
        plan_loan(
            **BASELINE,
            strategy=RepaymentStrategy(
                lump_sum_events=(LumpSumEvent(month=121, amount=100),)
            ),
        )


# ---------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------


def test_compare_schedules_fields():
    baseline = _baseline_result()
    strategy = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(extra_monthly_payment=3000),
    )
    comparison = compare_schedules(baseline, strategy)

    assert comparison.interest_saved == (
        baseline.total_interest - strategy.total_interest
    )
    assert comparison.time_saved_months == (
        baseline.number_of_months - strategy.number_of_months
    )
    assert comparison.payment_difference == (
        baseline.total_payment - strategy.total_payment
    )
    assert comparison.interest_saved > 0
    assert comparison.time_saved_months > 0


# ---------------------------------------------------------------------------
# Target payoff
# ---------------------------------------------------------------------------


def test_target_term_payment_finishes_within_term():
    baseline_emi = calculate_emi(**BASELINE)
    target_payment = calculate_payment_for_target_term(500000, 10, 60)
    assert target_payment > baseline_emi

    result = plan_loan(
        **BASELINE,
        strategy=RepaymentStrategy(
            extra_monthly_payment=target_payment - baseline_emi
        ),
    )
    assert result.number_of_months <= 60
    assert result.schedule[-1]["closing_balance"] == Decimal("0.00")


def test_target_term_payment_validates_inputs():
    with pytest.raises(ValueError):
        calculate_payment_for_target_term(500000, 10, 0)
    with pytest.raises(ValueError):
        calculate_payment_for_target_term(0, 10, 60)
    with pytest.raises(ValueError):
        calculate_payment_for_target_term(500000, -1, 60)


# ---------------------------------------------------------------------------
# Actual monthly payment baseline
# ---------------------------------------------------------------------------


def test_actual_monthly_payment_becomes_baseline_payment():
    result = plan_loan(**BASELINE, actual_monthly_payment=10000)
    assert result.monthly_payment == Decimal("10000")
    assert result.number_of_months == 65
    assert result.schedule[-1]["closing_balance"] == Decimal("0.00")
    for row in result.schedule:
        assert row["closing_balance"] >= 0
    assert all(row["lump_sum"] == Decimal("0") for row in result.schedule)


def test_actual_payment_above_emi_clears_before_tenure():
    result = plan_loan(**BASELINE, actual_monthly_payment=10000)
    assert result.number_of_months < BASELINE["number_of_months"]
    baseline = plan_loan(**BASELINE)
    assert Decimal(result.total_interest) < Decimal(baseline.total_interest)


def test_actual_payment_below_emi_clears_after_tenure():
    result = plan_loan(**BASELINE, actual_monthly_payment=6000)
    assert result.number_of_months > BASELINE["number_of_months"]
    assert result.monthly_payment == Decimal("6000")
    assert result.schedule[-1]["closing_balance"] == Decimal("0.00")


def test_actual_payment_that_does_not_amortize_raises():
    # 500000 at 10% accrues ~4166.67 interest in month one; a 4000 instalment
    # never pays the interest down, so the loan cannot amortize.
    with pytest.raises(ValueError, match="insufficient to cover the monthly interest"):
        plan_loan(**BASELINE, actual_monthly_payment=4000)


def test_actual_monthly_payment_must_be_positive():
    with pytest.raises(ValueError, match="actual_monthly_payment must be greater than 0"):
        plan_loan(**BASELINE, actual_monthly_payment=0)
    with pytest.raises(ValueError, match="actual_monthly_payment must be greater than 0"):
        plan_loan(**BASELINE, actual_monthly_payment="0")


def test_strategy_extra_adds_to_actual_payment():
    result = plan_loan(
        **BASELINE,
        actual_monthly_payment=8000,
        strategy=RepaymentStrategy(extra_monthly_payment=1000),
    )
    assert result.monthly_payment == Decimal("9000")
    assert result.number_of_months == 75
    assert result.schedule[-1]["closing_balance"] == Decimal("0.00")

    no_extra = plan_loan(**BASELINE, actual_monthly_payment=8000)
    assert Decimal(result.total_interest) < Decimal(no_extra.total_interest)


def test_strategy_lump_sum_applies_on_top_of_actual_payment():
    result = plan_loan(
        **BASELINE,
        actual_monthly_payment=8000,
        strategy=RepaymentStrategy(
            lump_sum_events=(LumpSumEvent(month=12, amount=100000),)
        ),
    )
    assert result.schedule[11]["lump_sum"] == Decimal("100000")
    assert result.monthly_payment == Decimal("8000")
    assert result.number_of_months < plan_loan(
        **BASELINE, actual_monthly_payment=8000
    ).number_of_months


def test_absent_actual_payment_keeps_emi_baseline():
    result = plan_loan(**BASELINE)
    assert result.monthly_payment == calculate_emi(**BASELINE)


# ---------------------------------------------------------------------------
# Engine cleanliness
# ---------------------------------------------------------------------------


def test_engine_has_no_ui_or_cli_code():
    source = ENGINE_FILE.read_text()
    for banned in ("print(", "input(", "exit("):
        assert banned not in source, f"engine must not use {banned}"