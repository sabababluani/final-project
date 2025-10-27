import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiBadRequest,
  ApiUnauthorized,
  ApiInternalError,
} from '../../common/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { loginUserDto } from '../dto/login-user.dto';

export function ApiRegister() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Creates a new user account with email and password. Password must be at least 6 characters and match the confirmation.',
    }),
    ApiBody({ type: CreateUserDto }),
    ApiResponse({
      status: 201,
      description: 'User successfully registered',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'User Successfully Registered' },
        },
      },
    }),
    ApiBadRequest(),
    ApiInternalError()
  );
}

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login user',
      description:
        'Authenticates a user with email and password, returns a JWT access token.',
    }),
    ApiBody({ type: loginUserDto }),
    ApiResponse({
      status: 200,
      description: 'User successfully logged in',
      schema: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Invalid credentials' },
        },
      },
    }),
    ApiBadRequest(),
    ApiInternalError()
  );
}

export function ApiGoogleLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Login with Google',
      description:
        'Initiates Google OAuth authentication flow. Redirects to Google consent screen.',
    }),
    ApiResponse({
      status: 200,
      description: 'Redirects to Google OAuth',
      schema: {
        type: 'object',
        properties: {
          msg: { type: 'string', example: 'Google Authentication' },
        },
      },
    })
  );
}

export function ApiGoogleRedirect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google OAuth callback',
      description:
        'Handles the callback from Google OAuth. Returns JWT token and user information.',
    }),
    ApiResponse({
      status: 200,
      description: 'User authenticated via Google',
      schema: {
        type: 'object',
        properties: {
          access_token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              email: { type: 'string', example: 'john.doe@example.com' },
              firstName: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              role: { type: 'string', example: 'USER' },
              avatar: {
                type: 'string',
                example: 'https://lh3.googleusercontent.com/...',
              },
            },
          },
        },
      },
    })
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Logout user',
      description:
        'Logs out the currently authenticated user by blacklisting their JWT token.',
    }),
    ApiResponse({
      status: 200,
      description: 'User successfully logged out',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged out successfully' },
        },
      },
    }),
    ApiUnauthorized(),
    ApiInternalError()
  );
}
