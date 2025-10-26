import { Module } from '@nestjs/common';
import { TokenBlacklistService } from './token-blacklists.service';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TokenBlacklist])],
  providers: [TokenBlacklistService],
  exports: [TokenBlacklistService],
})
export class TokenBlacklistsModule {}
