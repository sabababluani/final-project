import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'ID of the vinyl to purchase',
    example: 1,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  vinylId: number;

  @ApiProperty({
    description: 'Quantity of the vinyl to purchase',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  quantity: number;
}
