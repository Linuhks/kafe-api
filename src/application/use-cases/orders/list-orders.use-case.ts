import { Order } from '../../../domain/entities/order.entity';
import {
  IOrderRepository,
  ListOrdersFilter,
} from '../../../domain/repositories/order.repository';

export class ListOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(filter: ListOrdersFilter): Promise<{ data: Order[]; total: number }> {
    return this.orderRepo.findAll(filter);
  }
}
