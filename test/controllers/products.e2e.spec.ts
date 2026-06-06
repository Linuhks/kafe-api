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

  describe('POST /api/v1/products', () => {
    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/products')
        .send({ categoryId: '00000000-0000-0000-0000-000000000000', name: 'Espresso', price: '5.50' });

      expect(res.status).toBe(401);
    });
  });
});
