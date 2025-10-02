#!/bin/bash

echo "🚀 Deploying Payment Gateway Platform..."

# Build all services
echo "🔨 Building services..."
docker-compose build

# Run tests
echo "🧪 Running tests..."
npm run test:all

if [ $? -ne 0 ]; then
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

# Deploy to production
echo "📦 Deploying to production..."

# Stop existing services
docker-compose down

# Start services with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health checks..."
services=("api-gateway:3000" "payment-service:3002" "merchant-service:3003" "fraud-service:3004")

for service in "${services[@]}"; do
    if curl -f "http://localhost:${service##*:}/health" > /dev/null 2>&1; then
        echo "✅ ${service%:*} is healthy"
    else
        echo "❌ ${service%:*} health check failed"
    fi
done

echo "🎉 Deployment completed!"
echo "API Gateway: http://localhost:3000"
echo "API Documentation: http://localhost:3000/docs"
echo "Monitoring: http://localhost:3001"
