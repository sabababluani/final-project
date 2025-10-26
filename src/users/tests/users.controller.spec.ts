import { describe, it, before, mock } from 'node:test';
import * as assert from 'node:assert';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { AuthenticatedRequest } from '../../interfaces/authenticated-user.interface';
import { AuthGuard } from '../../auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let mockMe: ReturnType<typeof mock.fn>;
  let mockFindOne: ReturnType<typeof mock.fn>;
  let mockUpdate: ReturnType<typeof mock.fn>;
  let mockRemove: ReturnType<typeof mock.fn>;

  before(async () => {
    mockMe = mock.fn(async () => ({ id: 1, email: 'test@test.com' }));
    mockFindOne = mock.fn(async () => ({ id: 1, email: 'test@test.com' }));
    mockUpdate = mock.fn(async () => ({
      id: 1,
      email: 'test@test.com',
      firstName: 'Updated',
    }));
    mockRemove = mock.fn(async () => ({
      message: 'User with ID 1 successfully deleted',
    }));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            me: mockMe,
            findOne: mockFindOne,
            update: mockUpdate,
            remove: mockRemove,
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    assert.ok(controller);
  });

  describe('me', () => {
    it('should return current user', async () => {
      const mockReq = {
        user: { id: 1, email: 'test@test.com', role: 'USER' },
      };

      const result = await controller.me(
        mockReq as unknown as AuthenticatedRequest
      );

      assert.ok(result);
      assert.strictEqual(result.id, 1);
      assert.strictEqual(mockMe.mock.callCount(), 1);
    });
  });

  describe('findOne', () => {
    it('should find a user by id', async () => {
      const result = await controller.findOne('1');

      assert.ok(result);
      assert.strictEqual(result.id, 1);
      assert.strictEqual(mockFindOne.mock.callCount(), 1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const mockReq = {
        user: { id: 1, email: 'test@test.com', role: 'USER' },
      };
      const updateDto = { firstName: 'Updated' };
      const result = await controller.update(
        mockReq as unknown as AuthenticatedRequest,
        updateDto
      );

      assert.ok(result);
      assert.strictEqual(result.firstName, 'Updated');
      assert.strictEqual(mockUpdate.mock.callCount(), 1);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const mockReq = {
        user: { id: 1, email: 'test@test.com', role: 'USER' },
      };
      const result = await controller.remove(
        mockReq as unknown as AuthenticatedRequest
      );

      assert.ok(result);
      assert.strictEqual(result.message, 'User with ID 1 successfully deleted');
      assert.strictEqual(mockRemove.mock.callCount(), 1);
    });
  });
});
