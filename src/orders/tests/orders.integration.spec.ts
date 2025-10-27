import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import { AppModuleTest } from '../../app.module.test';
import { OrdersService } from '../orders.service';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order-item.entity';
import { User } from '../../users/entities/user.entity';
import { Vinyl } from '../../vinyls/entities/vinyl.entity';

describe('OrdersModule (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let ordersService: OrdersService;
  let orderRepo: Repository<Order>;
  let orderItemRepo: Repository<OrderItem>;
  let vinylId1: number;
  let vinylId2: number;

  const createOrderData = (
    email: string,
    sessionId: string,
    totalAmount: number,
    items: { vinylId: number; quantity: number; price: number }[],
    paymentIntentId?: string
  ) => ({
    email,
    stripeSessionId: sessionId,
    stripePaymentIntentId: paymentIntentId,
    totalAmount,
    items,
  });

  const assertOrder = (
    order: Order,
    email: string,
    totalAmount: number,
    paymentIntentId?: string
  ) => {
    assert.ok(order?.id && order.stripeSessionId && order.createdAt);
    assert.strictEqual(order.email, email);
    assert.strictEqual(Number(order.totalAmount), totalAmount);
    if (paymentIntentId !== undefined) {
      assert.strictEqual(order.stripePaymentIntentId, paymentIntentId || null);
    }
  };

  const getOrderItems = async (orderId: number) =>
    orderItemRepo.find({ where: { order: { id: orderId } } });

  const assertItems = (
    items: OrderItem[],
    expected: { vinylId: number; quantity: number; price: number }[]
  ) => {
    assert.strictEqual(items.length, expected.length);
    expected.forEach((exp) => {
      const item = items.find((i) => i.vinylId === exp.vinylId);
      assert.ok(item);
      assert.strictEqual(item.quantity, exp.quantity);
      assert.strictEqual(Number(item.price), exp.price);
    });
  };

  before(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModuleTest],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource);
    ordersService = moduleFixture.get(OrdersService);
    orderRepo = dataSource.getRepository(Order);
    orderItemRepo = dataSource.getRepository(OrderItem);

    const userRepo = dataSource.getRepository(User);
    const testUser = await userRepo.save(
      userRepo.create({
        firstName: 'Test',
        lastName: 'Owner',
        email: 'owner@test.com',
        role: 'Admin',
        password: 'hashedpassword123',
      })
    );

    const vinylRepo = dataSource.getRepository(Vinyl);
    vinylId1 = (
      await vinylRepo.save(
        vinylRepo.create({
          name: 'The Dark Side of the Moon',
          authorName: 'Pink Floyd',
          image: 'https://example.com/dark-side.jpg',
          description: 'Legendary album',
          price: 34.99,
          averageRating: 0,
          owner: testUser,
        })
      )
    ).id;

    vinylId2 = (
      await vinylRepo.save(
        vinylRepo.create({
          name: 'Abbey Road',
          authorName: 'The Beatles',
          image: 'https://example.com/abbey-road.jpg',
          description: 'Classic Beatles album',
          price: 29.99,
          averageRating: 0,
          owner: testUser,
        })
      )
    ).id;
  });

  after(async () => {
    if (dataSource?.isInitialized) await dataSource.destroy();
    if (app) await app.close();
  });

  it('should create orders with single/multiple items and verify persistence', async () => {
    const order1 = await ordersService.createOrder(
      createOrderData('customer@test.com', 'cs_001', 34.99, [
        { vinylId: vinylId1, quantity: 1, price: 34.99 },
      ])
    );
    assertOrder(order1, 'customer@test.com', 34.99);
    assertItems(await getOrderItems(order1.id), [
      { vinylId: vinylId1, quantity: 1, price: 34.99 },
    ]);

    const order2 = await ordersService.createOrder(
      createOrderData('multi@test.com', 'cs_002', 94.97, [
        { vinylId: vinylId1, quantity: 2, price: 34.99 },
        { vinylId: vinylId2, quantity: 1, price: 29.99 },
      ])
    );
    assertOrder(order2, 'multi@test.com', 94.97);
    assertItems(await getOrderItems(order2.id), [
      { vinylId: vinylId1, quantity: 2, price: 34.99 },
      { vinylId: vinylId2, quantity: 1, price: 29.99 },
    ]);

    const dbOrder = await orderRepo.findOne({
      where: { id: order2.id },
      relations: ['items'],
    });
    assert.ok(dbOrder);
    assert.strictEqual(dbOrder.items.length, 2);
  });

  it('should handle payment intent ID correctly (with/without)', async () => {
    const withIntent = await ordersService.createOrder(
      createOrderData(
        'payment@test.com',
        'cs_003',
        34.99,
        [{ vinylId: vinylId1, quantity: 1, price: 34.99 }],
        'pi_123'
      )
    );
    assertOrder(withIntent, 'payment@test.com', 34.99, 'pi_123');

    const withoutIntent = await ordersService.createOrder(
      createOrderData('nopayment@test.com', 'cs_004', 29.99, [
        { vinylId: vinylId2, quantity: 1, price: 29.99 },
      ])
    );
    assertOrder(withoutIntent, 'nopayment@test.com', 29.99, undefined);
    assert.ok(!withoutIntent.stripePaymentIntentId);
  });

  it('should retrieve all orders and find by session ID', async () => {
    const uniqueSessionId = `cs_unique_${Date.now()}`;
    const created = await ordersService.createOrder(
      createOrderData('session@test.com', uniqueSessionId, 34.99, [
        { vinylId: vinylId1, quantity: 1, price: 34.99 },
      ])
    );

    const allOrders = await ordersService.getAllOrders();
    assert.ok(allOrders.length >= 1);
    assert.ok(
      allOrders.some((o) => o.items?.length > 0),
      'Orders should have items loaded'
    );

    const found = await ordersService.getOrderBySessionId(uniqueSessionId);
    assert.ok(found);
    assert.strictEqual(found.id, created.id);
    assert.strictEqual(found.email, 'session@test.com');

    const notFound = await ordersService.getOrderBySessionId('cs_nonexistent');
    assert.strictEqual(notFound, null);
  });

  it('should handle edge cases: large quantities, decimals, duplicate emails', async () => {
    const bulk = await ordersService.createOrder(
      createOrderData('bulk@test.com', 'cs_bulk', 3499.0, [
        { vinylId: vinylId1, quantity: 100, price: 34.99 },
      ])
    );
    assertOrder(bulk, 'bulk@test.com', 3499.0);
    assert.strictEqual((await getOrderItems(bulk.id))[0].quantity, 100);

    const decimal = await ordersService.createOrder(
      createOrderData('decimal@test.com', 'cs_decimal', 123.45, [
        { vinylId: vinylId1, quantity: 1, price: 123.45 },
      ])
    );
    assert.strictEqual(Number(decimal.totalAmount), 123.45);
    assert.strictEqual(
      Number((await getOrderItems(decimal.id))[0].price),
      123.45
    );

    const email = 'repeat@test.com';
    const order1 = await ordersService.createOrder(
      createOrderData(email, 'cs_repeat_1', 34.99, [
        { vinylId: vinylId1, quantity: 1, price: 34.99 },
      ])
    );
    const order2 = await ordersService.createOrder(
      createOrderData(email, 'cs_repeat_2', 29.99, [
        { vinylId: vinylId2, quantity: 1, price: 29.99 },
      ])
    );
    assert.ok(order1.id !== order2.id);
    assert.strictEqual(order1.email, order2.email);
    assert.notStrictEqual(order1.stripeSessionId, order2.stripeSessionId);
  });

  it('should filter invalid vinyl IDs and handle zero-amount orders', async () => {
    const filtered = await ordersService.createOrder(
      createOrderData('filter@test.com', 'cs_filter', 34.99, [
        { vinylId: vinylId1, quantity: 1, price: 34.99 },
        { vinylId: NaN, quantity: 1, price: 10.0 },
      ])
    );
    assertOrder(filtered, 'filter@test.com', 34.99);
    const items = await getOrderItems(filtered.id);
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].vinylId, vinylId1);

    const zero = await ordersService.createOrder(
      createOrderData('zero@test.com', 'cs_zero', 0, [])
    );
    assert.strictEqual(Number(zero.totalAmount), 0);
    assert.strictEqual((await getOrderItems(zero.id)).length, 0);
  });

  it('should persist timestamps correctly', async () => {
    const order = await ordersService.createOrder(
      createOrderData('timestamp@test.com', 'cs_timestamp', 34.99, [
        { vinylId: vinylId1, quantity: 1, price: 34.99 },
      ])
    );

    assert.ok(order.createdAt, 'Order should have createdAt timestamp');
    const createdAt = new Date(order.createdAt);
    const now = new Date();

    assert.ok(
      Math.abs(now.getTime() - createdAt.getTime()) < 24 * 60 * 60 * 1000,
      'Timestamp should be within 24 hours of current time'
    );

    const dbOrder = await orderRepo.findOne({ where: { id: order.id } });
    assert.ok(
      dbOrder?.createdAt,
      'Database order should have createdAt timestamp'
    );
  });

  it('should cascade delete order items', async () => {
    const order = await ordersService.createOrder(
      createOrderData('cascade@test.com', 'cs_cascade', 34.99, [
        { vinylId: vinylId1, quantity: 1, price: 34.99 },
      ])
    );
    assert.strictEqual((await getOrderItems(order.id)).length, 1);

    await orderRepo.delete(order.id);
    assert.strictEqual(
      await orderRepo.findOne({ where: { id: order.id } }),
      null
    );
    assert.strictEqual((await getOrderItems(order.id)).length, 0);
  });

  it('should handle concurrent order creation', async () => {
    const orders = await Promise.all([
      ordersService.createOrder(
        createOrderData('c1@test.com', 'cs_c1', 34.99, [
          { vinylId: vinylId1, quantity: 1, price: 34.99 },
        ])
      ),
      ordersService.createOrder(
        createOrderData('c2@test.com', 'cs_c2', 29.99, [
          { vinylId: vinylId2, quantity: 1, price: 29.99 },
        ])
      ),
      ordersService.createOrder(
        createOrderData('c3@test.com', 'cs_c3', 64.98, [
          { vinylId: vinylId1, quantity: 1, price: 34.99 },
          { vinylId: vinylId2, quantity: 1, price: 29.99 },
        ])
      ),
    ]);

    assert.strictEqual(orders.length, 3);
    assert.strictEqual(
      new Set(orders.map((o) => o.id)).size,
      3,
      'All IDs should be unique'
    );
    orders.forEach((o) => assert.ok(o.id && o.stripeSessionId));
  });

  it('should maintain data integrity across service/repository/database layers', async () => {
    const order = await ordersService.createOrder(
      createOrderData('integrity@test.com', 'cs_integrity', 129.96, [
        { vinylId: vinylId1, quantity: 2, price: 34.99 },
        { vinylId: vinylId2, quantity: 2, price: 29.99 },
      ])
    );

    const viaService = (await ordersService.getAllOrders()).find(
      (o) => o.id === order.id
    );
    assert.ok(viaService?.items?.length === 2);

    const dbOrder = await orderRepo.findOne({
      where: { id: order.id },
      relations: ['items'],
    });
    assert.ok(dbOrder);
    assert.strictEqual(dbOrder.email, order.email);
    assert.strictEqual(Number(dbOrder.totalAmount), Number(order.totalAmount));
    assert.strictEqual(dbOrder.stripeSessionId, order.stripeSessionId);
    assert.strictEqual(dbOrder.items.length, 2);
  });
});
