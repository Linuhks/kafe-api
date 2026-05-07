import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { InMemoryInventoryMovementRepository } from '@test/repositories/in-memory-inventory-movement.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { RestockIngredientUseCase } from './restock-ingredient.use-case';

describe('RestockIngredientUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let movementRepo: InMemoryInventoryMovementRepository;
  let sut: RestockIngredientUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    movementRepo = new InMemoryInventoryMovementRepository();
    sut = new RestockIngredientUseCase(ingredientRepo, movementRepo);
  });

  it('should increment currentStock by quantity', async () => {
    const ingredient = await ingredientRepo.create({
      name: 'Café',
      unit: 'g',
      currentStock: '500',
    });

    const result = await sut.execute(ingredient.id, '250');

    expect(parseFloat(result.currentStock)).toBeCloseTo(750);
  });

  it('should create a RESTOCK movement', async () => {
    const ingredient = await ingredientRepo.create({ name: 'Café', unit: 'g', currentStock: '0' });

    await sut.execute(ingredient.id, '100', 'Compra semanal');

    expect(movementRepo.items).toHaveLength(1);
    expect(movementRepo.items[0].type).toBe('RESTOCK');
    expect(movementRepo.items[0].quantity).toBe('100');
    expect(movementRepo.items[0].note).toBe('Compra semanal');
    expect(movementRepo.items[0].ingredientId).toBe(ingredient.id);
  });

  it('should throw NotFoundError if ingredient does not exist', async () => {
    await expect(sut.execute('non-existent', '100')).rejects.toThrow(NotFoundError);
  });
});
