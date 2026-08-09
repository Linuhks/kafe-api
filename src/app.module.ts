import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BetterAuthModule } from './infrastructure/auth/better-auth.module';
import { DrizzleModule } from './infrastructure/db/drizzle.module';
import { AuthModule } from './modules/auth.module';
import { DashboardModule } from './modules/dashboard.module';
import { InventoryModule } from './modules/inventory.module';
import { MenuModule } from './modules/menu.module';
import { OrdersModule } from './modules/orders.module';
import { UsersModule } from './modules/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        if (!redisUrl) return { ttl: 60_000 };
        return {
          stores: [new KeyvRedis(redisUrl, { connectionTimeout: 5000 })],
          ttl: 60_000,
        } as never;
      },
    }),
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
