import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const db = configService.get('database');
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.name,
    ssl: db.ssl ? { rejectUnauthorized: false } : false,
    entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '../database/migrations/*{.ts,.js}')],
    synchronize: db.synchronize,
    logging: db.logging,
    migrationsRun: false,
    retryAttempts: 5,
    retryDelay: 3000,
    connectTimeoutMS: 30000,
    extra: {
      max: 20,
      min: 2,
      acquire: 60000,
      idle: 10000,
    },
  };
};
