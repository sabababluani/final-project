import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppModuleTest } from '../../app.module.test';
import { User } from '../../users/entities/user.entity';

describe('AuthModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let accessToken: string;

  const uniqueEmail = () => `test.${Date.now()}@test.com`;
  const postAuth = (
    endpoint: string,
    body?: Record<string, unknown>,
    token?: string
  ) => {
    const req = request(app.getHttpServer()).post(`/auth/${endpoint}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return body ? req.send(body) : req;
  };
  const assertStatus = (
    res: request.Response,
    expected: number,
    msg?: string
  ) =>
    assert.strictEqual(
      res.status,
      expected,
      msg ||
        `Expected ${expected} but got ${res.status}: ${JSON.stringify(res.body)}`
    );

  before(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModuleTest],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    userRepo = dataSource.getRepository(User);

    const jwtService = moduleFixture.get(JwtService);
    const testUser = await userRepo.save(
      userRepo.create({
        firstName: 'Existing',
        lastName: 'User',
        email: 'existing@test.com',
        role: 'USER',
        password: '$2b$10$hashed_password_here',
      })
    );

    const secret = process.env.JWT_SECRET || 'test_jwt_secret';
    accessToken = jwtService.sign(
      { sub: testUser.id, email: 'existing@test.com', role: 'USER' },
      { secret }
    );

    await userRepo.save(
      userRepo.create({
        firstName: 'Login',
        lastName: 'Test',
        email: 'login@test.com',
        role: 'USER',
        password: await bcrypt.hash('ValidPassword123!', 10),
      })
    );
  });

  after(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should register a new user (POST /auth/register)', async () => {
    const email = uniqueEmail();
    const res = await postAuth('register', {
      firstName: 'John',
      lastName: 'Doe',
      email,
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });

    assertStatus(res, 201);
    assert.ok(res.body, 'Response body should exist');

    const user = await userRepo.findOne({ where: { email } });
    assert.ok(user, 'User should be created in database');
    assert.strictEqual(user.firstName, 'John');
    assert.strictEqual(user.lastName, 'Doe');
    assert.strictEqual(user.email, email);
    assert.notStrictEqual(
      user.password,
      'SecurePass123!',
      'Password should be hashed'
    );
  });

  it('should return 400 for duplicate email (POST /auth/register)', async () => {
    const res = await postAuth('register', {
      firstName: 'Duplicate',
      lastName: 'User',
      email: 'existing@test.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });
    assertStatus(res, 400, 'Should reject duplicate email');
  });

  it('should return 400 for invalid email format (POST /auth/register)', async () => {
    const res = await postAuth('register', {
      firstName: 'Test',
      lastName: 'User',
      email: 'invalid-email',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    });
    assertStatus(res, 400, 'Should reject invalid email format');
  });

  it('should return 400 for short password (POST /auth/register)', async () => {
    const res = await postAuth('register', {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail(),
      password: '12345',
      confirmPassword: '12345',
    });
    assertStatus(res, 400, 'Should reject password shorter than 6 characters');
  });

  it('should return 400 for password mismatch (POST /auth/register)', async () => {
    const res = await postAuth('register', {
      firstName: 'Test',
      lastName: 'User',
      email: uniqueEmail(),
      password: 'SecurePass123!',
      confirmPassword: 'DifferentPass456!',
    });
    assertStatus(res, 400, 'Should reject mismatched passwords');
  });

  it('should login with valid credentials (POST /auth/login)', async () => {
    const res = await postAuth('login', {
      email: 'login@test.com',
      password: 'ValidPassword123!',
    });
    assertStatus(res, 201);
    assert.ok(res.body?.accessToken, 'Access token should be returned');
  });

  it('should return 400 for invalid email (POST /auth/login)', async () => {
    const res = await postAuth('login', {
      email: 'nonexistent@test.com',
      password: 'SomePassword123!',
    });
    assertStatus(res, 400, 'Should reject non-existent email');
  });

  it('should return 400 for invalid password (POST /auth/login)', async () => {
    const res = await postAuth('login', {
      email: 'login@test.com',
      password: 'WrongPassword123!',
    });
    assertStatus(res, 400, 'Should reject invalid password');
  });

  it('should return 400 for missing email (POST /auth/login)', async () => {
    const res = await postAuth('login', { password: 'SomePassword123!' });
    assertStatus(res, 400, 'Should reject missing email');
  });

  it('should return 400 for missing password (POST /auth/login)', async () => {
    const res = await postAuth('login', { email: 'test@test.com' });
    assertStatus(res, 400, 'Should reject missing password');
  });

  it('should logout with valid token (POST /auth/logout)', async () => {
    const res = await postAuth('logout', undefined, accessToken);
    assertStatus(res, 201);
    assert.ok(res.body?.message, 'Success message should be returned');
  });

  it('should return 401 when logging out without token (POST /auth/logout)', async () => {
    const res = await postAuth('logout');
    assertStatus(res, 401, 'Should require authentication');
  });

  it('should return 401 with invalid token (POST /auth/logout)', async () => {
    const res = await postAuth('logout', undefined, 'invalid_token_here');
    assertStatus(res, 401, 'Should reject invalid token');
  });

  it('should return 400 for missing required fields (POST /auth/register)', async () => {
    const res = await postAuth('register', {
      firstName: 'Test',
      email: uniqueEmail(),
    });
    assertStatus(res, 400, 'Should reject missing required fields');
  });

  it('should return success message after registration (POST /auth/register)', async () => {
    const email = uniqueEmail();
    const res = await postAuth('register', {
      firstName: 'Jane',
      lastName: 'Smith',
      email,
      password: 'SecurePass456!',
      confirmPassword: 'SecurePass456!',
    });
    assertStatus(res, 201);
    assert.ok(res.body, 'Response body should exist');
    assert.ok(
      await userRepo.findOne({ where: { email } }),
      'User should be created in database'
    );
  });

  it('should return access token after successful login (POST /auth/login)', async () => {
    const res = await postAuth('login', {
      email: 'login@test.com',
      password: 'ValidPassword123!',
    });
    assertStatus(res, 201);
    assert.ok(res.body?.accessToken, 'Access token should be returned');
    assert.strictEqual(
      typeof res.body.accessToken,
      'string',
      'Access token should be a string'
    );
  });
});
