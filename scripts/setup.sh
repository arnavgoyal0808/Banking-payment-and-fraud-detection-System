#!/bin/bash

echo "🚀 Setting up Payment Gateway Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p data/clickhouse

# Set permissions
chmod +x scripts/*.sh

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install service dependencies
echo "📦 Installing service dependencies..."
cd services/api-gateway && npm install && cd ../..
cd services/payment-service && npm install && cd ../..

# Create environment files
echo "🔧 Creating environment files..."

# API Gateway .env
cat > services/api-gateway/.env << EOF
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_gateway
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
KEYCLOAK_URL=http://localhost:8080
PAYMENT_SERVICE_URL=http://localhost:3002
MERCHANT_SERVICE_URL=http://localhost:3003
FRAUD_SERVICE_URL=http://localhost:3004
SETTLEMENT_SERVICE_URL=http://localhost:3005
EOF

# Payment Service .env
cat > services/payment-service/.env << EOF
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_gateway
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
EOF

# Create Dockerfile for API Gateway
cat > services/api-gateway/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
EOF

# Create Dockerfile for Payment Service
cat > services/payment-service/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
EOF

# Create monitoring configuration
mkdir -p monitoring

cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
  
  - job_name: 'payment-service'
    static_configs:
      - targets: ['payment-service:3000']
  
  - job_name: 'merchant-service'
    static_configs:
      - targets: ['merchant-service:3000']
  
  - job_name: 'fraud-service'
    static_configs:
      - targets: ['fraud-service:3000']
EOF

echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start the services: docker-compose up -d"
echo "2. Check service health: curl http://localhost:3000/health"
echo "3. View API docs: http://localhost:3000/docs"
echo "4. Monitor with Grafana: http://localhost:3001 (admin/admin)"
echo ""
echo "🎉 Happy coding!"
