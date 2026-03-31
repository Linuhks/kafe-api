import { Product } from '../../../domain/entities/product.entity.js';
import { IProductRepository } from '../../../domain/repositories/product.repository.js';

export interface ListProductsInput {
  page: number;
  limit: number;
  categoryId?: string;
}

export interface ListProductsOutput {
  data: Product[];
  total: number;
}

export class ListProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute({ page, limit, categoryId }: ListProductsInput): Promise<ListProductsOutput> {
    return this.productRepo.findAll(page, limit, categoryId);
  }
}
