import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCategoryUseCase } from './create-category.use-case';

describe('CreateCategoryUseCase', () => {
  let categoryRepo: InMemoryCategoryRepository;
  let sut: CreateCategoryUseCase;

  beforeEach(() => {
    categoryRepo = new InMemoryCategoryRepository();
    sut = new CreateCategoryUseCase(categoryRepo);
  });

  it('should create a category', async () => {
    const result = await sut.execute({ name: 'Cafés', sortOrder: 1 });

    expect(result.isRight()).toBe(true);
    expect(result.value.name).toBe('Cafés');
    expect(result.value.isActive).toBe(true);
    expect(categoryRepo.items).toHaveLength(1);
  });

  it('should return Left(ConflictError) if name already in use', async () => {
    await sut.execute({ name: 'Cafés' });

    const result = await sut.execute({ name: 'Cafés' });

    expect(result.isLeft()).toBe(true);
    expect(result.value.message).toBe('Category name already in use');
  });
});
