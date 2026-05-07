import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../../domain/errors/domain.error';
import { InMemoryIngredientRepository } from '../../../test/repositories/in-memory-ingredient.repository';
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

    expect(result.name).toBe('Café');
    expect(result.unit).toBe('g');
    expect(result.currentStock).toBe('1000');
    expect(result.minimumStock).toBe('200');
    expect(ingredientRepo.items).toHaveLength(1);
  });

  it('should throw ConflictError if name already exists', async () => {
    await sut.execute({ name: 'Café', unit: 'g' });

    await expect(sut.execute({ name: 'Café', unit: 'kg' })).rejects.toThrow(ConflictError);
  });
});
