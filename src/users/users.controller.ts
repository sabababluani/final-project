import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';
import {
  ApiGetMe,
  ApiUpdateUser,
  ApiDeleteUser,
} from './swagger/users.swagger';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiGetMe()
  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    return await this.usersService.me(user);
  }

  @ApiUpdateUser()
  @UseGuards(AuthGuard)
  @Patch('me')
  async update(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const user = req.user;
    return await this.usersService.update(user.id, updateUserDto);
  }

  @ApiDeleteUser()
  @UseGuards(AuthGuard)
  @Delete('me')
  async remove(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    return await this.usersService.remove(user.id);
  }
}
