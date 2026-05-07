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

    await sut.execute(product.id);

    expect(productRepo.items).toHaveLength(0);
  });

  it('should throw NOT_FOUND if product does not exist', async () => {
    await expect(sut.execute('non-existent')).rejects.toThrow('Product not found');
  });
});
