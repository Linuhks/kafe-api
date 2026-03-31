export class Product {
  constructor(
    public readonly id: string,
    public readonly categoryId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly price: string,
    public readonly imageUrl: string | null,
    public readonly isAvailable: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
