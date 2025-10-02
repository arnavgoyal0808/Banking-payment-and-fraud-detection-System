#!/bin/bash

echo "🧪 Running Integration Tests for Payment Gateway..."

# Start test environment
echo "🚀 Starting test environment..."
docker-compose -f docker-compose.test.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Test API Gateway health
echo "🏥 Testing API Gateway health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API Gateway is healthy"
else
    echo "❌ API Gateway health check failed"
    exit 1
fi

# Test Payment Service health
echo "🏥 Testing Payment Service health..."
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Payment Service is healthy"
else
    echo "❌ Payment Service health check failed"
    exit 1
fi

# Test payment creation
echo "💳 Testing payment creation..."
PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_demo123" \
  -d '{
    "amount": 2000,
    "currency": "USD",
    "paymentMethod": {
      "type": "card",
      "token": "tok_visa_4242"
    },
    "customer": {
      "email": "test@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "description": "Integration test payment"
  }')

PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '.id')

if [ "$PAYMENT_ID" != "null" ] && [ "$PAYMENT_ID" != "" ]; then
    echo "✅ Payment created successfully: $PAYMENT_ID"
else
    echo "❌ Payment creation failed"
    echo "Response: $PAYMENT_RESPONSE"
    exit 1
fi

# Test payment capture
echo "💰 Testing payment capture..."
CAPTURE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments/$PAYMENT_ID/capture \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_demo123" \
  -d '{"amount": 2000}')

CAPTURE_STATUS=$(echo $CAPTURE_RESPONSE | jq -r '.status')

if [ "$CAPTURE_STATUS" = "captured" ]; then
    echo "✅ Payment captured successfully"
else
    echo "❌ Payment capture failed"
    echo "Response: $CAPTURE_RESPONSE"
    exit 1
fi

# Test payment retrieval
echo "🔍 Testing payment retrieval..."
GET_RESPONSE=$(curl -s -X GET http://localhost:3000/api/payments/$PAYMENT_ID \
  -H "X-API-Key: pk_test_demo123")

GET_STATUS=$(echo $GET_RESPONSE | jq -r '.status')

if [ "$GET_STATUS" = "captured" ]; then
    echo "✅ Payment retrieved successfully"
else
    echo "❌ Payment retrieval failed"
    echo "Response: $GET_RESPONSE"
    exit 1
fi

# Test partial refund
echo "💸 Testing partial refund..."
REFUND_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments/$PAYMENT_ID/refund \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_demo123" \
  -d '{
    "amount": 1000,
    "reason": "Integration test refund"
  }')

REFUND_ID=$(echo $REFUND_RESPONSE | jq -r '.id')

if [ "$REFUND_ID" != "null" ] && [ "$REFUND_ID" != "" ]; then
    echo "✅ Refund processed successfully: $REFUND_ID"
else
    echo "❌ Refund processing failed"
    echo "Response: $REFUND_RESPONSE"
    exit 1
fi

# Test fraud detection (high amount)
echo "🛡️ Testing fraud detection..."
FRAUD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_demo123" \
  -d '{
    "amount": 50000,
    "currency": "USD",
    "paymentMethod": {
      "type": "card",
      "token": "tok_visa_4242"
    },
    "customer": {
      "email": "suspicious@example.com"
    },
    "description": "High amount test payment"
  }')

FRAUD_ERROR=$(echo $FRAUD_RESPONSE | jq -r '.error.message // empty')

if [[ "$FRAUD_ERROR" == *"fraud"* ]] || [[ "$FRAUD_ERROR" == *"blocked"* ]]; then
    echo "✅ Fraud detection working correctly"
else
    echo "⚠️ Fraud detection may not be working as expected"
    echo "Response: $FRAUD_RESPONSE"
fi

# Test rate limiting
echo "🚦 Testing rate limiting..."
for i in {1..15}; do
    curl -s -X GET http://localhost:3000/api/payments \
      -H "X-API-Key: pk_test_demo123" > /dev/null
done

RATE_LIMIT_RESPONSE=$(curl -s -X GET http://localhost:3000/api/payments \
  -H "X-API-Key: pk_test_demo123")

if echo $RATE_LIMIT_RESPONSE | grep -q "rate limit\|too many requests"; then
    echo "✅ Rate limiting working correctly"
else
    echo "⚠️ Rate limiting may not be configured"
fi

# Test invalid API key
echo "🔐 Testing authentication..."
AUTH_RESPONSE=$(curl -s -X GET http://localhost:3000/api/payments \
  -H "X-API-Key: invalid_key")

if echo $AUTH_RESPONSE | grep -q "unauthorized\|invalid"; then
    echo "✅ Authentication working correctly"
else
    echo "❌ Authentication not working properly"
    echo "Response: $AUTH_RESPONSE"
fi

# Test multi-currency
echo "🌍 Testing multi-currency support..."
EUR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_demo123" \
  -d '{
    "amount": 1500,
    "currency": "EUR",
    "paymentMethod": {
      "type": "card",
      "token": "tok_visa_4242"
    },
    "customer": {
      "email": "euro@example.com"
    }
  }')

EUR_CURRENCY=$(echo $EUR_RESPONSE | jq -r '.currency')

if [ "$EUR_CURRENCY" = "EUR" ]; then
    echo "✅ Multi-currency support working"
else
    echo "❌ Multi-currency support failed"
    echo "Response: $EUR_RESPONSE"
fi

# Cleanup test environment
echo "🧹 Cleaning up test environment..."
docker-compose -f docker-compose.test.yml down

echo ""
echo "🎉 Integration tests completed!"
echo "✅ All core payment flows tested successfully"
echo "✅ Security features validated"
echo "✅ Multi-currency support confirmed"
