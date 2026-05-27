import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { User } from '../../../domain/entities/user.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { UpdateUserUseCase } from './update-user.use-case';

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

    expect(result.isRight()).toBe(true);
    expect(result.value.name).toBe('Maria');
    expect(result.value.role).toBe('BARISTA');
    expect(result.value.email).toBe('maria@example.com');
  });

  it('should return Left(NotFoundError) if user does not exist', async () => {
    const result = await sut.execute('non-existent', { name: 'X' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
  });
});
