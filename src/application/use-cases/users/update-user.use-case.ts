import { Either, left, right } from '../../../domain/either';
import { User } from '../../../domain/entities/user.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IUserRepository, UpdateUserData } from '../../../domain/repositories/user.repository';

export class UpdateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string, data: UpdateUserData): Promise<Either<NotFoundError, User>> {
    const existing = await this.userRepo.findById(id);
    if (!existing) return left(new NotFoundError('User'));

    const updated = await this.userRepo.update(id, data);
    return right(updated);
  }
}
