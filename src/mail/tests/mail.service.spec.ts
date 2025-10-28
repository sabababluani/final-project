import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail.service';
import { SystemLogsService } from '../../system-logs/system-logs.service';
import type Stripe from 'stripe';
import * as nodemailer from 'nodemailer';
import type { Mock } from 'node:test';

describe('MailService', () => {
  let service: MailService;
  let mockSendMail: Mock<
    (options: nodemailer.SendMailOptions) => Promise<nodemailer.SentMessageInfo>
  >;

  before(async () => {
    mockSendMail = mock.fn(async () => ({
      messageId: 'test-message-id',
      accepted: ['customer@test.com'],
      rejected: [],
      response: '250 OK',
    }));

    const mockTransporter = {
      sendMail: mockSendMail,
    };

    mock.method(nodemailer, 'createTransport', () => mockTransporter);

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

    assert.strictEqual(mockSendMail.mock.callCount(), 1);

    const calls = mockSendMail.mock.calls;
    assert.ok(calls.length > 0, 'sendMail should have been called');

    const firstCall = calls[0];
    assert.ok(firstCall, 'First call should exist');
    assert.ok(firstCall.arguments, 'First call should have arguments');
    assert.ok(
      firstCall.arguments.length > 0,
      'First call should have at least one argument'
    );

    const emailOptions = firstCall.arguments[0];
    assert.strictEqual(emailOptions.to, 'customer@test.com');
    assert.strictEqual(emailOptions.from, 'test@example.com');
    assert.ok(
      emailOptions.subject &&
        emailOptions.subject.includes('Payment Successful')
    );
    assert.ok(
      emailOptions.html && (emailOptions.html as string).includes('sess_123')
    );
    assert.ok(
      emailOptions.html && (emailOptions.html as string).includes('Test Vinyl')
    );
  });
});
