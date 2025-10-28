import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as session from 'express-session';
import * as passport from 'passport';
import { json, raw } from 'express';
import { setupSwagger } from './config/swagger.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  app.use((req, res, next) => {
    if (
      req.originalUrl.includes('/stripe/webhook') ||
      req.path.includes('/stripe/webhook')
    ) {
      raw({ type: 'application/json' })(req, res, next);
    } else {
      json()(req, res, next);
    }
  });

  app.use(
    session({
      secret: configService.get<string>('SESSION_SECRET')!,
      saveUninitialized: false,
      resave: false,
      cookie: {
        maxAge: 60000,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    credentials: true,
  });

  setupSwagger(app);

  const port = configService.get<number>('SERVER_PORT')!;
  await app.listen(port);
}
bootstrap();
