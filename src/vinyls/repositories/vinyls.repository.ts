import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { User } from '../../users/entities/user.entity';
import { PaginationDto } from '../../common/pagination.dto';
import { CreateVinylDto } from '../dto/create-vinyl.dto';
import { Vinyl } from '../entities/vinyl.entity';
import { UpdateVinylDto } from '../dto/update-vinyl.dto';
import {
  SearchVinylsDto,
  SortOrder,
  VinylSortBy,
} from '../dto/search-vinyls.dto';

@Injectable()
export class VinylsRepository {
  constructor(
    @InjectRepository(Vinyl)
    private readonly vinylsRepository: Repository<Vinyl>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly dataSource: DataSource
  ) {}

  async create(
    dto: CreateVinylDto,
    user: User,
    queryRunner: QueryRunner
  ): Promise<Vinyl> {
    const vinyl = queryRunner.manager.create(Vinyl, {
      ...dto,
      owner: user,
    });

    return await queryRunner.manager.save(vinyl);
  }

  async findById(id: number): Promise<Vinyl | null> {
    return await this.vinylsRepository.findOne({ where: { id } });
  }

  async update(
    id: number,
    dto: UpdateVinylDto,
    queryRunner: QueryRunner
  ): Promise<void> {
    await queryRunner.manager.update(Vinyl, id, dto);
  }

  async delete(
    id: number,
    queryRunner: QueryRunner
  ): Promise<{ affected: number }> {
    const result = await queryRunner.manager.delete(Vinyl, id);
    return { affected: result.affected || 0 };
  }

  async findAll(pagination: PaginationDto): Promise<[Vinyl[], number]> {
    const { page = 1, limit = 10 } = pagination;
    return await this.vinylsRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });
  }

  async search(dto: SearchVinylsDto): Promise<[Vinyl[], number]> {
    const {
      query,
      sortBy = VinylSortBy.CREATED_AT,
      order = SortOrder.ASC,
      page = 1,
      limit = 10,
    } = dto;

    const qb = this.vinylsRepository.createQueryBuilder('vinyl');

    qb.leftJoinAndSelect(
      'vinyl.reviews',
      'review',
      'review.id = (SELECT r.id FROM review r WHERE r.vinylId = vinyl.id ORDER BY r.createdAt ASC LIMIT 1)'
    );

    qb.leftJoinAndSelect('review.user', 'reviewUser');

    if (query && query.trim().length > 0) {
      const searchQuery = `%${query.trim().toLowerCase()}%`;
      qb.where('LOWER(vinyl.name) LIKE :searchQuery', { searchQuery }).orWhere(
        'LOWER(vinyl.authorName) LIKE :searchQuery',
        { searchQuery }
      );
    }

    const sortColumnMap: Record<VinylSortBy, string> = {
      [VinylSortBy.PRICE]: 'vinyl.price',
      [VinylSortBy.NAME]: 'vinyl.name',
      [VinylSortBy.AUTHOR_NAME]: 'vinyl.authorName',
      [VinylSortBy.CREATED_AT]: 'vinyl.createdAt',
    };

    qb.orderBy(sortColumnMap[sortBy], order)
      .skip((page - 1) * limit)
      .take(limit);

    return await qb.getManyAndCount();
  }

  async updateAverageRating(
    vinylId: number,
    queryRunner: QueryRunner
  ): Promise<number> {
    const { avg } = await queryRunner.manager
      .createQueryBuilder(Review, 'review')
      .select('COALESCE(AVG(review.score), 0)', 'avg')
      .where('review.vinylId = :vinylId', { vinylId })
      .getRawOne();

    const average = Number(Number(avg).toFixed(2));

    await queryRunner.manager.update(Vinyl, vinylId, {
      averageRating: average,
    });

    return average;
  }

  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
}
