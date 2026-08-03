@echo off
REM SkillBridge Zambia - ONE command, ONE window, ONE service.
REM Builds the React app and serves it together with the API at http://localhost:8000
cd /d "%~dp0"

echo ==============================================
echo   SkillBridge Zambia - single service setup
echo ==============================================
echo.
echo [1/2] Building the app UI...
pushd frontend
call npm run build
if errorlevel 1 goto :err
popd

echo.
echo [2/2] Starting SkillBridge at http://localhost:8000
echo       Press Ctrl+C to stop.
echo.
cd backend
"..\.venv\Scripts\python.exe" run.py
goto :eof

:err
echo.
echo Build failed. Check the messages above.
popd
exit /b 1
