import { Injectable } from '@nestjs/common';
import { OrdersRepository } from './repositories/orders.repository';
import { OrderItemsRepository } from './repositories/order-items.repository';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly orderItemsRepository: OrderItemsRepository
  ) {}

  async createOrder(data: {
    email: string;
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    totalAmount: number;
    items: { vinylId: number; quantity: number; price: number }[];
  }) {
    const order = await this.ordersRepository.createOrder({
      email: data.email,
      stripeSessionId: data.stripeSessionId,
      stripePaymentIntentId: data.stripePaymentIntentId,
      totalAmount: data.totalAmount,
    });

    const orderItems = data.items
      .filter((item) => !isNaN(item.vinylId))
      .map((item) => ({
        order,
        vinylId: item.vinylId,
        quantity: item.quantity,
        price: item.price,
      }));

    await this.orderItemsRepository.createMany(orderItems);
    return order;
  }

  async getAllOrders() {
    return this.ordersRepository.findAll();
  }

  async getOrderBySessionId(sessionId: string) {
    return this.ordersRepository.findBySessionId(sessionId);
  }
}
