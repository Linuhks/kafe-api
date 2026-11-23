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

  describe('POST /api/v1/users password length', () => {
    it('returns 401 without auth', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .send({ name: 'No Auth', email: 'pwd-noauth@users.com', password: 'TwelveChars1' });

      expect(res.status).toBe(401);
    });

    it('returns 403 for non-ADMIN users', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ name: 'Wrong Role', email: 'pwd-client@users.com', password: 'TwelveChars1' });

      expect(res.status).toBe(403);
    });

    it('rejects an 11-character password with 400 and creates no user', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Short Pwd', email: 'pwd-short@users.com', password: 'ElevenChar1' });

      expect(res.status).toBe(400);
      expect(await helper.getUserRole('pwd-short@users.com')).toBeNull();
    });

    it('accepts a 12-character password and the user can log in', async () => {
      const password = 'TwelveChars1';
      const createRes = await request(helper.app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ok Pwd', email: 'pwd-ok@users.com', password });

      expect(createRes.status).toBe(201);

      const loginRes = await request(helper.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'pwd-ok@users.com', password });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toEqual(expect.any(String));
    });
  });

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
