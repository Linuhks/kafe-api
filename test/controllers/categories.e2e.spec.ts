import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('CategoriesController (e2e)', () => {
  const helper = new E2ETestHelper();
  let adminToken: string;
  let createdId: string;

  beforeAll(async () => {
    await helper.setup();
    adminToken = await helper.createUserAndLogin({
      email: 'admin@kafe.com',
      password: 'AdminPass1234!',
      name: 'Admin User',
      role: 'ADMIN',
    });
  });
  afterAll(() => helper.teardown());

  describe('GET /api/v1/categories', () => {
    it('returns 200 with empty list (public)', async () => {
      const res = await request(helper.app.getHttpServer()).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: [],
        pagination: { total: 0 },
      });
    });
  });

  describe('POST /api/v1/categories', () => {
    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/categories')
        .send({ name: 'Cafés' });

      expect(res.status).toBe(401);
    });

    it('creates a category as ADMIN', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cafés', description: 'Cafés especiais' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Cafés' });
      createdId = res.body.id as string;
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('updates a category as ADMIN', async () => {
      const res = await request(helper.app.getHttpServer())
        .patch(`/api/v1/categories/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Cafés Especiais' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ name: 'Cafés Especiais' });
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('deletes a category as ADMIN', async () => {
      const res = await request(helper.app.getHttpServer())
        .delete(`/api/v1/categories/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});
