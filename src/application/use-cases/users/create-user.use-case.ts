import { Either, left, right } from '../../../domain/either';
import { User } from '../../../domain/entities/user.entity';
import { ConflictError, InvalidEmailError } from '../../../domain/errors/domain.error';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { Email } from '../../../domain/value-objects/email';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<Either<InvalidEmailError | ConflictError, User>> {
    const emailResult = Email.create(input.email);
    if (emailResult.isLeft()) {
      return emailResult;
    }
    const email = emailResult.value;

    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      return left(new ConflictError('Email already in use'));
    }

    const user = await this.userRepo.create({ ...input, email });
    return right(user);
  }
}
