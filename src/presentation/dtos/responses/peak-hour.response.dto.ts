import { ApiProperty } from '@nestjs/swagger';

export class PeakHourResponseDto {
  @ApiProperty({ example: 9, description: 'Hora do dia (0-23)' })
  hour: number;

  @ApiProperty({ example: 34 })
  orderCount: number;
}
