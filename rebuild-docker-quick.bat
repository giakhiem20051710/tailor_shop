@echo off
echo ========================================
echo  Quick Rebuild (Keep Database)
echo ========================================
echo.

echo [1/4] Stopping containers...
docker-compose down

echo.
echo [2/4] Rebuilding backend with --no-cache...
docker-compose build --no-cache backend

echo.
echo [3/4] Rebuilding frontend with --no-cache...
docker-compose build --no-cache frontend

echo.
echo [4/4] Starting containers...
docker-compose up -d

echo.
echo ========================================
echo  Rebuild Complete!
echo ========================================
echo.
docker-compose ps
echo.
pause
