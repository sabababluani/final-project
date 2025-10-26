import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrderItemsRepository {
  constructor(
    @InjectRepository(OrderItem)
    private readonly repository: Repository<OrderItem>
  ) {}

  async createMany(items: Partial<OrderItem>[]): Promise<OrderItem[]> {
    const entities = this.repository.create(items);
    return this.repository.save(entities);
  }

  async findByOrderId(orderId: number): Promise<OrderItem[]> {
    return this.repository.find({ where: { order: { id: orderId } } });
  }
}
