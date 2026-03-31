import { Session } from '@thallesp/nestjs-better-auth';

// Re-exporta @Session() com nome semântico para o domínio da aplicação
export const CurrentUser = Session;
