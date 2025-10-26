import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/pagination.dto';
import { CreateVinylDto } from './dto/create-vinyl.dto';
import { UpdateVinylDto } from './dto/update-vinyl.dto';
import {
  SearchVinylsDto,
  SortOrder,
  VinylSortBy,
} from './dto/search-vinyls.dto';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { TelegramService } from '../telegram/telegram.service';
import { QueryRunner } from 'typeorm';
import { VinylsRepository } from './repositories/vinyls.repository';

@Injectable()
export class VinylsService {
  constructor(
    private readonly vinylsRepository: VinylsRepository,
    private readonly systemLogsService: SystemLogsService,
    private readonly telegramService: TelegramService
  ) {}

  async create(dto: CreateVinylDto, user: User) {
    const queryRunner = this.vinylsRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const vinyl = await this.vinylsRepository.create(dto, user, queryRunner);

      await this.systemLogsService.createLog({
        message: `User with ID: ${user.id} created vinyl "${vinyl.name}"`,
      });

      await this.telegramService.createTelegram(dto.name, dto.price);
      await queryRunner.commitTransaction();

      return { message: 'Vinyl created successfully', data: vinyl };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, dto: UpdateVinylDto) {
    const queryRunner = this.vinylsRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const vinyl = await this.vinylsRepository.findById(id);

      if (!vinyl) {
        throw new NotFoundException(`Vinyl with ID ${id} not found`);
      }

      await this.vinylsRepository.update(id, dto, queryRunner);

      await this.systemLogsService.createLog({
        message: `Vinyl ${id} updated`,
      });

      await queryRunner.commitTransaction();
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: number) {
    const queryRunner = this.vinylsRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await this.vinylsRepository.delete(id, queryRunner);

      if (!result.affected) {
        throw new NotFoundException(`Vinyl with ID ${id} not found`);
      }

      await this.systemLogsService.createLog({
        message: `Vinyl ${id} deleted`,
      });

      await queryRunner.commitTransaction();
      return { message: 'Successfully deleted vinyl' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAverageRating(vinylId: number, queryRunner: QueryRunner) {
    const average = await this.vinylsRepository.updateAverageRating(
      vinylId,
      queryRunner
    );

    await this.systemLogsService.createLog({
      message: `Average rating for vinyl ${vinylId} updated to ${average}`,
    });
  }

  async findOne(id: number) {
    const vinyl = await this.vinylsRepository.findById(id);
    if (!vinyl) throw new NotFoundException(`Vinyl with ID ${id} not found`);
    return vinyl;
  }

  async findAll(pagination: PaginationDto) {
    const [vinyls, total] = await this.vinylsRepository.findAll(pagination);
    const { page = 1, limit = 10 } = pagination;

    return {
      data: vinyls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(dto: SearchVinylsDto) {
    const [vinyls, total] = await this.vinylsRepository.search(dto);
    const {
      page = 1,
      limit = 10,
      sortBy = VinylSortBy.NAME,
      order = SortOrder.ASC,
    } = dto;

    return {
      data: vinyls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sortBy,
        order,
      },
    };
  }
}
