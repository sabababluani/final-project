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
import { Review } from '../entities/review.entity';

export function ApiCreateReview() {
  return applyDecorators(
    ApiTags('Reviews'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Create a review for a vinyl',
      description:
        'Allows authenticated users to create a review with a rating (1-5) and comment for a specific vinyl record.',
    }),
    ApiParam({
      name: 'vinylId',
      description: 'ID of the vinyl to review',
      example: 1,
      type: 'number',
    }),
    ApiResponse({
      status: 201,
      description: 'Review created successfully',
      type: Review,
    }),
    ApiBadRequest(),
    ApiUnauthorized(),
    ApiNotFound('Vinyl'),
    ApiInternalError()
  );
}

export function ApiGetReviewsByVinyl() {
  return applyDecorators(
    ApiTags('Reviews'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get all reviews for a vinyl',
      description:
        'Retrieves all reviews for a specific vinyl record with pagination support.',
    }),
    ApiParam({
      name: 'vinylId',
      description: 'ID of the vinyl',
      example: 1,
      type: 'number',
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
      description: 'Reviews retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(Review) },
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
    ApiNotFound('Vinyl'),
    ApiInternalError()
  );
}

export function ApiDeleteReview() {
  return applyDecorators(
    ApiTags('Reviews'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Delete a review',
      description:
        'Deletes a review. Only the review author or users with ADMIN role can delete reviews.',
    }),
    ApiParam({
      name: 'id',
      description: 'Review ID',
      example: 1,
      type: 'number',
    }),
    ApiResponse({
      status: 200,
      description: 'Review deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Review deleted successfully' },
        },
      },
    }),
    ApiUnauthorized(),
    ApiForbidden(),
    ApiNotFound('Review'),
    ApiInternalError()
  );
}
