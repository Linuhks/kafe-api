import { User } from '../../../domain/entities/user.entity.js';
import { ConflictError } from '../../../domain/errors/domain.error.js';
import {
  CreateUserData,
  IUserRepository,
} from '../../../domain/repositories/user.repository.js';

export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: CreateUserData): Promise<User> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already in use');
    }

    return this.userRepo.create(data);
  }
}
