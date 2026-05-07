import { describe, expect, it } from 'vitest';
import {
  ConflictError,
  DomainError,
  InsufficientStockError,
  InvalidOrderTransitionError,
  NotFoundError,
} from './domain.error';

describe('DomainError', () => {
  it('should set message, code, and statusCode', () => {
    const error = new DomainError('something went wrong', 'SOME_CODE', 418);
    expect(error.message).toBe('something went wrong');
    expect(error.code).toBe('SOME_CODE');
    expect(error.statusCode).toBe(418);
  });

  it('should be an instance of Error', () => {
    expect(new DomainError('msg', 'CODE', 400)).toBeInstanceOf(Error);
  });

  it('should set name to the constructor name', () => {
    expect(new DomainError('msg', 'CODE', 400).name).toBe('DomainError');
  });
});

describe('NotFoundError', () => {
  it('should produce correct message, code, and statusCode', () => {
    const error = new NotFoundError('Product');
    expect(error.message).toBe('Product not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('should be an instance of DomainError', () => {
    expect(new NotFoundError('X')).toBeInstanceOf(DomainError);
  });

  it('should set name to NotFoundError', () => {
    expect(new NotFoundError('X').name).toBe('NotFoundError');
  });
});

describe('ConflictError', () => {
  it('should produce correct message, code, and statusCode', () => {
    const error = new ConflictError('Email already in use');
    expect(error.message).toBe('Email already in use');
    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(409);
  });

  it('should be an instance of DomainError', () => {
    expect(new ConflictError('msg')).toBeInstanceOf(DomainError);
  });

  it('should set name to ConflictError', () => {
    expect(new ConflictError('msg').name).toBe('ConflictError');
  });
});

describe('InvalidOrderTransitionError', () => {
  it('should produce correct message, code, and statusCode', () => {
    const error = new InvalidOrderTransitionError('RECEIVED', 'READY');
    expect(error.message).toBe('Invalid order status transition from RECEIVED to READY');
    expect(error.code).toBe('INVALID_ORDER_TRANSITION');
    expect(error.statusCode).toBe(400);
  });

  it('should be an instance of DomainError', () => {
    expect(new InvalidOrderTransitionError('A', 'B')).toBeInstanceOf(DomainError);
  });

  it('should set name to InvalidOrderTransitionError', () => {
    expect(new InvalidOrderTransitionError('A', 'B').name).toBe('InvalidOrderTransitionError');
  });
});

describe('InsufficientStockError', () => {
  it('should produce correct message, code, and statusCode', () => {
    const error = new InsufficientStockError('Coffee');
    expect(error.message).toBe('Insufficient stock for ingredient: Coffee');
    expect(error.code).toBe('INSUFFICIENT_STOCK');
    expect(error.statusCode).toBe(400);
  });

  it('should be an instance of DomainError', () => {
    expect(new InsufficientStockError('X')).toBeInstanceOf(DomainError);
  });

  it('should set name to InsufficientStockError', () => {
    expect(new InsufficientStockError('X').name).toBe('InsufficientStockError');
  });
});
