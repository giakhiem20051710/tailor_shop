@echo off
echo ========================================
echo  Rebuild Docker with Latest Code
echo ========================================
echo.

echo [1/6] Stopping all containers...
docker-compose down

echo.
echo [2/6] Removing old images...
docker rmi tailor-shop-backend tailor-shop-frontend 2>nul
docker image prune -f

echo.
echo [3/6] Removing database volume (FRESH DB)...
docker volume rm tailor_shop_mysql_data 2>nul

echo.
echo [4/6] Building images with --no-cache...
docker-compose build --no-cache

echo.
echo [5/6] Starting containers...
docker-compose up -d

echo.
echo [6/6] Waiting for services to be ready...
timeout /t 10 /nobreak

echo.
echo ========================================
echo  Rebuild Complete!
echo ========================================
echo.
echo Checking status...
docker-compose ps

echo.
echo View logs with: docker-compose logs -f
echo.
pause
