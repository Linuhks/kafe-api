import { User } from '../../../domain/entities/user.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import {
  IUserRepository,
  UpdateUserData,
} from '../../../domain/repositories/user.repository.js';

export class UpdateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string, data: UpdateUserData): Promise<User> {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new NotFoundError('User');

    return this.userRepo.update(id, data);
  }
}
