import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, bearer } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/auth-schema';

// Instância de DB dedicada ao better-auth (fora do DI do NestJS)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// Prevent unhandled 'error' events (e.g. when connection is terminated externally)
pool.on('error', () => {});
const db = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    autoSignIn: false,
  },

  plugins: [
    bearer(), // suporte a Bearer token — ideal para API REST
    admin(), // setRole, ban/unban, listUsers, impersonation
  ],

  advanced: {
    cookies: {
      session_token: { attributes: { sameSite: 'strict', httpOnly: true } },
    },
  },

  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'CLIENT', required: true },
      isActive: { type: 'boolean', defaultValue: true },
    },
  },
});

export type Auth = typeof auth;
