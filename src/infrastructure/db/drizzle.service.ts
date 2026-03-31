import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as authSchema from './auth-schema.js';

export type DrizzleDB = NodePgDatabase<typeof schema>;
export type AuthDrizzleDB = NodePgDatabase<typeof authSchema>;

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private _pool: Pool;
  readonly db: DrizzleDB;
  readonly authDb: AuthDrizzleDB;

  constructor(private readonly config: ConfigService) {
    this._pool = new Pool({
      connectionString: this.config.getOrThrow<string>('DATABASE_URL'),
    });
    this.db = drizzle(this._pool, { schema });
    this.authDb = drizzle(this._pool, { schema: authSchema });
  }

  async onModuleDestroy() {
    await this._pool.end();
  }
}
