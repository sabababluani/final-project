import { Injectable } from '@nestjs/common';
import * as Discogs from 'disconnect';
import { VinylsService } from '../vinyls/vinyls.service';
import { CreateVinylDto } from '../vinyls/dto/create-vinyl.dto';
import { User } from '../users/entities/user.entity';
import { SystemLogsService } from '../system-logs/system-logs.service';
import { LogLevel } from '../system-logs/dto/create-system-log.dto';

@Injectable()
export class DiscogsService {
  private discogs: Discogs.Client;
  private readonly REQUEST_DELAY = 2000;
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly vinylsService: VinylsService,
    private readonly systemLogsService: SystemLogsService
  ) {
    this.discogs = new Discogs.Client({
      consumerKey: process.env.DISCOGS_CONSUMER_KEY,
      consumerSecret: process.env.DISCOGS_CONSUMER_SECRET,
      userToken: process.env.DISCOGS_USER_TOKEN,
    });
  }

  async fetchAndStoreVinyls(searchQuery: string, user: User) {
    const db = this.discogs.database();
    const response = await db.search(searchQuery, {
      type: 'release',
      per_page: 50,
    });

    for (const release of response.results) {
      try {
        await this.delay(this.REQUEST_DELAY);

        const details = await this.fetchWithRetry(db, release.id);

        const vinyl: CreateVinylDto = {
          name: details.title,
          authorName:
            details.artists?.map((a: Discogs.Artist) => a.name).join(', ') ||
            'Unknown Artist',
          description: this.extractNotes(details.notes),
          image: release.cover_image || details.images?.[0]?.uri,
          price: details.lowest_price ?? 0,
        };

        await this.vinylsService.create(vinyl, user);
      } catch (error) {
        await this.systemLogsService.createLog({
          message: `Failed to add vinyl "${release.title}": ${error.message}`,
        });
      }
    }

    await this.systemLogsService.createLog({
      message: `User with ID: ${user.id} fetched and stored ${response.results.length} vinyls`,
    });

    return {
      message: `Vinyls fetched and stored. ${response.results.length} vinyls fetched`,
    };
  }

  private async fetchWithRetry(
    db: Discogs.Database,
    releaseId: string,
    retries = 0
  ): Promise<Discogs.Release> {
    try {
      return await db.getRelease(releaseId);
    } catch (error) {
      if (error.message.includes('429') && retries < this.MAX_RETRIES) {
        const retryAfter =
          this.extractRetryAfter(error.message) || Math.pow(2, retries) * 1000;
        await this.delay(retryAfter);
        return this.fetchWithRetry(db, releaseId, retries + 1);
      }
      await this.systemLogsService.createLog({
        message: `Failed to fetch vinyl with ID: ${releaseId}`,
        level: LogLevel.ERROR,
      });
      throw error;
    }
  }

  private extractRetryAfter(errorMessage: string): number | null {
    const match = errorMessage.match(/retry after (\d+)/);
    return match ? parseInt(match[1]) * 1000 : null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractNotes(notes: Discogs.Note[]): string {
    if (!notes) return 'No description available';
    if (Array.isArray(notes)) {
      return notes.map((n: Discogs.Note) => n.value || n).join(' ');
    }
    if (typeof notes === 'string') return notes;
    return JSON.stringify(notes);
  }
}
