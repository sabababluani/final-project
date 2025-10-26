import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
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
  ApiGetUserById,
  ApiUpdateUser,
  ApiDeleteUser,
} from './swagger/users.swagger';
import { Roles } from '../auth/guards/jwt-roles.guard';
import { Role } from '../auth/guards/enum/role.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiGetMe()
  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    return this.usersService.me(user);
  }

  @ApiGetUserById()
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @ApiUpdateUser()
  @UseGuards(AuthGuard)
  @Patch('me')
  update(
    @Req() req: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const user = req.user;
    return this.usersService.update(user.id, updateUserDto);
  }

  @ApiUpdateUser()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @Patch(':id')
  updateById(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @ApiDeleteUser()
  @UseGuards(AuthGuard)
  @Delete('me')
  remove(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    return this.usersService.remove(user.id);
  }

  @ApiDeleteUser()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard)
  @Delete(':id')
  removeById(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
