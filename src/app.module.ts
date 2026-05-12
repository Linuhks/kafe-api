import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth.module';
import { DashboardModule } from './dashboard.module';
import { BetterAuthModule } from './infrastructure/auth/better-auth.module';
import { DrizzleModule } from './infrastructure/db/drizzle.module';
import { InventoryModule } from './inventory.module';
import { MenuModule } from './menu.module';
import { OrdersModule } from './orders.module';
import { UsersModule } from './users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    DrizzleModule,
    BetterAuthModule,
    AuthModule,
    UsersModule,
    MenuModule,
    OrdersModule,
    InventoryModule,
    DashboardModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
