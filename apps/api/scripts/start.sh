#!/bin/bash
# Start Synora API server with all checks

set -e

echo "🚀 Starting Synora API..."
echo "========================"
echo ""

cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your credentials before running again."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Virtual environment not found. Installing dependencies..."
    ./scripts/install_dependencies.sh
fi

# Activate virtual environment
source .venv/bin/activate

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "🐍 Python version: $PYTHON_VERSION"

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/uploads
mkdir -p data/analytics

# Run database migrations
echo "🔄 Running database migrations..."
alembic upgrade head || echo "⚠️  Migration failed or not configured yet"

echo ""
echo "✅ Starting API server..."
echo "   URL: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
