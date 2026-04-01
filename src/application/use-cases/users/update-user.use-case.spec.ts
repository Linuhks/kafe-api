import { beforeEach, describe, expect, it } from 'vitest';
import { User } from '../../../domain/entities/user.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user.repository.js';
import { UpdateUserUseCase } from './update-user.use-case.js';

describe('UpdateUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let sut: UpdateUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sut = new UpdateUserUseCase(userRepo);
  });

  it('should update only the provided fields', async () => {
    userRepo.items.push(
      new User('u-1', 'Maria', 'maria@example.com', 'CLIENT', true, new Date(), new Date()),
    );

    const result = await sut.execute('u-1', { role: 'BARISTA' });

    expect(result.name).toBe('Maria');
    expect(result.role).toBe('BARISTA');
    expect(result.email).toBe('maria@example.com');
  });

  it('should throw NotFoundError if user does not exist', async () => {
    await expect(sut.execute('non-existent', { name: 'X' })).rejects.toThrow(NotFoundError);
  });
});
