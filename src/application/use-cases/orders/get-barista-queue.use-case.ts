import { Order } from '../../../domain/entities/order.entity.js';
import { IOrderRepository } from '../../../domain/repositories/order.repository.js';

export class GetBaristaQueueUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orderRepo.findQueue();
  }
}
