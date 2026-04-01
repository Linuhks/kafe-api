import type { User } from '../../../domain/entities/user.entity.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.js';

export interface ListUsersInput {
  page: number;
  limit: number;
}

export interface ListUsersOutput {
  data: User[];
  total: number;
}

export class ListUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute({ page, limit }: ListUsersInput): Promise<ListUsersOutput> {
    return this.userRepo.findAll(page, limit);
  }
}
