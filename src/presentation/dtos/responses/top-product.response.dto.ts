import { ApiProperty } from '@nestjs/swagger';

export class TopProductResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  productId: string;

  @ApiProperty({ example: 'Cappuccino' })
  productName: string;

  @ApiProperty({ example: 85 })
  quantitySold: number;

  @ApiProperty({ example: '1062.50' })
  revenue: string;
}
