import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../../domain/errors/domain.error';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user.repository';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let sut: CreateUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sut = new CreateUserUseCase(userRepo);
  });

  it('should create a user and persist it', async () => {
    const result = await sut.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'senha123',
      role: 'CLIENT',
    });

    expect(result.name).toBe('Ana');
    expect(result.email).toBe('ana@example.com');
    expect(result.role).toBe('CLIENT');
    expect(userRepo.items).toHaveLength(1);
  });

  it('should throw ConflictError if email already exists', async () => {
    await sut.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'senha123',
      role: 'CLIENT',
    });

    await expect(
      sut.execute({
        name: 'Outro',
        email: 'ana@example.com',
        password: 'outrasenha',
        role: 'ADMIN',
      }),
    ).rejects.toThrow(ConflictError);
  });
});
