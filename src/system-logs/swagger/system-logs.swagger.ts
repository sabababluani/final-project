import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ApiUnauthorized,
  ApiForbidden,
  ApiBadRequest,
  ApiInternalError,
} from '../../common/swagger';

export function ApiCreateSystemLog() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create system log',
      description:
        'Creates a new system log entry for monitoring and debugging.',
    }),
    ApiResponse({
      status: 201,
      description: 'System log created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          message: { type: 'string', example: 'User logged in' },
          level: { type: 'string', example: 'info' },
          createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        },
      },
    }),
    ApiBadRequest(),
    ApiInternalError()
  );
}

export function ApiGetSystemLogs() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get system logs (supports pagination)',
      description:
        'Retrieves system logs. Supports optional pagination via query parameters `page` and `limit`. Only accessible by users with ADMIN role.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      example: 1,
      description: 'Page number for pagination (optional)',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      example: 10,
      description: 'Number of logs per page (optional)',
    }),
    ApiResponse({
      status: 200,
      description: 'System logs retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          logs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                message: { type: 'string', example: 'User logged in' },
                level: { type: 'string', example: 'info' },
                createdAt: {
                  type: 'string',
                  example: '2024-01-01T00:00:00.000Z',
                },
              },
            },
          },
          total: { type: 'number', example: 42 },
          page: { type: 'number', example: 1, nullable: true },
          limit: { type: 'number', example: 10, nullable: true },
        },
      },
    }),
    ApiUnauthorized(),
    ApiForbidden(),
    ApiInternalError()
  );
}
