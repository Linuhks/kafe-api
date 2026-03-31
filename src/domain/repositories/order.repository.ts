import { Order, OrderStatus } from '../entities/order.entity.js';

export interface CreateOrderItemData {
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export interface CreateOrderData {
  clientId?: string;
  clientName?: string;
  notes?: string;
  totalAmount: string;
  items: CreateOrderItemData[];
}

export interface ListOrdersFilter {
  status?: OrderStatus;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export abstract class IOrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  abstract findAll(filter: ListOrdersFilter): Promise<{ data: Order[]; total: number }>;
  abstract findByClientId(clientId: string, page: number, limit: number): Promise<{ data: Order[]; total: number }>;
  abstract findQueue(): Promise<Order[]>;
  abstract create(data: CreateOrderData): Promise<Order>;
  abstract updateStatus(id: string, status: OrderStatus, baristaId?: string): Promise<Order>;
}
