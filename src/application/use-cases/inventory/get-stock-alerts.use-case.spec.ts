import { beforeEach, describe, expect, it } from 'vitest';
import { Ingredient } from '../../../domain/entities/ingredient.entity.js';
import { InMemoryIngredientRepository } from '../../../test/repositories/in-memory-ingredient.repository.js';
import { GetStockAlertsUseCase } from './get-stock-alerts.use-case.js';

describe('GetStockAlertsUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let sut: GetStockAlertsUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    sut = new GetStockAlertsUseCase(ingredientRepo);
  });

  it('should return only ingredients where currentStock < minimumStock', async () => {
    ingredientRepo.items.push(
      new Ingredient('ing-1', 'Café', 'g', '50', '100', new Date(), new Date()),
      new Ingredient('ing-2', 'Leite', 'ml', '500', '200', new Date(), new Date()),
      new Ingredient('ing-3', 'Açúcar', 'g', '10', '50', new Date(), new Date()),
    );

    const result = await sut.execute();

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.name)).toEqual(expect.arrayContaining(['Café', 'Açúcar']));
  });

  it('should return empty array when all stock is sufficient', async () => {
    ingredientRepo.items.push(
      new Ingredient('ing-1', 'Café', 'g', '500', '100', new Date(), new Date()),
      new Ingredient('ing-2', 'Leite', 'ml', '1000', '200', new Date(), new Date()),
    );

    const result = await sut.execute();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when there are no ingredients', async () => {
    const result = await sut.execute();

    expect(result).toHaveLength(0);
  });
});
