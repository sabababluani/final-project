import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { StripeController } from '../stripe.controller';
import { StripeService } from '../stripe.service';
import { BadRequestException } from '@nestjs/common';
import type { CreateOrderDto } from '../dto/create-order.dto';
import { AuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import type { AuthenticatedRequest } from '../../interfaces/authenticated-user.interface';
import type { User } from '../../users/entities/user.entity';

describe('StripeController', () => {
  let controller: StripeController;
  let mockCreateCheckout: ReturnType<typeof mock.fn>;
  let mockHandleWebhook: ReturnType<typeof mock.fn>;

  before(async () => {
    mockCreateCheckout = mock.fn();
    mockHandleWebhook = mock.fn();

    const mockStripeService = {
      createCheckoutSessionForVinyls: mockCreateCheckout,
      handleWebhookEvent: mockHandleWebhook,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StripeController>(StripeController);
  });

  it('should be defined', () => {
    assert.ok(controller);
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session', async () => {
      const dto: CreateOrderDto = {
        items: [{ vinylId: 1, quantity: 2 }],
        currency: 'usd',
      };

      const mockReq: Partial<AuthenticatedRequest> = {
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'USER',
          firstName: 'Test',
          lastName: 'User',
        } as User,
      };

      const result = { sessionId: 'https://checkout.stripe.com/session123' };
      mockCreateCheckout.mock.mockImplementation(() => Promise.resolve(result));

      const response = await controller.createCheckoutSession(
        dto,
        mockReq as AuthenticatedRequest
      );

      assert.deepStrictEqual(response, result);
      assert.strictEqual(mockCreateCheckout.mock.callCount(), 1);
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook with valid signature', async () => {
      const req = { body: Buffer.from('test') } as unknown as Request;
      const signature = 'valid_signature';

      mockHandleWebhook.mock.mockImplementation(() => Promise.resolve());

      const result = await controller.handleWebhook(req, signature);

      assert.deepStrictEqual(result, { received: true });
      assert.strictEqual(mockHandleWebhook.mock.callCount(), 1);
    });

    it('should throw error when signature is missing', async () => {
      const req = { body: Buffer.from('test') } as unknown as Request;

      await assert.rejects(
        () => controller.handleWebhook(req, ''),
        BadRequestException
      );
    });
  });
});
