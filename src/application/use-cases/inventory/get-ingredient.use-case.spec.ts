import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { InMemoryIngredientRepository } from '../../../test/repositories/in-memory-ingredient.repository';
import { GetIngredientUseCase } from './get-ingredient.use-case';

describe('GetIngredientUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let sut: GetIngredientUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    sut = new GetIngredientUseCase(ingredientRepo);
  });

  it('should return ingredient by ID', async () => {
    const ingredient = await ingredientRepo.create({ name: 'Leite', unit: 'ml' });

    const result = await sut.execute(ingredient.id);

    expect(result.id).toBe(ingredient.id);
    expect(result.name).toBe('Leite');
  });

  it('should throw NotFoundError for unknown ID', async () => {
    await expect(sut.execute('non-existent')).rejects.toThrow(NotFoundError);
  });
});
