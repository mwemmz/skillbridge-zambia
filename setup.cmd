@echo off
REM SkillBridge Zambia - one-time setup
REM Creates the Python virtualenv and installs all dependencies.
cd /d "%~dp0"

echo [1/3] Creating Python virtual environment...
if not exist ".venv\Scripts\python.exe" (
  python -m venv .venv || goto :err
)

echo [2/3] Installing backend dependencies...
".venv\Scripts\python.exe" -m pip install --upgrade pip >nul
".venv\Scripts\python.exe" -m pip install -r backend\requirements.txt || goto :err

echo [3/3] Installing frontend dependencies...
pushd frontend
call npm install --no-audit --no-fund || goto :err
popd

echo.
echo Setup complete. Start the app with:
echo   start-backend.cmd    (API on http://localhost:8000)
echo   start-frontend.cmd   (App on http://localhost:5173)
exit /b 0

:err
echo.
echo Setup failed. Check the messages above.
exit /b 1
