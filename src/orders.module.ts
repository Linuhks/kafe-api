import { Module } from '@nestjs/common';
import { DeductForOrderUseCase } from './application/use-cases/inventory/deduct-for-order.use-case.js';
import { CreateOrderUseCase } from './application/use-cases/orders/create-order.use-case.js';
import { GetBaristaQueueUseCase } from './application/use-cases/orders/get-barista-queue.use-case.js';
import { GetMyOrdersUseCase } from './application/use-cases/orders/get-my-orders.use-case.js';
import { GetOrderUseCase } from './application/use-cases/orders/get-order.use-case.js';
import { ListOrdersUseCase } from './application/use-cases/orders/list-orders.use-case.js';
import { UpdateOrderStatusUseCase } from './application/use-cases/orders/update-order-status.use-case.js';
import { IIngredientRepository } from './domain/repositories/ingredient.repository.js';
import { IInventoryMovementRepository } from './domain/repositories/inventory-movement.repository.js';
import { IOrderRepository } from './domain/repositories/order.repository.js';
import { IProductRepository } from './domain/repositories/product.repository.js';
import { DrizzleIngredientRepository } from './infrastructure/db/repositories/drizzle-ingredient.repository.js';
import { DrizzleInventoryMovementRepository } from './infrastructure/db/repositories/drizzle-inventory-movement.repository.js';
import { DrizzleOrderRepository } from './infrastructure/db/repositories/drizzle-order.repository.js';
import { MenuModule } from './menu.module.js';
import { OrdersController } from './presentation/controllers/orders.controller.js';

@Module({
  imports: [MenuModule],
  controllers: [OrdersController],
  providers: [
    { provide: IOrderRepository, useClass: DrizzleOrderRepository },
    { provide: IIngredientRepository, useClass: DrizzleIngredientRepository },
    { provide: IInventoryMovementRepository, useClass: DrizzleInventoryMovementRepository },
    {
      provide: DeductForOrderUseCase,
      useFactory: (
        ingredientRepo: IIngredientRepository,
        movementRepo: IInventoryMovementRepository,
      ) => new DeductForOrderUseCase(ingredientRepo, movementRepo),
      inject: [IIngredientRepository, IInventoryMovementRepository],
    },
    {
      provide: CreateOrderUseCase,
      useFactory: (orderRepo: IOrderRepository, productRepo: IProductRepository) =>
        new CreateOrderUseCase(orderRepo, productRepo),
      inject: [IOrderRepository, IProductRepository],
    },
    {
      provide: UpdateOrderStatusUseCase,
      useFactory: (orderRepo: IOrderRepository, deductForOrder: DeductForOrderUseCase) =>
        new UpdateOrderStatusUseCase(orderRepo, deductForOrder),
      inject: [IOrderRepository, DeductForOrderUseCase],
    },
    {
      provide: ListOrdersUseCase,
      useFactory: (repo: IOrderRepository) => new ListOrdersUseCase(repo),
      inject: [IOrderRepository],
    },
    {
      provide: GetOrderUseCase,
      useFactory: (repo: IOrderRepository) => new GetOrderUseCase(repo),
      inject: [IOrderRepository],
    },
    {
      provide: GetBaristaQueueUseCase,
      useFactory: (repo: IOrderRepository) => new GetBaristaQueueUseCase(repo),
      inject: [IOrderRepository],
    },
    {
      provide: GetMyOrdersUseCase,
      useFactory: (repo: IOrderRepository) => new GetMyOrdersUseCase(repo),
      inject: [IOrderRepository],
    },
  ],
  exports: [IOrderRepository, IIngredientRepository, IInventoryMovementRepository],
})
export class OrdersModule {}
