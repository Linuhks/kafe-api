import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class RestockIngredientDto {
  @ApiProperty({ example: '5.000', description: 'Quantidade a adicionar em decimal string' })
  @IsString()
  @Matches(/^\d{1,6}(\.\d+)?$/, { message: 'quantity must be a valid positive decimal up to 999999 (e.g. "5.000")' })
  quantity: string;

  @ApiPropertyOptional({ example: 'Entrega semanal' })
  @IsOptional()
  @IsString()
  note?: string;
}
