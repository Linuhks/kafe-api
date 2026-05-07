import { ApiProperty } from '@nestjs/swagger';

export class OrderSummaryResponseDto {
  @ApiProperty({ example: 42 })
  totalOrders: number;

  @ApiProperty({ example: '1250.00' })
  totalRevenue: string;

  @ApiProperty({ example: '29.76' })
  avgOrderValue: string;

  @ApiProperty({
    example: {
      RECEIVED: 5,
      IN_PREPARATION: 3,
      READY: 2,
      DELIVERED: 30,
      CANCELLED: 2,
    },
  })
  ordersByStatus: Record<string, number>;
}
