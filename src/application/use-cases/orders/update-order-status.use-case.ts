import { Either, left, right } from '../../../domain/either';
import { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { ConflictError, DomainError, NotFoundError } from '../../../domain/errors/domain.error';
import { IOrderRepository } from '../../../domain/repositories/order.repository';
import { IUnitOfWork } from '../../../domain/repositories/unit-of-work';
import { DeductForOrderUseCase } from '../inventory/deduct-for-order.use-case';
import { RefundForOrderUseCase } from '../inventory/refund-for-order.use-case';

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly deductForOrder: DeductForOrderUseCase,
    private readonly refundForOrder: RefundForOrderUseCase,
    private readonly unitOfWork: IUnitOfWork,
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

    return this.unitOfWork.run<DomainError, Order>(async () => {
      const updated = await this.orderRepo.transitionStatus(id, order.status, newStatus, baristaId);
      if (!updated) {
        return left(new ConflictError('Order status was changed by another request'));
      }

      if (newStatus === 'IN_PREPARATION') {
        const deductResult = await this.deductForOrder.execute(order);
        if (deductResult.isLeft()) return left(deductResult.value);
      } else if (newStatus === 'CANCELLED' && order.status === 'IN_PREPARATION') {
        const refundResult = await this.refundForOrder.execute(order);
        if (refundResult.isLeft()) return left(refundResult.value);
      }

      return right(updated);
    });
  }
}
