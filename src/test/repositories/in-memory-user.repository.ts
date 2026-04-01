import { User } from '../../domain/entities/user.entity.js';
import {
  type CreateUserData,
  IUserRepository,
  type UpdateUserData,
} from '../../domain/repositories/user.repository.js';

export class InMemoryUserRepository extends IUserRepository {
  items: User[] = [];
  private counter = 0;

  async findById(id: string): Promise<User | null> {
    return this.items.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((u) => u.email === email) ?? null;
  }

  async findAll(page: number, limit: number): Promise<{ data: User[]; total: number }> {
    const start = (page - 1) * limit;
    return {
      data: this.items.slice(start, start + limit),
      total: this.items.length,
    };
  }

  async create(data: CreateUserData): Promise<User> {
    const user = new User(
      `user-${++this.counter}`,
      data.name,
      data.email,
      data.role,
      true,
      new Date(),
      new Date(),
    );
    this.items.push(user);
    return user;
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const idx = this.items.findIndex((u) => u.id === id);
    const existing = this.items[idx];
    const updated = new User(
      existing.id,
      data.name ?? existing.name,
      existing.email,
      data.role ?? existing.role,
      data.isActive ?? existing.isActive,
      existing.createdAt,
      new Date(),
    );
    this.items[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((u) => u.id !== id);
  }
}
