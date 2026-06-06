import 'dotenv/config';
import { BadRequestException, type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ValidationError } from 'class-validator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import request from 'supertest';
import * as authSchema from '../../src/infrastructure/db/auth-schema';
import * as schema from '../../src/infrastructure/db/schema';
import { HttpExceptionFilter } from '../../src/presentation/filters/http-exception.filter';
import { AuditInterceptor } from '../../src/presentation/interceptors/audit.interceptor';

export class E2ETestHelper {
  app!: INestApplication;
  private dbName!: string;
  private originalDatabaseUrl!: string;
  private suitePool!: Pool;

  getDbName(): string {
    return this.dbName;
  }

  async setup(): Promise<void> {
    this.originalDatabaseUrl = process.env.DATABASE_URL!;
    this.dbName = `kafe_test_${randomUUID().replace(/-/g, '_')}`;

    const adminUrl = this.getAdminUrl(this.originalDatabaseUrl);
    const suiteUrl = this.buildSuiteUrl(this.originalDatabaseUrl, this.dbName);

    // Create the suite database
    const adminPool = new Pool({ connectionString: adminUrl });
    try {
      await adminPool.query(`CREATE DATABASE "${this.dbName}"`);
    } finally {
      await adminPool.end();
    }

    // Run Drizzle migrations into the suite database
    this.suitePool = new Pool({ connectionString: suiteUrl });
    const db = drizzle(this.suitePool, { schema: { ...schema, ...authSchema } });
    await migrate(db, { migrationsFolder: './src/infrastructure/db/migrations' });

    // Override DATABASE_URL before importing AppModule so Better-Auth's top-level
    // pool captures the suite URL at module-load time
    process.env.DATABASE_URL = suiteUrl;
    const { AppModule } = await import('../../src/app.module');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication({ bodyParser: false });
    this.app.setGlobalPrefix('api/v1');
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors: ValidationError[]) => {
          const details = errors.flatMap((e) =>
            Object.values(e.constraints ?? {}).map((message) => ({
              field: e.property,
              message,
            })),
          );
          return new BadRequestException({ message: 'Validation failed', details });
        },
      }),
    );
    this.app.useGlobalFilters(new HttpExceptionFilter());
    this.app.useGlobalInterceptors(new AuditInterceptor());

    await this.app.init();
  }

  async teardown(): Promise<void> {
    try {
      await this.app.close();
    } catch (err) {
      console.error('E2E teardown: failed to close app:', err);
    }

    try {
      await this.suitePool.end();
    } catch (err) {
      console.error('E2E teardown: failed to close suite pool:', err);
    }

    process.env.DATABASE_URL = this.originalDatabaseUrl;

    const adminUrl = this.getAdminUrl(this.originalDatabaseUrl);
    const adminPool = new Pool({ connectionString: adminUrl });
    try {
      await adminPool.query(`DROP DATABASE IF EXISTS "${this.dbName}" WITH (FORCE)`);
    } catch (err) {
      console.error(`E2E teardown: failed to drop ${this.dbName}:`, err);
    } finally {
      await adminPool.end();
    }
  }

  async createUserAndLogin(params: {
    email: string;
    password: string;
    name: string;
    role?: 'ADMIN' | 'BARISTA' | 'CLIENT';
  }): Promise<string> {
    const { email, password, name, role = 'CLIENT' } = params;

    const signUpRes = await request(this.app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Content-Type', 'application/json')
      .send({ email, password, name });

    if (signUpRes.status !== 200 && signUpRes.status !== 201) {
      throw new Error(`Sign-up failed (${signUpRes.status}): ${JSON.stringify(signUpRes.body)}`);
    }

    if (role !== 'CLIENT') {
      await this.suitePool.query(`UPDATE "user" SET role = $1 WHERE email = $2`, [role, email]);
    }

    const loginRes = await request(this.app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    if (!loginRes.body.token) {
      throw new Error(`Login failed (${loginRes.status}): ${JSON.stringify(loginRes.body)}`);
    }

    return loginRes.body.token as string;
  }

  private getAdminUrl(databaseUrl: string): string {
    const url = new URL(databaseUrl);
    url.pathname = '/postgres';
    return url.toString();
  }

  private buildSuiteUrl(originalUrl: string, dbName: string): string {
    const url = new URL(originalUrl);
    url.pathname = `/${dbName}`;
    return url.toString();
  }
}
