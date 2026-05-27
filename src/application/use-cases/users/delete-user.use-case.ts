import { Either, left, right } from '../../../domain/either';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IUserRepository } from '../../../domain/repositories/user.repository';

export class DeleteUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<Either<NotFoundError, void>> {
    const existing = await this.userRepo.findById(id);
    if (!existing) return left(new NotFoundError('User'));

    await this.userRepo.delete(id);
    return right(undefined);
  }
}
