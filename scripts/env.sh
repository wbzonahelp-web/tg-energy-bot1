#!/bin/bash
# Скрипт для переключения между средами

ENV_FILE=".env"

if [ "$1" = "dev" ]; then
    echo "🔧 Switching to DEVELOPMENT environment"
    cp .env.dev .env.current
    ENV_FILE=".env.dev"
elif [ "$1" = "prod" ]; then
    echo "🏭 Switching to PRODUCTION environment"
    cp .env .env.current
else
    echo "Usage: ./scripts/env.sh {dev|prod}"
    exit 1
fi

echo "✅ Environment switched to $1"
echo "📄 Using: $ENV_FILE"
echo "💡 Restart services: docker compose restart"
