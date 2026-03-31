export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly sortOrder: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
