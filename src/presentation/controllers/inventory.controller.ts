import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../decorators/roles.decorator.js';
import { CreateIngredientUseCase } from '../../application/use-cases/inventory/create-ingredient.use-case.js';
import { GetIngredientUseCase } from '../../application/use-cases/inventory/get-ingredient.use-case.js';
import { UpdateIngredientUseCase } from '../../application/use-cases/inventory/update-ingredient.use-case.js';
import { ListIngredientsUseCase } from '../../application/use-cases/inventory/list-ingredients.use-case.js';
import { RestockIngredientUseCase } from '../../application/use-cases/inventory/restock-ingredient.use-case.js';
import { ListMovementsUseCase } from '../../application/use-cases/inventory/list-movements.use-case.js';
import { GetStockAlertsUseCase } from '../../application/use-cases/inventory/get-stock-alerts.use-case.js';
import { CreateIngredientDto } from '../dtos/inventory/create-ingredient.dto.js';
import { UpdateIngredientDto } from '../dtos/inventory/update-ingredient.dto.js';
import { RestockIngredientDto } from '../dtos/inventory/restock-ingredient.dto.js';
import { ListMovementsFiltersDto } from '../dtos/inventory/list-movements-filters.dto.js';
import { PaginationDto } from '../dtos/shared/pagination.dto.js';

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
  async movements(@Query() query: ListMovementsFiltersDto) {
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
  async alerts() {
    return this.getStockAlerts.execute();
  }

  @Get()
  @Roles(['ADMIN', 'BARISTA'])
  @ApiOperation({ summary: 'Lista ingredientes com paginação (ADMIN, BARISTA)' })
  async list(@Query() query: PaginationDto) {
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
  async getOne(@Param('id') id: string) {
    return this.getIngredient.execute(id);
  }

  @Post()
  @HttpCode(201)
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Cria ingrediente (ADMIN)' })
  async create(@Body() dto: CreateIngredientDto) {
    return this.createIngredient.execute(dto);
  }

  @Patch(':id')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Atualiza ingrediente (ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.updateIngredient.execute(id, dto);
  }

  @Post(':id/restock')
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Reabastecer ingrediente (ADMIN)' })
  async restock(@Param('id') id: string, @Body() dto: RestockIngredientDto) {
    return this.restockIngredient.execute(id, dto.quantity, dto.note);
  }
}
