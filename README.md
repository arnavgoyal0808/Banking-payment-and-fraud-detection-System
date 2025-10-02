# 💳 Enterprise Payment Gateway Platform

[![CI/CD](https://github.com/arnavgoyal0808/Banking-payment-and-fraud-detection-System/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/arnavgoyal0808/Banking-payment-and-fraud-detection-System/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-%3E%3D20.0.0-blue)](https://www.docker.com/)

> A fully open-source, enterprise-level Payment Gateway platform that simulates payment processing for merchants and customers, designed to demonstrate advanced software engineering concepts including microservices, event-driven architecture, and system design.

## 🚀 **Live Demo**

- **API Documentation**: [Swagger UI](http://localhost:3000/docs)
- **Monitoring Dashboard**: [Grafana](http://localhost:3001)
- **Health Check**: [API Status](http://localhost:3000/health)

## ✨ **Features**

- 🏗️ **Microservices Architecture** - Scalable, maintainable service design
- 💳 **Multi-Currency Support** - USD, EUR, GBP, JPY and more
- 🛡️ **Advanced Security** - JWT, API keys, HMAC webhooks, TLS encryption
- 🔍 **Fraud Detection** - Rule-based and ML-powered risk assessment
- 📊 **Real-time Analytics** - Transaction monitoring and business intelligence
- 🔄 **Event-Driven** - Kafka-based asynchronous communication
- 🐳 **Containerized** - Docker & Docker Compose ready
- 📈 **Production Ready** - Monitoring, logging, health checks

## 🏛️ **Architecture**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Web Client  │    │ Mobile App  │    │ Merchant    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
              ┌───────────▼────────────┐
              │     API Gateway        │
              │ • Authentication       │
              │ • Rate Limiting        │
              │ • Request Routing      │
              └───────────┬────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
┌───▼────┐    ┌──────────▼──────────┐    ┌─────▼─────┐
│Payment │    │   Merchant Service  │    │   Fraud   │
│Service │    │                     │    │  Service  │
└────────┘    └─────────────────────┘    └───────────┘
```

## 🛠️ **Technology Stack**

| Component | Technology |
|-----------|------------|
| **Backend** | NestJS, TypeScript |
| **Database** | PostgreSQL, Redis, ClickHouse |
| **Message Queue** | Apache Kafka |
| **Security** | Keycloak, HashiCorp Vault |
| **Monitoring** | Prometheus, Grafana |
| **Containerization** | Docker, Docker Compose |
| **Testing** | Jest, Supertest |

## 🚀 **Quick Start**

### Prerequisites
- Node.js ≥ 18.0.0
- Docker ≥ 20.0.0
- Docker Compose ≥ 2.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/arnavgoyal0808/Banking-payment-and-fraud-detection-System.git
cd Banking-payment-and-fraud-detection-System

# Setup the environment
./scripts/setup.sh

# Start all services
docker-compose up -d

# Verify installation
curl http://localhost:3000/health
```

### 🧪 **Testing**

```bash
# Run unit tests
npm run test

# Run integration tests
./scripts/test-integration.sh

# Run all tests
npm run test:all
```

## 📚 **API Usage**

### Create a Payment

```bash
curl -X POST http://localhost:3000/api/payments \
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
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

### Capture Payment

```bash
curl -X POST http://localhost:3000/api/payments/{payment_id}/capture \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pk_test_demo123" \
  -d '{"amount": 2000}'
```

## 📊 **Monitoring**

Access monitoring dashboards:

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **API Docs**: http://localhost:3000/docs

## 🔧 **Configuration**

Key environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/payment_gateway
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-super-secret-jwt-key
API_KEY_SECRET=your-api-key-secret

# Services
PAYMENT_SERVICE_URL=http://payment-service:3000
FRAUD_SERVICE_URL=http://fraud-service:3000
```

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **Documentation**

- [API Documentation](docs/API.md)
- [Architecture Guide](docs/ARCHITECTURE.md)

## 🔒 **Security**

- All API endpoints require authentication
- Sensitive data is encrypted at rest and in transit
- OWASP security guidelines followed
- Regular security audits via GitHub Actions

## 📈 **Roadmap**

- [ ] Real payment gateway integrations (Stripe, PayPal)
- [ ] Advanced fraud detection with ML models
- [ ] Merchant dashboard UI
- [ ] Mobile SDK
- [ ] Blockchain payment support
- [ ] Multi-tenant architecture

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Built with modern software engineering practices
- Inspired by real-world payment systems
- Designed for educational and production use

---

⭐ **Star this repository if you find it helpful!**

📧 **Questions?** Open an issue or start a discussion!
