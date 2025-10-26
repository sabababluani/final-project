import { Module, forwardRef } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { SystemLogsController } from './system-logs.controller';
import { SystemLogsRepository } from './repositories/system-logs.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemLog } from './entities/system-log.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { TokenBlacklistsModule } from '../token-blacklists/token-blacklists.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SystemLog]),
    forwardRef(() => AuthModule),
    forwardRef(() => UsersModule),
    TokenBlacklistsModule,
  ],
  controllers: [SystemLogsController],
  providers: [SystemLogsService, SystemLogsRepository],
  exports: [SystemLogsService, SystemLogsRepository],
})
export class SystemLogsModule {}
