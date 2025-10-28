import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Vinyl Store API')
    .setDescription(
      `
## Welcome to Vinyl Store API Documentation

This API provides a comprehensive vinyl records marketplace platform with the following features:

### Core Features
- **Authentication & Authorization**: Secure JWT-based auth with role-based access control
- **User Management**: Complete user profile management with Google OAuth integration  
- **Vinyl Management**: CRUD operations for vinyl records with search and pagination
- **Reviews & Ratings**: User reviews with automated rating calculations
- **Payment Processing**: Stripe integration for secure checkout
- **Notifications**: Email and Telegram notifications for important events
- **System Logs**: Comprehensive activity logging and monitoring

### API Standards
- RESTful architecture
- JWT Bearer token authentication
- Pagination support on list endpoints
- Comprehensive error handling
- Input validation on all endpoints

### Getting Started
1. Register a new account via \`POST /auth/register\`
2. Login to receive a JWT token via \`POST /auth/login\`
3. Include the JWT token in the Authorization header: \`Bearer <token>\`
4. Explore the available endpoints below

### Support
For issues or questions, please contact the development team.
      `.trim()
    )
    .setVersion('1.0')
    .setContact(
      'Vinyl Store Development Team',
      'https://vinylstore.com',
      'support@vinylstore.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3001', 'Local Development Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addOAuth2(
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: 'http://localhost:3001/auth/google/login',
            tokenUrl: 'http://localhost:3001/auth/google/redirect',
            scopes: {
              profile: 'Access user profile',
              email: 'Access user email',
            },
          },
        },
      },
      'google-oauth'
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management and profile operations')
    .addTag('Vinyls', 'Vinyl records catalog and management')
    .addTag('Reviews', 'Product reviews and ratings')
    .addTag('Stripe', 'Payment processing and checkout')
    .addTag('Discogs', 'Discogs integration for vinyl migration')
    .addTag('System', 'System information and health checks')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
    deepScanRoutes: true,
  });

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai',
      },
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
    },
    customSiteTitle: 'Vinyl Store API Documentation',
    customfavIcon: 'https://vinylstore.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { font-size: 2.5rem; }
    `,
  });
}
