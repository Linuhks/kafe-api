import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

describe('Swagger documentation (e2e)', () => {
  const helper = new E2ETestHelper();
  let document: OpenAPIObject;

  beforeAll(async () => {
    await helper.setup();
    document = SwaggerModule.createDocument(
      helper.app,
      new DocumentBuilder().setTitle('Kafe API').addBearerAuth().build(),
    );
  });
  afterAll(() => helper.teardown());

  // Swagger is the endpoint reference (docs/API.md only holds conventions), so every
  // route must describe itself through @ApiOperation / @ApiResponse.
  it('documents every operation with a summary and a success response', () => {
    const problems: string[] = [];

    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = item[method];
        if (!operation) continue;
        const label = `${method.toUpperCase()} ${path}`;

        if (!operation.summary?.trim()) problems.push(`${label}: missing @ApiOperation summary`);
        const codes = Object.keys(operation.responses ?? {});
        if (!codes.some((code) => code.startsWith('2'))) {
          problems.push(`${label}: missing 2xx @ApiResponse`);
        }
      }
    }

    expect(problems).toEqual([]);
  });

  it('documents 401 on every operation that requires a bearer token', () => {
    const problems: string[] = [];

    for (const [path, item] of Object.entries(document.paths)) {
      for (const method of HTTP_METHODS) {
        const operation = item[method];
        if (!operation?.security?.length) continue;
        if (!('401' in (operation.responses ?? {}))) {
          problems.push(`${method.toUpperCase()} ${path}: protected route without a 401 response`);
        }
      }
    }

    expect(problems).toEqual([]);
  });
});
