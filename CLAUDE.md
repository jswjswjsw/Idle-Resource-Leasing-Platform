# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**闲置资源租赁平台 (Idle Resource Rental Platform)**
- A comprehensive rental marketplace for sharing idle resources
- Modern microservices architecture with Chinese-first development approach
- Full-stack solution with Web, Mobile, and Admin interfaces

## 🏗️ Core Architecture

### System Components
- **Frontend**: React + TypeScript (Web) / React Native (Mobile)
- **Backend**: Node.js + Express + TypeScript microservices
- **Database**: MySQL (primary) + Redis (cache) + Elasticsearch (search)
- **Storage**: Alibaba Cloud OSS for file storage
- **Real-time**: WebSocket for chat and notifications

### Service Architecture
```
├── User Service (用户服务) - Authentication, profiles, credit system
├── Resource Service (资源服务) - Item management, search, recommendations
├── Order Service (订单服务) - Booking workflow, status management
├── Payment Service (支付服务) - Alipay/WeChat Pay integration
├── Communication Service (通讯服务) - Chat, notifications
└── File Service (文件服务) - Image/video upload and processing
```

## 🚀 Quick Commands

### Development Setup
```bash
# Initialize project structure
npm run claude-setup
npm run validate
npm run organize
npm run add-comments

# Start development environment
docker-compose up -d
npm run dev
```

### Testing Commands
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Database Commands
```bash
# Database migrations
npm run db:migrate
npm run db:seed

# Cache management
npm run cache:clear
npm run cache:warmup
```

### Build & Deploy
```bash
# Build for production
npm run build
npm run build:web
npm run build:mobile

# Deploy to production
npm run deploy:staging
npm run deploy:production
```

## 🗂️ File Organization

### Directory Structure
```
trade/
├── frontend/                 # Web React application
├── backend/                  # Node.js API services
├── database/                # Database schemas and migrations
├── third-party-integration/ # External service integrations
├── tests/                   # Test suites (unit/integration/e2e)
├── scripts/                 # Automation and utility scripts
└── docs/                    # Documentation and specifications
```

### Naming Conventions
- **Chinese-first documentation**: All comments and documentation in Chinese
- **File naming**: Use Chinese functional names where appropriate
- **API endpoints**: RESTful with Chinese resource names
- **Database**: Chinese table/column names with English aliases

## 🔧 Development Workflow

### Code Generation Commands
```bash
# Generate service scaffolding
npm run generate:service <service-name>
npm run generate:controller <controller-name>
npm run generate:model <model-name>

# Generate frontend components
npm run generate:component <component-name>
npm run generate:page <page-name>
```

### Code Quality Tools
```bash
# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Type checking
npm run type-check
npm run type-check:watch
```

## 📊 Key Configuration Files

### Environment Setup
- `.env` - Environment variables template
- `.claude.json` - Claude Code configuration (Chinese mode, UTF-8, auto-comments)
- `.claude-hooks.json` - Development hooks for Chinese documentation

### Database Configuration
- `database/schema.prisma` - Prisma schema definitions
- `database/migrations/` - Database migration files
- `database/seeds/` - Seed data for development

### API Documentation
- `docs/api/` - OpenAPI specifications
- `docs/design.md` - Complete system design document
- `require.md` - Project requirements in Chinese

## 🧪 Testing Patterns

### Test Structure
```
tests/
├── unit/           # Unit tests for services and utilities
├── integration/    # API endpoint integration tests
├── e2e/           # End-to-end browser tests
└── fixtures/      # Test data and mock files
```

### Common Test Commands
```bash
# Test specific service
npm test -- --testNamePattern="UserService"

# Test specific endpoint
npm test -- --testPathPattern="auth.integration.test.ts"

# Run with debugging
npm test -- --debug
```

## 🔍 Chinese-Specific Development

### Language & Encoding
- **Source**: All code includes Chinese comments at statement level
- **Documentation**: README.md and design docs in Chinese
- **API Responses**: Chinese error messages and success notifications
- **Database**: UTF-8MB4 encoding for full Chinese character support

### Cultural Considerations
- **Payment**: WeChat Pay and Alipay integration
- **Location**: High-precision Chinese address system
- **Social**: Chinese social login (WeChat, QQ, Weibo)
- **Security**: Chinese ID card verification system

## 📱 Development Environment

### Prerequisites
- Node.js 18+ LTS
- Docker & Docker Compose
- MySQL 8.0+
- Redis 7.0+
- TypeScript 5.0+

### Local Development
```bash
# Clone and setup
git clone <repository>
cd trade
npm install

# Start infrastructure
docker-compose up -d mysql redis elasticsearch

# Run migrations
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev:web
npm run dev:api
npm run dev:mobile
```

## 🚨 Troubleshooting

### Common Issues
1. **Chinese encoding**: Ensure UTF-8 in all files
2. **Database connection**: Check MySQL/Redis connectivity
3. **API timeouts**: Adjust timeout settings in config
4. **Cache issues**: Clear Redis cache with `npm run cache:clear`

### Debug Commands
```bash
# Check service health
npm run health:check

# View logs
npm run logs:api
npm run logs:web
npm run logs:mobile

# Performance profiling
npm run profile:api
npm run profile:web
```

## 🔗 External Integrations

### Third-Party Services
- **Alipay**: Payment processing
- **WeChat Pay**: Mobile payments
- **AliCloud OSS**: File storage
- **Alibaba SMS**: Verification codes
- **Gaode Maps**: Location services
- **Zhima Credit**: Credit scoring

### API Keys Configuration
Required environment variables:
```bash
ALIBABA_CLOUD_ACCESS_KEY_ID
ALIBABA_CLOUD_ACCESS_KEY_SECRET
WECHAT_APP_ID
WECHAT_APP_SECRET
ALIPAY_APP_ID
ALIPAY_PRIVATE_KEY
```

## 📞 Support & Resources

### Documentation Links
- [System Design](docs/design.md) - Complete technical architecture
- [API Documentation](docs/api/) - RESTful API specifications
- [Deployment Guide](docs/deployment.md) - Production deployment steps
- [Testing Guide](docs/testing.md) - Comprehensive testing strategy

### Development Tools
- **VS Code Extensions**: Chinese language pack, TypeScript, ESLint
- **Postman**: API testing collections in Chinese
- **Docker**: Containerized development environment
- **Git**: Conventional commits with Chinese messages