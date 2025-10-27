import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiUnauthorized,
  ApiNotFound,
  ApiBadRequest,
  ApiInternalError,
} from '../../common/swagger';
import { User } from '../entities/user.entity';

export function ApiGetMe() {
  return applyDecorators(
    ApiTags('Users'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get current user profile',
      description:
        'Returns the profile information of the currently authenticated user.',
    }),
    ApiResponse({
      status: 200,
      description: 'User profile retrieved successfully',
      type: User,
    }),
    ApiUnauthorized(),
    ApiInternalError()
  );
}

export function ApiGetUserById() {
  return applyDecorators(
    ApiTags('Users'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Get user by ID',
      description: 'Retrieves a user profile by their unique identifier.',
    }),
    ApiParam({
      name: 'id',
      description: 'User ID',
      example: 1,
      type: 'number',
    }),
    ApiResponse({
      status: 200,
      description: 'User found',
      type: User,
    }),
    ApiNotFound('User'),
    ApiUnauthorized(),
    ApiInternalError()
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiTags('Users'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Update own profile',
      description:
        "Updates the authenticated user's profile information including first name, last name, birthdate, and avatar.",
    }),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      type: User,
    }),
    ApiBadRequest(),
    ApiUnauthorized(),
    ApiNotFound('User'),
    ApiInternalError()
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiTags('Users'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Delete own account',
      description: "Deletes the authenticated user's own account.",
    }),
    ApiResponse({
      status: 200,
      description: 'User deleted successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User deleted successfully' },
        },
      },
    }),
    ApiUnauthorized(),
    ApiNotFound('User'),
    ApiInternalError()
  );
}
