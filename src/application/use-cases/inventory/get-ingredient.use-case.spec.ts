import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../domain/errors/domain.error';
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

    expect(result.isRight()).toBe(true);
    expect(result.value.id).toBe(ingredient.id);
    expect(result.value.name).toBe('Leite');
  });

  it('should return Left(NotFoundError) for unknown ID', async () => {
    const result = await sut.execute('non-existent');

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
  });
});
