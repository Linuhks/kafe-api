import type { Order } from '../../../domain/entities/order.entity.js';
import type { IOrderRepository } from '../../../domain/repositories/order.repository.js';

export class GetMyOrdersUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(
    clientId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Order[]; total: number }> {
    return this.orderRepo.findByClientId(clientId, page, limit);
  }
}
