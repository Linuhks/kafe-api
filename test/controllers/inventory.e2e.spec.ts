import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('InventoryController (e2e)', () => {
  const helper = new E2ETestHelper();
  let adminToken: string;
  let ingredientId: string;

  beforeAll(async () => {
    await helper.setup();
    adminToken = await helper.createUserAndLogin({
      email: 'admin@inventory.com',
      password: 'AdminPass1234!',
      name: 'Admin',
      role: 'ADMIN',
    });

    const res = await request(helper.app.getHttpServer())
      .post('/api/v1/inventory')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Coffee Beans', unit: 'kg', currentStock: '10.000', minimumStock: '2.000' });

    ingredientId = res.body.id as string;
  });

  afterAll(() => helper.teardown());

  describe('POST /api/v1/inventory/:id/restock', () => {
    it('adds stock movement (ADMIN)', async () => {
      const res = await request(helper.app.getHttpServer())
        .post(`/api/v1/inventory/${ingredientId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: '5.000', note: 'Weekly delivery' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Coffee Beans' });
    });

    it('returns 400 for invalid quantity format', async () => {
      const res = await request(helper.app.getHttpServer())
        .post(`/api/v1/inventory/${ingredientId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: '-5', note: 'Bad value' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/inventory', () => {
    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer()).get('/api/v1/inventory');

      expect(res.status).toBe(401);
    });
  });
});
