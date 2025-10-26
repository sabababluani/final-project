import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { CreateSystemLogDto } from './dto/create-system-log.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/guards/jwt-roles.guard';
import { Role } from '../auth/guards/enum/role.enum';
import {
  ApiCreateSystemLog,
  ApiGetSystemLogs,
} from './swagger/system-logs.swagger';
import { PaginationDto } from '../common/pagination.dto';

@Controller('system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @ApiCreateSystemLog()
  @Post()
  create(@Body() createSystemLogDto: CreateSystemLogDto) {
    return this.systemLogsService.createLog(createSystemLogDto);
  }

  @ApiGetSystemLogs()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Get()
  getSystemLogs(@Query() query: PaginationDto) {
    return this.systemLogsService.getSystemLogs(query);
  }
}
