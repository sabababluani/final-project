import {
  IsNumber,
  IsString,
  Min,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Trim } from 'class-sanitizer';

export class CreateVinylDto {
  @ApiProperty({
    description: 'Name of the vinyl record',
    example: 'Abbey Road',
    minLength: 1,
    maxLength: 200,
  })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Name of the artist or band',
    example: 'The Beatles',
    minLength: 1,
    maxLength: 200,
  })
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  authorName: string;

  @ApiProperty({
    description: 'Detailed description of the vinyl record',
    example:
      'Iconic album featuring classic hits like "Come Together" and "Here Comes the Sun"',
    minLength: 10,
  })
  @Trim()
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({
    description: 'URL of the vinyl record cover image',
    example: 'https://example.com/images/abbey-road.jpg',
    format: 'url',
  })
  @Trim()
  @IsUrl()
  image: string;

  @ApiProperty({
    description: 'Price of the vinyl record in USD',
    example: 29.99,
    minimum: 0,
    type: 'number',
    format: 'decimal',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}
