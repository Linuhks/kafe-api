import { Category } from '../../../domain/entities/category.entity';
import { ICategoryRepository } from '../../../domain/repositories/category.repository';

export interface ListCategoriesInput {
  page: number;
  limit: number;
}

export interface ListCategoriesOutput {
  data: Category[];
  total: number;
}

export class ListCategoriesUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute({ page, limit }: ListCategoriesInput): Promise<ListCategoriesOutput> {
    return this.categoryRepo.findAll(page, limit);
  }
}
