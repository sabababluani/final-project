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
import { SortOrder, VinylSortBy } from '../dto/search-vinyls.dto';

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
      summary: 'Get and search vinyl records',
      description:
        "Retrieves a paginated list of vinyl records with optional search and sorting capabilities. When no search query is provided, returns all vinyls. Each vinyl includes the first review (if available) with the reviewer's information.",
    }),
    ApiQuery({
      name: 'query',
      required: false,
      type: String,
      description: 'Search query to filter by vinyl name or author name',
      example: 'Beatles',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: VinylSortBy,
      description: 'Field to sort by',
      example: VinylSortBy.NAME,
    }),
    ApiQuery({
      name: 'order',
      required: false,
      enum: SortOrder,
      description: 'Sort order',
      example: SortOrder.ASC,
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
              sortBy: {
                type: 'string',
                enum: Object.values(VinylSortBy),
                example: VinylSortBy.NAME,
              },
              order: {
                type: 'string',
                enum: Object.values(SortOrder),
                example: SortOrder.ASC,
              },
            },
          },
        },
      },
    }),
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
