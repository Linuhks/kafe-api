import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { ValidationError } from 'class-validator';
import type { Request, Response } from 'express';
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
  // A UI fica por conta do Scalar; o spec OpenAPI continua em /api/v1/docs-json
  SwaggerModule.setup('api/v1/docs', app, document, {
    ui: false,
    jsonDocumentUrl: 'api/v1/docs-json',
  });

  // O Scalar carrega o bundle do CDN e inicia por script inline, o que o CSP padrão do
  // helmet bloqueia — a rota de docs recebe um CSP próprio, com nonce por requisição.
  app.use('/api/v1/docs', (req: Request, res: Response) => {
    const nonce = randomBytes(16).toString('base64');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src 'nonce-${nonce}' https://cdn.jsdelivr.net`,
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "font-src 'self' data: https://fonts.scalar.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://proxy.scalar.com",
      ].join('; '),
    );
    apiReference({
      content: document,
      nonce,
      pageTitle: 'Kafe API',
      theme: 'purple',
      persistAuth: true,
    })(req, res);
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
