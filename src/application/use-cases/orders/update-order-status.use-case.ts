import { Order, OrderStatus } from '../../../domain/entities/order.entity.js';
import { NotFoundError } from '../../../domain/errors/domain.error.js';
import { IOrderRepository } from '../../../domain/repositories/order.repository.js';
import { DeductForOrderUseCase } from '../inventory/deduct-for-order.use-case.js';

export class UpdateOrderStatusUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly deductForOrder: DeductForOrderUseCase,
  ) {}

  async execute(id: string, newStatus: OrderStatus, baristaId?: string): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundError('Order');

    order.validateTransition(newStatus);

    if (newStatus === 'IN_PREPARATION') {
      await this.deductForOrder.execute(order);
    }

    return this.orderRepo.updateStatus(id, newStatus, baristaId);
  }
}
