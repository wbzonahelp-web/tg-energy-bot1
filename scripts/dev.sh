#!/bin/bash
# Скрипт для управления dev окружением

case "$1" in
    start)
        echo "🚀 Starting development environment..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
        ;;
    stop)
        echo "🛑 Stopping development environment..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml down
        ;;
    restart)
        echo "🔄 Restarting development environment..."
        docker compose -f docker-compose.yml -f docker-compose.dev.yml restart
        ;;
    logs)
        echo "📋 Development logs:"
        docker logs -f telegram-bot-dev
        ;;
    status)
        echo "📊 Development status:"
        docker ps -f "name=dev"
        ;;
    *)
        echo "Usage: ./scripts/dev.sh {start|stop|restart|logs|status}"
        exit 1
esac
