import { describe, it, before, beforeEach, mock } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TokenBlacklistService } from '../token-blacklists.service';
import { TokenBlacklist } from '../entities/token-blacklist.entity';

describe('TokenBlacklistService', () => {
  let service: TokenBlacklistService;
  let mockSave: ReturnType<typeof mock.fn>;
  let mockFindOne: ReturnType<typeof mock.fn>;
  let mockDelete: ReturnType<typeof mock.fn>;

  before(async () => {
    mockSave = mock.fn();
    mockFindOne = mock.fn();
    mockDelete = mock.fn();

    const mockRepository = {
      save: mockSave,
      findOne: mockFindOne,
      delete: mockDelete,
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

  beforeEach(() => {
    mockSave.mock.resetCalls();
    mockFindOne.mock.resetCalls();
    mockDelete.mock.resetCalls();
  });

  it('should be defined', () => {
    assert.ok(service);
  });

  describe('addToBlacklist', () => {
    it('should add token to blacklist successfully', async () => {
      const token = 'test-jwt-token-123';
      const userId = 42;
      const expiresAt = new Date('2025-12-31');

      mockSave.mock.mockImplementationOnce(async (entity) => entity);

      await service.addToBlacklist(token, userId, expiresAt);

      assert.strictEqual(mockSave.mock.calls.length, 1);
      const savedEntity = mockSave.mock.calls[0].arguments[0] as TokenBlacklist;
      assert.strictEqual(savedEntity.token, token);
      assert.strictEqual(savedEntity.userId, userId);
      assert.strictEqual(savedEntity.expiresAt, expiresAt);
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true when token is blacklisted', async () => {
      const token = 'blacklisted-token';
      mockFindOne.mock.mockImplementationOnce(async () => ({
        id: 1,
        token,
        userId: 1,
        expiresAt: new Date(),
      }));

      const result = await service.isTokenBlacklisted(token);

      assert.strictEqual(result, true);
      assert.strictEqual(mockFindOne.mock.calls.length, 1);
    });

    it('should return false when token is not blacklisted', async () => {
      mockFindOne.mock.mockImplementationOnce(async () => null);

      const result = await service.isTokenBlacklisted('valid-token');

      assert.strictEqual(result, false);
      assert.strictEqual(mockFindOne.mock.calls.length, 1);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      mockDelete.mock.mockImplementationOnce(async () => ({ affected: 3 }));

      await service.cleanupExpiredTokens();

      assert.strictEqual(mockDelete.mock.calls.length, 1);
      const deleteCondition = mockDelete.mock.calls[0].arguments[0] as {
        expiresAt: Date;
      };
      assert.ok(deleteCondition.expiresAt);
    });
  });
});
