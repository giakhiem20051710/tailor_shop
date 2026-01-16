@echo off
REM Docker Helper Script for Tailor Shop (Windows)
REM Usage: docker-helper.bat [command]

set COMPOSE_FILE=docker-compose.yml
set PROD_COMPOSE_FILE=docker-compose.prod.yml

if "%1"=="start" goto start
if "%1"=="up" goto start
if "%1"=="stop" goto stop
if "%1"=="down" goto stop
if "%1"=="restart" goto restart
if "%1"=="build" goto build
if "%1"=="rebuild" goto rebuild
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="ps" goto status
if "%1"=="shell" goto shell
if "%1"=="mysql" goto mysql
if "%1"=="clean" goto clean
if "%1"=="prod" goto prod
if "%1"=="backup" goto backup
if "%1"=="restore" goto restore
goto help

:start
echo Starting Tailor Shop services...
docker-compose -f %COMPOSE_FILE% up -d
echo Services started!
echo Check status: docker-helper.bat status
goto end

:stop
echo Stopping Tailor Shop services...
docker-compose -f %COMPOSE_FILE% down
echo Services stopped!
goto end

:restart
echo Restarting Tailor Shop services...
docker-compose -f %COMPOSE_FILE% restart
echo Services restarted!
goto end

:build
echo Building Docker images...
docker-compose -f %COMPOSE_FILE% build --no-cache
echo Images built!
goto end

:rebuild
echo Rebuilding Docker images...
docker-compose -f %COMPOSE_FILE% down
docker-compose -f %COMPOSE_FILE% build --no-cache
docker-compose -f %COMPOSE_FILE% up -d
echo Images rebuilt and services started!
goto end

:logs
if "%2"=="" (
    docker-compose -f %COMPOSE_FILE% logs -f
) else (
    docker-compose -f %COMPOSE_FILE% logs -f %2
)
goto end

:status
echo Service Status:
docker-compose -f %COMPOSE_FILE% ps
goto end

:shell
if "%2"=="" (
    set SERVICE=backend
) else (
    set SERVICE=%2
)
echo Opening shell in %SERVICE% container...
docker-compose -f %COMPOSE_FILE% exec %SERVICE% sh
goto end

:mysql
echo Opening MySQL client...
docker-compose -f %COMPOSE_FILE% exec mysql mysql -u root -prootpassword tailor_shop
goto end

:clean
echo Cleaning up...
docker-compose -f %COMPOSE_FILE% down -v
echo Cleaned up volumes and containers!
goto end

:prod
echo Starting in PRODUCTION mode...
if not exist .env (
    echo Warning: .env file not found. Creating from env.example...
    copy env.example .env
    echo Please edit .env with production values before continuing!
    exit /b 1
)
docker-compose -f %COMPOSE_FILE% -f %PROD_COMPOSE_FILE% up -d --build
echo Production services started!
goto end

:backup
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set BACKUP_FILE=backup_%mydate%_%mytime%.sql
echo Backing up database to %BACKUP_FILE%...
docker-compose -f %COMPOSE_FILE% exec -T mysql mysqldump -u root -prootpassword tailor_shop > %BACKUP_FILE%
echo Backup saved to %BACKUP_FILE%
goto end

:restore
if "%2"=="" (
    echo Usage: docker-helper.bat restore ^<backup_file.sql^>
    exit /b 1
)
echo Restoring database from %2...
docker-compose -f %COMPOSE_FILE% exec -T mysql mysql -u root -prootpassword tailor_shop < %2
echo Database restored!
goto end

:help
echo Tailor Shop Docker Helper
echo.
echo Usage: docker-helper.bat [command]
echo.
echo Commands:
echo   start, up       - Start all services
echo   stop, down      - Stop all services
echo   restart         - Restart all services
echo   build           - Build Docker images
echo   rebuild         - Rebuild and restart services
echo   logs [service]  - View logs (all or specific service)
echo   status, ps      - Show service status
echo   shell [service] - Open shell in container (default: backend)
echo   mysql           - Open MySQL client
echo   clean           - Stop and remove volumes
echo   prod            - Start in production mode
echo   backup          - Backup database
echo   restore ^<file^>  - Restore database from backup
echo.
echo Examples:
echo   docker-helper.bat start
echo   docker-helper.bat logs backend
echo   docker-helper.bat shell frontend
echo   docker-helper.bat backup
goto end

:end

