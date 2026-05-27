export type Either<L, R> = Left<L> | Right<R>;

export class Left<L> {
  readonly _tag = 'Left' as const;

  constructor(public readonly value: L) {}

  isLeft(): this is Left<L> {
    return true;
  }

  isRight(): this is Right<never> {
    return false;
  }
}

export class Right<R> {
  readonly _tag = 'Right' as const;

  constructor(public readonly value: R) {}

  isLeft(): this is Left<never> {
    return false;
  }

  isRight(): this is Right<R> {
    return true;
  }
}

export const left = <L>(value: L): Left<L> => new Left(value);
export const right = <R>(value: R): Right<R> => new Right(value);
