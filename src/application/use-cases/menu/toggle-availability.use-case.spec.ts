import { describe, it, expect, beforeEach } from '@jest/globals';
import { ToggleAvailabilityUseCase } from './toggle-availability.use-case.js';
import { InMemoryProductRepository } from '../../../test/repositories/in-memory-product.repository.js';

describe('ToggleAvailabilityUseCase', () => {
  let productRepo: InMemoryProductRepository;
  let sut: ToggleAvailabilityUseCase;

  beforeEach(() => {
    productRepo = new InMemoryProductRepository();
    sut = new ToggleAvailabilityUseCase(productRepo);
  });

  it('should toggle isAvailable from true to false', async () => {
    const product = await productRepo.create({
      categoryId: 'cat-1',
      name: 'Espresso',
      price: '5.50',
      isAvailable: true,
    });

    const result = await sut.execute(product.id);

    expect(result.isAvailable).toBe(false);
  });

  it('should toggle isAvailable from false to true', async () => {
    const product = await productRepo.create({
      categoryId: 'cat-1',
      name: 'Espresso',
      price: '5.50',
      isAvailable: false,
    });

    const result = await sut.execute(product.id);

    expect(result.isAvailable).toBe(true);
  });

  it('should throw NOT_FOUND if product does not exist', async () => {
    await expect(sut.execute('non-existent')).rejects.toThrow('Product not found');
  });
});
