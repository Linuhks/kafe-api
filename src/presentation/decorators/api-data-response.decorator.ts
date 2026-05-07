import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';

export function ApiDataResponse<T>(type: Type<T>, status = 200) {
  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      schema: {
        properties: {
          data: { $ref: getSchemaPath(type) },
        },
        required: ['data'],
      },
    }),
  );
}
