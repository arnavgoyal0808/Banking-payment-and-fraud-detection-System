#!/bin/bash

echo "🚀 Publishing Payment Gateway Platform to GitHub..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git branch -M main
fi

# Add all files
echo "📝 Adding files to Git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "feat: initial commit - Enterprise Payment Gateway Platform

- Complete microservices architecture with NestJS
- Payment processing with authorization, capture, refunds
- Multi-currency support (USD, EUR, GBP, JPY)
- Advanced security with JWT, API keys, HMAC webhooks
- Fraud detection framework with rule-based logic
- Event-driven architecture with Kafka
- Comprehensive monitoring with Prometheus & Grafana
- Docker containerization with Docker Compose
- Full test suite with unit and integration tests
- Production-ready with proper SDLC practices
- Extensive documentation and API specs"

echo ""
echo "✅ Repository prepared for GitHub!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: payment-gateway-platform"
echo "   - Description: Enterprise Payment Gateway Platform - Microservices Architecture"
echo "   - Make it public"
echo "   - Don't initialize with README (we already have one)"
echo ""
echo "2. Add the remote origin (replace 'yourusername' with your GitHub username):"
echo "   git remote add origin https://github.com/yourusername/payment-gateway-platform.git"
echo ""
echo "3. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "4. Update the README badges:"
echo "   - Replace 'yourusername' in README.md with your actual GitHub username"
echo "   - Commit and push the changes"
echo ""
echo "🎉 Your project will be live on GitHub!"

# Optional: Open GitHub in browser
read -p "Would you like to open GitHub in your browser to create the repository? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://github.com/new"
    elif command -v open &> /dev/null; then
        open "https://github.com/new"
    else
        echo "Please manually open: https://github.com/new"
    fi
fi
