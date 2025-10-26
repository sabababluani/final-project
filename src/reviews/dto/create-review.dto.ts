import { IsNumber, IsString, Min, Max, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Trim } from 'class-sanitizer';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Rating score (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
    type: 'integer',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  score: number;

  @ApiProperty({
    description: 'Review comment or feedback',
    example: 'Amazing album! The sound quality is pristine.',
    minLength: 10,
  })
  @IsString()
  @Trim()
  @MinLength(10)
  comment: string;
}
