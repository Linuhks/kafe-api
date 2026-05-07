import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiPaginatedResponse<T>(type: Type<T>) {
  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status: 200,
      schema: {
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(type) } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              limit: { type: 'number' },
              total: { type: 'number' },
              totalPages: { type: 'number' },
            },
            required: ['page', 'limit', 'total', 'totalPages'],
          },
        },
        required: ['data', 'pagination'],
      },
    }),
  );
}
