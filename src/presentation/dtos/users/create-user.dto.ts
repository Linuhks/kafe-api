import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'maria@kafe.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'BARISTA', 'CLIENT'], default: 'CLIENT' })
  @IsOptional()
  @IsEnum(['ADMIN', 'BARISTA', 'CLIENT'])
  role: string = 'CLIENT';
}
