import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const corsEnv = process.env.CORS_ORIGINS?.trim();
  const corsOrigin = corsEnv
    ? corsEnv.split(',').map((s) => s.trim()).filter(Boolean)
    : true;

  const app = await NestFactory.create(AppModule, { cors: { origin: corsOrigin, credentials: false } });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap();
