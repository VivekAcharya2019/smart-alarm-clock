# Docker Build Script for Smart Alarm Clock (PowerShell)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Smart Alarm Clock - Docker Build" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Build Docker image
Write-Host "Step 1: Building Docker image..." -ForegroundColor Blue
docker build -t smart-alarm-clock-builder .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed!" -ForegroundColor Red
    exit 1
}

# Create output directory
New-Item -ItemType Directory -Force -Path ".\build-output" | Out-Null

# Run build in container
Write-Host "Step 2: Building Android APK..." -ForegroundColor Blue
docker run --rm `
    -v "${PWD}/build-output:/app/android/app/build/outputs" `
    smart-alarm-clock-builder `
    bash -c "cd android && ./gradlew clean && ./gradlew assembleDebug"

if ($LASTEXITCODE -ne 0) {
    Write-Host "APK build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "APK location:" -ForegroundColor Yellow
Write-Host "  .\build-output\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "To install on device/emulator:" -ForegroundColor Yellow
Write-Host "  adb install .\build-output\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
