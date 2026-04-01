export class ProductIngredient {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly ingredientId: string,
    public readonly quantity: string,
  ) {}
}
