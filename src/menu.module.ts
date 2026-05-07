import { Module } from '@nestjs/common';
import { AddProductIngredientUseCase } from './application/use-cases/menu/add-product-ingredient.use-case';
import { CreateCategoryUseCase } from './application/use-cases/menu/create-category.use-case';
import { CreateProductUseCase } from './application/use-cases/menu/create-product.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/menu/delete-category.use-case';
import { DeleteProductUseCase } from './application/use-cases/menu/delete-product.use-case';
import { GetCategoryUseCase } from './application/use-cases/menu/get-category.use-case';
import { GetProductUseCase } from './application/use-cases/menu/get-product.use-case';
import { ListCategoriesUseCase } from './application/use-cases/menu/list-categories.use-case';
import { ListProductIngredientsUseCase } from './application/use-cases/menu/list-product-ingredients.use-case';
import { ListProductsUseCase } from './application/use-cases/menu/list-products.use-case';
import { RemoveProductIngredientUseCase } from './application/use-cases/menu/remove-product-ingredient.use-case';
import { ToggleAvailabilityUseCase } from './application/use-cases/menu/toggle-availability.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/menu/update-category.use-case';
import { UpdateProductUseCase } from './application/use-cases/menu/update-product.use-case';
import { ICategoryRepository } from './domain/repositories/category.repository';
import { IIngredientRepository } from './domain/repositories/ingredient.repository';
import { IProductRepository } from './domain/repositories/product.repository';
import { IProductIngredientRepository } from './domain/repositories/product-ingredient.repository';
import { DrizzleCategoryRepository } from './infrastructure/db/repositories/drizzle-category.repository';
import { DrizzleIngredientRepository } from './infrastructure/db/repositories/drizzle-ingredient.repository';
import { DrizzleProductRepository } from './infrastructure/db/repositories/drizzle-product.repository';
import { DrizzleProductIngredientRepository } from './infrastructure/db/repositories/drizzle-product-ingredient.repository';
import { CategoriesController } from './presentation/controllers/categories.controller';
import { ProductsController } from './presentation/controllers/products.controller';

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
