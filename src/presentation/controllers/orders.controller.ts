import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case.js';
import type { GetBaristaQueueUseCase } from '../../application/use-cases/orders/get-barista-queue.use-case.js';
import type { GetMyOrdersUseCase } from '../../application/use-cases/orders/get-my-orders.use-case.js';
import type { GetOrderUseCase } from '../../application/use-cases/orders/get-order.use-case.js';
import type { ListOrdersUseCase } from '../../application/use-cases/orders/list-orders.use-case.js';
import type { UpdateOrderStatusUseCase } from '../../application/use-cases/orders/update-order-status.use-case.js';
import type { OrderStatus } from '../../domain/entities/order.entity.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { CreateOrderDto } from '../dtos/orders/create-order.dto.js';
import type { UpdateOrderStatusDto } from '../dtos/orders/update-order-status.dto.js';
import { PaginationDto } from '../dtos/shared/pagination.dto.js';

class ListOrdersQuery extends PaginationDto {
  status?: OrderStatus;
  from?: string;
  to?: string;
}

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly updateOrderStatus: UpdateOrderStatusUseCase,
    private readonly getBaristaQueue: GetBaristaQueueUseCase,
    private readonly getMyOrders: GetMyOrdersUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @AllowAnonymous()
  @ApiOperation({ summary: 'Cria pedido (qualquer usuário)' })
  async create(@Body() dto: CreateOrderDto, @Request() req: any) {
    const user = req.user as { id: string; name: string } | undefined;
    return this.createOrder.execute({
      clientId: user?.id,
      clientName: user?.name ?? dto.clientName,
      notes: dto.notes,
      items: dto.items,
    });
  }

  @Get()
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Lista pedidos com filtros (ADMIN)' })
  async list(@Query() query: ListOrdersQuery) {
    const result = await this.listOrders.execute({
      status: query.status,
      from: query.from,
      to: query.to,
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

  @Get('queue')
  @ApiBearerAuth()
  @Roles(['BARISTA', 'ADMIN'])
  @ApiOperation({ summary: 'Fila de pedidos do barista (BARISTA, ADMIN)' })
  async queue() {
    return this.getBaristaQueue.execute();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Histórico de pedidos do cliente autenticado' })
  async myOrders(@Query() query: PaginationDto, @Request() req: any) {
    const user = req.user as { id: string };
    const result = await this.getMyOrders.execute(user.id, query.page, query.limit);
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
  @ApiBearerAuth()
  @Roles(['ADMIN', 'BARISTA'])
  @ApiOperation({ summary: 'Detalhe do pedido (ADMIN, BARISTA)' })
  async getOne(@Param('id') id: string) {
    return this.getOrder.execute(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(['BARISTA', 'ADMIN'])
  @ApiOperation({ summary: 'Atualiza status do pedido (BARISTA, ADMIN)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const user = req.user as { id: string } | undefined;
    return this.updateOrderStatus.execute(id, dto.status, user?.id);
  }
}
