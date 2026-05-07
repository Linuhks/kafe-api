import { User } from '../../../domain/entities/user.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IUserRepository } from '../../../domain/repositories/user.repository';

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) throw new NotFoundError('User');
    return user;
  }
}
