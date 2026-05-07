import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous, UserSession } from '@thallesp/nestjs-better-auth';
import { CreateOrderUseCase } from '../../application/use-cases/orders/create-order.use-case';
import { GetBaristaQueueUseCase } from '../../application/use-cases/orders/get-barista-queue.use-case';
import { GetMyOrdersUseCase } from '../../application/use-cases/orders/get-my-orders.use-case';
import { GetOrderUseCase } from '../../application/use-cases/orders/get-order.use-case';
import { ListOrdersUseCase } from '../../application/use-cases/orders/list-orders.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-cases/orders/update-order-status.use-case';
import { Order, OrderStatus } from '../../domain/entities/order.entity';
import { Auth } from '../../infrastructure/auth/better-auth';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { CreateOrderDto } from '../dtos/orders/create-order.dto';
import { UpdateOrderStatusDto } from '../dtos/orders/update-order-status.dto';
import { OrderResponseDto } from '../dtos/responses/order.response.dto';
import { PaginationDto } from '../dtos/shared/pagination.dto';
import { ApiPaginatedResponse } from '../decorators/api-paginated-response.decorator';

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
  @ApiResponse({ status: 201, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou estoque insuficiente' })
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: UserSession<Auth> | undefined,
  ): Promise<Order> {
    return this.createOrder.execute({
      clientId: user?.user.id,
      clientName: user?.user.name ?? dto.clientName,
      notes: dto.notes,
      items: dto.items,
    });
  }

  @Get()
  @ApiBearerAuth()
  @Roles(['ADMIN'])
  @ApiOperation({ summary: 'Lista pedidos com filtros (ADMIN)' })
  @ApiPaginatedResponse(OrderResponseDto)
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async list(@Query() query: ListOrdersQuery): Promise<{
    data: Order[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
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
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async queue(): Promise<Order[]> {
    return this.getBaristaQueue.execute();
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Histórico de pedidos do cliente autenticado' })
  @ApiPaginatedResponse(OrderResponseDto)
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async myOrders(
    @Query() query: PaginationDto,
    @CurrentUser() user: UserSession<Auth>,
  ): Promise<{
    data: Order[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.getMyOrders.execute(user.user.id, query.page, query.limit);
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
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async getOne(@Param('id') id: string): Promise<Order> {
    return this.getOrder.execute(id);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @Roles(['BARISTA', 'ADMIN'])
  @ApiOperation({ summary: 'Atualiza status do pedido (BARISTA, ADMIN)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Transição de status inválida' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: UserSession<Auth> | undefined,
  ): Promise<Order> {
    return this.updateOrderStatus.execute(id, dto.status, user?.user.id);
  }
}
