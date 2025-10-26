import { Module } from '@nestjs/common';
import { DiscogsService } from './discogs.service';
import { DiscogsController } from './discogs.controller';
import { VinylsModule } from '../vinyls/vinyls.module';
import { AuthModule } from '../auth/auth.module';
import { TokenBlacklistsModule } from '../token-blacklists/token-blacklists.module';
import { UsersModule } from '../users/users.module';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [
    VinylsModule,
    AuthModule,
    TokenBlacklistsModule,
    UsersModule,
    SystemLogsModule,
  ],
  controllers: [DiscogsController],
  providers: [DiscogsService],
})
export class DiscogsModule {}
