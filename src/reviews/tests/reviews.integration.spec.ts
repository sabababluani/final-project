import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModuleTest } from '../../app.module.test';
import { User } from '../../users/entities/user.entity';
import { Vinyl } from '../../vinyls/entities/vinyl.entity';
import { Review } from '../entities/review.entity';

describe('ReviewsModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let adminToken: string;
  let userId: number;
  let adminId: number;
  let vinylId: number;

  const req = (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    path: string,
    token?: string
  ) => {
    const r = request(app.getHttpServer())[method](path);
    return token ? r.set('Authorization', `Bearer ${token}`) : r;
  };

  const createReview = (score: number, comment: string, token = userToken) =>
    req('post', `/reviews/${vinylId}`, token).send({ score, comment });

  before(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModuleTest],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.init();

    dataSource = module.get(DataSource);
    const jwtService = module.get(JwtService);
    const secret = process.env.JWT_SECRET || 'test_jwt_secret';

    const userRepo = dataSource.getRepository(User);
    const user = await userRepo.save(
      userRepo.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        role: 'User',
        password: 'hash123',
      })
    );
    userId = user.id;
    userToken = jwtService.sign(
      { sub: userId, email: user.email, role: 'User' },
      { secret }
    );

    const admin = await userRepo.save(
      userRepo.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        role: 'Admin',
        password: 'hash456',
      })
    );
    adminId = admin.id;
    adminToken = jwtService.sign(
      { sub: adminId, email: admin.email, role: 'Admin' },
      { secret }
    );

    const vinylRepo = dataSource.getRepository(Vinyl);
    const vinyl = await vinylRepo.save(
      vinylRepo.create({
        name: 'Dark Side of the Moon',
        authorName: 'Pink Floyd',
        image: 'https://example.com/img.jpg',
        description: 'Classic album',
        price: 45.99,
        averageRating: 0,
        owner: admin,
      })
    );
    vinylId = vinyl.id;
  });

  after(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should create a review for a vinyl (POST /reviews/:vinylId)', async () => {
    const res = await createReview(
      5,
      'Absolutely amazing album! A true masterpiece of progressive rock.'
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.message, "Successfully created vinyl's review");

    const review = await dataSource.getRepository(Review).findOne({
      where: { user: { id: userId }, vinyl: { id: vinylId } },
      relations: ['user', 'vinyl'],
    });

    assert.ok(review);
    assert.strictEqual(review.score, 5);
    assert.strictEqual(
      review.comment,
      'Absolutely amazing album! A true masterpiece of progressive rock.'
    );

    const vinyl = await dataSource
      .getRepository(Vinyl)
      .findOneBy({ id: vinylId });
    assert.ok(vinyl && vinyl.averageRating > 0);
  });

  it('should return 400 for invalid score', async () => {
    const res = await createReview(10, 'Valid comment here');
    assert.strictEqual(res.status, 400);
  });

  it('should return 400 for short comment', async () => {
    const res = await createReview(4, 'Short');
    assert.strictEqual(res.status, 400);
  });

  it('should return 404 for non-existent vinyl', async () => {
    const res = await req('post', '/reviews/99999', userToken).send({
      score: 5,
      comment: 'Great album!',
    });
    assert.strictEqual(res.status, 404);
  });

  it('should return error for duplicate review', async () => {
    const res = await createReview(4, 'Duplicate review attempt here');
    assert.strictEqual(res.status, 500);
    assert.ok(res.body.message);
  });

  it('should get all reviews for a vinyl (GET /reviews/vinyl/:vinylId)', async () => {
    const res = await req('get', `/reviews/vinyl/${vinylId}`, userToken).query({
      page: 1,
      limit: 10,
    });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.total, 1);
    assert.strictEqual(res.body.page, 1);
    assert.strictEqual(res.body.limit, 10);

    const review = res.body.data[0];
    assert.strictEqual(review.score, 5);
    assert.ok(review.comment && review.user);
    assert.strictEqual(review.user.id, userId);
  });

  it('should support pagination', async () => {
    await createReview(
      4,
      'Very good album, would recommend to any Pink Floyd fan.',
      adminToken
    );

    const res = await req('get', `/reviews/vinyl/${vinylId}`, userToken).query({
      page: 1,
      limit: 1,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.length, 1);
    assert.strictEqual(res.body.total, 2);
    assert.strictEqual(res.body.totalPages, 2);
  });

  it('should delete a review as admin (DELETE /reviews/:id)', async () => {
    await createReview(
      5,
      'Admin review to be deleted for testing.',
      adminToken
    );

    const reviewRepo = dataSource.getRepository(Review);
    const review = await reviewRepo.findOne({
      where: { user: { id: adminId }, vinyl: { id: vinylId } },
    });

    assert.ok(review);

    const res = await req('delete', `/reviews/${review.id}`, adminToken);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.message, 'Successfully deleted review');

    const deleted = await reviewRepo.findOneBy({ id: review.id });
    assert.strictEqual(deleted, null);

    const vinyl = await dataSource
      .getRepository(Vinyl)
      .findOneBy({ id: vinylId });
    assert.ok(vinyl);
  });

  it('should return 404 when deleting non-existent review', async () => {
    const res = await req('delete', '/reviews/99999', adminToken);
    assert.strictEqual(res.status, 404);
  });

  it('should return 401 when non-admin tries to delete', async () => {
    await createReview(3, 'Decent album with good tracks.', adminToken);

    const review = await dataSource.getRepository(Review).findOne({
      where: { user: { id: adminId }, vinyl: { id: vinylId } },
    });

    const res = await req('delete', `/reviews/${review?.id}`, userToken);
    assert.strictEqual(res.status, 401);
    assert.ok(res.body.message);
  });

  it('should return 200 without authentication', async () => {
    const res = await req('get', `/reviews/vinyl/${vinylId}`).query({
      page: 1,
      limit: 10,
    });
    assert.strictEqual(res.status, 200);
  });

  it('should return 401 with invalid token', async () => {
    const res = await req('post', `/reviews/${vinylId}`, 'invalid_token').send({
      score: 5,
      comment: 'Great album!',
    });
    assert.strictEqual(res.status, 401);
  });
});
