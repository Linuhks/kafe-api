import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 'Espresso' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Café espresso tradicional' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '5.50', description: 'Preço em formato decimal string (max 99999.99)' })
  @IsString()
  @Matches(/^\d{1,5}(\.\d{1,2})?$/, { message: 'price must be a valid decimal up to 99999.99 (e.g. "5.50")' })
  price: string;

  @ApiPropertyOptional({ example: 'https://cdn.kafe.com/espresso.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
