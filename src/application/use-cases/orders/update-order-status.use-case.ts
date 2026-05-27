import { Either, left, right } from '../../../domain/either';
import { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { DomainError, NotFoundError } from '../../../domain/errors/domain.error';
import { IOrderRepository } from '../../../domain/repositories/order.repository';
import { DeductForOrderUseCase } from '../inventory/deduct-for-order.use-case';

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly deductForOrder: DeductForOrderUseCase,
  ) {}

  async execute(
    id: string,
    newStatus: OrderStatus,
    baristaId?: string,
  ): Promise<Either<DomainError, Order>> {
    const order = await this.orderRepo.findById(id);
    if (!order) return left(new NotFoundError('Order'));

    const transitionResult = order.validateTransition(newStatus);
    if (transitionResult.isLeft()) return left(transitionResult.value);

    if (newStatus === 'IN_PREPARATION') {
      const deductResult = await this.deductForOrder.execute(order);
      if (deductResult.isLeft()) return left(deductResult.value);
    }

    const updated = await this.orderRepo.updateStatus(id, newStatus, baristaId);
    return right(updated);
  }
}
