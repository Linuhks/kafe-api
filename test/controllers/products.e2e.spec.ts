import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('ProductsController (e2e)', () => {
  const helper = new E2ETestHelper();

  beforeAll(() => helper.setup());
  afterAll(() => helper.teardown());

  describe('GET /api/v1/products', () => {
    it('returns 200 with empty list on fresh database', async () => {
      const res = await request(helper.app.getHttpServer()).get('/api/v1/products');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: [],
        pagination: {
          page: expect.any(Number),
          limit: expect.any(Number),
          total: 0,
          totalPages: expect.any(Number),
        },
      });
    });
  });

  describe('success body shape (no global envelope)', () => {
    it('returns a single product unwrapped and the list as { data, pagination }', async () => {
      const adminToken = await helper.createUserAndLogin({
        email: 'admin@products-shape.com',
        password: 'AdminPass1234!',
        name: 'Admin Shape',
        role: 'ADMIN',
      });
      const category = await request(helper.app.getHttpServer())
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Shape Cafés' });
      expect(category.status).toBe(201);
      const product = await request(helper.app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ categoryId: category.body.id, name: 'Shape Espresso', price: '5.50' });
      expect(product.status).toBe(201);
      expect(product.body).not.toHaveProperty('data');

      const single = await request(helper.app.getHttpServer()).get(
        `/api/v1/products/${product.body.id}`,
      );
      expect(single.status).toBe(200);
      expect(single.body).toMatchObject({ id: product.body.id, name: 'Shape Espresso' });
      expect(single.body).not.toHaveProperty('data');

      const list = await request(helper.app.getHttpServer()).get('/api/v1/products');
      expect(list.status).toBe(200);
      expect(Object.keys(list.body).sort()).toEqual(['data', 'pagination']);
      expect(list.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: product.body.id })]),
      );
      expect(list.body.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });
  });

  describe('POST /api/v1/products', () => {
    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/products')
        .send({ categoryId: '00000000-0000-0000-0000-000000000000', name: 'Espresso', price: '5.50' });

      expect(res.status).toBe(401);
    });
  });
});
