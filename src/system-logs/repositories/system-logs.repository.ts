import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from '../entities/system-log.entity';
import { CreateSystemLogDto } from '../dto/create-system-log.dto';

@Injectable()
export class SystemLogsRepository {
  constructor(
    @InjectRepository(SystemLog)
    private readonly logsRepository: Repository<SystemLog>
  ) {}

  async create(createSystemLogDto: CreateSystemLogDto): Promise<SystemLog> {
    const log = this.logsRepository.create(createSystemLogDto);
    return await this.logsRepository.save(log);
  }

  async findAll(): Promise<SystemLog[]> {
    return await this.logsRepository.find();
  }

  async findById(id: number): Promise<SystemLog | null> {
    return await this.logsRepository.findOne({ where: { id } });
  }

  async findByLevel(level: string): Promise<SystemLog[]> {
    return await this.logsRepository.find({ where: { level } });
  }

  async delete(id: number): Promise<void> {
    await this.logsRepository.delete(id);
  }

  async count(): Promise<number> {
    return await this.logsRepository.count();
  }

  async findWithPagination(skip: number, take: number): Promise<SystemLog[]> {
    return await this.logsRepository.find({
      skip,
      take,
      order: { createdAt: 'ASC' },
    });
  }
}
