#!/bin/bash

echo "🐳 Validating Docker configurations..."

# Check if Dockerfiles exist
if [ -f "services/api-gateway/Dockerfile" ]; then
    echo "✅ API Gateway Dockerfile exists"
else
    echo "❌ API Gateway Dockerfile missing"
    exit 1
fi

if [ -f "services/payment-service/Dockerfile" ]; then
    echo "✅ Payment Service Dockerfile exists"
else
    echo "❌ Payment Service Dockerfile missing"
    exit 1
fi

# Check if package-lock.json files exist
if [ -f "services/api-gateway/package-lock.json" ]; then
    echo "✅ API Gateway package-lock.json exists"
else
    echo "❌ API Gateway package-lock.json missing"
    exit 1
fi

if [ -f "services/payment-service/package-lock.json" ]; then
    echo "✅ Payment Service package-lock.json exists"
else
    echo "❌ Payment Service package-lock.json missing"
    exit 1
fi

echo "✅ All Docker configurations validated successfully!"
echo "📋 Docker builds should now work with:"
echo "   docker build -t api-gateway ./services/api-gateway"
echo "   docker build -t payment-service ./services/payment-service"
