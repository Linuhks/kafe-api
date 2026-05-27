import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { User } from '../../../domain/entities/user.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { DeleteUserUseCase } from './delete-user.use-case';

describe('DeleteUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let sut: DeleteUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sut = new DeleteUserUseCase(userRepo);
  });

  it('should remove the user from repository', async () => {
    userRepo.items.push(
      new User('u-1', 'Pedro', 'pedro@example.com', 'CLIENT', true, new Date(), new Date()),
    );

    const result = await sut.execute('u-1');

    expect(result.isRight()).toBe(true);
    expect(userRepo.items).toHaveLength(0);
  });

  it('should return Left(NotFoundError) if user does not exist', async () => {
    const result = await sut.execute('non-existent');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
  });
});
