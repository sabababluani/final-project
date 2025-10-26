import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';
import { TokenBlacklistService } from '../../token-blacklists/token-blacklists.service';
import { SystemLogsService } from '../../system-logs/system-logs.service';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, HttpException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { loginUserDto } from '../dto/login-user.dto';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let findOneMock: ReturnType<typeof mock.fn>;
  let signAsyncMock: ReturnType<typeof mock.fn>;
  let decodeMock: ReturnType<typeof mock.fn>;
  let findOneByEmailMock: ReturnType<typeof mock.fn>;
  let createUserMock: ReturnType<typeof mock.fn>;
  let addToBlacklistMock: ReturnType<typeof mock.fn>;

  before(async () => {
    findOneMock = mock.fn();
    signAsyncMock = mock.fn(async () => 'mock-token');
    decodeMock = mock.fn();
    findOneByEmailMock = mock.fn();
    createUserMock = mock.fn();
    addToBlacklistMock = mock.fn(async () => {});

    const mockQueryRunner = {
      connect: mock.fn(async () => {}),
      startTransaction: mock.fn(async () => {}),
      commitTransaction: mock.fn(async () => {}),
      rollbackTransaction: mock.fn(async () => {}),
      release: mock.fn(async () => {}),
      manager: {
        findOne: mock.fn(),
        create: mock.fn(),
        save: mock.fn(),
      },
    };

    const mockUserRepository = {
      findOne: findOneMock,
    };

    const mockJwtService = {
      signAsync: signAsyncMock,
      decode: decodeMock,
    };

    const mockUsersService = {
      findOneByEmail: findOneByEmailMock,
      create: createUserMock,
    };

    const mockTokenBlacklistService = {
      addToBlacklist: addToBlacklistMock,
    };

    const mockSystemLogsService = {
      createLog: mock.fn(async () => {}),
    };

    const mockDataSource = {
      createQueryRunner: mock.fn(() => mockQueryRunner),
    };

    const mockConfigService = {
      get: mock.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
        {
          provide: SystemLogsService,
          useValue: mockSystemLogsService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    assert.ok(service);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto = plainToInstance(CreateUserDto, {
        email: 'test@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

      const mockUser = { id: 1, email: 'test@test.com' };
      findOneByEmailMock.mock.mockImplementation(async () => null);
      createUserMock.mock.mockImplementation(async () => mockUser);

      const result = await service.register(createUserDto);

      assert.strictEqual(findOneByEmailMock.mock.calls.length, 1);
      assert.strictEqual(createUserMock.mock.calls.length, 1);
      assert.deepStrictEqual(result, mockUser);
    });

    it('should throw error if email already exists', async () => {
      const createUserDto = plainToInstance(CreateUserDto, {
        email: 'existing@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      });

      findOneByEmailMock.mock.mockImplementation(async () => ({
        id: 1,
        email: 'existing@test.com',
      }));

      await assert.rejects(
        async () => service.register(createUserDto),
        (error) => {
          assert.ok(error instanceof HttpException);
          assert.strictEqual(error.message, 'Email already in use');
          return true;
        }
      );
    });
  });

  describe('findUser', () => {
    it('should find a user by id', async () => {
      const mockUser = { id: 1, email: 'test@test.com' };
      findOneMock.mock.mockImplementation(async () => mockUser);

      const result = await service.findUser(1);

      assert.deepStrictEqual(result, mockUser);
      assert.strictEqual(findOneMock.mock.calls.length, 1);
    });
  });

  describe('handleRedirect', () => {
    it('should generate token for OAuth redirect', async () => {
      const mockReq = { user: { id: 1, email: 'test@test.com', role: 'user' } };

      const result = await service.handleRedirect(mockReq);

      assert.ok(result);
      assert.ok(result.accessToken);
      assert.strictEqual(result.accessToken, 'mock-token');
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      const loginDto = plainToInstance(loginUserDto, {
        email: 'test@test.com',
        password: 'Password123!',
      });

      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        role: 'user',
      };
      findOneByEmailMock.mock.mockImplementation(async () => mockUser);

      const result = await service.login(loginDto);

      assert.ok(result);
      assert.ok(result.accessToken);
      assert.strictEqual(result.accessToken, 'mock-token');
    });

    it('should throw error with incorrect password', async () => {
      const loginDto = plainToInstance(loginUserDto, {
        email: 'test@test.com',
        password: 'WrongPassword',
      });

      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 1,
        email: 'test@test.com',
        password: hashedPassword,
        role: 'user',
      };
      findOneByEmailMock.mock.mockImplementation(async () => mockUser);

      await assert.rejects(
        async () => service.login(loginDto),
        (error) => {
          assert.ok(error instanceof BadRequestException);
          assert.strictEqual(error.message, 'Password is incorrect');
          return true;
        }
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const token = 'valid-token';
      const userId = 1;
      decodeMock.mock.mockImplementation(() => ({
        sub: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }));

      const result = await service.logout(token, userId);

      assert.deepStrictEqual(result, { message: 'Successfully logged out' });
      assert.strictEqual(addToBlacklistMock.mock.calls.length, 1);
    });
  });
});
