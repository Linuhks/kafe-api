import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConflictError,
  InsufficientStockError,
  InvalidOrderTransitionError,
  NotFoundError,
} from '../../domain/errors/domain.error.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

function buildHost() {
  const jsonMock = vi.fn();
  const request = { url: '/api/v1/test' };
  const response = {
    status: vi.fn().mockReturnThis(),
    json: jsonMock,
  };
  const httpCtx = {
    getResponse: vi.fn().mockReturnValue(response),
    getRequest: vi.fn().mockReturnValue(request),
  };
  const host = {
    switchToHttp: vi.fn().mockReturnValue(httpCtx),
  } as unknown as ArgumentsHost;
  return { host, response, jsonMock };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  describe('DomainError path', () => {
    it('should map NotFoundError to 404 NOT_FOUND', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(new NotFoundError('Order'), host);
      expect(response.status).toHaveBeenCalledWith(404);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Order not found');
    });

    it('should map ConflictError to 409 CONFLICT', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(new ConflictError('Already exists'), host);
      expect(response.status).toHaveBeenCalledWith(409);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('CONFLICT');
      expect(body.error.message).toBe('Already exists');
    });

    it('should map InvalidOrderTransitionError to 400', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(new InvalidOrderTransitionError('RECEIVED', 'READY'), host);
      expect(response.status).toHaveBeenCalledWith(400);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('INVALID_ORDER_TRANSITION');
    });

    it('should map InsufficientStockError to 400', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(new InsufficientStockError('Milk'), host);
      expect(response.status).toHaveBeenCalledWith(400);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should include timestamp and path in error response', () => {
      const { host, jsonMock } = buildHost();
      filter.catch(new NotFoundError('User'), host);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.timestamp).toBeDefined();
      expect(body.error.path).toBe('/api/v1/test');
    });

    it('should not include details when none present', () => {
      const { host, jsonMock } = buildHost();
      filter.catch(new NotFoundError('User'), host);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.details).toBeUndefined();
    });
  });

  describe('HttpException path', () => {
    it('should handle HttpException with string response', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);
      expect(response.status).toHaveBeenCalledWith(404);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Not found');
    });

    it('should handle HttpException with object response', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(
        new HttpException({ message: 'Forbidden resource' }, HttpStatus.FORBIDDEN),
        host,
      );
      expect(response.status).toHaveBeenCalledWith(403);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Forbidden resource');
    });

    it('should handle 401 UNAUTHORIZED', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED), host);
      expect(response.status).toHaveBeenCalledWith(401);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Validation error path (structured body.details)', () => {
    it('should extract field and message from body.details', () => {
      const { host, response, jsonMock } = buildHost();
      const details = [
        { field: 'email', message: 'email must be an email' },
        { field: 'name', message: 'name must be longer than or equal to 2 characters' },
      ];
      filter.catch(
        new HttpException({ message: 'Validation failed', details }, HttpStatus.BAD_REQUEST),
        host,
      );
      expect(response.status).toHaveBeenCalledWith(400);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.details).toEqual(details);
    });

    it('should handle legacy string-array message format', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(
        new HttpException(
          { message: ['name must be longer than or equal to 2 characters'] },
          HttpStatus.BAD_REQUEST,
        ),
        host,
      );
      expect(response.status).toHaveBeenCalledWith(400);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.details).toEqual([
        { message: 'name must be longer than or equal to 2 characters' },
      ]);
    });
  });

  describe('Unknown error path', () => {
    it('should return 500 INTERNAL_ERROR for plain Error', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch(new Error('Something exploded'), host);
      expect(response.status).toHaveBeenCalledWith(500);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('Internal server error');
    });

    it('should return 500 for thrown string', () => {
      const { host, response, jsonMock } = buildHost();
      filter.catch('unexpected string throw', host);
      expect(response.status).toHaveBeenCalledWith(500);
      const body = jsonMock.mock.calls[0][0];
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should return 500 for null', () => {
      const { host, response } = buildHost();
      filter.catch(null, host);
      expect(response.status).toHaveBeenCalledWith(500);
    });
  });
});
