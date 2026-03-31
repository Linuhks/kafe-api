# src/infrastructure

Concrete implementations of domain interfaces. Framework and database code lives here.

## db/repositories/

Drizzle implementations of `I<X>Repository`. Pattern:

```typescript
@Injectable()
export class DrizzleUserRepository extends IUserRepository {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
    this.db = drizzleService.authDb; // or drizzleService.db for business tables
  }
}
```

- Use `drizzleService.db` for business tables (`schema.ts`)
- Use `drizzleService.authDb` for user/auth tables (`auth-schema.ts`)
- Always map DB rows to domain entities with a local `mapTo<Entity>()` function
- `DrizzleUserRepository.create()` runs a transaction inserting into both `user` and `account` tables — required by Better-Auth's credential provider

Repositories: `DrizzleUserRepository`, `DrizzleProductRepository`, `DrizzleCategoryRepository`, `DrizzleIngredientRepository`, `DrizzleInventoryMovementRepository`, `DrizzleOrderRepository`.

## db/schema.ts

Business tables: `categories`, `products`, `ingredients`, `product_ingredients`, `orders`, `order_items`, `inventory_movements`. Edit here to add/modify business tables. Run `drizzle-kit generate` after changes, then `drizzle-kit migrate`.

## db/auth-schema.ts

Managed by Better-Auth — tables: `user`, `session`, `account`, `verification`. Do not edit manually; regenerate via Better-Auth CLI if needed.

## db/drizzle.service.ts

Provides two Drizzle instances:
- `drizzleService.db` — uses `schema.ts`
- `drizzleService.authDb` — uses `auth-schema.ts`

## auth/

- `better-auth.ts` — Better-Auth configuration with bearer token plugin and credential provider
- `better-auth.module.ts` — NestJS module wrapping Better-Auth for DI
