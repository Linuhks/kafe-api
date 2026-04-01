import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { GetPeakHoursUseCase } from '../../application/use-cases/dashboard/get-peak-hours.use-case.js';
import type { GetSummaryUseCase } from '../../application/use-cases/dashboard/get-summary.use-case.js';
import type { GetTopProductsUseCase } from '../../application/use-cases/dashboard/get-top-products.use-case.js';
import { Roles } from '../decorators/roles.decorator.js';
import type { TopProductsQueryDto } from '../dtos/dashboard/top-products-query.dto.js';
import type { DateRangeDto } from '../dtos/shared/date-range.dto.js';

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
  async summary(@Query() query: DateRangeDto) {
    return this.getSummary.execute(query);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Produtos mais vendidos (ADMIN)' })
  async topProducts(@Query() query: TopProductsQueryDto) {
    return this.getTopProducts.execute(query.limit, { from: query.from, to: query.to });
  }

  @Get('peak-hours')
  @ApiOperation({ summary: 'Horários de pico (ADMIN)' })
  async peakHours(@Query() query: DateRangeDto) {
    return this.getPeakHours.execute(query);
  }
}
