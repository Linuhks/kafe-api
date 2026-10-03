import { Either } from '../either';

export abstract class IUnitOfWork {
  /**
   * Runs `fn` atomically: every repository write made inside it commits together.
   * A `Left` result (or a thrown error) rolls everything back.
   */
  abstract run<L, R>(fn: () => Promise<Either<L, R>>): Promise<Either<L, R>>;
}
