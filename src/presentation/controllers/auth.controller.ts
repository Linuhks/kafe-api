import { Body, Controller, HttpCode, Inject, Post, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous, AuthService } from '@thallesp/nestjs-better-auth';
import { auth } from '../../infrastructure/auth/better-auth';
import { LoginDto } from '../dtos/auth/login.dto';
import { LoginResponseDto } from '../dtos/responses/auth.response.dto';

@ApiTags('auth')
@AllowAnonymous()
@Throttle({ default: { ttl: 60_000, limit: 5 } })
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService<typeof auth>) { }
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica com e-mail e senha, retorna token Bearer' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto): Promise<{ token: string; user: unknown }> {
    const result = await this.authService.api.signInEmail({
      body: { email: dto.email, password: dto.password },
    });

    if (!result?.token) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return { token: result.token, user: result.user };
  }
}
