import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Café' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: '10.000', description: 'Estoque atual em decimal string (max 999999)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,6}(\.\d+)?$/, { message: 'currentStock must be a valid decimal up to 999999 (e.g. "10.000")' })
  currentStock?: string;

  @ApiPropertyOptional({ example: '2.000', description: 'Estoque mínimo em decimal string (max 999999)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,6}(\.\d+)?$/, { message: 'minimumStock must be a valid decimal up to 999999 (e.g. "2.000")' })
  minimumStock?: string;
}
