import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../shared/pagination.dto.js';
import { DateRangeDto } from '../shared/date-range.dto.js';

export class ListMovementsFiltersDto extends IntersectionType(PaginationDto, DateRangeDto) {
  @ApiPropertyOptional({ description: 'Filtrar por ingrediente' })
  @IsOptional()
  @IsUUID()
  ingredientId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por pedido' })
  @IsOptional()
  @IsUUID()
  orderId?: string;
}
