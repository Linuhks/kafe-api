import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { UpdateIngredientUseCase } from './update-ingredient.use-case';

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

    expect(result.isRight()).toBe(true);
    expect(result.value.name).toBe('Açúcar Refinado');
    expect(result.value.minimumStock).toBe('200');
    expect(result.value.id).toBe(ingredient.id);
  });

  it('should return Left(NotFoundError) for unknown ID', async () => {
    const result = await sut.execute('non-existent', { name: 'X' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundError);
  });
});
