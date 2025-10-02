# Payment Gateway API Documentation

## Authentication

All API requests require authentication using API keys:

```bash
curl -H "X-API-Key: pk_test_your_api_key" \
     -H "Content-Type: application/json" \
     https://api.paymentgateway.com/api/payments
```

## Endpoints

### Payments

#### Create Payment
```http
POST /api/payments
```

**Request Body:**
```json
{
  "amount": 2000,
  "currency": "USD",
  "paymentMethod": {
    "type": "card",
    "token": "tok_visa_4242"
  },
  "customer": {
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "description": "Order #12345",
  "metadata": {
    "orderId": "12345",
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "id": "txn_1234567890",
  "status": "authorized",
  "amount": 2000,
  "currency": "USD",
  "createdAt": "2024-01-01T00:00:00Z",
  "customer": {
    "id": "cus_1234567890",
    "email": "customer@example.com"
  }
}
```

#### Capture Payment
```http
POST /api/payments/{id}/capture
```

**Request Body:**
```json
{
  "amount": 2000
}
```

#### Refund Payment
```http
POST /api/payments/{id}/refund
```

**Request Body:**
```json
{
  "amount": 1000,
  "reason": "Customer requested refund"
}
```

#### Get Payment
```http
GET /api/payments/{id}
```

#### List Payments
```http
GET /api/payments
```

### Merchants

#### Get Merchant Profile
```http
GET /api/merchants/profile
```

#### Update Webhook URL
```http
PUT /api/merchants/webhook
```

**Request Body:**
```json
{
  "url": "https://your-site.com/webhooks/payments"
}
```

## Webhooks

Payment Gateway sends webhooks for important events:

### Event Types
- `payment.authorized`
- `payment.captured`
- `payment.failed`
- `payment.refunded`

### Webhook Payload
```json
{
  "id": "evt_1234567890",
  "type": "payment.captured",
  "data": {
    "transaction": {
      "id": "txn_1234567890",
      "status": "captured",
      "amount": 2000,
      "currency": "USD"
    }
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Webhook Verification

Verify webhook signatures using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "type": "invalid_request_error",
    "code": "parameter_missing",
    "message": "Missing required parameter: amount",
    "param": "amount"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limits

- 100 requests per minute per API key
- 1000 requests per hour per API key

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Testing

Use test API keys for development:
- Publishable: `pk_test_...`
- Secret: `sk_test_...`

### Test Card Numbers
- Visa: `4242424242424242`
- Mastercard: `5555555555554444`
- Declined: `4000000000000002`
