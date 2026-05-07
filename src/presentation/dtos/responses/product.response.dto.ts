import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  categoryId: string;

  @ApiProperty({ example: 'Cappuccino' })
  name: string;

  @ApiProperty({ example: 'Espresso com leite vaporizado', nullable: true })
  description: string | null;

  @ApiProperty({ example: '12.50' })
  price: string;

  @ApiProperty({ example: 'https://example.com/cappuccino.jpg', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: true })
  isAvailable: boolean;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T10:00:00.000Z' })
  updatedAt: Date;
}
