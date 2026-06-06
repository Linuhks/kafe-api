import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('AuthController (e2e)', () => {
  const helper = new E2ETestHelper();

  beforeAll(() => helper.setup());
  afterAll(() => helper.teardown());

  const email = 'auth_test@kafe.com';
  const password = 'TestPass1234!';
  const name = 'Auth Test User';

  describe('POST /api/auth/sign-up/email', () => {
    it('creates a new user', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .set('Content-Type', 'application/json')
        .send({ email, password, name });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ user: { email, name } });
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns a bearer token on valid credentials', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(0);
    });

    it('returns 401 on invalid credentials', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrongpassword!!' });

      expect(res.status).toBe(401);
    });
  });

  describe('unauthenticated access to protected route', () => {
    it('returns 401 on GET /api/v1/users without token', async () => {
      const res = await request(helper.app.getHttpServer()).get('/api/v1/users');

      expect(res.status).toBe(401);
    });
  });
});
