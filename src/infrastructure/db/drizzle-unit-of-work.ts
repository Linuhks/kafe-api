import { Injectable } from '@nestjs/common';
import { Either } from '../../domain/either';
import { IUnitOfWork } from '../../domain/repositories/unit-of-work';
import { DrizzleService } from './drizzle.service';

class RollbackSignal<L> {
  constructor(readonly left: L) {}
}

@Injectable()
export class DrizzleUnitOfWork extends IUnitOfWork {
  constructor(private readonly drizzleService: DrizzleService) {
    super();
  }

  async run<L, R>(fn: () => Promise<Either<L, R>>): Promise<Either<L, R>> {
    try {
      return await this.drizzleService.runInTransaction(async () => {
        const result = await fn();
        if (result.isLeft()) throw new RollbackSignal(result);
        return result;
      });
    } catch (err) {
      if (err instanceof RollbackSignal) return err.left as Either<L, R>;
      throw err;
    }
  }
}
