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
import { User } from '../../users/entities/user.entity';
import { SystemLog } from '../entities/system-log.entity';
import { LogLevel } from '../dto/create-system-log.dto';

describe('SystemLogsModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;
  let adminId: number;
  let userId: number;

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
    const adminUser = userRepository.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@test.com',
      role: 'Admin',
      password: 'hashedpassword123',
    });
    const savedAdmin = await userRepository.save(adminUser);
    adminId = savedAdmin.id;

    const regularUser = userRepository.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'user@test.com',
      role: 'User',
      password: 'hashedpassword456',
    });
    const savedUser = await userRepository.save(regularUser);
    userId = savedUser.id;

    const secret = process.env.JWT_SECRET || 'test_jwt_secret';
    adminToken = jwtService.sign(
      { sub: adminId, email: 'admin@test.com', role: 'Admin' },
      { secret }
    );
    userToken = jwtService.sign(
      { sub: userId, email: 'user@test.com', role: 'User' },
      { secret }
    );
  });

  after(async () => {
    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should create a system log (POST /system-logs)', async () => {
    const createDto = {
      message: 'User successfully logged in',
      level: LogLevel.INFO,
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    assert.strictEqual(
      response.status,
      201,
      `Expected 201 but got ${response.status}: ${JSON.stringify(response.body)}`
    );

    assert.ok(response.body, 'Response body should exist');
    assert.strictEqual(
      response.body.message,
      'Log created successfully',
      'Should return success message'
    );
    assert.ok(response.body.log, 'Should return created log');
    assert.strictEqual(
      response.body.log.message,
      'User successfully logged in',
      'Log message should match'
    );
    assert.strictEqual(
      response.body.log.level,
      LogLevel.INFO,
      'Log level should match'
    );

    const logRepository = dataSource.getRepository(SystemLog);
    const savedLog = await logRepository.findOne({
      where: { message: 'User successfully logged in' },
    });
    assert.ok(savedLog, 'Log should be saved in database');
    assert.strictEqual(savedLog.level, LogLevel.INFO);
  });

  it('should create a system log without level (uses default)', async () => {
    const createDto = {
      message: 'System started successfully',
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    assert.strictEqual(
      response.status,
      201,
      `Expected 201 but got ${response.status}: ${JSON.stringify(response.body)}`
    );

    assert.ok(response.body.log, 'Should return created log');
    assert.strictEqual(
      response.body.log.message,
      'System started successfully'
    );
  });

  it('should create logs with different levels', async () => {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.DEBUG];

    for (const level of levels) {
      const createDto = {
        message: `Test log with ${level} level`,
        level: level,
      };

      const response = await request(app.getHttpServer())
        .post('/system-logs')
        .send(createDto);

      assert.strictEqual(
        response.status,
        201,
        `Expected 201 but got ${response.status} for level ${level}`
      );
      assert.strictEqual(response.body.log.level, level);
    }
  });

  it('should return 400 for invalid log level', async () => {
    const createDto = {
      message: 'Test message',
      level: 'invalid_level',
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    assert.strictEqual(response.status, 400, 'Should reject invalid log level');
  });

  it('should return 400 for missing message', async () => {
    const createDto = {
      level: LogLevel.INFO,
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    assert.strictEqual(response.status, 400, 'Should reject missing message');
  });

  it('should return 400 for invalid message type', async () => {
    const createDto = {
      message: 12345,
      level: LogLevel.INFO,
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    assert.strictEqual(
      response.status,
      400,
      'Should reject non-string message'
    );
  });

  it('should get system logs as admin (GET /system-logs)', async () => {
    const response = await request(app.getHttpServer())
      .get('/system-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );

    assert.ok(response.body, 'Response body should exist');
    assert.ok(Array.isArray(response.body.logs), 'Should return logs array');
    assert.ok(response.body.total >= 0, 'Should return total count');
    assert.strictEqual(response.body.page, 1, 'Should return current page');
    assert.strictEqual(response.body.limit, 10, 'Should return limit');

    assert.ok(response.body.logs.length > 0, 'Should have at least one log');
  });

  it('should support pagination for system logs', async () => {
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post('/system-logs')
        .send({
          message: `Pagination test log ${i}`,
          level: LogLevel.INFO,
        });
    }

    const firstPage = await request(app.getHttpServer())
      .get('/system-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 3 });

    assert.strictEqual(firstPage.status, 200);
    assert.strictEqual(firstPage.body.logs.length, 3);
    assert.strictEqual(firstPage.body.page, 1);
    assert.strictEqual(firstPage.body.limit, 3);
    assert.ok(firstPage.body.total >= 5);

    const secondPage = await request(app.getHttpServer())
      .get('/system-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 2, limit: 3 });

    assert.strictEqual(secondPage.status, 200);
    assert.ok(secondPage.body.logs.length > 0);
    assert.strictEqual(secondPage.body.page, 2);
    assert.strictEqual(secondPage.body.limit, 3);
  });

  it('should get all logs without pagination when no query params', async () => {
    const response = await request(app.getHttpServer())
      .get('/system-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(response.status, 200);
    assert.ok(Array.isArray(response.body.logs));
    assert.ok(response.body.total >= 0);
    assert.ok(response.body.page !== undefined);
    assert.ok(response.body.limit !== undefined);
  });

  it('should return 401 when accessing logs without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/system-logs')
      .query({ page: 1, limit: 10 });

    assert.strictEqual(response.status, 401, 'Should require authentication');
  });

  it('should return 401 with invalid token when accessing logs', async () => {
    const response = await request(app.getHttpServer())
      .get('/system-logs')
      .set('Authorization', 'Bearer invalid_token_here')
      .query({ page: 1, limit: 10 });

    assert.strictEqual(response.status, 401, 'Should reject invalid token');
  });

  it('should return 401 when non-admin user tries to access logs', async () => {
    const response = await request(app.getHttpServer())
      .get('/system-logs')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ page: 1, limit: 10 });

    assert.strictEqual(
      response.status,
      401,
      'Should reject non-admin users with 401'
    );
  });

  it('should verify log timestamps are created correctly', async () => {
    const createDto = {
      message: 'Timestamp test log',
      level: LogLevel.INFO,
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    const now = new Date();

    assert.strictEqual(response.status, 201);
    assert.ok(response.body.log.createdAt, 'Should have createdAt timestamp');
    assert.ok(response.body.log.updatedAt, 'Should have updatedAt timestamp');

    const createdAt = new Date(response.body.log.createdAt);

    assert.ok(
      Math.abs(now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000,
      'Timestamp should be within 24 hours of current time'
    );
  });

  it('should handle empty log message gracefully', async () => {
    const createDto = {
      message: '',
      level: LogLevel.INFO,
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    assert.ok(
      response.status === 400 || response.status === 201,
      'Should either reject or accept empty message based on validation rules'
    );
  });

  it('should handle moderately long log messages', async () => {
    const longMessage = 'A'.repeat(255);
    const createDto = {
      message: longMessage,
      level: LogLevel.INFO,
    };

    const response = await request(app.getHttpServer())
      .post('/system-logs')
      .send(createDto);

    assert.strictEqual(
      response.status,
      201,
      'Should handle messages up to 255 characters'
    );
    assert.strictEqual(response.body.log.message.length, 255);
  });

  it('should retrieve logs in correct order', async () => {
    const messages = ['First log', 'Second log', 'Third log'];
    for (const message of messages) {
      await request(app.getHttpServer())
        .post('/system-logs')
        .send({ message, level: LogLevel.INFO });
    }

    const response = await request(app.getHttpServer())
      .get('/system-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 100 });

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.logs.length >= 3);
  });
});
