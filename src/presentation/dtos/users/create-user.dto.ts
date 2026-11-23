import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'maria@kafe.com' })
  @IsEmail()
  email: string;

  // Keep in sync with emailAndPassword.minPasswordLength in src/infrastructure/auth/better-auth.ts:
  // this path hashes the password directly and never runs Better-Auth's sign-up check.
  @ApiProperty({ example: 'senhaSegura2026', minLength: 12 })
  @IsString()
  @MinLength(12)
  password: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'BARISTA', 'CLIENT'], default: 'CLIENT' })
  @IsOptional()
  @IsEnum(['ADMIN', 'BARISTA', 'CLIENT'])
  role: string = 'CLIENT';
}
