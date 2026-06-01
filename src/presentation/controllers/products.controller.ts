import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { Cache } from 'cache-manager';
import { IsOptional, IsUUID } from 'class-validator';
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
import {
  buildProductListKey,
  clearProductListCache,
} from '../../infrastructure/cache/product-cache.keys';
import { ApiPaginatedResponse } from '../decorators/api-paginated-response.decorator';
import { Roles } from '../decorators/roles.decorator';
import { AddProductIngredientDto } from '../dtos/menu/add-product-ingredient.dto';
import { CreateProductDto } from '../dtos/menu/create-product.dto';
import { UpdateProductDto } from '../dtos/menu/update-product.dto';
import { ProductResponseDto } from '../dtos/responses/product.response.dto';
import { ProductIngredientResponseDto } from '../dtos/responses/product-ingredient.response.dto';
import { PaginationDto } from '../dtos/shared/pagination.dto';

class ListProductsQuery extends PaginationDto {
  @IsOptional()
  @IsUUID('all')
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
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Lista produtos (público)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiPaginatedResponse(ProductResponseDto)
  async list(@Query() query: ListProductsQuery): Promise<{
    data: Product[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const cacheKey = buildProductListKey(query as Record<string, unknown>);
    const cached = await this.cacheManager.get<{
      data: Product[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(cacheKey);
    if (cached) return cached;

    const result = await this.listProducts.execute(query);
    const response = {
      data: result.data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
    await this.cacheManager.set(cacheKey, response, 60_000);
    return response;
  }

  @Get(':id')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Busca produto por ID (público)' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async getOne(@Param('id') id: string): Promise<Product> {
    const result = await this.getProduct.execute(id);
    if (result.isLeft()) throw result.value;
    return result.value;
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
    const result = await this.createProduct.execute(dto);
    if (result.isLeft()) throw result.value;
    await clearProductListCache(this.cacheManager);
    return result.value;
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
    const result = await this.updateProduct.execute(id, dto);
    if (result.isLeft()) throw result.value;
    await clearProductListCache(this.cacheManager);
    return result.value;
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
    const result = await this.deleteProduct.execute(id);
    if (result.isLeft()) throw result.value;
    await clearProductListCache(this.cacheManager);
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
    const result = await this.toggleAvailability.execute(id);
    if (result.isLeft()) throw result.value;
    return result.value;
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
    const result = await this.addProductIngredient.execute({ productId: id, ...dto });
    if (result.isLeft()) throw result.value;
    return result.value;
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
    const result = await this.removeProductIngredient.execute(id, ingredientId);
    if (result.isLeft()) throw result.value;
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
    const result = await this.listProductIngredients.execute(id);
    if (result.isLeft()) throw result.value;
    return result.value;
  }
}
