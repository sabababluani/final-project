import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { TokenBlacklistsModule } from './token-blacklists/token-blacklists.module';
import { TokenBlacklist } from './token-blacklists/entities/token-blacklist.entity';
import { JwtModule } from '@nestjs/jwt';
import { VinylsModule } from './vinyls/vinyls.module';
import { Vinyl } from './vinyls/entities/vinyl.entity';
import { ReviewsModule } from './reviews/reviews.module';
import { Review } from './reviews/entities/review.entity';
import { SystemLogsModule } from './system-logs/system-logs.module';
import { StripeModule } from './stripe/stripe.module';
import { MailModule } from './mail/mail.module';
import { TelegramModule } from './telegram/telegram.module';
import { OrdersModule } from './orders/orders.module';
import { DiscogsModule } from './discogs/discogs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<number>('JWT_EXPIRATION_TIME') },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USERNAME'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('TEST_DATABASE'),
        entities: [User, TokenBlacklist, Vinyl, Review],
        autoLoadEntities: true,
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),
    TokenBlacklistsModule,
    PassportModule.register({ session: true }),
    AuthModule,
    UsersModule,
    VinylsModule,
    ReviewsModule,
    SystemLogsModule,
    StripeModule,
    MailModule,
    TelegramModule,
    OrdersModule,
    DiscogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModuleTest {}
