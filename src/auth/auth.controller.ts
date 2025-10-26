import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/GoogleGuards';
import { validate } from 'class-validator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { loginUserDto } from './dto/login-user.dto';
import { AuthGuard } from './guards/jwt-auth.guard';
import { Public } from './guards/jwt-strategy';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';
import {
  ApiRegister,
  ApiLogin,
  ApiGoogleLogin,
  ApiGoogleRedirect,
  ApiLogout,
} from './swagger/auth.swagger';
import { GoogleRedirectRequest } from './interfaces/google-redirect-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiGoogleLogin()
  @Public()
  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  handleLogin() {
    return { msg: 'Google Authentication' };
  }

  @ApiGoogleRedirect()
  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async handleRedirect(@Req() req: GoogleRedirectRequest) {
    return this.authService.handleRedirect(req);
  }

  @ApiRegister()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const errors = await validate(createUserDto);
    if (errors.length > 0) {
      throw new HttpException(
        { message: 'Validation failed', errors },
        HttpStatus.BAD_REQUEST
      );
    }
    return this.authService.register(createUserDto);
  }

  @ApiLogin()
  @Post('login')
  loginUser(@Body() body: loginUserDto) {
    return this.authService.login(body);
  }

  @ApiLogout()
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: AuthenticatedRequest) {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = req.user.id;

    if (!token) {
      throw new HttpException('No token provided', HttpStatus.BAD_REQUEST);
    }

    return this.authService.logout(token, userId);
  }
}
