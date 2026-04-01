import type {
  DateRange,
  IOrderRepository,
  TopProductData,
} from '../../../domain/repositories/order.repository.js';

export class GetTopProductsUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(limit = 10, dateRange: DateRange = {}): Promise<TopProductData[]> {
    return this.orderRepo.getTopProducts(limit, dateRange);
  }
}
