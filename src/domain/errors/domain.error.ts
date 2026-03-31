export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class InvalidOrderTransitionError extends DomainError {
  constructor(from: string, to: string) {
    super(
      `Invalid order status transition from ${from} to ${to}`,
      'INVALID_ORDER_TRANSITION',
      400,
    );
  }
}

export class InsufficientStockError extends DomainError {
  constructor(ingredient: string) {
    super(
      `Insufficient stock for ingredient: ${ingredient}`,
      'INSUFFICIENT_STOCK',
      400,
    );
  }
}
