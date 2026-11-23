import { User } from '../entities/user.entity';
import type { Email } from '../value-objects/email';

export interface CreateUserData {
  name: string;
  email: Email;
  password: string;
  role: string;
}

export interface UpdateUserData {
  name?: string;
  role?: string;
  isActive?: boolean;
}

export abstract class IUserRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract findAll(page: number, limit: number): Promise<{ data: User[]; total: number }>;
  abstract create(data: CreateUserData): Promise<User>;
  abstract update(id: string, data: UpdateUserData): Promise<User>;
  abstract delete(id: string): Promise<void>;
}
