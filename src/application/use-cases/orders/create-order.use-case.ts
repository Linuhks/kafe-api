import { Either, left, right } from '../../../domain/either';
import { Order } from '../../../domain/entities/order.entity';
import { ConflictError, DomainError, NotFoundError } from '../../../domain/errors/domain.error';
import {
  CreateOrderItemData,
  IOrderRepository,
} from '../../../domain/repositories/order.repository';
import { IProductRepository } from '../../../domain/repositories/product.repository';

interface CreateOrderInput {
  clientId?: string;
  clientName?: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
  ) {}

  async execute(data: CreateOrderInput): Promise<Either<DomainError, Order>> {
    const orderItems: CreateOrderItemData[] = [];
    let totalAmountCents = 0;

    for (const item of data.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) return left(new NotFoundError(`Product ${item.productId}`));
      if (!product.isAvailable)
        return left(new ConflictError(`Product ${item.productId} is not available`));

      const unitPriceCents = Math.round(parseFloat(product.price) * 100);
      const subtotalCents = unitPriceCents * item.quantity;
      totalAmountCents += subtotalCents;

      orderItems.push({
        productId: item.productId,
        productName: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        subtotal: (subtotalCents / 100).toFixed(2),
      });
    }

    const order = await this.orderRepo.create({
      clientId: data.clientId,
      clientName: data.clientName,
      notes: data.notes,
      totalAmount: (totalAmountCents / 100).toFixed(2),
      items: orderItems,
    });
    return right(order);
  }
}
