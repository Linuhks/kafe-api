# Code Guide

Conventions, patterns, and contribution flow for `kafe-api`.

---

## Development commands

```bash
pnpm run start:dev     # Start the API with hot reload (watch mode)
pnpm run build         # Compile TypeScript to dist/

pnpm run test                              # Run unit tests
pnpm run test:watch                        # Tests in watch mode
pnpm run test:cov                          # Tests with coverage report
pnpm run test:e2e                          # End-to-end tests (requires docker compose up -d; CREATEDB privilege on the PostgreSQL user; PostgreSQL ≥ 13 for DROP DATABASE ... WITH (FORCE))
pnpm run test:e2e:watch                    # E2E tests in watch mode
pnpm run test -- path/to/file.spec.ts      # Single file

pnpm run lint          # Biome linter with auto-fix
pnpm run check         # Biome full check (format + lint) with auto-fix
pnpm run format        # Biome formatter

pnpm run seed          # Seed the database with sample data
pnpm run db:studio     # Open Drizzle Studio in the browser (database UI)
pnpm run db:migrate    # Apply pending Drizzle migrations
```

Prerequisite: `docker compose up -d` to start PostgreSQL (port 5432) and Redis (port 6379). Set `REDIS_URL=redis://localhost:6379` in `.env`.

The **mandatory gate** after every subtask and every task:

```bash
pnpm lint && pnpm check && pnpm test
```

All three must pass before committing. `test:e2e` runs in pre-push (Husky) and CI — not in the per-subtask loop.

---

## Dependency injection pattern

Use cases **do not use** NestJS's `@Injectable()`. They are manually instantiated via `useFactory` inside the module.

```typescript
// ✅ Correct
{
  provide: CreateUserUseCase,
  useFactory: (repo: IUserRepository) => new CreateUserUseCase(repo),
  inject: [IUserRepository],
}

// ❌ Avoid — use cases must not depend on the NestJS container
@Injectable()
export class CreateUserUseCase { ... }
```

Repositories follow the opposite pattern: the interface (an `abstract class` used as the DI token) is registered with `useClass` pointing to the Drizzle implementation.

```typescript
{ provide: IUserRepository, useClass: DrizzleUserRepository }
```

Why `abstract class` instead of `interface`? TypeScript interfaces are erased at runtime — NestJS needs a runtime value as the injection token.

---

## The Either pattern

All use cases return `Either<DomainError, T>` instead of throwing. The domain layer never raises exceptions; controllers unwrap and throw only at the HTTP boundary, where `HttpExceptionFilter` converts the error into a standardized response.

Defined in `src/domain/either.ts`:

```typescript
export type Either<L, R> = Left<L> | Right<R>;

export const left  = <L>(value: L): Left<L>  => new Left(value);
export const right = <R>(value: R): Right<R> => new Right(value);
```

### Returning from a use case

```typescript
async execute(data: CreateUserData): Promise<Either<ConflictError, User>> {
  const existing = await this.userRepo.findByEmail(data.email);
  if (existing) return left(new ConflictError('Email already in use'));

  const user = await this.userRepo.create(data);
  return right(user);
}
```

### Composing use cases

Propagate the `Left` branch as-is — never re-wrap:

```typescript
const deductResult = await this.deductForOrder.execute(order);
if (deductResult.isLeft()) return left(deductResult.value);
```

### Unwrapping in a controller

```typescript
const result = await this.createOrder.execute(dto);
if (result.isLeft()) throw result.value;   // HttpExceptionFilter handles it
return result.value;
```

`DomainError` carries `statusCode` and `code`, which the filter maps directly to the HTTP response.

---

## Naming conventions

| Type | Suffix | Example |
|---|---|---|
| Domain entity | `.entity.ts` | `order.entity.ts` → `Order` |
| Repository interface | `.repository.ts` | `user.repository.ts` → `IUserRepository` |
| Use case | `.use-case.ts` | `create-user.use-case.ts` → `CreateUserUseCase` |
| Drizzle implementation | `drizzle-<name>.repository.ts` | `DrizzleUserRepository` |
| Test fake | `in-memory-<name>.repository.ts` | `InMemoryUserRepository` |
| Controller | `.controller.ts` | `users.controller.ts` → `UsersController` |
| DTO | `.dto.ts` | `create-user.dto.ts` → `CreateUserDto` |
| Module | `.module.ts` | `users.module.ts` → `UsersModule` |

All files: **kebab-case**. All classes: **PascalCase**.

---

## Where to create each file type

```
src/
├── domain/
│   ├── entities/          ← new business entities
│   ├── repositories/      ← new repository interfaces (abstract class)
│   └── errors/            ← new typed domain errors
│
├── application/use-cases/
│   └── <module>/          ← new use cases (e.g. menu/, orders/)
│
├── infrastructure/
│   └── db/repositories/   ← Drizzle repository implementations
│
└── presentation/
    ├── controllers/       ← new HTTP controllers
    └── dtos/              ← input and output DTOs

test/
├── repositories/          ← in-memory fakes for unit tests (imported via @test/*)
├── controllers/           ← E2E suites (<resource>.e2e.spec.ts)
└── helpers/               ← E2ETestHelper and global setup
```

The `@test/*` path alias maps to `test/*` at the project root. Use it in spec files:

```typescript
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository';
```

---

## Adding a use case

### Step 1 — Extend the repository interface (if needed)

`src/domain/repositories/user.repository.ts`:

```typescript
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export abstract class IUserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract create(data: CreateUserData): Promise<User>;
  // ...
}
```

Co-locate input data types in the same file as the interface they belong to.

### Step 2 — Implement the use case

`src/application/use-cases/users/create-user.use-case.ts`:

```typescript
import { Either, left, right } from '../../../domain/either';
import { User } from '../../../domain/entities/user.entity';
import { ConflictError } from '../../../domain/errors/domain.error';
import { CreateUserData, IUserRepository } from '../../../domain/repositories/user.repository';

export class CreateUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(data: CreateUserData): Promise<Either<ConflictError, User>> {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) return left(new ConflictError('Email already in use'));

    const user = await this.userRepo.create(data);
    return right(user);
  }
}
```

No `@Injectable()`. No `@nestjs/*` imports. Depend on the interface, never on `DrizzleUserRepository`.

### Step 3 — Write the unit test

`src/application/use-cases/users/create-user.use-case.spec.ts`:

```typescript
import { InMemoryUserRepository } from '@test/repositories/in-memory-user.repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError } from '../../../domain/errors/domain.error';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let userRepo: InMemoryUserRepository;
  let sut: CreateUserUseCase;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    sut = new CreateUserUseCase(userRepo);
  });

  it('should create a user and persist it', async () => {
    const result = await sut.execute({
      name: 'Ana',
      email: 'ana@example.com',
      password: 'senha123',
      role: 'CLIENT',
    });

    expect(result.isRight()).toBe(true);
    expect(result.value.email).toBe('ana@example.com');
    expect(userRepo.items).toHaveLength(1);
  });

  it('should return Left(ConflictError) if email already exists', async () => {
    await sut.execute({ name: 'Ana', email: 'ana@example.com', password: 'x', role: 'CLIENT' });
    const result = await sut.execute({ name: 'B', email: 'ana@example.com', password: 'y', role: 'ADMIN' });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ConflictError);
  });
});
```

No NestJS bootstrapping, no real database. `sut` (system under test) is the canonical local variable name.

### Step 4 — Register in the feature module

`src/users.module.ts`:

```typescript
{
  provide: CreateUserUseCase,
  useFactory: (repo: IUserRepository) => new CreateUserUseCase(repo),
  inject: [IUserRepository],
},
```

### Step 5 — Inject into the controller

```typescript
constructor(private readonly createUser: CreateUserUseCase) {}

@Post()
async create(@Body() dto: CreateUserDto) {
  const result = await this.createUser.execute(dto);
  if (result.isLeft()) throw result.value;
  return result.value;
}
```

### Step 6 — Run the gate

```bash
pnpm lint && pnpm check && pnpm test
```

Then commit. One commit per use case.

---

## Adding a new feature module

Walkthrough for introducing a brand-new resource — e.g. a `Coupon`. Skip steps that already exist.

### Step 1 — Entity

`src/domain/entities/coupon.entity.ts`:

```typescript
export class Coupon {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly discountPercent: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
```

Immutable: all fields `readonly`, no business methods (push behavior into use cases unless it's pure invariant logic — see `Order.validateTransition` for a counter-example).

### Step 2 — Repository interface

`src/domain/repositories/coupon.repository.ts`:

```typescript
import { Coupon } from '../entities/coupon.entity';

export interface CreateCouponData { code: string; discountPercent: number }
export interface UpdateCouponData { discountPercent?: number; isActive?: boolean }

export abstract class ICouponRepository {
  abstract findById(id: string): Promise<Coupon | null>;
  abstract findByCode(code: string): Promise<Coupon | null>;
  abstract create(data: CreateCouponData): Promise<Coupon>;
  abstract update(id: string, data: UpdateCouponData): Promise<Coupon>;
}
```

### Step 3 — In-memory fake

`test/repositories/in-memory-coupon.repository.ts`:

```typescript
import { Coupon } from '../../src/domain/entities/coupon.entity';
import {
  type CreateCouponData,
  ICouponRepository,
  type UpdateCouponData,
} from '../../src/domain/repositories/coupon.repository';

export class InMemoryCouponRepository extends ICouponRepository {
  items: Coupon[] = [];
  private counter = 0;

  async findById(id: string): Promise<Coupon | null> {
    return this.items.find((c) => c.id === id) ?? null;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.items.find((c) => c.code === code) ?? null;
  }

  async create(data: CreateCouponData): Promise<Coupon> {
    const coupon = new Coupon(
      `coupon-${++this.counter}`,
      data.code,
      data.discountPercent,
      true,
      new Date(),
    );
    this.items.push(coupon);
    return coupon;
  }

  async update(id: string, data: UpdateCouponData): Promise<Coupon> {
    const idx = this.items.findIndex((c) => c.id === id);
    const existing = this.items[idx];
    const updated = new Coupon(
      existing.id,
      existing.code,
      data.discountPercent ?? existing.discountPercent,
      data.isActive ?? existing.isActive,
      existing.createdAt,
    );
    this.items[idx] = updated;
    return updated;
  }
}
```

Expose `items` as a public field so tests can assert against it directly.

### Step 4 — Drizzle schema

Append to `src/infrastructure/db/schema.ts`:

```typescript
export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 64 }).notNull().unique(),
  discountPercent: integer('discount_percent').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

Generate and apply the migration — see **Editing the Drizzle schema** below.

### Step 5 — Drizzle repository

`src/infrastructure/db/repositories/drizzle-coupon.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Coupon } from '../../../domain/entities/coupon.entity';
import {
  type CreateCouponData,
  ICouponRepository,
  type UpdateCouponData,
} from '../../../domain/repositories/coupon.repository';
import { coupons } from '../schema';
import { DrizzleService } from '../drizzle.service';

function mapToCoupon(row: typeof coupons.$inferSelect): Coupon {
  return new Coupon(row.id, row.code, row.discountPercent, row.isActive, row.createdAt);
}

@Injectable()
export class DrizzleCouponRepository extends ICouponRepository {
  private readonly db: DrizzleService['db'];

  constructor(readonly drizzleService: DrizzleService) {
    super();
    this.db = drizzleService.db;
  }

  async findById(id: string): Promise<Coupon | null> {
    const rows = await this.db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return rows[0] ? mapToCoupon(rows[0]) : null;
  }

  // ...remaining methods follow the same mapToCoupon + drizzleService.db pattern
}
```

Always provide a local `mapToXxx()` function. Use `drizzleService.db` for business tables; reserve `drizzleService.authDb` for tables in `auth-schema.ts`.

### Step 6 — Use cases

For each operation (create, list, get, update, deactivate, ...), follow **Adding a use case** above.

### Step 7 — DTO and controller

`src/presentation/dtos/coupons/create-coupon.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'WELCOME10' })
  @IsString()
  @MinLength(3)
  code: string;

  @ApiProperty({ example: 10, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  discountPercent: number;
}
```

`src/presentation/controllers/coupons.controller.ts`:

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateCouponUseCase } from '../../application/use-cases/coupons/create-coupon.use-case';
import { Roles } from '../decorators/roles.decorator';
import { CreateCouponDto } from '../dtos/coupons/create-coupon.dto';

@ApiTags('coupons')
@ApiBearerAuth()
@Roles(['ADMIN'])
@Controller('coupons')
export class CouponsController {
  constructor(private readonly createCoupon: CreateCouponUseCase) {}

  @Post()
  async create(@Body() dto: CreateCouponDto) {
    const result = await this.createCoupon.execute(dto);
    if (result.isLeft()) throw result.value;
    return result.value;
  }
}
```

### Step 8 — Wire the module

`src/coupons.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CreateCouponUseCase } from './application/use-cases/coupons/create-coupon.use-case';
import { ICouponRepository } from './domain/repositories/coupon.repository';
import { DrizzleCouponRepository } from './infrastructure/db/repositories/drizzle-coupon.repository';
import { CouponsController } from './presentation/controllers/coupons.controller';

@Module({
  controllers: [CouponsController],
  providers: [
    { provide: ICouponRepository, useClass: DrizzleCouponRepository },
    {
      provide: CreateCouponUseCase,
      useFactory: (repo: ICouponRepository) => new CreateCouponUseCase(repo),
      inject: [ICouponRepository],
    },
  ],
})
export class CouponsModule {}
```

### Step 9 — Register in `AppModule`

Add `CouponsModule` to the `imports` array in `src/app.module.ts`.

### Step 10 — Add the E2E suite

See **Writing an E2E test** below.

### Step 11 — Update affected docs

After the task is complete (not after each subtask), review the table in `docs/workflow-dev.md`. For a new module, expect updates to `docs/modules.md`, `docs/API.md`, and possibly `docs/business-rules.md`.

---

## Editing the Drizzle schema and creating a migration

Schema is split into two files (both wired in `drizzle.config.ts`):

- `src/infrastructure/db/schema.ts` — business tables (`categories`, `products`, `orders`, ...). Edit freely.
- `src/infrastructure/db/auth-schema.ts` — managed by Better-Auth (`user`, `session`, `account`, `verification`). **Do not edit manually**; regenerate via the Better-Auth CLI if absolutely needed.

### Workflow

1. **Edit `schema.ts`** — add columns, tables, enums, or relations.
2. **Generate the migration**:
   ```bash
   pnpm drizzle-kit generate --config=drizzle.config.ts
   ```
   Output lands in `src/infrastructure/db/migrations/`.
3. **Review the generated SQL.** Renames are detected as drop+add by default; column renames or data backfills usually need manual edits. Never assume the generated SQL is what you want.
4. **Apply locally**:
   ```bash
   pnpm db:migrate
   ```
5. **Update the Drizzle repository** to read/write the new columns and adjust `mapToXxx()`.
6. **Update the in-memory repository** to mirror the change (otherwise unit tests drift from production behavior).
7. **Run the gate**:
   ```bash
   pnpm lint && pnpm check && pnpm test
   ```

### Picking the right `DrizzleService` instance

- `drizzleService.db` — bound to `schema.ts` (business tables).
- `drizzleService.authDb` — bound to `auth-schema.ts` (Better-Auth tables).

A Drizzle repository should pick one in its constructor:

```typescript
constructor(readonly drizzleService: DrizzleService) {
  super();
  this.db = drizzleService.db; // or drizzleService.authDb for auth tables
}
```

### Multi-table writes

Wrap in a transaction. Example from `DrizzleUserRepository.create`, which must insert into `user` and `account` atomically (Better-Auth credential provider requirement):

```typescript
await this.db.transaction(async (tx) => {
  await tx.insert(userTable).values({ /* ... */ });
  await tx.insert(accountTable).values({ /* ... */ });
});
```

In production, `start:prod` runs migrations before the API boots (`node dist/src/migrate.js && node dist/src/main`).

---

## Writing an E2E test

E2E tests boot the full `AppModule` against a real PostgreSQL database. Each suite gets its own isolated `kafe_test_<uuid>` DB — created in `beforeAll`, migrated, used, and dropped in `afterAll` even when tests fail.

Files live in `test/controllers/<resource>.e2e.spec.ts`. The boilerplate is encapsulated in `test/helpers/e2e-test-helper.ts`.

### Skeleton

```typescript
import request from 'supertest';
import { E2ETestHelper } from '../helpers/e2e-test-helper';

describe('CouponsController (e2e)', () => {
  const helper = new E2ETestHelper();
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    await helper.setup();

    adminToken = await helper.createUserAndLogin({
      email: 'admin@coupons.com',
      password: 'AdminPass1234!',
      name: 'Admin',
      role: 'ADMIN',
    });
    clientToken = await helper.createUserAndLogin({
      email: 'client@coupons.com',
      password: 'ClientPass1234!',
      name: 'Client',
      role: 'CLIENT',
    });
  });

  afterAll(() => helper.teardown());

  describe('POST /api/v1/coupons', () => {
    it('creates a coupon (admin)', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'WELCOME10', discountPercent: 10 });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ code: 'WELCOME10', discountPercent: 10 });
    });

    it('rejects non-admin (403)', async () => {
      const res = await request(helper.app.getHttpServer())
        .post('/api/v1/coupons')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ code: 'NOPE', discountPercent: 5 });

      expect(res.status).toBe(403);
    });
  });
});
```

### Conventions

- Always pair `await helper.setup()` with `helper.teardown()` — even on failure, teardown must run to drop the suite DB.
- Use real auth: `createUserAndLogin` signs up via Better-Auth, promotes the role via direct SQL, then logs in to obtain the bearer token.
- Prefix endpoints with `/api/v1/` — the helper sets the global prefix.
- Use `toMatchObject` for partial assertions; only assert what your test actually validates.
- Don't share state across `describe` blocks — order is not guaranteed.

### Running

```bash
docker compose up -d           # PostgreSQL must be running
pnpm run test:e2e              # all suites
pnpm run test:e2e -- coupons   # single suite
```

`test:e2e` is part of the pre-push Husky gate. Run it locally before pushing to avoid CI churn.

---

## Architecture rules checklist

Use this as a PR review checklist. Each rule maps to a layer. Most are auto-enforced by Biome + tests; the rest require human review.

### Domain (`src/domain/`)

- [ ] No imports from `@nestjs/*`, `drizzle-orm`, `better-auth`, or any infrastructure.
- [ ] Entities are immutable — every field `readonly`, set only via the constructor.
- [ ] Repository interfaces are `abstract class` (not `interface`) so NestJS can use them as DI tokens.
- [ ] Domain errors extend `DomainError` and set both `code` and `statusCode`.
- [ ] Input data types (`CreateXxxData`, `UpdateXxxData`) live alongside the repository interface, not in entities.

### Application (`src/application/use-cases/`)

- [ ] No imports from `@nestjs/*`.
- [ ] No `@Injectable()` decorator — use cases are wired via `useFactory`.
- [ ] `execute()` returns `Either<DomainError, T>`. Domain errors are returned as `left(...)`, never thrown.
- [ ] Depends only on repository interfaces (`IXxxRepository`), never on `DrizzleXxxRepository`.
- [ ] Has a sibling `.spec.ts` that uses an in-memory repository (no DB, no NestJS bootstrap).

### Infrastructure (`src/infrastructure/`)

- [ ] Drizzle repository class extends the interface (`extends IUserRepository`).
- [ ] DB rows mapped to domain entities via a local `mapToXxx()` function.
- [ ] Multi-table writes wrapped in `db.transaction(async (tx) => ...)`.
- [ ] Picks the right Drizzle instance: `drizzleService.db` for business tables, `drizzleService.authDb` for auth tables.
- [ ] `schema.ts` edits accompanied by a generated migration in `src/infrastructure/db/migrations/`.

### Presentation (`src/presentation/`)

- [ ] Controllers inject **use cases**, never repositories.
- [ ] `Either` is unwrapped with `if (result.isLeft()) throw result.value` at the controller boundary.
- [ ] DTOs use `class-validator` + `@ApiProperty` / `@ApiPropertyOptional` for Swagger.
- [ ] No manual response wrapping — `TransformInterceptor` wraps success; `HttpExceptionFilter` formats errors.
- [ ] Role-based access via `@Roles(['ADMIN'])`; anonymous routes via `@AllowAnonymous()`.
- [ ] Authenticated user accessed via `@CurrentUser()`.

### Cross-cutting

- [ ] No `any`. Use explicit types, or `unknown` + narrowing for genuinely unknown values.
- [ ] File names: kebab-case. Class names: PascalCase.
- [ ] In-memory fakes live in `test/repositories/`, imported via `@test/repositories/*`.
- [ ] `pnpm lint && pnpm check && pnpm test` all pass before each commit.
- [ ] `pnpm test:e2e` passes before push (Husky enforces).
- [ ] Affected docs reviewed when a **task** completes — see the table in `docs/workflow-dev.md`.

---

## Authentication

Managed by **Better-Auth** via `@thallesp/nestjs-better-auth`. Configuration lives in `src/infrastructure/auth/better-auth.ts`.

- **Sign up**: `POST /api/auth/sign-up/email` (Better-Auth route, no `/v1` prefix) — body `{ email, password, name }`.
- **Login**: `POST /api/v1/auth/login` — body `{ email, password }` → response `{ token, user }`.
- **Send the token**: `Authorization: Bearer <token>` on subsequent requests.

Controller decorators (from `src/presentation/decorators/`):

```typescript
@Roles(['ADMIN'])           // restrict to one or more roles
@AllowAnonymous()           // skip auth entirely (from @thallesp/nestjs-better-auth)
@CurrentUser() user         // inject the authenticated session, typed UserSession<Auth>
```

Roles are stored on the `user` table (`ADMIN | BARISTA | CLIENT`). Promotion happens via SQL or an admin-only endpoint — sign-up always lands on `CLIENT`.
