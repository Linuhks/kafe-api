import { Order } from '../../../domain/entities/order.entity';
import { IOrderRepository } from '../../../domain/repositories/order.repository';

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
