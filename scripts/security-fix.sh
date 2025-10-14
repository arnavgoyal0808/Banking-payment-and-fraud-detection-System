#!/bin/bash

set -e

echo "🔒 Starting security fixes for Banking Payment System..."

# Create .env file from template if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your secure passwords and keys!"
fi

# Update root package.json to fix vulnerabilities
echo "🔧 Updating root dependencies..."
npm install --package-lock-only
npm audit fix --audit-level=moderate || true

# Fix service dependencies
echo "🔧 Fixing API Gateway dependencies..."
cd services/api-gateway
npm install --package-lock-only
npm audit fix --audit-level=moderate || true

echo "🔧 Fixing Payment Service dependencies..."
cd ../payment-service
npm install --package-lock-only
npm audit fix --audit-level=moderate || true

cd ../..

# Install updated dependencies
echo "📦 Installing updated dependencies..."
npm ci --legacy-peer-deps

echo "📦 Installing service dependencies..."
cd services/api-gateway && npm ci --legacy-peer-deps
cd ../payment-service && npm ci --legacy-peer-deps
cd ../..

# Run security audit
echo "🔍 Running final security audit..."
npm audit --audit-level=high || echo "⚠️  Some vulnerabilities remain - check manually"

echo "✅ Security fixes completed!"
echo "📋 Next steps:"
echo "   1. Update .env file with secure passwords"
echo "   2. Review remaining vulnerabilities manually"
echo "   3. Run 'docker-compose up' to test the application"
