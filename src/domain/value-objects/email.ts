import { Either, left, right } from '../either';
import { InvalidEmailError } from '../errors/domain.error';

const MAX_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export class Email {
  private constructor(public readonly value: string) {}

  static create(raw: string): Either<InvalidEmailError, Email> {
    const normalized = raw.trim().toLowerCase();

    if (normalized.length > MAX_LENGTH || !EMAIL_PATTERN.test(normalized)) {
      return left(new InvalidEmailError());
    }

    return right(new Email(normalized));
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
