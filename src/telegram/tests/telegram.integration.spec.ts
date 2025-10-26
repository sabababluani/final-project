import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  let mockSendMessage: ReturnType<typeof mock.fn>;

  before(async () => {
    mockSendMessage = mock.fn(async () => ({
      message_id: 12345,
      date: Date.now(),
      chat: { id: 123456, type: 'channel' },
      text: 'Test message',
    }));

    const mockConfigService = {
      get: mock.fn((key: string) => {
        if (key === 'TELEGRAM_BOT_TOKEN') return 'test-token-123';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);

    Object.defineProperty(service, 'bot', {
      value: {
        telegram: {
          sendMessage: mockSendMessage,
          getChat: mock.fn(async () => ({
            id: 123456,
            type: 'channel',
            title: '@babluanis',
          })),
        },
      },
      writable: true,
    });
  });

  it('should be defined', () => {
    assert.ok(service);
  });

  it('should create telegram message for new vinyl', async () => {
    const result = await service.createTelegram('Test Vinyl Album', 29.99);

    assert.ok(result);
    assert.ok(result.includes('Telegram message sent'));
    assert.strictEqual(mockSendMessage.mock.calls.length, 1);
  });
});
