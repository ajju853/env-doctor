export type FieldType = 'string' | 'number' | 'boolean' | 'url' | 'email' | 'enum' | 'json' | 'port';

export interface FieldDef {
  type: FieldType;
  required?: boolean;
  default?: string;
  values?: string[];
  minLength?: number;
  maxLength?: number;
  description?: string;
  example?: string;
}

export type Schema = Record<string, FieldDef>;

export type FieldStatus = 'ok' | 'missing' | 'invalid' | 'default';

export interface FieldResult {
  key: string;
  status: FieldStatus;
  value?: unknown;
  rawValue?: string;
  error?: string;
  def: FieldDef;
}

export type InferEnv<S extends Schema> = {
  [K in keyof S]: S[K]['type'] extends 'number' | 'port'
    ? number
    : S[K]['type'] extends 'boolean'
      ? boolean
      : S[K]['type'] extends 'json'
        ? unknown
        : string;
};

export class EnvValidationError extends Error {
  public results: FieldResult[];

  constructor(results: FieldResult[]) {
    const count = results.filter((r) => r.status === 'missing' || r.status === 'invalid').length;
    super(`env-doctor: ${count} validation issue(s) found`);
    this.name = 'EnvValidationError';
    this.results = results;
  }
}
