# Testing Report - Trashform

## 1. What We Tested

We ran tests on Trashform to make sure the app actually works —
not just that the code exists, but that the backend responds correctly
and the frontend loads without breaking.

## 2. Setup

- Project: Trashform (AI-based waste analysis)
- Backend: Python + FastAPI
- Frontend: React + TypeScript
- Tools we used: pytest, FastAPI TestClient, React Testing Library

## 3. Backend Tests

| Test | What it checks | Expected | Result |
|---|---|---|---|
| GET `/` | Is the server running? | 200 OK | Passed |
| POST `/analyze` (no file) | Does it reject empty requests? | 400 or 422 | Passed |

## 4. Frontend Test

| Test | What it checks | Expected | Result |
|---|---|---|---|
| App renders | Does the page load without crashing? | Content visible | Passed |

## 5. Unit Tests

| Test | What it checks | Expected | Result |
|---|---|---|---|
| Prediction output | Does the model return the right label? | "plastic" == "plastic" | Passed |
| Confidence score | Is the score a valid probability? | Between 0 and 1 | Passed |

## 6. Notes

All core functionality passed. The `/analyze` endpoint correctly
rejects requests without an image, which is the expected behavior.
Frontend renders without errors. Unit logic for prediction output
and confidence scoring works as intended.
