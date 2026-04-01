import type { User } from '../../../domain/entities/user.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.js';

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }
}
