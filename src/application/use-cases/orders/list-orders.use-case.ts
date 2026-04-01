import type { Order } from '../../../domain/entities/order.entity.js';
import type {
  IOrderRepository,
  ListOrdersFilter,
} from '../../../domain/repositories/order.repository.js';

export class ListOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(filter: ListOrdersFilter): Promise<{ data: Order[]; total: number }> {
    return this.orderRepo.findAll(filter);
  }
}
