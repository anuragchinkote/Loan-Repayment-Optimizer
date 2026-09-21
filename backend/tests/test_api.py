"""Tests for the Loan Optimizer FastAPI layer."""

from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BASELINE = {
    "principal": "500000",
    "annual_interest_rate": "10",
    "number_of_months": 120,
}


def _payload(**overrides):
    payload = dict(BASELINE)
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health_returns_200():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# Basic plan
# ---------------------------------------------------------------------------


def test_basic_loan_calculation_works():
    response = client.post("/api/v1/loan/plan", json=_payload())
    assert response.status_code == 200

    data = response.json()
    baseline = data["baseline"]
    assert baseline["monthly_payment"] == "6607.54"
    assert baseline["number_of_months"] == 120
    assert len(baseline["schedule"]) == 120
    assert baseline["schedule"][-1]["closing_balance"] == "0.00"
    assert baseline["schedule"][0]["lump_sum"] == "0"

    assert data["strategy"]["monthly_payment"] == "6607.54"
    assert data["comparison"]["months_saved"] == 0
    assert data["comparison"]["interest_saved"] == "0.00"
    assert data["comparison"]["payment_difference"] == "0.00"


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------


def test_strategy_with_extra_monthly_payment():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "3000",
                "lump_sum_events": [],
            }
        ),
    )
    assert response.status_code == 200

    data = response.json()
    assert data["strategy"]["monthly_payment"] == "9607.54"
    assert data["strategy"]["number_of_months"] < 120
    assert Decimal(data["strategy"]["total_interest"]) < Decimal(
        data["baseline"]["total_interest"]
    )


def test_strategy_with_lump_sum():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "0",
                "lump_sum_events": [{"month": 12, "amount": "100000"}],
            }
        ),
    )
    assert response.status_code == 200

    data = response.json()
    strategy = data["strategy"]
    assert strategy["schedule"][11]["lump_sum"] == "100000"
    assert Decimal(data["comparison"]["interest_saved"]) > 0


def test_combined_extra_payment_and_lump_sum():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "3000",
                "lump_sum_events": [{"month": 12, "amount": "100000"}],
            }
        ),
    )
    assert response.status_code == 200

    data = response.json()
    assert data["strategy"]["monthly_payment"] == "9607.54"
    assert data["strategy"]["schedule"][11]["lump_sum"] == "100000"
    assert data["strategy"]["number_of_months"] < 120
    assert data["strategy"]["number_of_months"] < data["baseline"]["number_of_months"]


def test_multiple_lump_sums_in_one_strategy():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "0",
                "lump_sum_events": [
                    {"month": 12, "amount": "100000"},
                    {"month": 24, "amount": "50000"},
                ],
            }
        ),
    )
    assert response.status_code == 200

    data = response.json()
    strategy = data["strategy"]
    months_with_lumps = [
        row["lump_sum"] for row in strategy["schedule"] if row["lump_sum"] != "0"
    ]
    assert months_with_lumps == ["100000", "50000"]
    assert strategy["number_of_months"] < data["baseline"]["number_of_months"]


def test_lump_sum_larger_than_balance_is_capped():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            principal="100000",
            strategy={
                "extra_monthly_payment": "0",
                "lump_sum_events": [{"month": 1, "amount": "10000000"}],
            },
        ),
    )
    assert response.status_code == 200

    data = response.json()
    strategy = data["strategy"]
    first = strategy["schedule"][0]
    applied = Decimal(first["lump_sum"])
    assert 0 < applied <= Decimal(first["opening_balance"])
    assert first["closing_balance"] == "0.00"

    for row in strategy["schedule"]:
        assert Decimal(row["closing_balance"]) >= 0


def test_total_cash_paid_includes_lump_sums():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "0",
                "lump_sum_events": [{"month": 12, "amount": "100000"}],
            }
        ),
    )
    assert response.status_code == 200

    data = response.json()
    strategy = data["strategy"]
    payments = sum(Decimal(row["payment"]) for row in strategy["schedule"])
    lumps = sum(Decimal(row["lump_sum"]) for row in strategy["schedule"])
    assert Decimal(strategy["total_payment"]) == payments + lumps
    assert lumps == Decimal("100000")

    comparison = data["comparison"]
    assert Decimal(comparison["payment_difference"]) == (
        Decimal(data["baseline"]["total_payment"])
        - Decimal(strategy["total_payment"])
    )


def test_strategy_interest_lower_than_baseline():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "3000",
                "lump_sum_events": [{"month": 12, "amount": "100000"}],
            }
        ),
    )
    data = response.json()
    comparison = data["comparison"]
    assert Decimal(comparison["interest_saved"]) > 0
    assert comparison["months_saved"] > 0
    assert Decimal(comparison["payment_difference"]) > 0


def test_response_money_values_are_strings():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "3000",
                "lump_sum_events": [{"month": 12, "amount": "100000"}],
            }
        ),
    )
    assert response.status_code == 200
    data = response.json()

    for section in ("baseline", "strategy"):
        result = data[section]
        for key in ("monthly_payment", "total_payment", "total_interest"):
            assert isinstance(result[key], str), f"{section}.{key} must be str"
        row = result["schedule"][0]
        for key in ("opening_balance", "payment", "interest", "principal", "lump_sum", "closing_balance"):
            assert isinstance(row[key], str), f"{section}.schedule[0].{key} must be str"

    for key in ("interest_saved", "payment_difference"):
        assert isinstance(data["comparison"][key], str)


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def test_invalid_principal_returns_422():
    response = client.post("/api/v1/loan/plan", json=_payload(principal="0"))
    assert response.status_code == 422


def test_invalid_interest_rate_returns_422():
    response = client.post("/api/v1/loan/plan", json=_payload(annual_interest_rate="-1"))
    assert response.status_code == 422


def test_invalid_number_of_months_returns_422():
    response = client.post("/api/v1/loan/plan", json=_payload(number_of_months=0))
    assert response.status_code == 422


def test_invalid_lump_sum_month_returns_error_response():
    invalid_month = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"lump_sum_events": [{"month": 0, "amount": "100"}]}),
    )
    assert invalid_month.status_code == 422

    beyond_term = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"lump_sum_events": [{"month": 130, "amount": "100"}]}),
    )
    assert beyond_term.status_code == 400


def test_engine_error_is_converted_to_400_not_traceback():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"lump_sum_events": [{"month": 130, "amount": "100"}]}),
    )
    assert response.status_code == 400
    assert "between 1 and" in response.json()["detail"]
    assert "traceback" not in response.text.lower()


# ---------------------------------------------------------------------------
# Target payoff term
# ---------------------------------------------------------------------------


def test_target_term_60_months():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"target_months": 60}),
    )
    assert response.status_code == 200

    data = response.json()
    assert data["strategy"]["monthly_payment"] == "10623.53"
    assert data["strategy"]["number_of_months"] == 60
    assert data["strategy"]["total_interest"] == "137411.23"
    assert data["strategy"]["schedule"][-1]["closing_balance"] == "0.00"
    assert data["comparison"]["months_saved"] == 60
    assert Decimal(data["comparison"]["interest_saved"]) > 0


def test_target_term_shorter_than_original():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"target_months": 36}),
    )
    assert response.status_code == 200

    data = response.json()
    strategy = data["strategy"]
    assert strategy["number_of_months"] <= 36
    assert strategy["number_of_months"] < data["baseline"]["number_of_months"]
    assert Decimal(strategy["monthly_payment"]) > Decimal(
        data["baseline"]["monthly_payment"]
    )


def test_target_term_equal_to_original():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"target_months": 120}),
    )
    assert response.status_code == 200

    data = response.json()
    assert data["strategy"]["monthly_payment"] == "6607.54"
    assert data["strategy"]["number_of_months"] == 120
    assert data["comparison"]["months_saved"] == 0
    assert data["comparison"]["interest_saved"] == "0.00"


def test_target_term_greater_than_original_returns_400():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"target_months": 130}),
    )
    assert response.status_code == 400
    assert "target_months must not exceed number_of_months" in response.json()["detail"]


def test_target_term_combined_with_extra_payment_rejected():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "extra_monthly_payment": "1000",
                "target_months": 60,
            }
        ),
    )
    assert response.status_code == 400
    assert (
        "target_months cannot be combined with extra_monthly_payment"
        in response.json()["detail"]
    )


def test_target_term_combined_with_lump_sum_rejected():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            strategy={
                "lump_sum_events": [{"month": 12, "amount": "100000"}],
                "target_months": 60,
            }
        ),
    )
    assert response.status_code == 400
    assert (
        "target_months cannot be combined with lump_sum_events"
        in response.json()["detail"]
    )


def test_unknown_strategy_field_returns_422():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"target_month": 60}),
    )
    assert response.status_code == 422

    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(strategy={"target_months": 60, "unknow_field": "x"}),
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Actual current monthly instalment
# ---------------------------------------------------------------------------


def test_actual_instalment_becomes_baseline():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(current_monthly_instalment="10000"),
    )
    assert response.status_code == 200

    data = response.json()
    baseline = data["baseline"]
    assert baseline["monthly_payment"] == "10000"
    assert baseline["number_of_months"] == 65
    assert baseline["schedule"][-1]["closing_balance"] == "0.00"
    assert data["standard_monthly_instalment"] == "6607.54"

    assert data["strategy"]["monthly_payment"] == "10000"
    assert data["comparison"]["months_saved"] == 0
    assert data["comparison"]["interest_saved"] == "0.00"


def test_actual_instalment_above_standard_clears_before_tenure():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(current_monthly_instalment="10000"),
    )
    assert response.status_code == 200
    baseline = response.json()["baseline"]
    assert baseline["number_of_months"] < 120


def test_actual_instalment_below_standard_clears_after_tenure():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(current_monthly_instalment="6000"),
    )
    assert response.status_code == 200

    data = response.json()
    baseline = data["baseline"]
    assert baseline["monthly_payment"] == "6000"
    assert baseline["number_of_months"] > 120
    assert baseline["schedule"][-1]["closing_balance"] == "0.00"
    for row in baseline["schedule"]:
        assert Decimal(row["closing_balance"]) >= 0


def test_actual_instalment_that_does_not_amortize_returns_400():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(current_monthly_instalment="4000"),
    )
    assert response.status_code == 400
    assert "insufficient to cover the monthly interest" in response.json()["detail"]


def test_zero_or_negative_actual_instalment_returns_422():
    for value in ("0", "-100"):
        response = client.post(
            "/api/v1/loan/plan",
            json=_payload(current_monthly_instalment=value),
        )
        assert response.status_code == 422


def test_standard_instalment_is_null_when_actual_not_provided():
    response = client.post("/api/v1/loan/plan", json=_payload())
    assert response.status_code == 200
    assert response.json()["standard_monthly_instalment"] is None


def test_extra_payment_adds_to_actual_instalment():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            current_monthly_instalment="8000",
            strategy={"extra_monthly_payment": "2000", "lump_sum_events": []},
        ),
    )
    assert response.status_code == 200

    data = response.json()
    assert data["baseline"]["monthly_payment"] == "8000"
    assert data["strategy"]["monthly_payment"] == "10000"
    assert data["comparison"]["months_saved"] > 0
    assert Decimal(data["comparison"]["interest_saved"]) > 0


def test_lump_sum_applies_after_actual_instalment():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            current_monthly_instalment="8000",
            strategy={
                "extra_monthly_payment": "0",
                "lump_sum_events": [{"month": 12, "amount": "100000"}],
            },
        ),
    )
    assert response.status_code == 200

    data = response.json()
    assert data["strategy"]["schedule"][11]["lump_sum"] == "100000"
    assert data["strategy"]["monthly_payment"] == "8000"


def test_target_term_computes_engine_payment_independently():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            current_monthly_instalment="8000",
            strategy={"target_months": 90},
        ),
    )
    assert response.status_code == 200

    data = response.json()
    strategy = data["strategy"]
    assert strategy["monthly_payment"] == "7918.97"
    assert strategy["number_of_months"] == 90
    # The target term is a standalone engine payment, not "instalment + extra":
    # here it is lower than the current 8000 instalment but still finishes in
    # exactly 90 months, and the comparison reflects that honestly.
    assert Decimal(strategy["monthly_payment"]) < Decimal(
        data["baseline"]["monthly_payment"]
    )
    assert Decimal(data["comparison"]["interest_saved"]) < 0


def test_target_term_equal_to_current_payoff_is_legitimate():
    response = client.post(
        "/api/v1/loan/plan",
        json=_payload(
            current_monthly_instalment="8000",
            strategy={"target_months": 89},
        ),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["strategy"]["number_of_months"] <= 89