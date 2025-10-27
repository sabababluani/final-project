import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private bot: Telegraf;
  private readonly channelId = '@babluanis';

  constructor(private readonly configService: ConfigService) {
    const telegramToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.bot = new Telegraf(telegramToken!);
  }

  async verifyChannelAccess() {
    try {
      const chat = await this.bot.telegram.getChat(this.channelId);
      return chat;
    } catch (err) {
      throw err;
    }
  }

  async createTelegram(vinylName: string, price: number) {
    const message = `
      🎵 *New Vinyl Available!*
      *Name:* ${vinylName}
      *Price:* $${price}
      *Link:* [Check Store](https://final-project-r1qs.onrender.com/vinyls)
    `.trim();

    try {
      const result = await this.bot.telegram.sendMessage(
        this.channelId,
        message,
        { parse_mode: 'Markdown' }
      );

      return `Telegram message sent: ${result.message_id}`;
    } catch (err) {
      throw err;
    }
  }
}
