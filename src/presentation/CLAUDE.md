# src/presentation

HTTP layer — controllers, DTOs, and response standardization.

## Controllers (`controllers/`)

- Inject use cases directly (never repositories)
- Use `@Roles(['ADMIN'])` at class or method level to restrict access
- Use `@CurrentUser()` to get the authenticated user from the request
- Do not wrap return values manually — `TransformInterceptor` handles it

```typescript
@ApiTags('users')
@ApiBearerAuth()
@Roles(['ADMIN'])
@Controller('users')
export class UsersController {
  constructor(private readonly createUser: CreateUserUseCase) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);  // TransformInterceptor wraps the result
  }
}
```

Controllers: `AuthController`, `UsersController`, `CategoriesController`, `ProductsController`, `OrdersController`, `InventoryController`, `DashboardController`.

## DTOs (`dtos/`)

class-validator + `@nestjs/swagger`. Always annotate with `@ApiProperty` / `@ApiPropertyOptional`:

```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'BARISTA', 'CLIENT'], default: 'CLIENT' })
  @IsOptional()
  @IsEnum(['ADMIN', 'BARISTA', 'CLIENT'])
  role: string = 'CLIENT';
}
```

Shared DTOs to reuse:
- `dtos/shared/pagination.dto.ts` — `PaginationDto` with `page` and `limit`
- `dtos/shared/date-range.dto.ts` — `DateRangeDto` with `startDate` and `endDate`

## Decorators (`decorators/`)

- `@CurrentUser()` — extract authenticated user from request (`current-user.decorator.ts`)
- `@Roles(['ADMIN'])` — wrapper around `@thallesp/nestjs-better-auth` (`roles.decorator.ts`)

## Response Format

- **Success**: `TransformInterceptor` wraps all responses automatically — no manual wrapping needed
- **Errors**: `HttpExceptionFilter` catches `DomainError` and maps `error.statusCode` + `error.code` to HTTP response
- Pagination responses: build manually in the controller — `{ data, pagination: { page, limit, total, totalPages } }`

## filters/ and interceptors/

- `filters/http-exception.filter.ts` — converts `DomainError` to standardized error response
- `interceptors/transform.interceptor.ts` — wraps success data in `{ data, timestamp }` envelope
