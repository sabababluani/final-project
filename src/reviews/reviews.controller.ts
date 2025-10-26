import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';
import { Roles } from '../auth/guards/jwt-roles.guard';
import { Role } from '../auth/guards/enum/role.enum';
import { PaginationDto } from '../common/pagination.dto';
import {
  ApiCreateReview,
  ApiGetReviewsByVinyl,
  ApiDeleteReview,
} from './swagger/reviews.swagger';
import { ApiExtraModels } from '@nestjs/swagger';
import { Review } from './entities/review.entity';

@ApiExtraModels(Review)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiCreateReview()
  @UseGuards(AuthGuard)
  @Post(':vinylId')
  create(
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: AuthenticatedRequest,
    @Param('vinylId') vinylId: string
  ) {
    const user = req.user;
    return this.reviewsService.create(createReviewDto, user, +vinylId);
  }

  @ApiGetReviewsByVinyl()
  @UseGuards(AuthGuard)
  @Get('/vinyl/:vinylId')
  async findAllByVinyl(
    @Param('vinylId') vinylId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.reviewsService.findAllByVinyl(+vinylId, paginationDto);
  }

  @ApiDeleteReview()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const user = req.user;
    return await this.reviewsService.remove(+id, user);
  }
}
