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

describe('VinylsModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let accessToken: string;
  let createdVinylId: number;
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
      lastName: 'Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      password: 'hashedpassword',
    });
    const savedUser = await userRepository.save(testUser);
    testUserId = savedUser.id;

    const secret = process.env.JWT_SECRET || 'test_jwt_secret';
    accessToken = jwtService.sign(
      { sub: testUserId, email: 'admin@test.com', role: 'ADMIN' },
      { secret }
    );
  });

  after(async () => {
    if (dataSource && dataSource.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should create a vinyl (authenticated admin)', async () => {
    const dto = {
      name: 'Wish You Were Here',
      authorName: 'Pink Floyd',
      image: 'https://example.com/images/wish-you-were-here.jpg',
      description: 'Classic Pink Floyd album released in 1975.',
      price: 60,
    };

    const response = await request(app.getHttpServer())
      .post('/vinyls')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(dto);

    assert.strictEqual(
      response.status,
      201,
      `Expected 201 but got ${response.status}: ${JSON.stringify(response.body)}`
    );

    createdVinylId = response.body?.data?.id || response.body?.id;

    assert.ok(
      createdVinylId && !isNaN(createdVinylId),
      `Vinyl ID should be a valid number, got: ${createdVinylId}. Response body: ${JSON.stringify(response.body)}`
    );
  });

  it('should fetch all vinyls', async () => {
    const response = await request(app.getHttpServer())
      .get('/vinyls')
      .set('Authorization', `Bearer ${accessToken}`);

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );
    assert.ok(response.body, 'Response body should exist');
  });

  it('should update a vinyl (authenticated admin)', async () => {
    const updateDto = {
      name: 'Wish You Were Here - Remastered',
      price: 75,
    };

    const response = await request(app.getHttpServer())
      .patch(`/vinyls/${createdVinylId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateDto);

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );
    assert.ok(response.body, 'Response body should exist');
  });

  it('should delete a vinyl (authenticated admin)', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/vinyls/${createdVinylId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );
    assert.ok(response.body, 'Response body should exist');
  });

  it('should return 404 when fetching deleted vinyl', async () => {
    await request(app.getHttpServer())
      .get(`/vinyls/${createdVinylId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('should search vinyls with filters', async () => {
    const searchDto = {
      page: 1,
      limit: 10,
      sortBy: 'name',
      order: 'ASC',
    };

    const response = await request(app.getHttpServer())
      .get('/vinyls')
      .set('Authorization', `Bearer ${accessToken}`)
      .query(searchDto);

    assert.strictEqual(
      response.status,
      200,
      `Expected 200 but got ${response.status}: ${JSON.stringify(response.body)}`
    );
    assert.ok(response.body, 'Response body should exist');
  });

  it('should return 404 when updating non-existent vinyl', async () => {
    const updateDto = {
      name: 'Non-existent Album',
    };

    await request(app.getHttpServer())
      .patch('/vinyls/99999')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateDto)
      .expect(404);
  });

  it('should return 404 when deleting non-existent vinyl', async () => {
    await request(app.getHttpServer())
      .delete('/vinyls/99999')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
