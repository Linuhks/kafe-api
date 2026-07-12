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

  describe('access control (security)', () => {
    it('does not allow self-assigning ADMIN role at sign-up', async () => {
      const server = helper.app.getHttpServer();
      const escalateEmail = 'escalate@kafe.com';
      const escalatePassword = 'TestPass1234!';

      // Attempt privilege escalation: pass role in the sign-up body.
      const signUp = await request(server)
        .post('/api/auth/sign-up/email')
        .set('Content-Type', 'application/json')
        .send({
          email: escalateEmail,
          password: escalatePassword,
          name: 'Escalate Attempt',
          role: 'ADMIN',
        });
      // Better-auth rejects the disallowed field (400) or forces the default (CLIENT).
      expect([200, 201, 400]).toContain(signUp.status);

      // The persisted role must never be ADMIN — either the user was not created
      // or was created as CLIENT.
      const persistedRole = await helper.getUserRole(escalateEmail);
      expect(persistedRole).not.toBe('ADMIN');
      expect(persistedRole === null || persistedRole === 'CLIENT').toBe(true);
    });

    it('denies login for a deactivated user', async () => {
      const server = helper.app.getHttpServer();
      const deactivatedEmail = 'deactivated@kafe.com';
      const deactivatedPassword = 'TestPass1234!';

      await request(server)
        .post('/api/auth/sign-up/email')
        .set('Content-Type', 'application/json')
        .send({ email: deactivatedEmail, password: deactivatedPassword, name: 'Deactivated' });

      await helper.deactivateUser(deactivatedEmail);

      const res = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: deactivatedEmail, password: deactivatedPassword });

      expect(res.status).toBe(401);
      expect(res.body.token).toBeUndefined();
    });

    it('still allows an active user to log in', async () => {
      const server = helper.app.getHttpServer();
      const activeEmail = 'active_user@kafe.com';
      const activePassword = 'TestPass1234!';

      await request(server)
        .post('/api/auth/sign-up/email')
        .set('Content-Type', 'application/json')
        .send({ email: activeEmail, password: activePassword, name: 'Active User' });

      const res = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: activeEmail, password: activePassword });

      expect(res.status).toBe(200);
      expect(typeof res.body.token).toBe('string');
      expect(res.body.token.length).toBeGreaterThan(0);
    });
  });
});
