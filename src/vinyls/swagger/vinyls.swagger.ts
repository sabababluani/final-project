import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  ApiUnauthorized,
  ApiForbidden,
  ApiNotFound,
  ApiBadRequest,
  ApiInternalError,
} from '../../common/swagger';
import { Vinyl } from '../entities/vinyl.entity';

export function ApiCreateVinyl() {
  return applyDecorators(
    ApiTags('Vinyls'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Create a new vinyl record',
      description:
        'Creates a new vinyl record listing. Only users with ADMIN role can create vinyls.',
    }),
    ApiResponse({
      status: 201,
      description: 'Vinyl created successfully',
      type: Vinyl,
    }),
    ApiBadRequest(),
    ApiUnauthorized(),
    ApiForbidden(),
    ApiInternalError()
  );
}

export function ApiGetAllVinyls() {
  return applyDecorators(
    ApiTags('Vinyls'),
    ApiOperation({
      summary: 'Get all vinyl records',
      description:
        'Retrieves a paginated list of all vinyl records available in the store.',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Vinyls retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(Vinyl) },
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
    }),
    ApiInternalError()
  );
}

export function ApiSearchVinyls() {
  return applyDecorators(
    ApiTags('Vinyls'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Search vinyl records',
      description:
        'Search and filter vinyl records with sorting and pagination support.',
    }),
    ApiQuery({
      name: 'query',
      required: false,
      type: String,
      description: 'Search query',
      example: 'Beatles',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['price', 'name', 'authorName'],
      description: 'Field to sort by',
    }),
    ApiQuery({
      name: 'order',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Sort order',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Search results',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(Vinyl) },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 50 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 5 },
            },
          },
        },
      },
    }),
    ApiUnauthorized(),
    ApiInternalError()
  );
}

export function ApiUpdateVinyl() {
  return applyDecorators(
    ApiTags('Vinyls'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Update a vinyl record',
      description:
        'Updates an existing vinyl record. Only users with ADMIN role can update vinyls.',
    }),
    ApiParam({
      name: 'id',
      description: 'Vinyl ID',
      example: 1,
      type: 'number',
    }),
    ApiResponse({
      status: 200,
      description: 'Vinyl updated successfully',
      type: Vinyl,
    }),
    ApiBadRequest(),
    ApiUnauthorized(),
    ApiForbidden(),
    ApiNotFound('Vinyl'),
    ApiInternalError()
  );
}

export function ApiDeleteVinyl() {
  return applyDecorators(
    ApiTags('Vinyls'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Delete a vinyl record',
      description:
        'Soft deletes a vinyl record. Only users with ADMIN role can delete vinyls.',
    }),
    ApiParam({
      name: 'id',
      description: 'Vinyl ID',
      example: 1,
      type: 'number',
    }),
    ApiResponse({
      status: 200,
      description: 'Vinyl deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Vinyl deleted successfully' },
        },
      },
    }),
    ApiUnauthorized(),
    ApiForbidden(),
    ApiNotFound('Vinyl'),
    ApiInternalError()
  );
}
