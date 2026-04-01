import { Module } from '@nestjs/common';
import { AddProductIngredientUseCase } from './application/use-cases/menu/add-product-ingredient.use-case.js';
import { CreateCategoryUseCase } from './application/use-cases/menu/create-category.use-case.js';
import { CreateProductUseCase } from './application/use-cases/menu/create-product.use-case.js';
import { DeleteCategoryUseCase } from './application/use-cases/menu/delete-category.use-case.js';
import { DeleteProductUseCase } from './application/use-cases/menu/delete-product.use-case.js';
import { GetCategoryUseCase } from './application/use-cases/menu/get-category.use-case.js';
import { GetProductUseCase } from './application/use-cases/menu/get-product.use-case.js';
import { ListCategoriesUseCase } from './application/use-cases/menu/list-categories.use-case.js';
import { ListProductIngredientsUseCase } from './application/use-cases/menu/list-product-ingredients.use-case.js';
import { ListProductsUseCase } from './application/use-cases/menu/list-products.use-case.js';
import { RemoveProductIngredientUseCase } from './application/use-cases/menu/remove-product-ingredient.use-case.js';
import { ToggleAvailabilityUseCase } from './application/use-cases/menu/toggle-availability.use-case.js';
import { UpdateCategoryUseCase } from './application/use-cases/menu/update-category.use-case.js';
import { UpdateProductUseCase } from './application/use-cases/menu/update-product.use-case.js';
import { ICategoryRepository } from './domain/repositories/category.repository.js';
import { IIngredientRepository } from './domain/repositories/ingredient.repository.js';
import { IProductRepository } from './domain/repositories/product.repository.js';
import { IProductIngredientRepository } from './domain/repositories/product-ingredient.repository.js';
import { DrizzleCategoryRepository } from './infrastructure/db/repositories/drizzle-category.repository.js';
import { DrizzleIngredientRepository } from './infrastructure/db/repositories/drizzle-ingredient.repository.js';
import { DrizzleProductRepository } from './infrastructure/db/repositories/drizzle-product.repository.js';
import { DrizzleProductIngredientRepository } from './infrastructure/db/repositories/drizzle-product-ingredient.repository.js';
import { CategoriesController } from './presentation/controllers/categories.controller.js';
import { ProductsController } from './presentation/controllers/products.controller.js';

@Module({
  controllers: [CategoriesController, ProductsController],
  providers: [
    { provide: ICategoryRepository, useClass: DrizzleCategoryRepository },
    { provide: IProductRepository, useClass: DrizzleProductRepository },
    { provide: IIngredientRepository, useClass: DrizzleIngredientRepository },
    { provide: IProductIngredientRepository, useClass: DrizzleProductIngredientRepository },
    {
      provide: CreateCategoryUseCase,
      useFactory: (repo: ICategoryRepository) => new CreateCategoryUseCase(repo),
      inject: [ICategoryRepository],
    },
    {
      provide: ListCategoriesUseCase,
      useFactory: (repo: ICategoryRepository) => new ListCategoriesUseCase(repo),
      inject: [ICategoryRepository],
    },
    {
      provide: GetCategoryUseCase,
      useFactory: (repo: ICategoryRepository) => new GetCategoryUseCase(repo),
      inject: [ICategoryRepository],
    },
    {
      provide: UpdateCategoryUseCase,
      useFactory: (repo: ICategoryRepository) => new UpdateCategoryUseCase(repo),
      inject: [ICategoryRepository],
    },
    {
      provide: DeleteCategoryUseCase,
      useFactory: (repo: ICategoryRepository) => new DeleteCategoryUseCase(repo),
      inject: [ICategoryRepository],
    },
    {
      provide: CreateProductUseCase,
      useFactory: (productRepo: IProductRepository, categoryRepo: ICategoryRepository) =>
        new CreateProductUseCase(productRepo, categoryRepo),
      inject: [IProductRepository, ICategoryRepository],
    },
    {
      provide: ListProductsUseCase,
      useFactory: (repo: IProductRepository) => new ListProductsUseCase(repo),
      inject: [IProductRepository],
    },
    {
      provide: GetProductUseCase,
      useFactory: (repo: IProductRepository) => new GetProductUseCase(repo),
      inject: [IProductRepository],
    },
    {
      provide: UpdateProductUseCase,
      useFactory: (productRepo: IProductRepository, categoryRepo: ICategoryRepository) =>
        new UpdateProductUseCase(productRepo, categoryRepo),
      inject: [IProductRepository, ICategoryRepository],
    },
    {
      provide: DeleteProductUseCase,
      useFactory: (repo: IProductRepository) => new DeleteProductUseCase(repo),
      inject: [IProductRepository],
    },
    {
      provide: ToggleAvailabilityUseCase,
      useFactory: (repo: IProductRepository) => new ToggleAvailabilityUseCase(repo),
      inject: [IProductRepository],
    },
    {
      provide: AddProductIngredientUseCase,
      useFactory: (
        productRepo: IProductRepository,
        ingredientRepo: IIngredientRepository,
        productIngredientRepo: IProductIngredientRepository,
      ) => new AddProductIngredientUseCase(productRepo, ingredientRepo, productIngredientRepo),
      inject: [IProductRepository, IIngredientRepository, IProductIngredientRepository],
    },
    {
      provide: RemoveProductIngredientUseCase,
      useFactory: (
        productRepo: IProductRepository,
        productIngredientRepo: IProductIngredientRepository,
      ) => new RemoveProductIngredientUseCase(productRepo, productIngredientRepo),
      inject: [IProductRepository, IProductIngredientRepository],
    },
    {
      provide: ListProductIngredientsUseCase,
      useFactory: (
        productRepo: IProductRepository,
        productIngredientRepo: IProductIngredientRepository,
      ) => new ListProductIngredientsUseCase(productRepo, productIngredientRepo),
      inject: [IProductRepository, IProductIngredientRepository],
    },
  ],
  exports: [ICategoryRepository, IProductRepository],
})
export class MenuModule {}
