#!/bin/bash
# Install all Python dependencies for Synora API

set -e

echo "🚀 Installing Synora API Dependencies..."
echo "=========================================="

cd "$(dirname "$0")/.."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies in virtual environment (no need for --break-system-packages)
echo "📥 Installing requirements..."
pip install -r requirements.txt

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "To activate the virtual environment:"
echo "  source .venv/bin/activate"
echo ""
echo "To start the API server:"
echo "  source .venv/bin/activate"
echo "  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
