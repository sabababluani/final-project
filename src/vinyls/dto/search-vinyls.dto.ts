import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum VinylSortBy {
  PRICE = 'price',
  NAME = 'name',
  AUTHOR_NAME = 'authorName',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class SearchVinylsDto {
  @ApiPropertyOptional({
    description: 'Search query to filter vinyls by name or author',
    example: 'Beatles',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: VinylSortBy,
    example: VinylSortBy.NAME,
  })
  @IsOptional()
  @IsEnum(VinylSortBy)
  sortBy?: VinylSortBy;

  @ApiPropertyOptional({
    description: 'Sort order (ascending or descending)',
    enum: SortOrder,
    default: SortOrder.ASC,
    example: SortOrder.ASC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.ASC;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
