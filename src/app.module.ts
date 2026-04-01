import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth.module.js';
import { DashboardModule } from './dashboard.module.js';
import { BetterAuthModule } from './infrastructure/auth/better-auth.module.js';
import { DrizzleModule } from './infrastructure/db/drizzle.module.js';
import { InventoryModule } from './inventory.module.js';
import { MenuModule } from './menu.module.js';
import { OrdersModule } from './orders.module.js';
import { UsersModule } from './users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DrizzleModule,
    BetterAuthModule,
    AuthModule,
    UsersModule,
    MenuModule,
    OrdersModule,
    InventoryModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
