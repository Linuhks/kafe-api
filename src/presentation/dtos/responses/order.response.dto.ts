import { ApiProperty } from '@nestjs/swagger';
import { OrderItemResponseDto } from './order-item.response.dto';

export class OrderResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901', nullable: true })
  clientId: string | null;

  @ApiProperty({ example: 'João Silva', nullable: true })
  clientName: string | null;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012', nullable: true })
  baristaId: string | null;

  @ApiProperty({
    enum: ['RECEIVED', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED'],
    example: 'RECEIVED',
  })
  status: string;

  @ApiProperty({ example: 'Sem açúcar', nullable: true })
  notes: string | null;

  @ApiProperty({ example: '25.00' })
  totalAmount: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  updatedAt: Date;
}
