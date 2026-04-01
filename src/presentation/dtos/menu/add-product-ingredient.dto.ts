import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsUUID, Matches } from 'class-validator';

export class AddProductIngredientDto {
  @ApiProperty({ example: 'uuid-do-ingrediente' })
  @IsUUID()
  ingredientId: string;

  @ApiProperty({ example: '0.030', description: 'Quantidade em formato decimal string positivo' })
  @IsNumberString()
  @Matches(/^\d+(\.\d+)?$/, { message: 'quantity must be a positive decimal string' })
  quantity: string;
}
