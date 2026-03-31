import { describe, it, expect, beforeEach } from '@jest/globals';
import { CreateCategoryUseCase } from './create-category.use-case.js';
import { InMemoryCategoryRepository } from '../../../test/repositories/in-memory-category.repository.js';

describe('CreateCategoryUseCase', () => {
  let categoryRepo: InMemoryCategoryRepository;
  let sut: CreateCategoryUseCase;

  beforeEach(() => {
    categoryRepo = new InMemoryCategoryRepository();
    sut = new CreateCategoryUseCase(categoryRepo);
  });

  it('should create a category', async () => {
    const result = await sut.execute({ name: 'Cafés', sortOrder: 1 });

    expect(result.name).toBe('Cafés');
    expect(result.isActive).toBe(true);
    expect(categoryRepo.items).toHaveLength(1);
  });

  it('should throw CONFLICT if name already in use', async () => {
    await sut.execute({ name: 'Cafés' });

    await expect(sut.execute({ name: 'Cafés' })).rejects.toThrow('Category name already in use');
  });
});
