import { Order } from '../../../domain/entities/order.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { IOrderRepository } from '../../../domain/repositories/order.repository.js';

export class GetOrderUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundError('Order');
    return order;
  }
}
