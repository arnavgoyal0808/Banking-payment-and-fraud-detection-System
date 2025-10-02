# Contributing to Payment Gateway Platform

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/payment-gateway-platform.git
   cd payment-gateway-platform
   ```

2. **Setup Environment**
   ```bash
   ./scripts/setup.sh
   ```

3. **Start Development Environment**
   ```bash
   docker-compose up -d
   ```

## Code Standards

- **Language**: TypeScript for all services
- **Linting**: ESLint with Prettier
- **Testing**: Jest for unit tests
- **Documentation**: JSDoc for functions

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with tests
3. Run the test suite: `npm run test:all`
4. Update documentation if needed
5. Submit PR to `develop` branch

## Commit Convention

Use conventional commits:
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `test:` test additions/changes
- `refactor:` code refactoring

## Testing

- Write unit tests for new features
- Ensure integration tests pass
- Maintain >80% code coverage

## Security

- Never commit secrets or API keys
- Follow OWASP security guidelines
- Report security issues privately

## Questions?

Open an issue or start a discussion!
