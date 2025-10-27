import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './guards/google/GoogleStrategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionSerializer } from './guards/Serialize';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { TokenBlacklistsModule } from '../token-blacklists/token-blacklists.module';
import { SystemLog } from '../system-logs/entities/system-log.entity';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SystemLog]),
    UsersModule,
    TokenBlacklistsModule,
    SystemLogsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, SessionSerializer],
})
export class AuthModule {}
