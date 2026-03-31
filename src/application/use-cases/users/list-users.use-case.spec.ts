import { describe, it, expect, beforeEach } from 'vitest';
import { ListUsersUseCase } from './list-users.use-case.js';
import { InMemoryUserRepository } from '../../../test/repositories/in-memory-user.repository.js';
import { User } from '../../../domain/entities/user.entity.js';

const makeUser = (id: string, name: string) =>
  new User(id, name, `${name.toLowerCase()}@example.com`, 'CLIENT', true, new Date(), new Date());

describe('ListUsersUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let sut: ListUsersUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sut = new ListUsersUseCase(userRepo);
  });

  it('should return paginated list with total', async () => {
    userRepo.items.push(makeUser('u-1', 'Alice'), makeUser('u-2', 'Bob'), makeUser('u-3', 'Carol'));

    const result = await sut.execute({ page: 1, limit: 10 });

    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should return correct slice for page 2', async () => {
    userRepo.items.push(makeUser('u-1', 'Alice'), makeUser('u-2', 'Bob'), makeUser('u-3', 'Carol'));

    const result = await sut.execute({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Carol');
    expect(result.total).toBe(3);
  });
});
