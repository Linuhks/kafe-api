import { ApiProperty } from '@nestjs/swagger';

export class IngredientResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Café Espresso' })
  name: string;

  @ApiProperty({ example: 'ml' })
  unit: string;

  @ApiProperty({ example: '5000.000' })
  currentStock: string;

  @ApiProperty({ example: '500.000' })
  minimumStock: string;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  updatedAt: Date;
}
