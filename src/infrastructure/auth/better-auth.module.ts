import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './better-auth';

@Module({
  imports: [AuthModule.forRoot({ auth })],
  exports: [AuthModule],
})
export class BetterAuthModule {}
