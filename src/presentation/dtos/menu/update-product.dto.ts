import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'uuid-da-categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Espresso' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Café espresso tradicional' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '5.50' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,5}(\.\d{1,2})?$/, { message: 'price must be a valid decimal up to 99999.99 (e.g. "5.50")' })
  price?: string;

  @ApiPropertyOptional({ example: 'https://cdn.kafe.com/espresso.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
