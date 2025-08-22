@echo off
echo ======================================
echo   Workitu SEO & Social Media Manager
echo ======================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running (optional check)
echo Checking MongoDB connection...
mongod --version >nul 2>&1
if errorlevel 1 (
    echo Warning: MongoDB might not be running
    echo Please make sure MongoDB is installed and running
    echo Download from: https://www.mongodb.com/try/download/community
    echo.
)

echo Installing backend dependencies...
cd backend
call npm install

echo Installing frontend dependencies...
cd ../frontend
call npm install

echo.
echo Setup complete! To start the application:
echo.
echo 1. Start MongoDB (if not already running)
echo 2. Open two command prompts:
echo    - Backend: cd backend ^& npm run dev
echo    - Frontend: cd frontend ^& npm run dev
echo.
echo Default admin credentials:
echo Username: admin
echo Password: admin123
echo.
echo Access the application at: http://localhost:3000
echo.

pause


