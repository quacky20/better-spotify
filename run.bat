@echo off
echo Starting Moodify servers...

REM Start Frontend (React)
start cmd /k "cd betterSpotify && npm run dev"

REM Start Backend (Express)
start cmd /k "cd server && npm run devStart"

REM Start AI Agent Backend (Flask)
start cmd /k "cd MLBackend && python app.py"

echo ✅ All servers launched in separate windows.
pause