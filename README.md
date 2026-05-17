# kafe-api

API REST do **Kafe** — sistema de pedidos de café construído com NestJS, Drizzle ORM e PostgreSQL.

## Stack

- **Framework:** NestJS
- **ORM:** Drizzle ORM
- **Banco de dados:** PostgreSQL
- **Autenticação:** Better Auth
- **Validação:** class-validator / class-transformer
- **Documentação:** Swagger / OpenAPI

## Configuração

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp .env.example .env
```

Instale as dependências:

```bash
pnpm install
```

## Rodando o projeto

```bash
# desenvolvimento
pnpm run start:dev

# produção (roda migrations e sobe a API)
pnpm run start:prod
```

## Migrations

As migrations são gerenciadas pelo **Drizzle ORM**.

Em **produção**, elas rodam automaticamente antes da API inicializar — o script `start:prod` executa `migrate.js` seguido do `main.js`, garantindo que o banco esteja sempre atualizado.

Para criar uma nova migration em desenvolvimento:

```bash
pnpm run db:migrate
```

Para visualizar o banco pelo Drizzle Studio:

```bash
pnpm run db:studio
```

## Seed

```bash
pnpm run seed
```

## Testes

```bash
# unit tests
pnpm run test

# coverage
pnpm run test:cov
```

## Docker

```bash
docker compose up -d
```

## Licença

Privado — todos os direitos reservados.
