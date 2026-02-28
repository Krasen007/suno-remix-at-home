@echo off
REM Check if virtual environment exists
if not exist ".venv\Scripts\activate.bat" (
    echo Error: .venv directory not found. 
    echo Please run 'python -m venv .venv' and 'pip install -r requirements.txt' first.
    pause
    exit /b
)

REM Activate the virtual environment and run the server
echo Activating virtual environment...
call .venv\Scripts\activate.bat
echo Starting Suno Remix Server...
python server.py
pause