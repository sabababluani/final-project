import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersRepository } from './repositories/orders.repository';
import { OrderItemsRepository } from './repositories/order-items.repository';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem])],
  providers: [OrdersService, OrdersRepository, OrderItemsRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
