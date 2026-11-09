from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app


client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_activities():
    original = deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_signup_adds_a_participant():
    response = client.post(
        "/activities/Art%20Studio/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 200
    assert "student@mergington.edu" in activities["Art Studio"]["participants"]


def test_duplicate_signup_is_rejected():
    response = client.post(
        "/activities/Chess%20Club/signup",
        params={"email": "michael@mergington.edu"},
    )

    assert response.status_code == 400
    assert activities["Chess Club"]["participants"].count("michael@mergington.edu") == 1


def test_signup_for_unknown_activity_is_rejected():
    response = client.post(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404


def test_unregister_removes_a_participant():
    response = client.delete(
        "/activities/Chess%20Club/participants",
        params={"email": "michael@mergington.edu"},
    )

    assert response.status_code == 200
    assert "michael@mergington.edu" not in activities["Chess Club"]["participants"]


def test_unregister_rejects_unknown_participants():
    response = client.delete(
        "/activities/Chess%20Club/participants",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404


def test_activity_catalog_includes_six_new_activities():
    response = client.get("/activities")

    assert response.status_code == 200
    assert len(response.json()) == 9
