import { describe, it, before, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from '../stripe.service';
import { ConfigService } from '@nestjs/config';
import { VinylsService } from '../../vinyls/vinyls.service';
import { MailService } from '../../mail/mail.service';
import { OrdersService } from '../../orders/orders.service';
import { SystemLogsService } from '../../system-logs/system-logs.service';
import { BadRequestException } from '@nestjs/common';

describe('StripeService', () => {
  let service: StripeService;
  let mockFindOneVinyl: ReturnType<typeof mock.fn>;
  let mockCreateOrder: ReturnType<typeof mock.fn>;
  let mockCreateLog: ReturnType<typeof mock.fn>;
  let mockStripeCreate: ReturnType<typeof mock.fn>;
  let mockStripeConstruct: ReturnType<typeof mock.fn>;

  before(async () => {
    mockFindOneVinyl = mock.fn();
    mockCreateOrder = mock.fn(async () => ({ id: 1 }));
    mockCreateLog = mock.fn(async () => {});
    mockStripeCreate = mock.fn();
    mockStripeConstruct = mock.fn();

    const mockConfigService = {
      get: mock.fn((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return 'sk_test_123';
        if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_123';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: VinylsService, useValue: { findOne: mockFindOneVinyl } },
        {
          provide: MailService,
          useValue: { sendOrderSuccessEmail: mock.fn() },
        },
        { provide: OrdersService, useValue: { createOrder: mockCreateOrder } },
        { provide: SystemLogsService, useValue: { createLog: mockCreateLog } },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);

    // Override Stripe methods
    Object.defineProperty(service, 'stripe', {
      value: {
        checkout: {
          sessions: {
            create: mockStripeCreate,
            retrieve: mock.fn(),
          },
        },
        webhooks: {
          constructEvent: mockStripeConstruct,
        },
        customers: {
          create: mock.fn(),
        },
      },
      writable: true,
    });
  });

  beforeEach(() => {
    mockFindOneVinyl.mock.resetCalls();
    mockCreateOrder.mock.resetCalls();
    mockCreateLog.mock.resetCalls();
    mockStripeCreate.mock.resetCalls();
    mockStripeConstruct.mock.resetCalls();
  });

  it('should be defined', () => {
    assert.ok(service);
  });

  describe('createCheckoutSessionForVinyls', () => {
    const mockVinyl = {
      id: 1,
      name: 'Abbey Road',
      authorName: 'The Beatles',
      price: 29.99,
      image: 'https://example.com/img.jpg',
    };

    it('should create checkout session with valid items', async () => {
      mockFindOneVinyl.mock.mockImplementation(async () => mockVinyl);
      mockStripeCreate.mock.mockImplementation(async () => ({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/session123',
      }));

      const result = await service.createCheckoutSessionForVinyls({
        items: [{ vinylId: 1, quantity: 2 }],
        customerEmail: 'test@example.com',
        currency: 'usd',
      });

      assert.ok(result);
      assert.strictEqual(
        result.sessionId,
        'https://checkout.stripe.com/session123'
      );
      assert.strictEqual(mockFindOneVinyl.mock.callCount(), 1);
      assert.strictEqual(mockStripeCreate.mock.callCount(), 1);
    });

    it('should throw error when no items provided', async () => {
      await assert.rejects(
        async () =>
          service.createCheckoutSessionForVinyls({
            items: [],
            customerEmail: 'test@example.com',
            currency: 'usd',
          }),
        BadRequestException
      );
    });

    it('should handle multiple items with different currencies', async () => {
      mockFindOneVinyl.mock.mockImplementation(async () => mockVinyl);
      mockStripeCreate.mock.mockImplementation(async () => ({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/session123',
      }));

      const result = await service.createCheckoutSessionForVinyls({
        items: [{ vinylId: 1, quantity: 1 }],
        customerEmail: 'test@example.com',
        currency: 'eur',
      });
      assert.ok(result.sessionId);
      assert.strictEqual(mockFindOneVinyl.mock.callCount(), 1);
    });
  });

  describe('handleWebhookEvent', () => {
    it('should throw error on invalid webhook signature', async () => {
      const rawBody = Buffer.from('test-body');
      const signature = 'invalid-signature';

      mockStripeConstruct.mock.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await assert.rejects(
        async () => service.handleWebhookEvent(rawBody, signature),
        BadRequestException
      );
    });
  });
});
