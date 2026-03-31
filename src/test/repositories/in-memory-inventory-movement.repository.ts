import { InventoryMovement } from '../../domain/entities/inventory-movement.entity.js';
import {
  IInventoryMovementRepository,
  CreateMovementData,
  FindMovementsFilters,
} from '../../domain/repositories/inventory-movement.repository.js';

export class InMemoryInventoryMovementRepository extends IInventoryMovementRepository {
  items: InventoryMovement[] = [];
  private counter = 0;

  async create(data: CreateMovementData): Promise<InventoryMovement> {
    const movement = new InventoryMovement(
      `mov-${++this.counter}`,
      data.ingredientId,
      data.orderId ?? null,
      data.type,
      data.quantity,
      data.note ?? null,
      new Date(),
    );
    this.items.push(movement);
    return movement;
  }

  async findAll(page: number, limit: number): Promise<{ data: InventoryMovement[]; total: number }> {
    const start = (page - 1) * limit;
    return { data: this.items.slice(start, start + limit), total: this.items.length };
  }

  async findByIngredientId(
    ingredientId: string,
    page: number,
    limit: number,
  ): Promise<{ data: InventoryMovement[]; total: number }> {
    const filtered = this.items.filter((m) => m.ingredientId === ingredientId);
    const start = (page - 1) * limit;
    return { data: filtered.slice(start, start + limit), total: filtered.length };
  }

  async findMovements(filters: FindMovementsFilters): Promise<{ data: InventoryMovement[]; total: number }> {
    const { ingredientId, orderId, from, to, page, limit } = filters;
    let filtered = this.items;
    if (ingredientId) filtered = filtered.filter((m) => m.ingredientId === ingredientId);
    if (orderId) filtered = filtered.filter((m) => m.orderId === orderId);
    if (from) filtered = filtered.filter((m) => m.createdAt >= from);
    if (to) filtered = filtered.filter((m) => m.createdAt <= to);
    const start = (page - 1) * limit;
    return { data: filtered.slice(start, start + limit), total: filtered.length };
  }
}
