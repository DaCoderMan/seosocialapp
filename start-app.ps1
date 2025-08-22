# Workitu SEO & Social Media Management System Startup Script
Write-Host "🚀 Starting Workitu SEO & Social Media Management System..." -ForegroundColor Green

# Function to start backend server
function Start-Backend {
    Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
    Set-Location ".\backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

# Function to start frontend server
function Start-Frontend {
    Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
    Set-Location ".\frontend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
}

# Function to check if servers are running
function Test-Servers {
    Write-Host "🔍 Testing server connections..." -ForegroundColor Cyan
    
    # Test backend
    try {
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/test" -Method GET -TimeoutSec 5
        Write-Host "✅ Backend is running on http://localhost:5000" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend is not responding" -ForegroundColor Red
    }
    
    # Test frontend
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
        Write-Host "✅ Frontend is running on http://localhost:3000" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend is not responding" -ForegroundColor Red
    }
}

# Main execution
try {
    # Start servers
    Start-Backend
    Start-Frontend
    
    # Wait for servers to start
    Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    # Test servers
    Test-Servers
    
    Write-Host "`n🎉 Workitu SEO & Social Media Management System is starting!" -ForegroundColor Green
    Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "`n💡 Default Admin Credentials:" -ForegroundColor Yellow
    Write-Host "   Username: admin" -ForegroundColor White
    Write-Host "   Password: admin123" -ForegroundColor White
    
} catch {
    Write-Host "❌ Error starting servers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
