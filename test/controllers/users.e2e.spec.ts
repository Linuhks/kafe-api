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

  describe('POST /api/v1/users', () => {
    const password = 'CasePass1234!';

    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .send({ name: 'No Auth', email: 'noauth@users.com', password });

      expect(res.status).toBe(401);
    });

    it('returns 403 for non-ADMIN users', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Wrong Role', email: 'wrongrole@users.com', password });

      expect(res.status).toBe(403);
    });

    it('stores a mixed-case email lowercased and the user can log in with any case', async () => {
      const createRes = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Maria Case', email: 'Maria.Case@Users.com', password });

      expect(createRes.status).toBe(201);
      expect(createRes.body).toMatchObject({ email: 'maria.case@users.com' });

      for (const email of ['maria.case@users.com', 'MARIA.CASE@USERS.COM']) {
        const loginRes = await request(helper.app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.token).toEqual(expect.any(String));
      }
    });

    it('returns 409 for an email that differs only by case', async () => {
      const first = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Dup One', email: 'dup@users.com', password });
      expect(first.status).toBe(201);

      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Dup Two', email: 'DUP@Users.com', password });

      expect(res.status).toBe(409);
    });
  });
});
