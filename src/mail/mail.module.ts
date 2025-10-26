import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SystemLogsModule } from '../system-logs/system-logs.module';

@Module({
  imports: [SystemLogsModule],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
