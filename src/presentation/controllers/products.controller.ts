import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AddProductIngredientUseCase } from '../../application/use-cases/menu/add-product-ingredient.use-case';
import { CreateProductUseCase } from '../../application/use-cases/menu/create-product.use-case';
import { DeleteProductUseCase } from '../../application/use-cases/menu/delete-product.use-case';
import { GetProductUseCase } from '../../application/use-cases/menu/get-product.use-case';
import { ListProductIngredientsUseCase } from '../../application/use-cases/menu/list-product-ingredients.use-case';
import { ListProductsUseCase } from '../../application/use-cases/menu/list-products.use-case';
import { RemoveProductIngredientUseCase } from '../../application/use-cases/menu/remove-product-ingredient.use-case';
import { ToggleAvailabilityUseCase } from '../../application/use-cases/menu/toggle-availability.use-case';
import { UpdateProductUseCase } from '../../application/use-cases/menu/update-product.use-case';
import { Product } from '../../domain/entities/product.entity';
import { ProductIngredient } from '../../domain/entities/product-ingredient.entity';
import { Roles } from '../decorators/roles.decorator';
import { AddProductIngredientDto } from '../dtos/menu/add-product-ingredient.dto';
import { CreateProductDto } from '../dtos/menu/create-product.dto';
import { UpdateProductDto } from '../dtos/menu/update-product.dto';
import { ProductResponseDto } from '../dtos/responses/product.response.dto';
import { ProductIngredientResponseDto } from '../dtos/responses/product-ingredient.response.dto';
import { PaginationDto } from '../dtos/shared/pagination.dto';

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
  @ApiExtraModels(ProductResponseDto)
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        data: { type: 'array', items: { $ref: getSchemaPath(ProductResponseDto) } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  async list(@Query() query: ListProductsQuery): Promise<{
    data: Product[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
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
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async getOne(@Param('id') id: string): Promise<Product> {
    return this.getProduct.execute(id);
  }

  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Cria produto (ADMIN)' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.createProduct.execute(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Atualiza produto (ADMIN)' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<Product> {
    return this.updateProduct.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Remove produto (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Produto removido com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteProduct.execute(id);
  }

  @Patch(':id/availability')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Alterna disponibilidade do produto (ADMIN)' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async toggleAvail(@Param('id') id: string): Promise<Product> {
    return this.toggleAvailability.execute(id);
  }

  @Post(':id/ingredients')
  @HttpCode(201)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Adiciona ingrediente à receita do produto (ADMIN)' })
  @ApiResponse({ status: 201, type: ProductIngredientResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto ou ingrediente não encontrado' })
  async addIngredient(
    @Param('id') id: string,
    @Body() dto: AddProductIngredientDto,
  ): Promise<ProductIngredient> {
    return this.addProductIngredient.execute({ productId: id, ...dto });
  }

  @Delete(':id/ingredients/:ingredientId')
  @HttpCode(204)
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Remove ingrediente da receita do produto (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Ingrediente removido da receita' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Relação produto-ingrediente não encontrada' })
  async removeIngredient(
    @Param('id') id: string,
    @Param('ingredientId') ingredientId: string,
  ): Promise<void> {
    await this.removeProductIngredient.execute(id, ingredientId);
  }

  @Get(':id/ingredients')
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Lista ingredientes da receita do produto (ADMIN)' })
  @ApiResponse({ status: 200, type: [ProductIngredientResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async listIngredients(@Param('id') id: string): Promise<ProductIngredient[]> {
    return this.listProductIngredients.execute(id);
  }
}
