import { Module } from '@nestjs/common';
import { VinylsService } from './vinyls.service';
import { VinylsController } from './vinyls.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vinyl } from './entities/vinyl.entity';
import { Review } from '../reviews/entities/review.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { TokenBlacklistsModule } from '../token-blacklists/token-blacklists.module';
import { SystemLog } from '../system-logs/entities/system-log.entity';
import { SystemLogsModule } from '../system-logs/system-logs.module';
import { TelegramModule } from '../telegram/telegram.module';
import { VinylsRepository } from './repositories/vinyls.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vinyl, Review, SystemLog]),
    UsersModule,
    AuthModule,
    TokenBlacklistsModule,
    SystemLogsModule,
    TelegramModule,
  ],
  controllers: [VinylsController],
  providers: [VinylsService, VinylsRepository],
  exports: [VinylsService],
})
export class VinylsModule {}
