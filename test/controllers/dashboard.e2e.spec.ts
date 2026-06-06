import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('DashboardController (e2e)', () => {
  const helper = new E2ETestHelper();
  let adminToken: string;

  beforeAll(async () => {
    await helper.setup();
    adminToken = await helper.createUserAndLogin({
      email: 'admin@dashboard.com',
      password: 'AdminPass1234!',
      name: 'Dashboard Admin',
      role: 'ADMIN',
    });
  });

  afterAll(() => helper.teardown());

  describe('GET /api/v1/dashboard/summary', () => {
    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer()).get('/api/v1/dashboard/summary');

      expect(res.status).toBe(401);
    });

    it('returns summary data for ADMIN', async () => {
      const now = new Date().toISOString();
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(helper.app.getHttpServer())
        .get('/api/v1/dashboard/summary')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ from: past, to: now });

      expect(res.status).toBe(200);
    });
  });
});
