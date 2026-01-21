@echo off
echo ========================================
echo   DOCKER DIAGNOSTIC SCRIPT
echo ========================================

echo.
echo [1/4] Checking Docker version...
docker --version

echo.
echo [2/4] Listing all containers...
docker ps -a

echo.
echo [3/4] Checking backend container logs (last 50 lines)...
docker logs tailor-shop-backend --tail 50 2>&1

echo.
echo [4/4] Checking if MySQL is accessible from host...
echo Testing connection to localhost:3306...

echo.
echo ========================================
echo   DIAGNOSTIC COMPLETE
echo ========================================
echo.
echo Please copy and paste the output above to share with the assistant.
echo.
pause
