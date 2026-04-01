import { Module } from '@nestjs/common';
import { CreateIngredientUseCase } from './application/use-cases/inventory/create-ingredient.use-case.js';
import { GetIngredientUseCase } from './application/use-cases/inventory/get-ingredient.use-case.js';
import { GetStockAlertsUseCase } from './application/use-cases/inventory/get-stock-alerts.use-case.js';
import { ListIngredientsUseCase } from './application/use-cases/inventory/list-ingredients.use-case.js';
import { ListMovementsUseCase } from './application/use-cases/inventory/list-movements.use-case.js';
import { RestockIngredientUseCase } from './application/use-cases/inventory/restock-ingredient.use-case.js';
import { UpdateIngredientUseCase } from './application/use-cases/inventory/update-ingredient.use-case.js';
import { IIngredientRepository } from './domain/repositories/ingredient.repository.js';
import { IInventoryMovementRepository } from './domain/repositories/inventory-movement.repository.js';
import { DrizzleIngredientRepository } from './infrastructure/db/repositories/drizzle-ingredient.repository.js';
import { DrizzleInventoryMovementRepository } from './infrastructure/db/repositories/drizzle-inventory-movement.repository.js';
import { InventoryController } from './presentation/controllers/inventory.controller.js';

@Module({
  controllers: [InventoryController],
  providers: [
    { provide: IIngredientRepository, useClass: DrizzleIngredientRepository },
    { provide: IInventoryMovementRepository, useClass: DrizzleInventoryMovementRepository },
    {
      provide: CreateIngredientUseCase,
      useFactory: (repo: IIngredientRepository) => new CreateIngredientUseCase(repo),
      inject: [IIngredientRepository],
    },
    {
      provide: GetIngredientUseCase,
      useFactory: (repo: IIngredientRepository) => new GetIngredientUseCase(repo),
      inject: [IIngredientRepository],
    },
    {
      provide: UpdateIngredientUseCase,
      useFactory: (repo: IIngredientRepository) => new UpdateIngredientUseCase(repo),
      inject: [IIngredientRepository],
    },
    {
      provide: ListIngredientsUseCase,
      useFactory: (repo: IIngredientRepository) => new ListIngredientsUseCase(repo),
      inject: [IIngredientRepository],
    },
    {
      provide: RestockIngredientUseCase,
      useFactory: (
        ingredientRepo: IIngredientRepository,
        movementRepo: IInventoryMovementRepository,
      ) => new RestockIngredientUseCase(ingredientRepo, movementRepo),
      inject: [IIngredientRepository, IInventoryMovementRepository],
    },
    {
      provide: ListMovementsUseCase,
      useFactory: (repo: IInventoryMovementRepository) => new ListMovementsUseCase(repo),
      inject: [IInventoryMovementRepository],
    },
    {
      provide: GetStockAlertsUseCase,
      useFactory: (repo: IIngredientRepository) => new GetStockAlertsUseCase(repo),
      inject: [IIngredientRepository],
    },
  ],
})
export class InventoryModule {}
