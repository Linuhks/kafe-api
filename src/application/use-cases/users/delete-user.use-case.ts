import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { IUserRepository } from '../../../domain/repositories/user.repository.js';

export class DeleteUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.userRepo.findById(id);
    if (!existing) throw new NotFoundError('User');

    await this.userRepo.delete(id);
  }
}
