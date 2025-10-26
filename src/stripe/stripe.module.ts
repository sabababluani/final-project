import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { VinylsModule } from '../vinyls/vinyls.module';
import { MailModule } from '../mail/mail.module';
import { TokenBlacklistsModule } from '../token-blacklists/token-blacklists.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [
    VinylsModule,
    MailModule,
    AuthModule,
    UsersModule,
    TokenBlacklistsModule,
    OrdersModule,
    SystemLogsModule,
  ],
  providers: [StripeService],
  controllers: [StripeController],
})
export class StripeModule {}
