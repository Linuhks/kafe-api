# Modules

Each feature is a NestJS module in `src/modules/<name>.module.ts` that wires controller → use cases → repository interface → Drizzle implementation.

The lists of use cases, entities and repositories are **not repeated here** — they are the files in the code:

- use cases: `src/application/use-cases/<module>/` (one class per file, `*.use-case.ts`)
- entities and repository interfaces: `src/domain/entities/`, `src/domain/repositories/`
- controllers: `src/presentation/controllers/`
- Drizzle repositories: `src/infrastructure/db/repositories/`

What follows is only what the file tree can't tell you.

| Module | Responsibility | Module imports / notes |
|---|---|---|
| `auth` | Login and Better-Auth session wiring | imports `BetterAuthModule` |
| `users` | Account administration (ADMIN) | — |
| `menu` | Categories, products, product–ingredient recipes | exports `ICategoryRepository`, `IProductRepository` |
| `inventory` | Ingredient stock and the movement ledger | — |
| `orders` | Order lifecycle, barista queue, client self-cancel | imports `MenuModule` (products). Also registers the ingredient/movement repositories and wires `DeductForOrder` / `RefundForOrder` itself, so status changes and stock changes share one unit of work |
| `dashboard` | Read-only aggregates over orders (ADMIN) | registers its own `IOrderRepository` |

Modules register their own Drizzle repository instances rather than importing each other, except where noted.

Behavior of each area: see the specs listed in [`business-rules.md`](./business-rules.md).
