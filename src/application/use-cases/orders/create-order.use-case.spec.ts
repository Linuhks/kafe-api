import { InMemoryOrderRepository } from '@test/repositories/in-memory-order.repository';
import { InMemoryProductRepository } from '@test/repositories/in-memory-product.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateOrderUseCase } from './create-order.use-case';

describe('CreateOrderUseCase', () => {
  let orderRepo: InMemoryOrderRepository;
  let productRepo: InMemoryProductRepository;
  let sut: CreateOrderUseCase;

  beforeEach(() => {
    orderRepo = new InMemoryOrderRepository();
    productRepo = new InMemoryProductRepository();
    sut = new CreateOrderUseCase(orderRepo, productRepo);
  });

  it('should create an order with price/name snapshot and correct totalAmount', async () => {
    await productRepo.create({ categoryId: 'cat-1', name: 'Espresso', price: '5.50' });
    await productRepo.create({ categoryId: 'cat-1', name: 'Latte', price: '7.00' });
    const [p1, p2] = productRepo.items;

    const result = await sut.execute({
      clientName: 'João',
      items: [
        { productId: p1.id, quantity: 2 },
        { productId: p2.id, quantity: 1 },
      ],
    });

    expect(result.totalAmount).toBe('18.00');
    expect(result.items).toHaveLength(2);
    expect(result.items[0].productName).toBe('Espresso');
    expect(result.items[0].unitPrice).toBe('5.50');
    expect(result.items[0].subtotal).toBe('11.00');
    expect(result.status).toBe('RECEIVED');
  });

  it('should throw NOT_FOUND if product does not exist', async () => {
    await expect(
      sut.execute({ items: [{ productId: 'non-existent', quantity: 1 }] }),
    ).rejects.toThrow('not found');
  });
});
