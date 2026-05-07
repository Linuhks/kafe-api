import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetPeakHoursUseCase } from '../../application/use-cases/dashboard/get-peak-hours.use-case';
import { GetSummaryUseCase } from '../../application/use-cases/dashboard/get-summary.use-case';
import { GetTopProductsUseCase } from '../../application/use-cases/dashboard/get-top-products.use-case';
import { OrderSummaryData, PeakHourData, TopProductData } from '../../domain/repositories/order.repository';
import { Roles } from '../decorators/roles.decorator';
import { OrderSummaryResponseDto } from '../dtos/responses/order-summary.response.dto';
import { PeakHourResponseDto } from '../dtos/responses/peak-hour.response.dto';
import { TopProductResponseDto } from '../dtos/responses/top-product.response.dto';
import { TopProductsQueryDto } from '../dtos/dashboard/top-products-query.dto';
import { DateRangeDto } from '../dtos/shared/date-range.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@Roles(['ADMIN'])
export class DashboardController {
  constructor(
    private readonly getSummary: GetSummaryUseCase,
    private readonly getTopProducts: GetTopProductsUseCase,
    private readonly getPeakHours: GetPeakHoursUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo de vendas por período (ADMIN)' })
  @ApiResponse({ status: 200, type: OrderSummaryResponseDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async summary(@Query() query: DateRangeDto): Promise<OrderSummaryData> {
    return this.getSummary.execute(query);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Produtos mais vendidos (ADMIN)' })
  @ApiResponse({ status: 200, type: [TopProductResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async topProducts(@Query() query: TopProductsQueryDto): Promise<TopProductData[]> {
    return this.getTopProducts.execute(query.limit, { from: query.from, to: query.to });
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Horários de pico (ADMIN)' })
  @ApiResponse({ status: 200, type: [PeakHourResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async peakHours(@Query() query: DateRangeDto): Promise<PeakHourData[]> {
    return this.getPeakHours.execute(query);
  }
}
