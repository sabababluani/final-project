import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Review } from '../entities/review.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { PaginationDto } from 'src/common/pagination.dto';
import { User } from 'src/users/entities/user.entity';
import { Vinyl } from 'src/vinyls/entities/vinyl.entity';

@Injectable()
export class ReviewsRepository {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly dataSource: DataSource
  ) {}

  async create(
    dto: CreateReviewDto,
    user: User,
    vinyl: Vinyl,
    queryRunner: QueryRunner
  ): Promise<Review> {
    const review = queryRunner.manager.create(Review, {
      ...dto,
      user,
      vinyl,
    });

    return await queryRunner.manager.save(review);
  }

  async findAllByVinyl(
    vinylId: number,
    paginationDto: PaginationDto
  ): Promise<{ reviews: Review[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { vinyl: { id: vinylId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { reviews, total };
  }

  async findOneWithVinyl(
    id: number,
    queryRunner: QueryRunner
  ): Promise<Review | null> {
    return await queryRunner.manager.findOne(Review, {
      where: { id },
      relations: ['vinyl'],
    });
  }

  async remove(id: number, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.delete(Review, id);
  }

  async findById(id: number): Promise<Review | null> {
    return await this.reviewsRepository.findOne({
      where: { id },
      relations: ['vinyl', 'user'],
    });
  }

  async findByUserAndVinyl(
    userId: number,
    vinylId: number
  ): Promise<Review | null> {
    return await this.reviewsRepository.findOne({
      where: {
        user: { id: userId },
        vinyl: { id: vinylId },
      },
    });
  }

  async getAverageRatingByVinyl(vinylId: number): Promise<number> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.score)', 'average')
      .where('review.vinylId = :vinylId', { vinylId })
      .getRawOne();

    return parseFloat(result.average) || 0;
  }

  async getReviewCountByVinyl(vinylId: number): Promise<number> {
    return await this.reviewsRepository.count({
      where: { vinyl: { id: vinylId } },
    });
  }

  async getReviewsByUser(
    userId: number,
    paginationDto: PaginationDto
  ): Promise<{ reviews: Review[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;

    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['vinyl'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { reviews, total };
  }
}
