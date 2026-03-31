export class OrderItem {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly unitPrice: string,
    public readonly quantity: number,
    public readonly subtotal: string,
  ) {}
}
