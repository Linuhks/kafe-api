# Code Guide

Guia de convenções, padrões e fluxo de contribuição do `kafe-api`.

---

## Comandos de desenvolvimento

```bash
pnpm run start:dev     # Sobe a API com hot reload (watch mode)
pnpm run build         # Compila TypeScript para dist/

pnpm run test          # Roda os testes unitários
pnpm run test:watch    # Testes em modo watch
pnpm run test:cov      # Testes com relatório de cobertura
pnpm run test:e2e      # Testes end-to-end

pnpm run lint          # ESLint com auto-fix
pnpm run format        # Prettier

pnpm run seed          # Popula o banco com dados de exemplo
pnpm run db:studio     # Abre o Drizzle Studio no navegador (UI para o banco)
```

Pré-requisito: `docker compose up -d` para subir o PostgreSQL (porta 5432).

---

## Padrão de injeção de dependência

Use cases **não usam** `@Injectable()` do NestJS. Eles são instanciados manualmente via `useFactory` dentro do módulo.

```typescript
// ✅ Correto
{
  provide: CreateUserUseCase,
  useFactory: (repo: IUserRepository) => new CreateUserUseCase(repo),
  inject: [IUserRepository],
}

// ❌ Evitar — use cases não devem depender do container do NestJS
@Injectable()
export class CreateUserUseCase { ... }
```

Repositórios seguem o padrão oposto: a interface é registrada com `useClass` apontando para a implementação Drizzle.

```typescript
{ provide: IUserRepository, useClass: DrizzleUserRepository }
```

---

## Convenções de nomenclatura

| Tipo | Sufixo | Exemplo |
|---|---|---|
| Entidade de domínio | `.entity.ts` | `order.entity.ts` → `Order` |
| Interface de repositório | `.repository.ts` | `user.repository.ts` → `IUserRepository` |
| Use case | `.use-case.ts` | `create-user.use-case.ts` → `CreateUserUseCase` |
| Implementação Drizzle | `drizzle-<nome>.repository.ts` | `DrizzleUserRepository` |
| Fake para testes | `in-memory-<nome>.repository.ts` | `InMemoryUserRepository` |
| Controller | `.controller.ts` | `users.controller.ts` → `UsersController` |
| DTO | `.dto.ts` | `create-user.dto.ts` → `CreateUserDto` |
| Módulo | `.module.ts` | `users.module.ts` → `UsersModule` |

Todos os arquivos: **kebab-case**. Todas as classes: **PascalCase**.

---

## Onde criar cada tipo de arquivo

```
src/
├── domain/
│   ├── entities/          ← novas entidades de negócio
│   ├── repositories/      ← novas interfaces de repositório
│   └── errors/            ← novos erros de domínio tipados
│
├── application/use-cases/
│   └── <módulo>/          ← novos use cases (ex: menu/, orders/)
│
├── infrastructure/
│   └── db/repositories/   ← implementações Drizzle dos repositórios
│
├── presentation/
│   ├── controllers/       ← novos controllers HTTP
│   └── dtos/              ← DTOs de entrada e saída
│
└── test/repositories/     ← fakes in-memory para testes unitários
```

---

## Fluxo para adicionar uma feature

1. **Domain**: criar/atualizar a entidade e a interface de repositório
2. **Application**: criar o use case em `use-cases/<módulo>/`
3. **Infrastructure**: implementar o repositório Drizzle (se novo)
4. **Test**: criar o fake in-memory em `src/test/repositories/`
5. **Presentation**: criar o DTO e adicionar o endpoint no controller
6. **Módulo**: registrar o use case e o repositório no `.module.ts` da feature

---

## Testes unitários

Use cases são testados com repositórios in-memory (sem banco real). O fake implementa a mesma interface do repositório Drizzle.

```typescript
// Exemplo de teste de use case
const repo = new InMemoryUserRepository();
const useCase = new CreateUserUseCase(repo);

const result = await useCase.execute({ name: 'João', email: 'joao@kafe.com', role: 'CLIENT' });
expect(result.name).toBe('João');
```

Cada use case deve ter seu arquivo `.spec.ts` no mesmo diretório.

---

## Banco de dados

- ORM: **Drizzle** com PostgreSQL
- Schema em `src/infrastructure/db/schema.ts` (tabelas de negócio)
- Schema de auth em `src/infrastructure/db/auth-schema.ts` (gerenciado pelo Better-Auth)
- Migrations: geradas e aplicadas via CLI do Drizzle

---

## Autenticação

Gerenciada pelo **Better-Auth**. O token JWT é obtido via `POST /api/v1/auth/login` e enviado no header `Authorization: Bearer <token>`. Guards e decorators de controle de acesso ficam em `src/presentation/`.
