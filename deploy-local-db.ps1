# Docker Local DB Deployment Script
# Run this in PowerShell: .\deploy-local-db.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING WITH LOCAL DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/5] Stopping all containers..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose -f docker-compose.local-db.yml down 2>$null

Write-Host ""
Write-Host "[2/5] Removing old containers..." -ForegroundColor Yellow
docker rm -f tailor-shop-backend tailor-shop-frontend tailor-shop-redis 2>$null

Write-Host ""
Write-Host "[3/5] Building and starting containers (this takes 2-5 minutes)..." -ForegroundColor Yellow
docker-compose -f docker-compose.local-db.yml up -d --build

Write-Host ""
Write-Host "[4/5] Waiting 45 seconds for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 45

Write-Host ""
Write-Host "[5/5] Checking container status..." -ForegroundColor Yellow
docker ps -a --format "table {{.Names}}`t{{.Status}}"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKEND LOGS (last 30 lines)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
docker logs tailor-shop-backend --tail 30

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test URLs:"
Write-Host "  - Frontend: http://localhost"
Write-Host "  - Backend:  http://localhost:8083/api/v1/health"
Write-Host ""
Write-Host "If backend failed, check full logs with:"
Write-Host "  docker logs tailor-shop-backend"
Write-Host ""

# Save logs to file
docker logs tailor-shop-backend > docker-backend-logs.txt 2>&1
Write-Host "Full logs saved to: docker-backend-logs.txt" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
