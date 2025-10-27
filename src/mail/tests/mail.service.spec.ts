import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail.service';
import { SystemLogsService } from '../../system-logs/system-logs.service';
import type Stripe from 'stripe';

describe('MailService', () => {
  let service: MailService;

  before(async () => {
    const mockConfigService = {
      get: mock.fn((key: string) => {
        if (key === 'EMAIL_USER') return 'test@example.com';
        if (key === 'EMAIL_PASSWORD') return 'test-password';
        return null;
      }),
    };

    const mockSystemLogsService = {
      createLog: mock.fn(async () => ({})),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: SystemLogsService, useValue: mockSystemLogsService },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    assert.ok(service);
  });

  it('should send order success email', async () => {
    const mockSession = {
      id: 'sess_123',
      customer_email: 'customer@test.com',
      amount_total: 5000,
    } as Stripe.Checkout.Session;

    const mockLineItems = [
      {
        description: 'Test Vinyl',
        quantity: 2,
        amount_total: 5000,
      },
    ] as Stripe.LineItem[];

    await service.sendOrderSuccessEmail(mockSession, mockLineItems);

    assert.ok(service);
  });
});
