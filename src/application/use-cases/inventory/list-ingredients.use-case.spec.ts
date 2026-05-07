import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListIngredientsUseCase } from './list-ingredients.use-case';

describe('ListIngredientsUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let sut: ListIngredientsUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    sut = new ListIngredientsUseCase(ingredientRepo);
  });

  it('should return paginated list with total count', async () => {
    await ingredientRepo.create({ name: 'Café', unit: 'g' });
    await ingredientRepo.create({ name: 'Leite', unit: 'ml' });
    await ingredientRepo.create({ name: 'Açúcar', unit: 'g' });

    const result = await sut.execute(1, 10);

    expect(result.data).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should respect page and limit for offset slicing', async () => {
    await ingredientRepo.create({ name: 'Café', unit: 'g' });
    await ingredientRepo.create({ name: 'Leite', unit: 'ml' });
    await ingredientRepo.create({ name: 'Açúcar', unit: 'g' });

    const result = await sut.execute(2, 2);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Açúcar');
    expect(result.total).toBe(3);
  });

  it('should return empty list when no ingredients', async () => {
    const result = await sut.execute(1, 10);

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
