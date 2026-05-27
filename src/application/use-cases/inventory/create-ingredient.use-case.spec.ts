import { InMemoryIngredientRepository } from '@test/repositories/in-memory-ingredient.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../../domain/errors/domain.error';
import { CreateIngredientUseCase } from './create-ingredient.use-case';

describe('CreateIngredientUseCase', () => {
  let ingredientRepo: InMemoryIngredientRepository;
  let sut: CreateIngredientUseCase;

  beforeEach(() => {
    ingredientRepo = new InMemoryIngredientRepository();
    sut = new CreateIngredientUseCase(ingredientRepo);
  });

  it('should create an ingredient and persist it', async () => {
    const result = await sut.execute({
      name: 'Café',
      unit: 'g',
      currentStock: '1000',
      minimumStock: '200',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value.name).toBe('Café');
    expect(result.value.unit).toBe('g');
    expect(result.value.currentStock).toBe('1000');
    expect(result.value.minimumStock).toBe('200');
    expect(ingredientRepo.items).toHaveLength(1);
  });

  it('should return Left(ConflictError) if name already exists', async () => {
    await sut.execute({ name: 'Café', unit: 'g' });

    const result = await sut.execute({ name: 'Café', unit: 'kg' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ConflictError);
  });
});
