import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';
import { TokenBlacklistsModule } from '../token-blacklists/token-blacklists.module';
import { SystemLog } from '../system-logs/entities/system-log.entity';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SystemLog]),
    TokenBlacklistsModule,
    SystemLogsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
