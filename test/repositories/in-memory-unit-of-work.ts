import { Either } from '../../src/domain/either';
import { IUnitOfWork } from '../../src/domain/repositories/unit-of-work';

interface Snapshotable {
  items: unknown[];
}

/** Snapshots the `items` of the given fakes and restores them when the callback fails. */
export class InMemoryUnitOfWork extends IUnitOfWork {
  constructor(private readonly repos: Snapshotable[] = []) {
    super();
  }

  async run<L, R>(fn: () => Promise<Either<L, R>>): Promise<Either<L, R>> {
    const snapshots = this.repos.map((r) => [...r.items]);
    const rollback = () => this.repos.forEach((r, i) => (r.items = snapshots[i]));
    try {
      const result = await fn();
      if (result.isLeft()) rollback();
      return result;
    } catch (err) {
      rollback();
      throw err;
    }
  }
}
