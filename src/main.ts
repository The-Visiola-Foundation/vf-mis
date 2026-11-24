import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exception.filter';
import { TransformInterceptor } from './common/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import dns from 'node:dns';

// dns.setDefaultResultOrder('ipv4first');


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGINS
    ?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean) ?? [];

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('VF MIS API')
    .setDescription('API documentation for the VF MIS platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(new ValidationPipe({
    forbidNonWhitelisted: false,
    whitelist: true,
    transform: true,
  }));

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();

