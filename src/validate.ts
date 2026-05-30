import type { Schema, FieldResult, InferEnv } from './types.js';
import { EnvValidationError } from './types.js';
import { coerceField } from './coerce.js';

export function validate<S extends Schema>(schema: S): InferEnv<S> {
  const results: FieldResult[] = [];
  const env: Record<string, unknown> = {};

  for (const [key, def] of Object.entries(schema)) {
    const rawValue = process.env[key];

    if (rawValue === undefined || rawValue === '') {
      if (def.default !== undefined) {
        const coerced = coerceField(def.default, def);
        if (coerced.error) {
          results.push({
            key,
            status: 'invalid',
            rawValue: def.default,
            error: coerced.error,
            def,
          });
        } else {
          results.push({
            key,
            status: 'default',
            value: coerced.value,
            rawValue: def.default,
            def,
          });
          env[key] = coerced.value;
        }
      } else if (def.required) {
        results.push({
          key,
          status: 'missing',
          error: 'required',
          def,
        });
      } else {
        results.push({
          key,
          status: 'ok',
          value: undefined,
          def,
        });
        env[key] = undefined;
      }
      continue;
    }

    const coerced = coerceField(rawValue, def);
    if (coerced.error) {
      results.push({
        key,
        status: 'invalid',
        rawValue,
        error: coerced.error,
        def,
      });
    } else {
      results.push({
        key,
        status: 'ok',
        value: coerced.value,
        rawValue,
        def,
      });
      env[key] = coerced.value;
    }
  }

  const errors = results.filter((r) => r.status === 'missing' || r.status === 'invalid');
  if (errors.length > 0) {
    throw new EnvValidationError(results);
  }

  return env as InferEnv<S>;
}
