import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
} from '@nestjs/swagger';

export class ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export function ApiUnauthorized() {
  return ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing authentication token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  });
}

export function ApiForbidden() {
  return ApiForbiddenResponse({
    description: 'Forbidden - Insufficient permissions to access this resource',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Forbidden resource' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  });
}

export function ApiBadRequest() {
  return ApiBadRequestResponse({
    description: 'Bad Request - Invalid input data or validation failed',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          example: ['email must be a valid email', 'password is required'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  });
}

export function ApiNotFound(resourceName: string = 'Resource') {
  return ApiNotFoundResponse({
    description: `${resourceName} not found`,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: `${resourceName} not found` },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  });
}

export function ApiInternalError() {
  return ApiInternalServerErrorResponse({
    description: 'Internal Server Error - Something went wrong on the server',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: {
          type: 'string',
          example: 'Internal server error',
        },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  });
}

export function ApiPaginatedResponse<T extends Type<unknown>>(model: T) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Successful response with pagination',
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number', example: 100 },
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 10 },
                  totalPages: { type: 'number', example: 10 },
                },
              },
            },
          },
        ],
      },
    })
  );
}

export function ApiCommonErrors() {
  return applyDecorators(
    ApiUnauthorized(),
    ApiForbidden(),
    ApiBadRequest(),
    ApiInternalError()
  );
}

export function ApiCreatedResponse<T extends Type<unknown>>(
  model: T,
  description: string = 'Resource created successfully'
) {
  return ApiResponse({
    status: 201,
    description,
    type: model,
  });
}

export function ApiSuccessResponse<T extends Type<unknown>>(
  model: T,
  description: string = 'Successful operation'
) {
  return ApiResponse({
    status: 200,
    description,
    type: model,
  });
}

export function ApiDeleteResponse(
  description: string = 'Resource deleted successfully'
) {
  return ApiResponse({
    status: 200,
    description,
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Resource deleted successfully' },
      },
    },
  });
}
