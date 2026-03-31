import { Module } from '@nestjs/common';
import { IUserRepository } from './domain/repositories/user.repository.js';
import { CreateUserUseCase } from './application/use-cases/users/create-user.use-case.js';
import { ListUsersUseCase } from './application/use-cases/users/list-users.use-case.js';
import { GetUserUseCase } from './application/use-cases/users/get-user.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/users/update-user.use-case.js';
import { DeleteUserUseCase } from './application/use-cases/users/delete-user.use-case.js';
import { DrizzleUserRepository } from './infrastructure/db/repositories/drizzle-user.repository.js';
import { UsersController } from './presentation/controllers/users.controller.js';

@Module({
  controllers: [UsersController],
  providers: [
    { provide: IUserRepository, useClass: DrizzleUserRepository },
    {
      provide: CreateUserUseCase,
      useFactory: (repo: IUserRepository) => new CreateUserUseCase(repo),
      inject: [IUserRepository],
    },
    {
      provide: ListUsersUseCase,
      useFactory: (repo: IUserRepository) => new ListUsersUseCase(repo),
      inject: [IUserRepository],
    },
    {
      provide: GetUserUseCase,
      useFactory: (repo: IUserRepository) => new GetUserUseCase(repo),
      inject: [IUserRepository],
    },
    {
      provide: UpdateUserUseCase,
      useFactory: (repo: IUserRepository) => new UpdateUserUseCase(repo),
      inject: [IUserRepository],
    },
    {
      provide: DeleteUserUseCase,
      useFactory: (repo: IUserRepository) => new DeleteUserUseCase(repo),
      inject: [IUserRepository],
    },
  ],
})
export class UsersModule {}
