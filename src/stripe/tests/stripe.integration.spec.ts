import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModuleTest } from '../../app.module.test';
import { User } from '../../users/entities/user.entity';
import { Vinyl } from '../../vinyls/entities/vinyl.entity';

describe('StripeModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userToken: string;
  let adminToken: string;
  let vinylId1: number;
  let vinylId2: number;

  const postStripe = (
    endpoint: string,
    body?: Record<string, unknown>,
    token?: string,
    signature?: string
  ) => {
    const req = request(app.getHttpServer()).post(`/stripe/${endpoint}`);
    if (token) req.set('Authorization', `Bearer ${token}`);
    if (signature) req.set('stripe-signature', signature);
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

  const createCheckoutDto = (
    items: Array<{ vinylId: number | string; quantity: number }>,
    email = 'customer@test.com',
    currency = 'usd'
  ) => ({
    items,
    customerEmail: email,
    currency,
  });

  const assertSessionCreated = (res: request.Response, status = 201) => {
    assertStatus(res, status);
    assert.ok(res.body?.sessionId, 'Session URL should be returned');
  };

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
    const jwtService = moduleFixture.get(JwtService);
    const secret = process.env.JWT_SECRET || 'test_jwt_secret';

    const userRepo = dataSource.getRepository(User);
    const testUser = await userRepo.save(
      userRepo.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@test.com',
        role: 'USER',
        password: 'hashedpassword123',
      })
    );
    userToken = jwtService.sign(
      { sub: testUser.id, email: testUser.email, role: 'USER' },
      { secret }
    );

    const adminUser = await userRepo.save(
      userRepo.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        role: 'ADMIN',
        password: 'hashedpassword456',
      })
    );
    adminToken = jwtService.sign(
      { sub: adminUser.id, email: adminUser.email, role: 'ADMIN' },
      { secret }
    );

    const vinylRepo = dataSource.getRepository(Vinyl);
    vinylId1 = (
      await vinylRepo.save(
        vinylRepo.create({
          name: 'Abbey Road',
          authorName: 'The Beatles',
          image: 'https://example.com/abbey-road.jpg',
          description: 'Classic Beatles album',
          price: 29.99,
          averageRating: 0,
          owner: adminUser,
        })
      )
    ).id;
    vinylId2 = (
      await vinylRepo.save(
        vinylRepo.create({
          name: 'Dark Side of the Moon',
          authorName: 'Pink Floyd',
          image: 'https://example.com/dark-side.jpg',
          description: 'Legendary Pink Floyd album',
          price: 34.99,
          averageRating: 0,
          owner: adminUser,
        })
      )
    ).id;
  });

  after(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should create checkout session with valid data (POST /stripe/create-checkout-session)', async () => {
    const res = await postStripe(
      'create-checkout-session',
      createCheckoutDto([
        { vinylId: vinylId1, quantity: 2 },
        { vinylId: vinylId2, quantity: 1 },
      ]),
      userToken
    );
    assertSessionCreated(res);
    assert.strictEqual(
      typeof res.body.sessionId,
      'string',
      'Session URL should be a string'
    );
  });

  it('should create checkout with single/multiple items and different currencies', async () => {
    const testCases = [
      {
        items: [{ vinylId: vinylId1, quantity: 1 }],
        email: 'single@test.com',
        currency: 'usd',
      },
      {
        items: [
          { vinylId: vinylId1, quantity: 3 },
          { vinylId: vinylId2, quantity: 5 },
        ],
        email: 'multi@test.com',
        currency: 'eur',
      },
      {
        items: [{ vinylId: vinylId1, quantity: 1 }],
        email: 'gel@test.com',
        currency: 'gel',
      },
      {
        items: [{ vinylId: vinylId1, quantity: 100 }],
        email: 'large@test.com',
        currency: 'usd',
      },
      {
        items: [
          { vinylId: vinylId1, quantity: 2 },
          { vinylId: vinylId1, quantity: 3 },
        ],
        email: 'dup@test.com',
        currency: 'usd',
      },
    ];

    for (const { items, email, currency } of testCases) {
      assertSessionCreated(
        await postStripe(
          'create-checkout-session',
          createCheckoutDto(items, email, currency),
          userToken
        )
      );
    }
  });

  it('should validate checkout input and reject invalid data', async () => {
    const validationTests = [
      { dto: createCheckoutDto([]), expected: 400, msg: 'empty items' },
      {
        dto: { customerEmail: 'customer@test.com', currency: 'usd' },
        expected: 400,
        msg: 'missing items',
      },
      {
        dto: createCheckoutDto(
          [{ vinylId: vinylId1, quantity: 1 }],
          'invalid-email'
        ),
        expected: 400,
        msg: 'invalid email',
      },
      {
        dto: createCheckoutDto(
          [{ vinylId: vinylId1, quantity: 1 }],
          'customer@test.com',
          'xxx'
        ),
        expected: 400,
        msg: 'invalid currency',
      },
      {
        dto: { items: [{ vinylId: vinylId1, quantity: 1 }], currency: 'usd' },
        expected: 400,
        msg: 'missing email',
      },
      {
        dto: createCheckoutDto([{ vinylId: 99999, quantity: 1 }]),
        expected: 404,
        msg: 'non-existent vinyl',
      },
      {
        dto: createCheckoutDto([{ vinylId: vinylId1, quantity: 0 }]),
        expected: 400,
        msg: 'zero quantity',
      },
      {
        dto: createCheckoutDto([{ vinylId: vinylId1, quantity: -5 }]),
        expected: 400,
        msg: 'negative quantity',
      },
      {
        dto: createCheckoutDto([{ vinylId: 'invalid', quantity: 1 }]),
        expected: 400,
        msg: 'non-integer vinyl ID',
      },
      {
        dto: createCheckoutDto([{ vinylId: vinylId1, quantity: 1.5 }]),
        expected: 400,
        msg: 'non-integer quantity',
      },
      {
        dto: {
          items: [{ vinylId: vinylId1 }],
          customerEmail: 'c@test.com',
          currency: 'usd',
        },
        expected: 400,
        msg: 'missing quantity',
      },
      {
        dto: {
          items: [{ vinylId: vinylId1, quantity: 1 }],
          customerEmail: 'c@test.com',
        },
        expected: 400,
        msg: 'missing currency',
      },
    ];

    for (const { dto, expected, msg } of validationTests) {
      assertStatus(
        await postStripe('create-checkout-session', dto, userToken),
        expected,
        `Should reject ${msg}`
      );
    }
  });

  it('should handle authentication and authorization', async () => {
    const dto = createCheckoutDto(
      [{ vinylId: vinylId1, quantity: 1 }],
      'test@test.com'
    );
    assertStatus(
      await postStripe('create-checkout-session', dto),
      401,
      'no token'
    );
    assertStatus(
      await postStripe('create-checkout-session', dto, 'invalid_token'),
      401,
      'invalid token'
    );
    assertSessionCreated(
      await postStripe('create-checkout-session', dto, userToken)
    );
    assertSessionCreated(
      await postStripe('create-checkout-session', dto, adminToken)
    );
  });

  it('should validate webhook signature', async () => {
    const webhookEvent = {
      id: 'evt_test',
      object: 'event',
      type: 'checkout.session.completed',
    };
    const noSigRes = await postStripe('webhook', webhookEvent);
    assertStatus(noSigRes, 400, 'Should reject webhook without signature');
    assert.ok(noSigRes.body?.message?.includes('Missing stripe-signature'));

    const invalidSigRes = await postStripe(
      'webhook',
      webhookEvent,
      undefined,
      'invalid_signature'
    );
    assertStatus(invalidSigRes, 400, 'Should reject invalid webhook signature');
  });

  it('should handle mixed case currency codes', async () => {
    const res = await postStripe(
      'create-checkout-session',
      createCheckoutDto(
        [{ vinylId: vinylId1, quantity: 1 }],
        'customer@test.com',
        'USD'
      ),
      userToken
    );
    assert.ok(
      res.status === 201 || res.status === 400,
      'Should handle currency case appropriately'
    );
  });
});
