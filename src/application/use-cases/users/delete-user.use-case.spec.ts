import { beforeEach, describe, expect, it } from 'vitest';
import { User } from '../../../domain/entities/user.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user.repository';
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

    await sut.execute('u-1');

    expect(userRepo.items).toHaveLength(0);
  });

  it('should throw NotFoundError if user does not exist', async () => {
    await expect(sut.execute('non-existent')).rejects.toThrow(NotFoundError);
  });
});
