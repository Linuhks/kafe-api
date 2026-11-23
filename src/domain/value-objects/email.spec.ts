import { describe, expect, it } from 'vitest';
import { InvalidEmailError } from '../errors/domain.error';
import { Email } from './email';

describe('Email', () => {
  it('should create an email from a valid address', () => {
    const result = Email.create('maria@kafe.com');

    expect(result.isRight()).toBe(true);
    expect((result.value as Email).value).toBe('maria@kafe.com');
  });

  it('should trim and lowercase the address', () => {
    const result = Email.create('  Maria.Case@Kafe.COM  ');

    expect(result.isRight()).toBe(true);
    expect((result.value as Email).value).toBe('maria.case@kafe.com');
  });

  it('should accept subdomains and plus addressing', () => {
    const result = Email.create('ana+orders@mail.kafe.com.br');

    expect(result.isRight()).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['only whitespace', '   '],
    ['missing @', 'maria.kafe.com'],
    ['two @', 'maria@ana@kafe.com'],
    ['empty local part', '@kafe.com'],
    ['empty domain', 'maria@'],
    ['domain without a dot', 'maria@localhost'],
    ['domain ending with a dot', 'maria@kafe.'],
    ['domain starting with a dot', 'maria@.kafe.com'],
    ['empty domain label', 'maria@kafe..com'],
    ['inner whitespace', 'ma ria@kafe.com'],
  ])('should reject an address with %s', (_case, raw) => {
    const result = Email.create(raw);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidEmailError);
  });

  it('should accept exactly 254 characters and reject 255', () => {
    const domain = '@kafe.com';
    const atLimit = `${'a'.repeat(254 - domain.length)}${domain}`;
    const overLimit = `a${atLimit}`;

    expect(Email.create(atLimit).isRight()).toBe(true);
    expect(Email.create(overLimit).isLeft()).toBe(true);
  });

  it('should compare by normalized value', () => {
    const a = Email.create('Maria@Kafe.com').value as Email;
    const b = Email.create('maria@kafe.com').value as Email;
    const c = Email.create('ana@kafe.com').value as Email;

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
