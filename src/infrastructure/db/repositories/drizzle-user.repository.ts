import { Injectable } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { count, eq } from 'drizzle-orm';
import { User } from '../../../domain/entities/user.entity';
import {
  type CreateUserData,
  IUserRepository,
  type UpdateUserData,
} from '../../../domain/repositories/user.repository';
import { account as accountTable, user as userTable } from '../auth-schema';
import { DrizzleService } from '../drizzle.service';

function mapToUser(row: typeof userTable.$inferSelect): User {
  return new User(
    row.id,
    row.name,
    row.email,
    row.role,
    row.isActive ?? true,
    row.createdAt,
    row.updatedAt,
  );
}

@Injectable()
export class DrizzleUserRepository extends IUserRepository {
  private readonly db: DrizzleService['authDb'];

  constructor(readonly drizzleService: DrizzleService) {
    super();
    this.db = drizzleService.authDb;
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(userTable).where(eq(userTable.id, id)).limit(1);
    return rows[0] ? mapToUser(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
    return rows[0] ? mapToUser(rows[0]) : null;
  }

  async findAll(page: number, limit: number): Promise<{ data: User[]; total: number }> {
    const offset = (page - 1) * limit;

    const [rows, [countRow]] = await Promise.all([
      this.db.select().from(userTable).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(userTable),
    ]);

    return {
      data: rows.map(mapToUser),
      total: Number(countRow.total),
    };
  }

  async create(data: CreateUserData): Promise<User> {
    const id = crypto.randomUUID();
    const hashedPwd = await hashPassword(data.password);
    const now = new Date();

    await this.db.transaction(async (tx) => {
      await tx.insert(userTable).values({
        id,
        name: data.name,
        email: data.email,
        emailVerified: false,
        role: data.role,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(accountTable).values({
        id: crypto.randomUUID(),
        accountId: id,
        providerId: 'credential',
        userId: id,
        password: hashedPwd,
        createdAt: now,
        updatedAt: now,
      });
    });

    return this.findById(id) as Promise<User>;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const values: Partial<typeof userTable.$inferInsert> = {};
    if (data.name !== undefined) values.name = data.name;
    if (data.role !== undefined) values.role = data.role;
    if (data.isActive !== undefined) values.isActive = data.isActive;

    await this.db
      .update(userTable)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(userTable.id, id));

    return this.findById(id) as Promise<User>;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(userTable).where(eq(userTable.id, id));
  }
}
