import 'dotenv/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter.js';
import { TransformInterceptor } from './presentation/interceptors/transform.interceptor.js';

async function bootstrap() {
  // bodyParser: false — obrigatório para o better-auth processar o body raw
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const reflector = app.get(Reflector);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kafe API')
    .setDescription('API de gestão de cafeteria')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
