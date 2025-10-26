import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  ApiUnauthorized,
  ApiForbidden,
  ApiBadRequest,
  ApiInternalError,
} from '../../common/swagger';
import { Vinyl } from '../../vinyls/entities/vinyl.entity';

export function ApiDiscogsMigrate() {
  return applyDecorators(
    ApiTags('Discogs'),
    ApiBearerAuth('JWT-auth'),
    ApiOperation({
      summary: 'Migrate a vinyl from Discogs',
      description: 'Migrates a vinyl from Discoogs',
    }),
    ApiResponse({
      status: 200,
      description: 'Vinyl migrated successfully',
      type: Vinyl,
    }),
    ApiBadRequest(),
    ApiUnauthorized(),
    ApiForbidden(),
    ApiInternalError()
  );
}
