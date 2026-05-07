import { Module } from '@nestjs/common';
import { CreateIngredientUseCase } from './application/use-cases/inventory/create-ingredient.use-case';
import { GetIngredientUseCase } from './application/use-cases/inventory/get-ingredient.use-case';
import { GetStockAlertsUseCase } from './application/use-cases/inventory/get-stock-alerts.use-case';
import { ListIngredientsUseCase } from './application/use-cases/inventory/list-ingredients.use-case';
import { ListMovementsUseCase } from './application/use-cases/inventory/list-movements.use-case';
import { RestockIngredientUseCase } from './application/use-cases/inventory/restock-ingredient.use-case';
import { UpdateIngredientUseCase } from './application/use-cases/inventory/update-ingredient.use-case';
import { IIngredientRepository } from './domain/repositories/ingredient.repository';
import { IInventoryMovementRepository } from './domain/repositories/inventory-movement.repository';
import { DrizzleIngredientRepository } from './infrastructure/db/repositories/drizzle-ingredient.repository';
import { DrizzleInventoryMovementRepository } from './infrastructure/db/repositories/drizzle-inventory-movement.repository';
import { InventoryController } from './presentation/controllers/inventory.controller';

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
