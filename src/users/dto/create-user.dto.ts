import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from 'class-sanitizer';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @Trim()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
  })
  @Trim()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 2,
  })
  @Trim()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'SecurePass123!',
    minLength: 6,
    format: 'password',
  })
  @Trim()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({
    description: 'Password confirmation (must match password)',
    example: 'SecurePass123!',
    minLength: 8,
    format: 'password',
  })
  @Trim()
  @IsString()
  confirmPassword: string;
}
