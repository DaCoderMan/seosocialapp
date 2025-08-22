@echo off
echo 🚀 Starting Workitu SEO & Social Media Management System...
echo.

echo 📡 Starting Backend Server...
cd backend
start "Backend Server" cmd /k "node server.js"

echo 🎨 Starting Frontend Server...
cd ../frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ⏳ Waiting for servers to start...
timeout /t 15 /nobreak > nul

echo.
echo 🎉 Workitu SEO & Social Media Management System is starting!
echo 📱 Frontend: http://localhost:3000 (or http://localhost:5173 if 3000 is busy)
echo 🔧 Backend API: http://localhost:5000
echo.
echo 💡 Default Admin Credentials:
echo    Username: admin
echo    Password: admin123
echo.
echo Press any key to exit...
pause > nul
