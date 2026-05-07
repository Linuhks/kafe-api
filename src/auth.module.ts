import { Module } from '@nestjs/common';
import { BetterAuthModule } from './infrastructure/auth/better-auth.module';
import { AuthController } from './presentation/controllers/auth.controller';

@Module({
  imports: [BetterAuthModule],
  controllers: [AuthController],
})
export class AuthModule { }
