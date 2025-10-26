import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order-item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Array of items to purchase',
    type: [CreateOrderItemDto],
    minItems: 1,
    example: [
      { vinylId: 1, quantity: 2 },
      { vinylId: 3, quantity: 1 },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
    format: 'email',
  })
  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    description: 'Currency code for the transaction',
    example: 'usd',
    enum: ['usd', 'eur', 'gel'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['usd', 'eur', 'gel'])
  currency: string;
}
