import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import {
  InventoryMovement,
  type MovementType,
} from '../../../domain/entities/inventory-movement.entity';
import {
  type CreateMovementData,
  type FindMovementsFilters,
  IInventoryMovementRepository,
} from '../../../domain/repositories/inventory-movement.repository';
import { DrizzleService } from '../drizzle.service';
import { inventoryMovements } from '../schema';

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

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: InventoryMovement[]; total: number }> {
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

  async findMovements(
    filters: FindMovementsFilters,
  ): Promise<{ data: InventoryMovement[]; total: number }> {
    const { ingredientId, orderId, from, to, page, limit } = filters;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (ingredientId) conditions.push(eq(inventoryMovements.ingredientId, ingredientId));
    if (orderId) conditions.push(eq(inventoryMovements.orderId, orderId));
    if (from) conditions.push(gte(inventoryMovements.createdAt, from));
    if (to) conditions.push(lte(inventoryMovements.createdAt, to));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

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
