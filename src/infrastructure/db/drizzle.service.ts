import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './auth-schema.js';
import * as schema from './schema.js';

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
