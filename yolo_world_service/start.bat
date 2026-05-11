@echo off
title YOLO-World Service for AutoCashier
echo ============================================
echo   YOLO-World Detection Service
echo   AutoCashier - AI Product Scanner
echo ============================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

:: Load .env file
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        set %%a=%%b
    )
)

:: Check if venv exists, create if not
if not exist venv (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)

:: Activate venv
call venv\Scripts\activate.bat

:: Install dependencies
echo [INFO] Installing dependencies...
pip install -r requirements.txt -q

:: Run the service
echo.
echo [INFO] Starting YOLO-World service...
echo [INFO] API will be available at http://localhost:%YOLO_WORLD_PORT%
echo.
python app.py

pause
