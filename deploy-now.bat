@echo off
echo ========================================
echo   DEPLOYING BACKEND WITH LOCAL DB
echo ========================================

cd /d E:\Tailor_shop

echo.
echo [1/3] Stopping existing containers...
docker-compose -f docker-compose.local-db.yml down

echo.
echo [2/3] Building backend (this may take a few minutes)...
docker-compose -f docker-compose.local-db.yml build --no-cache backend

echo.
echo [3/3] Starting backend...
docker-compose -f docker-compose.local-db.yml up -d backend

echo.
echo ========================================
echo   DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Checking container status...
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo To view logs, run: docker logs -f backend
echo.
pause
