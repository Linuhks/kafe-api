import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, admin } from 'better-auth/plugins';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/auth-schema.js';

// Instância de DB dedicada ao better-auth (fora do DI do NestJS)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: false,
  },

  plugins: [
    bearer(), // suporte a Bearer token — ideal para API REST
    admin(), // setRole, ban/unban, listUsers, impersonation
  ],

  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'CLIENT', required: true },
      isActive: { type: 'boolean', defaultValue: true },
    },
  },
});

export type Auth = typeof auth;
