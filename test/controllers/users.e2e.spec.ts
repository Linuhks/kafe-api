import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('UsersController (e2e)', () => {
  const helper = new E2ETestHelper();
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    await helper.setup();
    adminToken = await helper.createUserAndLogin({
      email: 'admin@users.com',
      password: 'AdminPass1234!',
      name: 'Admin User',
      role: 'ADMIN',
    });
    clientToken = await helper.createUserAndLogin({
      email: 'client@users.com',
      password: 'ClientPass1234!',
      name: 'Client User',
      role: 'CLIENT',
    });
  });

  afterAll(() => helper.teardown());

  describe('GET /api/v1/users', () => {
    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer()).get('/api/v1/users');

      expect(res.status).toBe(401);
    });

    it('returns 403 for non-ADMIN users', async () => {
      const res = await request(helper.app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${clientToken}`);

      expect(res.status).toBe(403);
    });

    it('returns user list for ADMIN', async () => {
      const res = await request(helper.app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        data: expect.any(Array),
        pagination: { total: expect.any(Number) },
      });
    });
  });
});
