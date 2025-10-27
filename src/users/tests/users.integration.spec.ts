import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModuleTest } from '../../app.module.test';
import { User } from '../entities/user.entity';

describe('UsersModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let accessToken: string;
  let testUserId: number;

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
    jwtService = moduleFixture.get(JwtService);

    const userRepository = dataSource.getRepository(User);
    const testUser = userRepository.create({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@test.com',
      role: 'User',
      password: 'hashedpassword123',
    });
    const savedUser = await userRepository.save(testUser);
    testUserId = savedUser.id;

    const secret = process.env.JWT_SECRET || 'test_jwt_secret';
    accessToken = jwtService.sign(
      { sub: testUserId, email: 'testuser@test.com', role: 'User' },
      { secret }
    );
  });

  after(async () => {
    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should get current user profile (GET /users/me)', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );

    assert.ok(response.body, 'Response body should exist');
    assert.strictEqual(response.body.id, testUserId, 'User ID should match');
    assert.strictEqual(
      response.body.email,
      'testuser@test.com',
      'Email should match'
    );
    assert.strictEqual(
      response.body.firstName,
      'Test',
      'First name should match'
    );
    assert.strictEqual(
      response.body.lastName,
      'User',
      'Last name should match'
    );

    assert.strictEqual(
      response.body.password,
      undefined,
      'Password should not be exposed'
    );
  });

  it('should update own profile (PATCH /users/me)', async () => {
    const updateDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    const response = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateDto);

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );

    assert.strictEqual(
      response.body.firstName,
      'Updated',
      'First name should be updated'
    );
    assert.strictEqual(
      response.body.lastName,
      'Name',
      'Last name should be updated'
    );

    const userRepository = dataSource.getRepository(User);
    const updatedUser = await userRepository.findOne({
      where: { id: testUserId },
    });
    assert.strictEqual(
      updatedUser?.firstName,
      'Updated',
      'First name should persist in database'
    );
    assert.strictEqual(
      updatedUser?.lastName,
      'Name',
      'Last name should persist in database'
    );
  });

  it('should delete own account (DELETE /users/me)', async () => {
    const response = await request(app.getHttpServer())
      .delete('/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );

    assert.ok(response.body.message, 'Should return success message');

    const userRepository = dataSource.getRepository(User);
    const deletedUser = await userRepository.findOne({
      where: { id: testUserId },
    });
    assert.strictEqual(
      deletedUser,
      null,
      'User should be deleted from database'
    );
  });

  it('should return 401 when accessing without authentication (GET /users/me)', async () => {
    const response = await request(app.getHttpServer()).get('/users/me');

    assert.strictEqual(response.status, 401, 'Should require authentication');
  });

  it('should return 401 with invalid token (GET /users/me)', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer invalid_token_here');

    assert.strictEqual(response.status, 401, 'Should reject invalid token');
  });
});
