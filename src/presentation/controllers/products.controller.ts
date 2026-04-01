import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Roles } from '../decorators/roles.decorator.js';
import { CreateProductUseCase } from '../../application/use-cases/menu/create-product.use-case.js';
import { DeleteProductUseCase } from '../../application/use-cases/menu/delete-product.use-case.js';
import { GetProductUseCase } from '../../application/use-cases/menu/get-product.use-case.js';
import { ListProductsUseCase } from '../../application/use-cases/menu/list-products.use-case.js';
import { UpdateProductUseCase } from '../../application/use-cases/menu/update-product.use-case.js';
import { ToggleAvailabilityUseCase } from '../../application/use-cases/menu/toggle-availability.use-case.js';
import { AddProductIngredientUseCase } from '../../application/use-cases/menu/add-product-ingredient.use-case.js';
import { RemoveProductIngredientUseCase } from '../../application/use-cases/menu/remove-product-ingredient.use-case.js';
import { ListProductIngredientsUseCase } from '../../application/use-cases/menu/list-product-ingredients.use-case.js';
import { PaginationDto } from '../dtos/shared/pagination.dto.js';
import { CreateProductDto } from '../dtos/menu/create-product.dto.js';
import { UpdateProductDto } from '../dtos/menu/update-product.dto.js';
import { AddProductIngredientDto } from '../dtos/menu/add-product-ingredient.dto.js';

class ListProductsQuery extends PaginationDto {
  categoryId?: string;
}

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly listProducts: ListProductsUseCase,
    private readonly getProduct: GetProductUseCase,
    private readonly updateProduct: UpdateProductUseCase,
    private readonly deleteProduct: DeleteProductUseCase,
    private readonly toggleAvailability: ToggleAvailabilityUseCase,
    private readonly addProductIngredient: AddProductIngredientUseCase,
    private readonly removeProductIngredient: RemoveProductIngredientUseCase,
    private readonly listProductIngredients: ListProductIngredientsUseCase,
  ) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Lista produtos (público)' })
  @ApiQuery({ name: 'categoryId', required: false })
  async list(@Query() query: ListProductsQuery) {
    const result = await this.listProducts.execute(query);
    return {
      data: result.data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  @Get(':id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Busca produto por ID (público)' })
  async getOne(@Param('id') id: string) {
    return this.getProduct.execute(id);
  }

  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Cria produto (ADMIN)' })
  async create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Atualiza produto (ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.updateProduct.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Remove produto (ADMIN)' })
  async remove(@Param('id') id: string) {
    await this.deleteProduct.execute(id);
  }

  @Patch(':id/availability')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Alterna disponibilidade do produto (ADMIN)' })
  async toggleAvail(@Param('id') id: string) {
    return this.toggleAvailability.execute(id);
  }

  @Post(':id/ingredients')
  @HttpCode(201)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Adiciona ingrediente à receita do produto (ADMIN)' })
  async addIngredient(@Param('id') id: string, @Body() dto: AddProductIngredientDto) {
    return this.addProductIngredient.execute({ productId: id, ...dto });
  }

  @Delete(':id/ingredients/:ingredientId')
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Remove ingrediente da receita do produto (ADMIN)' })
  async removeIngredient(@Param('id') id: string, @Param('ingredientId') ingredientId: string) {
    await this.removeProductIngredient.execute(id, ingredientId);
  }

  @Get(':id/ingredients')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Lista ingredientes da receita do produto (ADMIN)' })
  async listIngredients(@Param('id') id: string) {
    return this.listProductIngredients.execute(id);
  }
}
