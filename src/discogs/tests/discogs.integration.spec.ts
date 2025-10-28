import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModuleTest } from '../../app.module.test';
import { User } from '../../users/entities/user.entity';
import { DiscogsService } from '../discogs.service';

describe('DiscogsModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let adminToken: string;
  let userToken: string;

  const mockDiscogsService = {
    fetchAndStoreVinyls: async () => ({
      message: 'Vinyls fetched and stored. 10 vinyls fetched',
    }),
  };

  before(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModuleTest],
    })
      .overrideProvider(DiscogsService)
      .useValue(mockDiscogsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    userRepo = dataSource.getRepository(User);

    const jwtService = moduleFixture.get(JwtService);
    const configService = moduleFixture.get(ConfigService);
    const secret = configService.get<string>('JWT_SECRET');

    const adminUser = await userRepo.save(
      userRepo.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        role: 'Admin',
        password: '$2b$10$hashed_password',
      })
    );

    const regularUser = await userRepo.save(
      userRepo.create({
        firstName: 'Regular',
        lastName: 'User',
        email: 'user@test.com',
        role: 'User',
        password: '$2b$10$hashed_password',
      })
    );

    adminToken = jwtService.sign(
      { sub: adminUser.id, email: adminUser.email, role: 'Admin' },
      { secret }
    );

    userToken = jwtService.sign(
      { sub: regularUser.id, email: regularUser.email, role: 'User' },
      { secret }
    );
  });

  after(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should fetch vinyls with admin token (GET /discogs/migrate)', async () => {
    const res = await request(app.getHttpServer())
      .get('/discogs/migrate')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.message);
  });

  it('should return 401 without token (GET /discogs/migrate)', async () => {
    const res = await request(app.getHttpServer()).get('/discogs/migrate');

    assert.strictEqual(res.status, 401);
  });

  it('should return 401 with non-admin token (GET /discogs/migrate)', async () => {
    const res = await request(app.getHttpServer())
      .get('/discogs/migrate')
      .set('Authorization', `Bearer ${userToken}`);

    assert.strictEqual(res.status, 401);
  });

  it('should accept query parameter (GET /discogs/migrate?q=jazz)', async () => {
    const res = await request(app.getHttpServer())
      .get('/discogs/migrate?q=jazz')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.message);
  });
});
