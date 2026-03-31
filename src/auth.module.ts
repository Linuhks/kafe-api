import { Module } from '@nestjs/common';
import { AuthController } from './presentation/controllers/auth.controller.js';

@Module({
  controllers: [AuthController],
})
export class AuthModule {}
