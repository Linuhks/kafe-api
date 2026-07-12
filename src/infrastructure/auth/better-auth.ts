import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import { admin, bearer } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
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
      // input: false — servidor-controlado; impede escalonamento de privilégio via
      // POST /api/auth/sign-up/email enviando role/isActive no corpo da requisição.
      role: { type: 'string', defaultValue: 'CLIENT', required: true, input: false },
      isActive: { type: 'boolean', defaultValue: true, input: false },
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Bloqueia autenticação de usuários desativados no ponto de criação de
        // sessão — cobre tanto /api/v1/auth/login quanto a rota nativa
        // /api/auth/sign-in/email do better-auth.
        before: async (session) => {
          const rows = await db
            .select({ isActive: schema.user.isActive })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId))
            .limit(1);
          if (rows[0]?.isActive === false) {
            throw new APIError('UNAUTHORIZED', { message: 'Account is deactivated' });
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;
