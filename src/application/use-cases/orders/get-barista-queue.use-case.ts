import { Order } from '../../../domain/entities/order.entity';
import { IOrderRepository } from '../../../domain/repositories/order.repository';

export class GetBaristaQueueUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orderRepo.findQueue();
  }
}
