import { InMemoryProductRepository } from '@test/repositories/in-memory-product.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ToggleAvailabilityUseCase } from './toggle-availability.use-case';

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

    expect(result.isRight()).toBe(true);
    expect(result.value.isAvailable).toBe(false);
  });

  it('should toggle isAvailable from false to true', async () => {
    const product = await productRepo.create({
      categoryId: 'cat-1',
      name: 'Espresso',
      price: '5.50',
      isAvailable: false,
    });

    const result = await sut.execute(product.id);

    expect(result.isRight()).toBe(true);
    expect(result.value.isAvailable).toBe(true);
  });

  it('should return Left(NotFoundError) if product does not exist', async () => {
    const result = await sut.execute('non-existent');

    expect(result.isLeft()).toBe(true);
    expect(result.value.message).toBe('Product not found');
  });
});
