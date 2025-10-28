# Swagger/OpenAPI Documentation Guide

## Overview

This project uses a production-grade Swagger (OpenAPI 3.0) documentation system that follows NestJS best practices. The implementation is modular, scalable, and maintainable.

## Architecture

### Directory Structure

```
src/
├── config/
│   └── swagger.config.ts          # Main Swagger configuration
├── common/
│   └── swagger/
│       ├── api-responses.decorator.ts  # Reusable response decorators
│       └── index.ts                    # Barrel export
├── auth/
│   └── swagger/
│       └── auth.swagger.ts         # Auth-specific Swagger decorators
├── users/
│   └── swagger/
│       └── users.swagger.ts        # Users-specific Swagger decorators
├── vinyls/
│   └── swagger/
│       └── vinyls.swagger.ts       # Vinyls-specific Swagger decorators
├── reviews/
│   └── swagger/
│       └── reviews.swagger.ts      # Reviews-specific Swagger decorators
└── stripe/
    └── swagger/
        └── stripe.swagger.ts       # Stripe-specific Swagger decorators
```

## Key Features

### 1. **Modular Design**
Each module has its own Swagger decorator files, making the codebase easy to maintain and scale.

### 2. **Reusable Decorators**
Common response patterns (400, 401, 403, 404, 500) are defined once in `common/swagger/api-responses.decorator.ts` and reused across all endpoints.

### 3. **JWT Authentication**
Swagger UI includes JWT Bearer token authentication with persistent storage (token survives page refresh).

### 4. **Comprehensive Documentation**
Every endpoint includes:
- Operation summary and description
- Request body schemas with examples
- Response schemas with status codes
- Parameter descriptions
- Error responses

### 5. **Tagged Endpoints**
Endpoints are organized by tags (Authentication, Users, Vinyls, Reviews, Stripe, System) for better navigation.

### 6. **Request Examples**
All DTOs include example values to help API consumers understand expected formats.

## Accessing the Documentation

### Local Development
```
http://localhost:3001/api/docs
```

## Using the Swagger UI

### 1. **Authentication**

For endpoints requiring authentication:

1. Click the **"Authorize"** button (🔒) at the top right
2. Enter your JWT token in the format: `Bearer <your-token>`
3. Click **"Authorize"**
4. Click **"Close"**

Your token will be included in all subsequent requests.

### 2. **Testing Endpoints**

1. Expand the endpoint you want to test
2. Click **"Try it out"**
3. Fill in the required parameters
4. Click **"Execute"**
5. View the response below

### 3. **Viewing Models**

Scroll to the bottom of the Swagger UI to see all data models (DTOs and Entities) with their properties and types.

## Best Practices Implemented

### 1. **Separation of Concerns**
- Configuration is separate from implementation
- Each module has its own Swagger decorators
- Common patterns are extracted to shared decorators

### 2. **Type Safety**
- All DTOs use class-validator decorators
- ApiProperty decorators match validation rules
- Response types are explicitly defined

### 3. **Documentation as Code**
- Documentation is maintained alongside the code
- Changes to endpoints automatically update documentation
- No separate API documentation to maintain

### 4. **Production-Ready Features**
- Multiple server configurations (local, staging, production)
- API versioning support
- Custom CSS for branding
- Security scheme documentation
- Contact information and licensing

### 5. **Developer Experience**
- Search/filter functionality enabled
- Request duration tracking
- Syntax highlighting with monokai theme
- Request snippets for various languages
- Persistent authorization

## Adding Swagger to New Endpoints

### Step 1: Create DTO with ApiProperty

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Amazing Product',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product price in USD',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber()
  price: number;
}
```

### Step 2: Create Swagger Decorator File

Create `src/products/swagger/products.swagger.ts`:

```typescript
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiCommonErrors } from 'src/common/swagger';

export function ApiCreateProduct() {
  return applyDecorators(
    ApiTags('Products'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Create a new product',
      description: 'Creates a new product in the catalog',
    }),
    ApiResponse({
      status: 201,
      description: 'Product created successfully',
      type: Product,
    }),
    ApiCommonErrors()
  );
}
```

### Step 3: Apply Decorator to Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiCreateProduct } from './swagger/products.swagger';

@Controller('products')
export class ProductsController {
  @ApiCreateProduct()
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

## Common Decorators Reference

### Response Decorators

```typescript
// 400 Bad Request
ApiBadRequest()

// 401 Unauthorized
ApiUnauthorized()

// 403 Forbidden
ApiForbidden()

// 404 Not Found
ApiNotFound('Resource')

// 500 Internal Server Error
ApiInternalError()

// All common errors at once
ApiCommonErrors()

// Paginated response
ApiPaginatedResponse(Model)

// Delete success
ApiDeleteResponse('Resource deleted successfully')
```

### Endpoint Decorators

```typescript
// Tag endpoints
@ApiTags('TagName')

// Authentication required
@ApiBearerAuth('JWT-auth')

// Operation details
@ApiOperation({
  summary: 'Short description',
  description: 'Detailed description',
})

// Response
@ApiResponse({
  status: 200,
  description: 'Success',
  type: ResponseDto,
})

// Path parameter
@ApiParam({
  name: 'id',
  description: 'Resource ID',
  type: 'number',
})

// Query parameter
@ApiQuery({
  name: 'search',
  required: false,
  type: String,
})
```

## Configuration Options

Edit `src/config/swagger.config.ts` to customize:

- API title and description
- Version number
- Contact information
- License
- Server URLs
- Authentication schemes
- Tags and groupings
- Swagger UI options

## Troubleshooting

### Swagger UI Not Loading
- Ensure `setupSwagger(app)` is called in `main.ts`
- Check that the app is running on the correct port
- Clear browser cache

### Missing Endpoints
- Verify controller is imported in module
- Check that decorators are applied correctly
- Ensure DTOs have `@ApiProperty()` decorators

### Authentication Not Working
- Use format: `Bearer <token>` (with space)
- Ensure token is valid and not expired
- Check that endpoint has `@ApiBearerAuth()` decorator

### Models Not Showing
- Add `@ApiExtraModels(Model)` to controller
- Use `getSchemaPath(Model)` in response schemas
- Import model at the top of the file

## Maintenance

### Regular Updates
- Update examples when adding new fields
- Keep descriptions clear and concise
- Review and update error responses
- Maintain consistent naming conventions

### Version Control
- Document breaking changes
- Update version number in swagger.config.ts
- Tag releases in version control

## Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)

## Support

For issues or questions regarding the API documentation:
- Email: support@vinylstore.com
- GitHub Issues: [Project Repository]

