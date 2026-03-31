import { Ingredient } from '../../domain/entities/ingredient.entity.js';
import {
  IIngredientRepository,
  CreateIngredientData,
  UpdateIngredientData,
  ProductIngredientRow,
} from '../../domain/repositories/ingredient.repository.js';

export class InMemoryIngredientRepository extends IIngredientRepository {
  items: Ingredient[] = [];
  recipes: { productId: string; ingredientId: string; quantity: string }[] = [];
  private counter = 0;

  async findById(id: string): Promise<Ingredient | null> {
    return this.items.find((i) => i.id === id) ?? null;
  }

  async findAll(page: number, limit: number): Promise<{ data: Ingredient[]; total: number }> {
    const start = (page - 1) * limit;
    return { data: this.items.slice(start, start + limit), total: this.items.length };
  }

  async create(data: CreateIngredientData): Promise<Ingredient> {
    const ingredient = new Ingredient(
      `ing-${++this.counter}`,
      data.name,
      data.unit,
      data.currentStock ?? '0',
      data.minimumStock ?? '0',
      new Date(),
      new Date(),
    );
    this.items.push(ingredient);
    return ingredient;
  }

  async update(id: string, data: UpdateIngredientData): Promise<Ingredient> {
    const idx = this.items.findIndex((i) => i.id === id);
    const existing = this.items[idx];
    const updated = new Ingredient(
      existing.id,
      data.name ?? existing.name,
      data.unit ?? existing.unit,
      existing.currentStock,
      data.minimumStock ?? existing.minimumStock,
      existing.createdAt,
      new Date(),
    );
    this.items[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.items = this.items.filter((i) => i.id !== id);
  }

  async deductStock(id: string, quantity: string): Promise<Ingredient> {
    const idx = this.items.findIndex((i) => i.id === id);
    const existing = this.items[idx];
    const newStock = (parseFloat(existing.currentStock) - parseFloat(quantity)).toFixed(3);
    const updated = new Ingredient(
      existing.id,
      existing.name,
      existing.unit,
      newStock,
      existing.minimumStock,
      existing.createdAt,
      new Date(),
    );
    this.items[idx] = updated;
    return updated;
  }

  async restockIngredient(id: string, quantity: string): Promise<Ingredient> {
    const idx = this.items.findIndex((i) => i.id === id);
    const existing = this.items[idx];
    const newStock = (parseFloat(existing.currentStock) + parseFloat(quantity)).toFixed(3);
    const updated = new Ingredient(
      existing.id,
      existing.name,
      existing.unit,
      newStock,
      existing.minimumStock,
      existing.createdAt,
      new Date(),
    );
    this.items[idx] = updated;
    return updated;
  }

  async findRecipeByProductId(productId: string): Promise<ProductIngredientRow[]> {
    return this.recipes
      .filter((r) => r.productId === productId)
      .map((r) => ({ ingredientId: r.ingredientId, quantity: r.quantity }));
  }

  async findByName(name: string): Promise<Ingredient | null> {
    return this.items.find((i) => i.name === name) ?? null;
  }

  async findLowStock(): Promise<Ingredient[]> {
    return this.items.filter((i) => parseFloat(i.currentStock) < parseFloat(i.minimumStock));
  }
}
