export type DomainErrorType = 'USER' | 'SYSTEM';

export type DomainErrorOptions = {
  field?: string;
  type?: DomainErrorType;
};

export class DomainError extends Error {
  readonly code: string;
  readonly type: DomainErrorType;
  readonly field?: string;

  constructor(code: string, message: string, options: DomainErrorOptions = {}) {
    super(message);
    this.code = code;
    this.type = options.type ?? 'USER';

    if ('field' in options) {
      this.field = options.field;
    }
  }
}