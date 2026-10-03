import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('OrdersController (e2e)', () => {
  const helper = new E2ETestHelper();
  let adminToken: string;
  let baristaToken: string;
  let clientToken: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    await helper.setup();

    adminToken = await helper.createUserAndLogin({
      email: 'admin@orders.com',
      password: 'AdminPass1234!',
      name: 'Admin',
      role: 'ADMIN',
    });
    baristaToken = await helper.createUserAndLogin({
      email: 'barista@orders.com',
      password: 'BaristaPass1234!',
      name: 'Barista',
      role: 'BARISTA',
    });
    clientToken = await helper.createUserAndLogin({
      email: 'client@orders.com',
      password: 'ClientPass1234!',
      name: 'Client',
      role: 'CLIENT',
    });

    // Create a category and product to use in orders
    const catRes = await request(helper.app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Drinks' });

    const prodRes = await request(helper.app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ categoryId: catRes.body.id, name: 'Espresso', price: '5.00' });

    productId = prodRes.body.id as string;
  });

  afterAll(() => helper.teardown());

  describe('POST /api/v1/orders', () => {
    it('creates an order (anonymous)', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/orders')
        .send({ clientName: 'Walk-in', items: [{ productId, quantity: 1 }] });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ status: 'RECEIVED' });
      orderId = res.body.id as string;
    });

    it('creates an order as CLIENT', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ items: [{ productId, quantity: 2 }] });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ status: 'RECEIVED' });
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('BARISTA can advance order status', async () => {
      const res = await request(helper.app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${baristaToken}`)
        .send({ status: 'IN_PREPARATION' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ status: 'IN_PREPARATION' });
    });

    it('CLIENT cannot update order status (403)', async () => {
      const res = await request(helper.app.getHttpServer())
        .patch(`/api/v1/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ status: 'READY' });

      expect(res.status).toBe(403);
    });
  });

  describe('stock consistency on status changes', () => {
    let stockProductId: string;
    let ingredientId: string;

    const server = () => helper.app.getHttpServer();
    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

    const stockOf = async (): Promise<string> => {
      const res = await request(server()).get(`/api/v1/inventory/${ingredientId}`).set(auth(adminToken));
      return res.body.currentStock as string;
    };
    const createOrder = async (quantity: number): Promise<string> => {
      const res = await request(server())
        .post('/api/v1/orders')
        .send({ clientName: 'Stock test', items: [{ productId: stockProductId, quantity }] });
      return res.body.id as string;
    };
    const setStatus = (id: string, status: string) =>
      request(server()).patch(`/api/v1/orders/${id}/status`).set(auth(baristaToken)).send({ status });

    beforeAll(async () => {
      const cat = await request(server()).post('/api/v1/categories').set(auth(adminToken)).send({ name: 'Stock drinks' });
      const prod = await request(server())
        .post('/api/v1/products')
        .set(auth(adminToken))
        .send({ categoryId: cat.body.id, name: 'Stock latte', price: '6.00' });
      stockProductId = prod.body.id as string;
      const ing = await request(server())
        .post('/api/v1/inventory')
        .set(auth(adminToken))
        .send({ name: 'Stock milk', unit: 'ml', currentStock: '100.000', minimumStock: '1.000' });
      ingredientId = ing.body.id as string;
      await request(server())
        .post(`/api/v1/products/${stockProductId}/ingredients`)
        .set(auth(adminToken))
        .send({ ingredientId, quantity: '10.000' });
    });

    it('cancelling an IN_PREPARATION order restores stock and records a RESTOCK movement', async () => {
      const id = await createOrder(2);

      expect((await setStatus(id, 'IN_PREPARATION')).status).toBe(200);
      expect(await stockOf()).toBe('80.000');

      const cancel = await setStatus(id, 'CANCELLED');
      expect(cancel.status).toBe(200);
      expect(await stockOf()).toBe('100.000');

      const movements = await request(server())
        .get('/api/v1/inventory/movements')
        .query({ orderId: id })
        .set(auth(adminToken));
      const types = (movements.body.data as { type: string; quantity: string }[]).map((m) => m.type).sort();
      expect(types).toEqual(['DEDUCTION', 'RESTOCK']);
    });

    it('cancelling a RECEIVED order does not change stock', async () => {
      const id = await createOrder(1);

      expect((await setStatus(id, 'CANCELLED')).status).toBe(200);
      expect(await stockOf()).toBe('100.000');
    });

    it('concurrent IN_PREPARATION requests deduct stock only once', async () => {
      const id = await createOrder(1);

      const results = await Promise.all([setStatus(id, 'IN_PREPARATION'), setStatus(id, 'IN_PREPARATION')]);

      const statuses = results.map((r) => r.status).sort();
      expect(statuses[0]).toBe(200);
      // the loser is a 409 (lost the conditional update) or a 400 (read the order after the winner committed)
      expect([400, 409]).toContain(statuses[1]);
      expect(await stockOf()).toBe('90.000');
    });

    it('insufficient stock leaves the order RECEIVED and stock unchanged', async () => {
      const id = await createOrder(50);
      const before = await stockOf();

      const res = await setStatus(id, 'IN_PREPARATION');

      expect(res.status).toBe(400);
      expect(await stockOf()).toBe(before);
      const order = await request(server()).get(`/api/v1/orders/${id}`).set(auth(adminToken));
      expect(order.body.status).toBe('RECEIVED');
    });
  });
});
