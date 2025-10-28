import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

ConfigModule.forRoot();

const configService = new ConfigService();

export const dataSourceTest = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST_TEST'),
  port: configService.get<number>('DATABASE_PORT'),
  username: configService.get<string>('DATABASE_USERNAME_TEST'),
  password: configService.get<string>('DATABASE_PASSWORD_TEST'),
  database: configService.get<string>('DATABASE_NAME_TEST'),
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
  ssl: {
    rejectUnauthorized: false,
  },
});

