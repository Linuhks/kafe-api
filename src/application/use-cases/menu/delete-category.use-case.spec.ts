import { InMemoryCategoryRepository } from '@test/repositories/in-memory-category.repository';
import { InMemoryProductRepository } from '@test/repositories/in-memory-product.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteCategoryUseCase } from './delete-category.use-case';

describe('DeleteCategoryUseCase', () => {
  let categoryRepo: InMemoryCategoryRepository;
  let productRepo: InMemoryProductRepository;
  let sut: DeleteCategoryUseCase;

  beforeEach(() => {
    categoryRepo = new InMemoryCategoryRepository();
    productRepo = new InMemoryProductRepository();
    sut = new DeleteCategoryUseCase(categoryRepo, productRepo);
  });

  it('should delete a category without products', async () => {
    const category = await categoryRepo.create({ name: 'Coffees' });

    const result = await sut.execute(category.id);

    expect(result.isRight()).toBe(true);
    expect(categoryRepo.items).toHaveLength(0);
  });

  it('should return Left(NotFoundError) if the category does not exist', async () => {
    const result = await sut.execute('non-existent');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toMatchObject({ statusCode: 404 });
  });

  it('should return Left(ConflictError) and keep the category when it has products', async () => {
    const category = await categoryRepo.create({ name: 'Coffees' });
    await productRepo.create({ categoryId: category.id, name: 'Espresso', price: '5.50' });

    const result = await sut.execute(category.id);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toMatchObject({ statusCode: 409 });
    expect(categoryRepo.items).toHaveLength(1);
  });
});
