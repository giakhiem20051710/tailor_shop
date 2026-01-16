#!/bin/bash

# Docker Helper Script for Tailor Shop
# Usage: ./docker-helper.sh [command]

set -e

COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

case "$1" in
  start|up)
    echo "🚀 Starting Tailor Shop services..."
    docker-compose -f $COMPOSE_FILE up -d
    echo "✅ Services started!"
    echo "📊 Check status: ./docker-helper.sh status"
    ;;
  
  stop|down)
    echo "🛑 Stopping Tailor Shop services..."
    docker-compose -f $COMPOSE_FILE down
    echo "✅ Services stopped!"
    ;;
  
  restart)
    echo "🔄 Restarting Tailor Shop services..."
    docker-compose -f $COMPOSE_FILE restart
    echo "✅ Services restarted!"
    ;;
  
  build)
    echo "🔨 Building Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo "✅ Images built!"
    ;;
  
  rebuild)
    echo "🔨 Rebuilding Docker images..."
    docker-compose -f $COMPOSE_FILE down
    docker-compose -f $COMPOSE_FILE build --no-cache
    docker-compose -f $COMPOSE_FILE up -d
    echo "✅ Images rebuilt and services started!"
    ;;
  
  logs)
    SERVICE=${2:-""}
    if [ -z "$SERVICE" ]; then
      docker-compose -f $COMPOSE_FILE logs -f
    else
      docker-compose -f $COMPOSE_FILE logs -f $SERVICE
    fi
    ;;
  
  status|ps)
    echo "📊 Service Status:"
    docker-compose -f $COMPOSE_FILE ps
    ;;
  
  shell)
    SERVICE=${2:-backend}
    echo "🐚 Opening shell in $SERVICE container..."
    docker-compose -f $COMPOSE_FILE exec $SERVICE sh
    ;;
  
  mysql)
    echo "🗄️  Opening MySQL client..."
    docker-compose -f $COMPOSE_FILE exec mysql mysql -u root -p${MYSQL_ROOT_PASSWORD:-rootpassword} tailor_shop
    ;;
  
  clean)
    echo "🧹 Cleaning up..."
    docker-compose -f $COMPOSE_FILE down -v
    echo "✅ Cleaned up volumes and containers!"
    ;;
  
  prod)
    echo "🚀 Starting in PRODUCTION mode..."
    if [ ! -f ".env" ]; then
      echo "⚠️  Warning: .env file not found. Creating from env.example..."
      cp env.example .env
      echo "⚠️  Please edit .env with production values before continuing!"
      exit 1
    fi
    docker-compose -f $COMPOSE_FILE -f $PROD_COMPOSE_FILE up -d --build
    echo "✅ Production services started!"
    ;;
  
  backup)
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "💾 Backing up database to $BACKUP_FILE..."
    docker-compose -f $COMPOSE_FILE exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD:-rootpassword} tailor_shop > $BACKUP_FILE
    echo "✅ Backup saved to $BACKUP_FILE"
    ;;
  
  restore)
    if [ -z "$2" ]; then
      echo "❌ Usage: ./docker-helper.sh restore <backup_file.sql>"
      exit 1
    fi
    echo "📥 Restoring database from $2..."
    docker-compose -f $COMPOSE_FILE exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD:-rootpassword} tailor_shop < $2
    echo "✅ Database restored!"
    ;;
  
  *)
    echo "🐳 Tailor Shop Docker Helper"
    echo ""
    echo "Usage: ./docker-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start, up       - Start all services"
    echo "  stop, down      - Stop all services"
    echo "  restart         - Restart all services"
    echo "  build           - Build Docker images"
    echo "  rebuild         - Rebuild and restart services"
    echo "  logs [service]  - View logs (all or specific service)"
    echo "  status, ps      - Show service status"
    echo "  shell [service] - Open shell in container (default: backend)"
    echo "  mysql           - Open MySQL client"
    echo "  clean           - Stop and remove volumes"
    echo "  prod            - Start in production mode"
    echo "  backup          - Backup database"
    echo "  restore <file>  - Restore database from backup"
    echo ""
    echo "Examples:"
    echo "  ./docker-helper.sh start"
    echo "  ./docker-helper.sh logs backend"
    echo "  ./docker-helper.sh shell frontend"
    echo "  ./docker-helper.sh backup"
    ;;
esac

