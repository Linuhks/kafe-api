import { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { NotFoundError } from '../../../domain/errors/domain.error';
import { IOrderRepository } from '../../../domain/repositories/order.repository';
import { DeductForOrderUseCase } from '../inventory/deduct-for-order.use-case';

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
