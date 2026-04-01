import type {
  DateRange,
  IOrderRepository,
  OrderSummaryData,
} from '../../../domain/repositories/order.repository.js';

export class GetSummaryUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(dateRange: DateRange = {}): Promise<OrderSummaryData> {
    return this.orderRepo.getSummary(dateRange);
  }
}
