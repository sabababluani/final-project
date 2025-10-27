import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { loginUserDto } from '../dto/login-user.dto';
import { AuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google/GoogleGuards';
import { plainToInstance } from 'class-transformer';
import type { AuthenticatedRequest } from '../../interfaces/authenticated-user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let mockHandleRedirect: ReturnType<typeof mock.fn>;
  let mockRegister: ReturnType<typeof mock.fn>;
  let mockLogin: ReturnType<typeof mock.fn>;
  let mockLogout: ReturnType<typeof mock.fn>;

  before(async () => {
    mockHandleRedirect = mock.fn();
    mockRegister = mock.fn();
    mockLogin = mock.fn();
    mockLogout = mock.fn();

    const mockAuthService = {
      handleRedirect: mockHandleRedirect,
      register: mockRegister,
      login: mockLogin,
      logout: mockLogout,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(GoogleAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    assert.ok(controller);
  });

  describe('handleLogin', () => {
    it('should return Google Authentication message', () => {
      const result = controller.handleLogin();
      assert.deepStrictEqual(result, { msg: 'Google Authentication' });
    });
  });

  describe('handleRedirect', () => {
    it('should call authService.handleRedirect', async () => {
      const mockReq = { user: { id: 1, email: 'test@test.com', role: 'user' } };
      const mockToken = { accessToken: 'token123' };
      mockHandleRedirect.mock.mockImplementation(async () => mockToken);

      const result = await controller.handleRedirect(mockReq);

      assert.strictEqual(mockHandleRedirect.mock.calls.length, 1);
      assert.deepStrictEqual(
        mockHandleRedirect.mock.calls[0].arguments[0],
        mockReq
      );
      assert.deepStrictEqual(result, mockToken);
    });
  });

  describe('register', () => {
    it('should call authService.register with valid data', async () => {
      const createUserDto = plainToInstance(CreateUserDto, {
        email: 'test@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });
      const mockUser = { id: 1, email: 'test@test.com' };
      mockRegister.mock.mockImplementation(async () => mockUser);

      const result = await controller.register(createUserDto);

      assert.strictEqual(mockRegister.mock.calls.length, 1);
      assert.strictEqual(
        (mockRegister.mock.calls[0].arguments[0] as CreateUserDto).email,
        createUserDto.email
      );
      assert.deepStrictEqual(result, mockUser);
    });
  });

  describe('loginUser', () => {
    it('should call authService.login', async () => {
      const loginDto = plainToInstance(loginUserDto, {
        email: 'test@test.com',
        password: 'Password123!',
      });
      const mockToken = { accessToken: 'token123' };
      mockLogin.mock.mockImplementation(async () => mockToken);

      const result = await controller.loginUser(loginDto);

      assert.strictEqual(mockLogin.mock.calls.length, 1);
      assert.strictEqual(
        (mockLogin.mock.calls[0].arguments[0] as loginUserDto).email,
        loginDto.email
      );
      assert.deepStrictEqual(result, mockToken);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with token and userId', async () => {
      const mockReq = {
        headers: { authorization: 'Bearer token123' },
        user: { id: 1 },
      } as AuthenticatedRequest;
      const mockResponse = { message: 'Successfully logged out' };
      mockLogout.mock.mockImplementation(async () => mockResponse);

      const result = await controller.logout(mockReq);

      assert.strictEqual(mockLogout.mock.calls.length, 1);
      assert.strictEqual(mockLogout.mock.calls[0].arguments[0], 'token123');
      assert.strictEqual(mockLogout.mock.calls[0].arguments[1], 1);
      assert.deepStrictEqual(result, mockResponse);
    });

    it('should throw error if no token provided', async () => {
      const mockReq = {
        headers: {},
        user: { id: 1 },
      } as AuthenticatedRequest;

      await assert.rejects(
        async () => controller.logout(mockReq),
        (error) => {
          assert.ok(error instanceof HttpException);
          assert.strictEqual(error.message, 'No token provided');
          assert.strictEqual(error.getStatus(), HttpStatus.BAD_REQUEST);
          return true;
        }
      );
    });
  });
});
