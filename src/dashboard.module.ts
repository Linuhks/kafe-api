import { Module } from '@nestjs/common';
import { IOrderRepository } from './domain/repositories/order.repository.js';
import { GetSummaryUseCase } from './application/use-cases/dashboard/get-summary.use-case.js';
import { GetTopProductsUseCase } from './application/use-cases/dashboard/get-top-products.use-case.js';
import { GetPeakHoursUseCase } from './application/use-cases/dashboard/get-peak-hours.use-case.js';
import { DrizzleOrderRepository } from './infrastructure/db/repositories/drizzle-order.repository.js';
import { DashboardController } from './presentation/controllers/dashboard.controller.js';

@Module({
  controllers: [DashboardController],
  providers: [
    { provide: IOrderRepository, useClass: DrizzleOrderRepository },
    {
      provide: GetSummaryUseCase,
      useFactory: (repo: IOrderRepository) => new GetSummaryUseCase(repo),
      inject: [IOrderRepository],
    },
    {
      provide: GetTopProductsUseCase,
      useFactory: (repo: IOrderRepository) => new GetTopProductsUseCase(repo),
      inject: [IOrderRepository],
    },
    {
      provide: GetPeakHoursUseCase,
      useFactory: (repo: IOrderRepository) => new GetPeakHoursUseCase(repo),
      inject: [IOrderRepository],
    },
  ],
})
export class DashboardModule {}
