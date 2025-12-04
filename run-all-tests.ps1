# PowerShell script to run all integration tests (backend and frontend)
# Usage: .\run-all-tests.ps1

$ErrorActionPreference = "Stop"

Write-Host "🧪 Running All Integration Tests" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

function Print-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
}

function Run-BackendTests {
    Print-Section "📦 Backend Integration Tests"
    Push-Location backend
    
    Write-Host "Running backend integration tests..." -ForegroundColor Yellow
    npm test -- tests/integration/ --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend integration tests passed!" -ForegroundColor Green
        $script:BackendPassed = $true
    } else {
        Write-Host "⚠️  Backend integration tests had some failures" -ForegroundColor Yellow
        $script:BackendPassed = $false
    }
    
    Pop-Location
}

function Run-FrontendTests {
    Print-Section "🎨 Frontend E2E Tests"
    Push-Location frontend
    
    Write-Host "Running frontend e2e tests..." -ForegroundColor Yellow
    npm run test:e2e
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend e2e tests passed!" -ForegroundColor Green
        $script:FrontendPassed = $true
    } else {
        Write-Host "⚠️  Frontend e2e tests had some failures" -ForegroundColor Yellow
        $script:FrontendPassed = $false
    }
    
    Pop-Location
}

# Main execution
$StartTime = Get-Date
$BackendPassed = $false
$FrontendPassed = $false

Write-Host "Starting test suite..." -ForegroundColor Green
Write-Host ""

# Run backend tests
Run-BackendTests

# Run frontend tests
Run-FrontendTests

# Summary
$EndTime = Get-Date
$Duration = ($EndTime - $StartTime).TotalSeconds

Print-Section "📊 Test Summary"

if ($BackendPassed -and $FrontendPassed) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Duration: $([math]::Round($Duration, 2))s"
    exit 0
} else {
    Write-Host "⚠️  Some tests failed:" -ForegroundColor Yellow
    if (-not $BackendPassed) { Write-Host "  - Backend integration tests" -ForegroundColor Red }
    if (-not $FrontendPassed) { Write-Host "  - Frontend e2e tests" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Duration: $([math]::Round($Duration, 2))s"
    exit 1
}

