import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as authSchema from './auth-schema';
import * as schema from './schema';

export type DrizzleDB = NodePgDatabase<typeof schema>;
export type AuthDrizzleDB = NodePgDatabase<typeof authSchema>;

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private _pool: Pool;
  private readonly baseDb: DrizzleDB;
  private readonly txStore = new AsyncLocalStorage<DrizzleDB>();
  readonly authDb: AuthDrizzleDB;

  constructor(private readonly config: ConfigService) {
    this._pool = new Pool({
      connectionString: this.config.getOrThrow<string>('DATABASE_URL'),
    });
    this.baseDb = drizzle(this._pool, { schema });
    this.authDb = drizzle(this._pool, { schema: authSchema });
  }

  /** The active transaction when called inside `runInTransaction`, otherwise the base instance. */
  get db(): DrizzleDB {
    return this.txStore.getStore() ?? this.baseDb;
  }

  async runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.txStore.getStore()) return fn();
    return this.baseDb.transaction((tx) => this.txStore.run(tx as unknown as DrizzleDB, fn));
  }

  async onModuleDestroy() {
    await this._pool.end();
  }
}
