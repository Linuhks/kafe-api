import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, InvalidEmailError } from '../../../domain/errors/domain.error';
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

  it('should return Left(InvalidEmailError) and persist nothing for an invalid email', async () => {
    const result = await sut.execute({
      name: 'Ana',
      email: 'ana.example.com',
      password: 'senha123',
      role: 'CLIENT',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidEmailError);
    expect(userRepo.items).toHaveLength(0);
  });

  it('should store the email trimmed and lowercased', async () => {
    const result = await sut.execute({
      name: 'Ana',
      email: '  Ana@Example.com ',
      password: 'senha123',
      role: 'CLIENT',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toMatchObject({ email: 'ana@example.com' });
    expect(userRepo.items[0].email).toBe('ana@example.com');
  });

  it('should return Left(ConflictError) for an email that differs only by case', async () => {
    await sut.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'senha123',
      role: 'CLIENT',
    });

    const result = await sut.execute({
      name: 'Outra Ana',
      email: 'ANA@Example.com',
      password: 'outrasenha',
      role: 'CLIENT',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ConflictError);
    expect(userRepo.items).toHaveLength(1);
  });
});
