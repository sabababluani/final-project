import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order)
    private readonly repository: Repository<Order>
  ) {}

  async createOrder(data: Partial<Order>): Promise<Order> {
    const order = this.repository.create(data);
    return this.repository.save(order);
  }

  async findBySessionId(sessionId: string): Promise<Order | null> {
    return this.repository.findOne({ where: { stripeSessionId: sessionId } });
  }

  async findAll(): Promise<Order[]> {
    return this.repository.find({ relations: ['items'] });
  }

  async deleteById(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
