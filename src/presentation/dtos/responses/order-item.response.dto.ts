import { ApiProperty } from '@nestjs/swagger';

export class OrderItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  orderId: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  productId: string;

  @ApiProperty({ example: 'Cappuccino' })
  productName: string;

  @ApiProperty({ example: '12.50' })
  unitPrice: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: '25.00' })
  subtotal: string;
}
