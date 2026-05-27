import { Either, left, right } from '../../../domain/either';
import { User } from '../../../domain/entities/user.entity';
import { ConflictError } from '../../../domain/errors/domain.error';
import { CreateUserData, IUserRepository } from '../../../domain/repositories/user.repository';

export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: CreateUserData): Promise<Either<ConflictError, User>> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      return left(new ConflictError('Email already in use'));
    }

    const user = await this.userRepo.create(data);
    return right(user);
  }
}
