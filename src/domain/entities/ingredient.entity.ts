export class Ingredient {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unit: string,
    public readonly currentStock: string,
    public readonly minimumStock: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
