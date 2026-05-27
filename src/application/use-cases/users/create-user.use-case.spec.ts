import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../../domain/errors/domain.error';
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

    expect(result.isRight()).toBe(true);
    expect(result.value.name).toBe('Ana');
    expect(result.value.email).toBe('ana@example.com');
    expect(result.value.role).toBe('CLIENT');
    expect(userRepo.items).toHaveLength(1);
  });

  it('should return Left(ConflictError) if email already exists', async () => {
    await sut.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'senha123',
      role: 'CLIENT',
    });

    const result = await sut.execute({
      name: 'Outro',
      email: 'ana@example.com',
      password: 'outrasenha',
      role: 'ADMIN',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ConflictError);
  });
});
