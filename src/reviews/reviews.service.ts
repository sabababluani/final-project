import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto } from '../common/pagination.dto';
import { VinylsService } from '../vinyls/vinyls.service';
import { User } from '../users/entities/user.entity';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { ReviewsRepository } from './repositories/reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly vinylsService: VinylsService,
    private readonly systemLogsService: SystemLogsService,
    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateReviewDto, user: User, vinylId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const vinyl = await this.vinylsService.findOne(vinylId);
      if (!vinyl) {
        throw new NotFoundException(`Vinyl with ID ${vinylId} not found`);
      }

      const existingReview = await this.reviewsRepository.findByUserAndVinyl(
        user.id,
        vinylId
      );

      if (existingReview) {
        throw new BadRequestException('User has already reviewed this vinyl');
      }

      await this.reviewsRepository.create(dto, user, vinyl, queryRunner);

      await this.vinylsService.updateAverageRating(vinylId, queryRunner);

      await this.systemLogsService.createLog({
        message: `User with ID:${user.id} created review for Vinyl ID:${vinylId}`,
      });

      await queryRunner.commitTransaction();
      return { message: "Successfully created vinyl's review" };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByVinyl(vinylId: number, paginationDto: PaginationDto) {
    const { reviews, total } = await this.reviewsRepository.findAllByVinyl(
      vinylId,
      paginationDto
    );

    const { page = 1, limit = 10 } = paginationDto;

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: reviews,
    };
  }

  async remove(id: number, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const review = await this.reviewsRepository.findOneWithVinyl(
        id,
        queryRunner
      );

      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      if (review.user.id !== user.id) {
        throw new Error('User can only delete their own reviews');
      }

      await this.reviewsRepository.remove(id, queryRunner);

      if (review.vinyl?.id) {
        await this.vinylsService.updateAverageRating(
          review.vinyl.id,
          queryRunner
        );
      }

      await this.systemLogsService.createLog({
        message: `User with ID:${user.id} deleted review ID:${id} from Vinyl ID:${review.vinyl?.id}`,
      });

      await queryRunner.commitTransaction();
      return { message: 'Review deleted successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
