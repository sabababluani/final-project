# 🎵 Vinyl Records Store

A comprehensive NestJS-based REST API for a vinyl records marketplace, featuring authentication, payment processing, and integration with Discogs for vinyl catalog data.

Showcase for LeverX's final project

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Development Guidelines](#development-guidelines)

## ✨ Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Google OAuth 2.0 integration
  - Role-based access control (RBAC)
  - Token blacklisting for secure logout

- **Vinyl Management**
  - CRUD operations for vinyl records
  - Integration with Discogs API for vinyl catalog data
  - Search and filtering capabilities
  - Pagination support

- **Order Management**
  - Create and manage orders
  - Order status tracking
  - Order history

- **Reviews System**
  - User reviews and ratings for vinyl records
  - Review moderation

- **Payment Processing**
  - Stripe integration for secure payments
  - Webhook handling for payment events
  - Order fulfillment

- **Notifications**
  - Email notifications via Nodemailer
  - Telegram bot integration for alerts

- **System Logging**
  - Comprehensive audit logging
  - Activity tracking

## 🛠 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) v11
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport.js (JWT & OAuth)
- **Payment**: Stripe
- **Email**: Nodemailer
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Node.js Native Test Runner with C8 coverage
- **Code Quality**: ESLint, Prettier, Husky

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **PostgreSQL** (v14 or higher)
- **Git**

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saba-babluani
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Husky (Git hooks)**
   ```bash
   npm run postinstall
   ```

## 🗄️ Database Setup

1. **Create a PostgreSQL database**
   ```bash
   createdb vinyl_marketplace
   ```

2. **Run migrations**
   ```bash
   npm run migration:run
   ```

3. **Generate a new migration (if needed)**
   ```bash
   npm run migration:generate -- src/migrations/YourMigrationName
   ```

## 🎮 Running the Application

### Development Mode
```bash
npm run start:dev
```
The API will be available at `http://localhost:3000`

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:cov

# Run all tests with coverage
npm run test:cov:all
```

Coverage reports will be generated in the `coverage` directory.

## 📚 API Documentation

This project uses Swagger for comprehensive API documentation.

### Access Swagger UI

Once the application is running, visit:
```
http://localhost:3000/api/docs
```

### Additional Documentation

- [Swagger Quick Start Guide](./SWAGGER_QUICK_START.md)
- [Swagger Implementation Details](./SWAGGER_IMPLEMENTATION.md)
- [Swagger Architecture](./SWAGGER_ARCHITECTURE.md)
- [Complete Swagger Guide](./SWAGGER_GUIDE.md)

## 💻 Development Guidelines

### Code Style

This project uses ESLint and Prettier for code formatting. The configuration will automatically:
- Format code on save (if configured in your IDE)
- Run linting before commits (via Husky)

### Commit Guidelines

The project uses Husky to enforce code quality before commits. Ensure:
- Code passes linting checks
- Tests are passing
- Code is properly formatted

### Creating New Modules

```bash
nest generate module <module-name>

nest generate controller <module-name>

nest generate service <module-name>
```

### Best Practices

1. **DTOs**: Always create DTOs for request/response validation
2. **Validation**: Use `class-validator` decorators for input validation
3. **Documentation**: Add Swagger decorators to all endpoints
4. **Testing**: Write unit tests for all services and controllers
5. **Error Handling**: Use NestJS exception filters for consistent error responses
6. **Security**: Never commit sensitive data or credentials

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Token blacklisting for secure logout
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS configuration
- Secure session management
- Stripe webhook signature verification

## 👥 Author

**Saba Babluani**

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - The progressive Node.js framework
- [Discogs API](https://www.discogs.com/developers/) - Vinyl records database
- [Stripe](https://stripe.com/) - Payment processing
- [TypeORM](https://typeorm.io/) - ORM for TypeScript


**Happy Coding LeverX! 🎵✨**
