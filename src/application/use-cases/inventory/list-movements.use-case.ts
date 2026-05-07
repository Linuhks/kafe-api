import { InventoryMovement } from '../../../domain/entities/inventory-movement.entity';
import {
  FindMovementsFilters,
  IInventoryMovementRepository,
} from '../../../domain/repositories/inventory-movement.repository';

export interface ListMovementsDto {
  ingredientId?: string;
  orderId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface ListMovementsResult {
  data: InventoryMovement[];
  total: number;
}

export class ListMovementsUseCase {
  constructor(private readonly movementRepo: IInventoryMovementRepository) {}

  async execute(dto: ListMovementsDto): Promise<ListMovementsResult> {
    const filters: FindMovementsFilters = {
      ingredientId: dto.ingredientId,
      orderId: dto.orderId,
      from: dto.from,
      to: dto.to,
      page: dto.page,
      limit: dto.limit,
    };
    return this.movementRepo.findMovements(filters);
  }
}
