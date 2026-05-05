$ErrorActionPreference = "Continue"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "   Healthcare Project - Setup & Run Automation Script" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$backendPath = Join-Path -Path $PSScriptRoot -ChildPath "backend"
$frontendPath = Join-Path -Path $PSScriptRoot -ChildPath "frontend"

# 1. Check Node.js
Write-Host "`n[1/5] Checking for Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node -v
    Write-Host "Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js is not found. Installing via winget..." -ForegroundColor Red
    winget install OpenJS.NodeJS -e --accept-package-agreements --accept-source-agreements
    Write-Host "Please restart your computer/terminal to apply changes and run this script again." -ForegroundColor Red
    exit
}

# 2. Check MySQL / MariaDB (Port 3306)
Write-Host "`n[2/5] Checking for MySQL database..." -ForegroundColor Yellow
$mysqlPortOpen = Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet
if ($mysqlPortOpen) {
    Write-Host "MySQL is running on port 3306." -ForegroundColor Green
} else {
    Write-Host "MySQL is NOT running on port 3306." -ForegroundColor Red
    Write-Host "Attempting to start MySQL from XAMPP..." -ForegroundColor Yellow
    if (Test-Path "C:\xampp\mysql\bin\mysqld.exe") {
        Write-Host "Found XAMPP MySQL. Starting it..." -ForegroundColor Cyan
        Start-Process -FilePath "C:\xampp\mysql\bin\mysqld.exe" -WindowStyle Hidden
        Start-Sleep -Seconds 4
        $mysqlPortOpen = Test-NetConnection -ComputerName localhost -Port 3306 -InformationLevel Quiet
        if ($mysqlPortOpen) {
            Write-Host "XAMPP MySQL started successfully!" -ForegroundColor Green
        } else {
            Write-Host "Failed to start XAMPP MySQL. Please start it manually." -ForegroundColor Red
            exit
        }
    } else {
        Write-Host "MySQL is not installed or XAMPP is not found in C:\xampp. Please install XAMPP or MySQL, start it on port 3306, and try again." -ForegroundColor Red
        exit
    }
}

# 3. Setup Backend
Write-Host "`n[3/5] Setting up backend..." -ForegroundColor Yellow
Set-Location -Path $backendPath

if (-not (Test-Path "node_modules")) {
    Write-Host "Running npm install for backend..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "node_modules already exists." -ForegroundColor Green
}

if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from .env.example..." -ForegroundColor Cyan
    Copy-Item ".env.example" ".env"
    
    # Adjust for XAMPP (usually no password for root)
    $envContent = Get-Content ".env"
    $envContent = $envContent -replace 'mysql://root:password@localhost', 'mysql://root:@localhost'
    Set-Content -Path ".env" -Value $envContent
}

# 4. Migrate Database
Write-Host "`n[4/5] Running database migrations..." -ForegroundColor Yellow
Write-Host "Migrating schema and generating Prisma client..." -ForegroundColor Cyan
# Using db push to automatically create database and apply schema
npx prisma db push --accept-data-loss
npx prisma generate

# 5. Start Servers
Write-Host "`n[5/5] Starting the project..." -ForegroundColor Yellow

# Start backend in a new window
Write-Host "Starting backend server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$backendPath'; npm run dev`""

# Start frontend using serve
Write-Host "Starting frontend server (Port 3000)..." -ForegroundColor Cyan
if (-not (Get-Command serve -ErrorAction SilentlyContinue)) {
    Write-Host "Installing 'serve' globally for the frontend..." -ForegroundColor Cyan
    npm install -g serve
}

Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$frontendPath'; serve -p 3000`""

Write-Host "`nDone! Your project is starting." -ForegroundColor Green
Write-Host "Backend is running on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend is running on http://localhost:3000" -ForegroundColor Cyan

# Wait a moment, then optionally open the browser
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"
