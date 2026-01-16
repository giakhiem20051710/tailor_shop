@echo off
echo ========================================
echo  Deploy with LOCAL MySQL Database
echo ========================================
echo.
echo This will:
echo  - Build Docker images for Backend + Frontend
echo  - Connect Backend to YOUR LOCAL MySQL (not Docker MySQL)
echo  - Use your real database with 239 image_assets
echo.

echo [1/3] Stopping old containers...
docker-compose -f docker-compose.local-db.yml down

echo.
echo [2/3] Building images...
docker-compose -f docker-compose.local-db.yml build --no-cache

echo.
echo [3/3] Starting containers...
docker-compose -f docker-compose.local-db.yml up -d

echo.
echo ========================================
echo  Done! Checking status...
echo ========================================
docker-compose -f docker-compose.local-db.yml ps

echo.
echo NOTE: Make sure your LOCAL MySQL is running!
echo       - Port: 3306
echo       - Database: tailor_shop
echo       - User: root (or set MYSQL_USER env var)
echo.
echo Access:
echo   Frontend: http://localhost:80
echo   Backend:  http://localhost:8083
echo.
pause
