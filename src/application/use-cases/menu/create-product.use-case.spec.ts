import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository';
import { InMemoryProductRepository } from '@test/repositories/in-memory-product.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateProductUseCase } from './create-product.use-case';

describe('CreateProductUseCase', () => {
  let productRepo: InMemoryProductRepository;
  let categoryRepo: InMemoryCategoryRepository;
  let sut: CreateProductUseCase;

  beforeEach(() => {
    productRepo = new InMemoryProductRepository();
    categoryRepo = new InMemoryCategoryRepository();
    sut = new CreateProductUseCase(productRepo, categoryRepo);
  });

  it('should create a product', async () => {
    const category = await categoryRepo.create({ name: 'Cafés' });

    const result = await sut.execute({
      categoryId: category.id,
      name: 'Espresso',
      price: '5.50',
      isAvailable: true,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value.name).toBe('Espresso');
    expect(result.value.price).toBe('5.50');
    expect(productRepo.items).toHaveLength(1);
  });

  it('should return Left(NotFoundError) if category does not exist', async () => {
    const result = await sut.execute({ categoryId: 'non-existent', name: 'X', price: '1.00' });

    expect(result.isLeft()).toBe(true);
    expect(result.value.message).toBe('Category not found');
  });
});
