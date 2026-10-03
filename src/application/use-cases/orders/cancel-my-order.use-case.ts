import { Either, left } from '../../../domain/either';
import { Order } from '../../../domain/entities/order.entity';
import {
  DomainError,
  InvalidOrderTransitionError,
  NotFoundError,
} from '../../../domain/errors/domain.error';
import { IOrderRepository } from '../../../domain/repositories/order.repository';
import { UpdateOrderStatusUseCase } from './update-order-status.use-case';

export class CancelMyOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
  ) {}

  async execute(id: string, userId: string): Promise<Either<DomainError, Order>> {
    const order = await this.orderRepo.findById(id);
    if (!order || order.clientId !== userId) return left(new NotFoundError('Order'));

    if (order.status !== 'RECEIVED') {
      return left(new InvalidOrderTransitionError(order.status, 'CANCELLED'));
    }

    return this.updateOrderStatus.execute(id, 'CANCELLED');
  }
}
