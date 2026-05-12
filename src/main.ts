import 'dotenv/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationError } from 'class-validator';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { AuditInterceptor } from './presentation/interceptors/audit.interceptor';

async function bootstrap() {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    throw new Error('CORS_ORIGIN environment variable is required but not set.');
  }

  // bodyParser: false — obrigatório para o better-auth processar o body raw
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const _reflector = app.get(Reflector);

  app.use(helmet());

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: corsOrigin,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const details = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}).map((message) => ({
            field: error.property,
            message,
          })),
        );
        return new BadRequestException({ message: 'Validation failed', details });
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new AuditInterceptor());

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
