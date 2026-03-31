import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DrizzleModule } from './infrastructure/db/drizzle.module.js';
import { BetterAuthModule } from './infrastructure/auth/better-auth.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    BetterAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
