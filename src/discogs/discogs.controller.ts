import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DiscogsService } from './discogs.service';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/jwt-roles.guard';
import { Role } from '../auth/guards/enum/role.enum';
import { ApiDiscogsMigrate } from './swagger/discogs.swagger';

@Controller('discogs')
export class DiscogsController {
  constructor(private readonly discogsService: DiscogsService) {}

  @ApiDiscogsMigrate()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Get('migrate')
  async fetchVinyls(
    @Query('q') query: string,
    @Req() req: AuthenticatedRequest
  ) {
    const user = req.user;
    return this.discogsService.fetchAndStoreVinyls(query || 'rock', user);
  }
}
