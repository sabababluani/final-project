import { Trim } from 'class-sanitizer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateGoogleUserDto {
  @IsEmail()
  @Trim()
  email: string;

  @IsString()
  @Trim()
  firstName: string;

  @IsString()
  @Trim()
  lastName: string;

  @IsOptional()
  @IsString()
  @Trim()
  avatar?: string;

  @IsOptional()
  @IsString()
  @Trim()
  accessToken?: string;

  @IsOptional()
  @IsString()
  @Trim()
  refreshToken?: string;
}
