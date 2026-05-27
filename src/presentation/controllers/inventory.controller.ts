import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateIngredientUseCase } from '../../application/use-cases/inventory/create-ingredient.use-case';
import { GetIngredientUseCase } from '../../application/use-cases/inventory/get-ingredient.use-case';
import { GetStockAlertsUseCase } from '../../application/use-cases/inventory/get-stock-alerts.use-case';
import { ListIngredientsUseCase } from '../../application/use-cases/inventory/list-ingredients.use-case';
import { ListMovementsUseCase } from '../../application/use-cases/inventory/list-movements.use-case';
import { RestockIngredientUseCase } from '../../application/use-cases/inventory/restock-ingredient.use-case';
import { UpdateIngredientUseCase } from '../../application/use-cases/inventory/update-ingredient.use-case';
import { Ingredient } from '../../domain/entities/ingredient.entity';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { ApiPaginatedResponse } from '../decorators/api-paginated-response.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CreateIngredientDto } from '../dtos/inventory/create-ingredient.dto';
import { ListMovementsFiltersDto } from '../dtos/inventory/list-movements-filters.dto';
import { RestockIngredientDto } from '../dtos/inventory/restock-ingredient.dto';
import { UpdateIngredientDto } from '../dtos/inventory/update-ingredient.dto';
import { IngredientResponseDto } from '../dtos/responses/ingredient.response.dto';
import { InventoryMovementResponseDto } from '../dtos/responses/inventory-movement.response.dto';
import { PaginationDto } from '../dtos/shared/pagination.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly createIngredient: CreateIngredientUseCase,
    private readonly getIngredient: GetIngredientUseCase,
    private readonly updateIngredient: UpdateIngredientUseCase,
    private readonly listIngredients: ListIngredientsUseCase,
    private readonly restockIngredient: RestockIngredientUseCase,
    private readonly listMovements: ListMovementsUseCase,
    private readonly getStockAlerts: GetStockAlertsUseCase,
  ) {}

  @Get('movements')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Lista movimentações de estoque (ADMIN)' })
  @ApiPaginatedResponse(InventoryMovementResponseDto)
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async movements(@Query() query: ListMovementsFiltersDto): Promise<{
    data: InventoryMovement[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.listMovements.execute({
      ingredientId: query.ingredientId,
      orderId: query.orderId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
    });
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

  @Get('alerts')
  @Roles(['ADMIN', 'BARISTA'])
  @ApiOperation({ summary: 'Lista ingredientes com estoque abaixo do mínimo (ADMIN, BARISTA)' })
  @ApiResponse({ status: 200, type: [IngredientResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async alerts(): Promise<Ingredient[]> {
    return this.getStockAlerts.execute();
  }

  @Get()
  @Roles(['ADMIN', 'BARISTA'])
  @ApiOperation({ summary: 'Lista ingredientes com paginação (ADMIN, BARISTA)' })
  @ApiPaginatedResponse(IngredientResponseDto)
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async list(@Query() query: PaginationDto): Promise<{
    data: Ingredient[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.listIngredients.execute(query.page, query.limit);
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
  @Roles(['ADMIN', 'BARISTA'])
  @ApiOperation({ summary: 'Busca ingrediente por ID (ADMIN, BARISTA)' })
  @ApiResponse({ status: 200, type: IngredientResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Ingrediente não encontrado' })
  async getOne(@Param('id') id: string): Promise<Ingredient> {
    const result = await this.getIngredient.execute(id);
    if (result.isLeft()) throw result.value;
    return result.value;
  }

  @Post()
  @HttpCode(201)
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Cria ingrediente (ADMIN)' })
  @ApiResponse({ status: 201, type: IngredientResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async create(@Body() dto: CreateIngredientDto): Promise<Ingredient> {
    const result = await this.createIngredient.execute(dto);
    if (result.isLeft()) throw result.value;
    return result.value;
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Atualiza ingrediente (ADMIN)' })
  @ApiResponse({ status: 200, type: IngredientResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Ingrediente não encontrado' })
  async update(@Param('id') id: string, @Body() dto: UpdateIngredientDto): Promise<Ingredient> {
    const result = await this.updateIngredient.execute(id, dto);
    if (result.isLeft()) throw result.value;
    return result.value;
  }

  @Post(':id/restock')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Reabastecer ingrediente (ADMIN)' })
  @ApiResponse({ status: 200, type: IngredientResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Ingrediente não encontrado' })
  async restock(@Param('id') id: string, @Body() dto: RestockIngredientDto): Promise<Ingredient> {
    const result = await this.restockIngredient.execute(id, dto.quantity, dto.note);
    if (result.isLeft()) throw result.value;
    return result.value;
  }
}
