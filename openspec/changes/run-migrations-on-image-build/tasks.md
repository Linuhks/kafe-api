## 1. Migration Runner Script

- [x] 1.1 Create `src/migrate.ts` that imports `drizzle-orm/postgres-js/migrator`, connects to the database via `DATABASE_URL`, runs `migrate(db, { migrationsFolder: './migrations' })`, and exits 0 on success or non-zero on error

## 2. Entrypoint Script

- [ ] 2.1 Create `entrypoint.sh` at the repository root that runs `node dist/src/migrate.js && exec node dist/src/main`
- [ ] 2.2 Make `entrypoint.sh` executable (`chmod +x entrypoint.sh`)

## 3. Dockerfile Updates

- [ ] 3.1 Add `COPY` in the production stage to bring SQL migration files into the image: `COPY --from=builder /app/src/infrastructure/db/migrations ./migrations`
- [ ] 3.2 Add `COPY` in the production stage to bring the entrypoint script: `COPY entrypoint.sh ./entrypoint.sh`
- [ ] 3.3 Add `RUN chmod +x entrypoint.sh` before the `USER node` directive
- [ ] 3.4 Replace `CMD ["node", "dist/src/main"]` with `ENTRYPOINT ["sh", "entrypoint.sh"]`

## 4. Verification

- [ ] 4.1 Run `pnpm run build` and confirm `dist/src/migrate.js` is produced
- [ ] 4.2 Build the Docker image locally (`docker build -t kafe-api .`) and confirm it builds without errors
- [ ] 4.3 Start a Postgres container and run `docker run --env DATABASE_URL=... kafe-api` to confirm migrations apply and the app starts
