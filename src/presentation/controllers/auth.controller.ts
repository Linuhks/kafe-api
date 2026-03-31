import { Body, Controller, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous, AuthService } from '@thallesp/nestjs-better-auth';
import { auth } from '../../infrastructure/auth/better-auth.js';
import { LoginDto } from '../dtos/auth/login.dto.js';

@ApiTags('auth')
@AllowAnonymous()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService<typeof auth>) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica com e-mail e senha, retorna token Bearer' })
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.api.signInEmail({
      body: { email: dto.email, password: dto.password },
    });

    if (!result?.token) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return { token: result.token, user: result.user };
  }
}
