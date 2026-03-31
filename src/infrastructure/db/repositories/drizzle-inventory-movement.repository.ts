import { Injectable } from '@nestjs/common';
import { eq, desc, count } from 'drizzle-orm';
import { DrizzleService } from '../drizzle.service.js';
import { inventoryMovements } from '../schema.js';
import { InventoryMovement, MovementType } from '../../../domain/entities/inventory-movement.entity.js';
import {
  IInventoryMovementRepository,
  CreateMovementData,
} from '../../../domain/repositories/inventory-movement.repository.js';

function mapToMovement(row: typeof inventoryMovements.$inferSelect): InventoryMovement {
  return new InventoryMovement(
    row.id,
    row.ingredientId,
    row.orderId,
    row.type as MovementType,
    row.quantity,
    row.note,
    row.createdAt,
  );
}

@Injectable()
export class DrizzleInventoryMovementRepository extends IInventoryMovementRepository {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  private get db() {
    return this.drizzleService.db;
  }

  async create(data: CreateMovementData): Promise<InventoryMovement> {
    const [row] = await this.db
      .insert(inventoryMovements)
      .values({
        ingredientId: data.ingredientId,
        orderId: data.orderId ?? null,
        type: data.type,
        quantity: data.quantity,
        note: data.note ?? null,
      })
      .returning();
    return mapToMovement(row);
  }

  async findAll(page: number, limit: number): Promise<{ data: InventoryMovement[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(inventoryMovements)
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(inventoryMovements),
    ]);
    return { data: rows.map(mapToMovement), total: Number(countRow.total) };
  }

  async findByIngredientId(
    ingredientId: string,
    page: number,
    limit: number,
  ): Promise<{ data: InventoryMovement[]; total: number }> {
    const offset = (page - 1) * limit;
    const where = eq(inventoryMovements.ingredientId, ingredientId);
    const [rows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(inventoryMovements)
        .where(where)
        .orderBy(desc(inventoryMovements.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(inventoryMovements).where(where),
    ]);
    return { data: rows.map(mapToMovement), total: Number(countRow.total) };
  }
}
