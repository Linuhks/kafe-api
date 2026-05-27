import { Either, left, right } from '../either';
import { InvalidOrderTransitionError } from '../errors/domain.error';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'RECEIVED' | 'IN_PREPARATION' | 'READY' | 'DELIVERED' | 'CANCELLED';

export class Order {
  static readonly VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    RECEIVED: ['IN_PREPARATION', 'CANCELLED'],
    IN_PREPARATION: ['READY', 'CANCELLED'],
    READY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };

  constructor(
    public readonly id: string,
    public readonly clientId: string | null,
    public readonly clientName: string | null,
    public readonly baristaId: string | null,
    public readonly status: OrderStatus,
    public readonly notes: string | null,
    public readonly totalAmount: string,
    public readonly items: OrderItem[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  canTransitionTo(newStatus: OrderStatus): boolean {
    return Order.VALID_TRANSITIONS[this.status].includes(newStatus);
  }

  validateTransition(newStatus: OrderStatus): Either<InvalidOrderTransitionError, void> {
    if (!this.canTransitionTo(newStatus)) {
      return left(new InvalidOrderTransitionError(this.status, newStatus));
    }
    return right(undefined);
  }
}
