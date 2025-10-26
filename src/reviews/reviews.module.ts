import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './repositories/reviews.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Vinyl } from '../vinyls/entities/vinyl.entity';
import { VinylsModule } from '../vinyls/vinyls.module';
import { TokenBlacklistsModule } from '../token-blacklists/token-blacklists.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { SystemLog } from '../system-logs/entities/system-log.entity';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Vinyl, SystemLog]),
    UsersModule,
    VinylsModule,
    AuthModule,
    TokenBlacklistsModule,
    SystemLogsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsService, ReviewsRepository],
})
export class ReviewsModule {}
