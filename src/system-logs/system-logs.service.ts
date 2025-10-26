import { Injectable } from '@nestjs/common';
import { CreateSystemLogDto } from './dto/create-system-log.dto';
import { PaginationDto } from 'src/common/pagination.dto';
import { SystemLogsRepository } from './repositories/system-logs.repository';

@Injectable()
export class SystemLogsService {
  constructor(private readonly systemLogsRepository: SystemLogsRepository) {}

  async createLog(createSystemLogDto: CreateSystemLogDto) {
    const logData = {
      ...createSystemLogDto,
    };

    const log = await this.systemLogsRepository.create(logData);

    return {
      message: 'Log created successfully',
      log,
    };
  }

  async getSystemLogs(dto: PaginationDto) {
    if (!dto || (!dto.page && !dto.limit)) {
      const logs = await this.systemLogsRepository.findAll();
      return { logs, total: logs.length, page: null, limit: null };
    }

    const { page, limit } = dto;
    const skip = (page - 1) * limit;

    const logs = await this.systemLogsRepository.findWithPagination(
      skip,
      limit
    );
    const total = await this.systemLogsRepository.count();

    return {
      logs,
      total,
      page,
      limit,
    };
  }
}
