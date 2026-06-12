# Integration Test - Trashform

## 1. What This Tests

Checks whether the frontend and backend actually work together —
not just individually, but as a complete system.

## 2. The Flow

1. User opens the Trashform app in browser
2. User uploads a photo of waste
3. Frontend sends the image to backend via `/analyze`
4. Backend runs the image through the AI model
5. Backend returns the waste category and confidence score
6. Frontend displays the result to the user

## 3. What Should Appear

- Waste category (e.g. plastic, organic, metal)
- Confidence score (e.g. 0.87)
- A clear result message on screen

## 4. Known Risk Points

| Issue | Impact | Fix |
|---|---|---|
| Backend not running | Frontend gets no response | Make sure backend starts first |
| Wrong image format | AI can't process it | Validate file type on upload |
| API returns error | Result won't show | Add error handling on frontend |

## 5. Notes

Integration depends on all three parts working together:
frontend, backend, and the Gemini AI model. If any one part
fails, the result won't reach the user.
