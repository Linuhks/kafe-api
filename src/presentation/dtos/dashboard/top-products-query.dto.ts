import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DateRangeDto } from '../shared/date-range.dto.js';

export class TopProductsQueryDto extends DateRangeDto {
  @ApiPropertyOptional({ description: 'Número máximo de produtos retornados', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
