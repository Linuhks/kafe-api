import { Injectable } from '@nestjs/common';
import { eq, and, inArray, gte, lte, desc, asc, count, ne, sql, SQL } from 'drizzle-orm';
import { DrizzleService } from '../drizzle.service.js';
import { orders, orderItems } from '../schema.js';
import { Order, OrderStatus } from '../../../domain/entities/order.entity.js';
import { OrderItem } from '../../../domain/entities/order-item.entity.js';
import {
  IOrderRepository,
  CreateOrderData,
  ListOrdersFilter,
  DateRange,
  OrderSummaryData,
  TopProductData,
  PeakHourData,
} from '../../../domain/repositories/order.repository.js';

function mapToOrderItem(row: typeof orderItems.$inferSelect): OrderItem {
  return new OrderItem(
    row.id,
    row.orderId,
    row.productId,
    row.productName,
    row.unitPrice,
    row.quantity,
    row.subtotal,
  );
}

function mapToOrder(row: typeof orders.$inferSelect, items: OrderItem[]): Order {
  return new Order(
    row.id,
    row.clientId,
    row.clientName,
    row.baristaId,
    row.status as OrderStatus,
    row.notes,
    row.totalAmount,
    items,
    row.createdAt,
    row.updatedAt,
  );
}

@Injectable()
export class DrizzleOrderRepository extends IOrderRepository {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  private get db() {
    return this.drizzleService.db;
  }

  private async loadItemsForOrders(orderIds: string[]): Promise<Map<string, OrderItem[]>> {
    if (orderIds.length === 0) return new Map();
    const rows = await this.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));
    const map = new Map<string, OrderItem[]>();
    for (const row of rows) {
      const arr = map.get(row.orderId) ?? [];
      arr.push(mapToOrderItem(row));
      map.set(row.orderId, arr);
    }
    return map;
  }

  async findById(id: string): Promise<Order | null> {
    const rows = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!rows[0]) return null;
    const itemsMap = await this.loadItemsForOrders([id]);
    return mapToOrder(rows[0], itemsMap.get(id) ?? []);
  }

  async findAll(filter: ListOrdersFilter): Promise<{ data: Order[]; total: number }> {
    const conditions: SQL[] = [];
    if (filter.status) conditions.push(eq(orders.status, filter.status));
    if (filter.from) conditions.push(gte(orders.createdAt, new Date(filter.from)));
    if (filter.to) conditions.push(lte(orders.createdAt, new Date(filter.to)));
    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (filter.page - 1) * filter.limit;

    const [orderRows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(filter.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(orders).where(where),
    ]);

    const itemsMap = await this.loadItemsForOrders(orderRows.map((r) => r.id));
    return {
      data: orderRows.map((r) => mapToOrder(r, itemsMap.get(r.id) ?? [])),
      total: Number(countRow.total),
    };
  }

  async findByClientId(
    clientId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Order[]; total: number }> {
    const offset = (page - 1) * limit;
    const where = eq(orders.clientId, clientId);
    const [orderRows, [countRow]] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(orders).where(where),
    ]);
    const itemsMap = await this.loadItemsForOrders(orderRows.map((r) => r.id));
    return {
      data: orderRows.map((r) => mapToOrder(r, itemsMap.get(r.id) ?? [])),
      total: Number(countRow.total),
    };
  }

  async findQueue(): Promise<Order[]> {
    const orderRows = await this.db
      .select()
      .from(orders)
      .where(inArray(orders.status, ['RECEIVED', 'IN_PREPARATION']))
      .orderBy(asc(orders.createdAt));
    const itemsMap = await this.loadItemsForOrders(orderRows.map((r) => r.id));
    return orderRows.map((r) => mapToOrder(r, itemsMap.get(r.id) ?? []));
  }

  async create(data: CreateOrderData): Promise<Order> {
    const [orderRow] = await this.db
      .insert(orders)
      .values({
        clientId: data.clientId ?? null,
        clientName: data.clientName ?? null,
        notes: data.notes ?? null,
        totalAmount: data.totalAmount,
        status: 'RECEIVED',
      })
      .returning();

    const itemRows =
      data.items.length > 0
        ? await this.db
            .insert(orderItems)
            .values(
              data.items.map((item) => ({
                orderId: orderRow.id,
                productId: item.productId,
                productName: item.productName,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                subtotal: item.subtotal,
              })),
            )
            .returning()
        : [];

    return mapToOrder(orderRow, itemRows.map(mapToOrderItem));
  }

  async updateStatus(id: string, status: OrderStatus, baristaId?: string): Promise<Order> {
    const values: Partial<typeof orders.$inferInsert> = { status, updatedAt: new Date() };
    if (baristaId !== undefined) values.baristaId = baristaId;
    await this.db.update(orders).set(values).where(eq(orders.id, id));
    return this.findById(id) as Promise<Order>;
  }

  async getSummary(dateRange: DateRange): Promise<OrderSummaryData> {
    const conditions: SQL[] = [];
    if (dateRange.from) conditions.push(gte(orders.createdAt, new Date(dateRange.from)));
    if (dateRange.to) conditions.push(lte(orders.createdAt, new Date(dateRange.to)));
    const where = conditions.length ? and(...conditions) : undefined;

    const [totalsRow] = await this.db
      .select({
        totalOrders: count(),
        totalRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${orders.status} != 'CANCELLED' THEN ${orders.totalAmount}::numeric ELSE 0 END), 0)`,
        avgOrderValue: sql<string>`COALESCE(AVG(CASE WHEN ${orders.status} != 'CANCELLED' THEN ${orders.totalAmount}::numeric END), 0)`,
      })
      .from(orders)
      .where(where);

    const statusRows = await this.db
      .select({ status: orders.status, cnt: count() })
      .from(orders)
      .where(where)
      .groupBy(orders.status);

    const ordersByStatus = {
      RECEIVED: 0,
      IN_PREPARATION: 0,
      READY: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    } as Record<OrderStatus, number>;

    for (const row of statusRows) {
      ordersByStatus[row.status as OrderStatus] = Number(row.cnt);
    }

    return {
      totalOrders: Number(totalsRow.totalOrders),
      totalRevenue: parseFloat(totalsRow.totalRevenue).toFixed(2),
      avgOrderValue: parseFloat(totalsRow.avgOrderValue).toFixed(2),
      ordersByStatus,
    };
  }

  async getTopProducts(limit: number, dateRange: DateRange): Promise<TopProductData[]> {
    const conditions: SQL[] = [ne(orders.status, 'CANCELLED')];
    if (dateRange.from) conditions.push(gte(orders.createdAt, new Date(dateRange.from)));
    if (dateRange.to) conditions.push(lte(orders.createdAt, new Date(dateRange.to)));

    const rows = await this.db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        quantitySold: sql<number>`SUM(${orderItems.quantity})::int`,
        revenue: sql<string>`SUM(${orderItems.subtotal}::numeric)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(...conditions))
      .groupBy(orderItems.productId, orderItems.productName)
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(limit);

    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      quantitySold: Number(r.quantitySold),
      revenue: parseFloat(r.revenue).toFixed(2),
    }));
  }

  async getPeakHours(dateRange: DateRange): Promise<PeakHourData[]> {
    const conditions: SQL[] = [];
    if (dateRange.from) conditions.push(gte(orders.createdAt, new Date(dateRange.from)));
    if (dateRange.to) conditions.push(lte(orders.createdAt, new Date(dateRange.to)));
    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt})::int`,
        orderCount: count(),
      })
      .from(orders)
      .where(where)
      .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`)
      .orderBy(desc(count()));

    return rows.map((r) => ({
      hour: Number(r.hour),
      orderCount: Number(r.orderCount),
    }));
  }
}
