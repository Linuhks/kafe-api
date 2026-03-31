import { InventoryMovement, MovementType } from '../entities/inventory-movement.entity.js';

export interface CreateMovementData {
  ingredientId: string;
  orderId?: string;
  type: MovementType;
  quantity: string;
  note?: string;
}

export interface FindMovementsFilters {
  ingredientId?: string;
  orderId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export abstract class IInventoryMovementRepository {
  abstract create(data: CreateMovementData): Promise<InventoryMovement>;
  abstract findAll(page: number, limit: number): Promise<{ data: InventoryMovement[]; total: number }>;
  abstract findByIngredientId(ingredientId: string, page: number, limit: number): Promise<{ data: InventoryMovement[]; total: number }>;
  abstract findMovements(filters: FindMovementsFilters): Promise<{ data: InventoryMovement[]; total: number }>;
}
