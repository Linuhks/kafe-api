import type { Order } from '../../../domain/entities/order.entity.js';
import { ConflictError, NotFoundError } from '../../../domain/errors/domain.error.js';
import type {
  CreateOrderItemData,
  IOrderRepository,
} from '../../../domain/repositories/order.repository.js';
import type { IProductRepository } from '../../../domain/repositories/product.repository.js';

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

  async execute(data: CreateOrderInput): Promise<Order> {
    const orderItems: CreateOrderItemData[] = [];
    let totalAmountCents = 0;

    for (const item of data.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product) throw new NotFoundError(`Product ${item.productId}`);
      if (!product.isAvailable)
        throw new ConflictError(`Product ${item.productId} is not available`);

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

    return this.orderRepo.create({
      clientId: data.clientId,
      clientName: data.clientName,
      notes: data.notes,
      totalAmount: (totalAmountCents / 100).toFixed(2),
      items: orderItems,
    });
  }
}
