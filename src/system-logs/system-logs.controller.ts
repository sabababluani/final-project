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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller('system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @ApiCreateSystemLog()
  @Post()
  async create(@Body() createSystemLogDto: CreateSystemLogDto) {
    return await this.systemLogsService.createLog(createSystemLogDto);
  }

  @ApiGetSystemLogs()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Get()
  async getSystemLogs(@Query() query: PaginationDto) {
    return await this.systemLogsService.getSystemLogs(query);
  }
}
