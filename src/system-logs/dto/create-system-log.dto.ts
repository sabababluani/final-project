import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from 'class-sanitizer';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export class CreateSystemLogDto {
  @ApiProperty({
    description: 'Log message',
    example: 'User successfully logged in',
  })
  @IsString()
  @Trim()
  message: string;

  @ApiPropertyOptional({
    description: 'Log level',
    enum: LogLevel,
    default: LogLevel.INFO,
    example: LogLevel.INFO,
  })
  @IsEnum(LogLevel)
  @IsOptional()
  level?: LogLevel;
}
