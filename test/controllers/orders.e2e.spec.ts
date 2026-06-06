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
});
