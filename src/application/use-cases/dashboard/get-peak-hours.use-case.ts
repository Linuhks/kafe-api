import type {
  DateRange,
  IOrderRepository,
  PeakHourData,
} from '../../../domain/repositories/order.repository.js';

export class GetPeakHoursUseCase {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(dateRange: DateRange = {}): Promise<PeakHourData[]> {
    return this.orderRepo.getPeakHours(dateRange);
  }
}
