import { InMemoryProductRepository } from '@test/repositories/in-memory-product.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteProductUseCase } from './delete-product.use-case';

describe('DeleteProductUseCase', () => {
  let productRepo: InMemoryProductRepository;
  let sut: DeleteProductUseCase;

  beforeEach(() => {
    productRepo = new InMemoryProductRepository();
    sut = new DeleteProductUseCase(productRepo);
  });

  it('should delete a product', async () => {
    const product = await productRepo.create({
      categoryId: 'cat-1',
      name: 'Espresso',
      price: '5.50',
    });

    const result = await sut.execute(product.id);

    expect(result.isRight()).toBe(true);
    expect(productRepo.items).toHaveLength(0);
  });

  it('should return Left(NotFoundError) if product does not exist', async () => {
    const result = await sut.execute('non-existent');

    expect(result.isLeft()).toBe(true);
    expect(result.value.message).toBe('Product not found');
  });
});
