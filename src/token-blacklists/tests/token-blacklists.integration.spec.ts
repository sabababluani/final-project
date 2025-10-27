import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenBlacklistService } from '../token-blacklists.service';
import { TokenBlacklist } from '../entities/token-blacklist.entity';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let mockRepository: {
    save: ReturnType<typeof mock.fn>;
    findOne: ReturnType<typeof mock.fn>;
    delete: ReturnType<typeof mock.fn>;
  };

  before(async () => {
    mockRepository = {
      save: mock.fn(async (token) => token),
      findOne: mock.fn(async ({ where }) => {
        if (where.token === 'blacklisted-token-123') {
          return {
            id: 1,
            token: 'blacklisted-token-123',
            userId: 1,
            expiresAt: new Date('2025-12-31'),
          };
        }
        return null;
      }),
      delete: mock.fn(async () => ({ affected: 1 })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: getRepositoryToken(TokenBlacklist),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
  });

  it('should be defined', () => {
    assert.ok(service);
  });

  it('should add token to blacklist', async () => {
    const token = 'test-token-456';
    const userId = 1;
    const expiresAt = new Date('2025-12-31');

    await service.addToBlacklist(token, userId, expiresAt);

    assert.strictEqual(mockRepository.save.mock.calls.length, 1);
    const savedToken = mockRepository.save.mock.calls[0]
      .arguments[0] as TokenBlacklist;
    assert.strictEqual(savedToken.token, token);
    assert.strictEqual(savedToken.userId, userId);
    assert.strictEqual(savedToken.expiresAt, expiresAt);
  });

  it('should return true if token is blacklisted', async () => {
    const result = await service.isTokenBlacklisted('blacklisted-token-123');

    assert.strictEqual(result, true);
    assert.strictEqual(mockRepository.findOne.mock.calls.length, 1);
  });

  it('should return false if token is not blacklisted', async () => {
    const result = await service.isTokenBlacklisted('non-blacklisted-token');

    assert.strictEqual(result, false);
  });

  it('should cleanup expired tokens', async () => {
    await service.cleanupExpiredTokens();

    assert.strictEqual(mockRepository.delete.mock.calls.length, 1);
    const deleteArgs = mockRepository.delete.mock.calls[0].arguments[0] as {
      expiresAt: Date;
    };
    assert.ok(deleteArgs.expiresAt);
  });
});
