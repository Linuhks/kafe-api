export type MovementType = 'DEDUCTION' | 'RESTOCK' | 'ADJUSTMENT';

export class InventoryMovement {
  constructor(
    public readonly id: string,
    public readonly ingredientId: string,
    public readonly orderId: string | null,
    public readonly type: MovementType,
    public readonly quantity: string,
    public readonly note: string | null,
    public readonly createdAt: Date,
  ) {}
}
