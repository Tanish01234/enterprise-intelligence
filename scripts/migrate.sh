#!/bin/bash
# Run database migrations
# Usage: ./scripts/migrate.sh [upgrade|downgrade|revision|current|history]

set -e

cd "$(dirname "$0")/../apps/api"

# Load environment variables
if [ -f "../../.env" ]; then
    export $(cat ../../.env | grep -v '^#' | xargs)
fi

COMMAND=${1:-upgrade}

case $COMMAND in
    upgrade)
        alembic upgrade head
        ;;
    downgrade)
        alembic downgrade -1
        ;;
    revision)
        MESSAGE=${2:-"auto_migration"}
        alembic revision --autogenerate -m "$MESSAGE"
        ;;
    current)
        alembic current
        ;;
    history)
        alembic history
        ;;
    *)
        echo "Usage: $0 [upgrade|downgrade|revision|current|history]"
        exit 1
        ;;
esac