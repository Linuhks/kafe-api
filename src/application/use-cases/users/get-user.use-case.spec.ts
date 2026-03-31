import { describe, it, expect, beforeEach } from '@jest/globals';
import { GetUserUseCase } from './get-user.use-case.js';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user.repository.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { User } from '../../../domain/entities/user.entity.js';

describe('GetUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let sut: GetUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sut = new GetUserUseCase(userRepo);
  });

  it('should return the user by id', async () => {
    userRepo.items.push(
      new User('u-1', 'Carlos', 'carlos@example.com', 'BARISTA', true, new Date(), new Date()),
    );

    const result = await sut.execute('u-1');

    expect(result.id).toBe('u-1');
    expect(result.name).toBe('Carlos');
  });

  it('should throw NotFoundError if user does not exist', async () => {
    await expect(sut.execute('non-existent')).rejects.toThrow(NotFoundError);
  });
});
