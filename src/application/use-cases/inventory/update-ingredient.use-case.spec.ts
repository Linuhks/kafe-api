import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { InMemoryIngredientRepository } from '../../../test/repositories/in-memory-ingredient.repository.js';
import { UpdateIngredientUseCase } from './update-ingredient.use-case.js';

describe('UpdateIngredientUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let sut: UpdateIngredientUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    sut = new UpdateIngredientUseCase(ingredientRepo);
  });

  it('should update ingredient fields and return updated ingredient', async () => {
    const ingredient = await ingredientRepo.create({
      name: 'Açúcar',
      unit: 'g',
      minimumStock: '100',
    });

    const result = await sut.execute(ingredient.id, {
      name: 'Açúcar Refinado',
      minimumStock: '200',
    });

    expect(result.name).toBe('Açúcar Refinado');
    expect(result.minimumStock).toBe('200');
    expect(result.id).toBe(ingredient.id);
  });

  it('should throw NotFoundError for unknown ID', async () => {
    await expect(sut.execute('non-existent', { name: 'X' })).rejects.toThrow(NotFoundError);
  });
});
