import { ApiProperty } from '@nestjs/swagger';

export class ProductIngredientResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  productId: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  ingredientId: string;

  @ApiProperty({ example: '30.000' })
  quantity: string;
}
