import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import type { OrderStatus } from '../../../domain/entities/order.entity';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['RECEIVED', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED'] })
  @IsEnum(['RECEIVED', 'IN_PREPARATION', 'READY', 'DELIVERED', 'CANCELLED'])
  status: OrderStatus;
}
