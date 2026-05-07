import { ApiProperty } from '@nestjs/swagger';

export class InventoryMovementResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  ingredientId: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012', nullable: true })
  orderId: string | null;

  @ApiProperty({ enum: ['DEDUCTION', 'RESTOCK', 'ADJUSTMENT'], example: 'RESTOCK' })
  type: string;

  @ApiProperty({ example: '500.000' })
  quantity: string;

  @ApiProperty({ example: 'Reposição semanal', nullable: true })
  note: string | null;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  createdAt: Date;
}
