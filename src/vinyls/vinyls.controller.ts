import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { VinylsService } from './vinyls.service';
import { CreateVinylDto } from './dto/create-vinyl.dto';
import { PaginationDto } from '../common/pagination.dto';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../interfaces/authenticated-user.interface';
import { UpdateVinylDto } from './dto/update-vinyl.dto';
import { Roles } from '../auth/guards/jwt-roles.guard';
import { Role } from '../auth/guards/enum/role.enum';
import { SearchVinylsDto } from './dto/search-vinyls.dto';
import {
  ApiCreateVinyl,
  ApiGetAllVinyls,
  ApiSearchVinyls,
  ApiUpdateVinyl,
  ApiDeleteVinyl,
} from './swagger/vinyls.swagger';
import { ApiExtraModels } from '@nestjs/swagger';
import { Vinyl } from './entities/vinyl.entity';

@ApiExtraModels(Vinyl)
@Controller('vinyls')
export class VinylsController {
  constructor(private readonly vinylsService: VinylsService) {}

  @ApiCreateVinyl()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateVinylDto, @Req() req: AuthenticatedRequest) {
    const user = req.user;
    return this.vinylsService.create(dto, user);
  }

  @ApiGetAllVinyls()
  @Get()
  async findAll(@Query() query: PaginationDto) {
    return await this.vinylsService.findAll(query);
  }

  @ApiSearchVinyls()
  @UseGuards(AuthGuard)
  @Get('search')
  async search(@Query() query: SearchVinylsDto) {
    return await this.vinylsService.search(query);
  }

  @ApiUpdateVinyl()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateVinylDto) {
    return await this.vinylsService.update(+id, dto);
  }

  @ApiDeleteVinyl()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.vinylsService.remove(+id);
  }
}
