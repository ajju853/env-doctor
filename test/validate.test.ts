import { describe, it, expect, beforeEach } from 'vitest';
import { validate } from '../src/validate.js';
import { EnvValidationError } from '../src/types.js';

const ORIG_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIG_ENV };
  // Remove test keys
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('TEST_')) {
      delete process.env[key];
    }
  }
});

describe('validate', () => {
  it('returns typed object for valid env vars', () => {
    process.env.TEST_PORT = '4000';
    process.env.TEST_NAME = 'hello';

    const env = validate({
      TEST_PORT: { type: 'port' },
      TEST_NAME: { type: 'string' },
    });

    expect(env.TEST_PORT).toBe(4000);
    expect(env.TEST_NAME).toBe('hello');
  });

  it('throws EnvValidationError when required field is missing', () => {
    delete process.env.TEST_REQUIRED;

    try {
      validate({
        TEST_REQUIRED: { type: 'string', required: true },
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      expect((err as EnvValidationError).results).toHaveLength(1);
      expect((err as EnvValidationError).results[0].status).toBe('missing');
      expect((err as EnvValidationError).results[0].key).toBe('TEST_REQUIRED');
    }
  });

  it('throws with results for multiple errors', () => {
    delete process.env.TEST_A;
    delete process.env.TEST_B;

    try {
      validate({
        TEST_A: { type: 'string', required: true },
        TEST_B: { type: 'number', required: true },
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      expect((err as EnvValidationError).results).toHaveLength(2);
    }
  });

  it('uses default when env var is missing', () => {
    delete process.env.TEST_PORT;

    const env = validate({
      TEST_PORT: { type: 'port', default: '3000' },
    });

    expect(env.TEST_PORT).toBe(3000);
  });

  it('does not error for optional missing field', () => {
    delete process.env.TEST_OPTIONAL;

    const env = validate({
      TEST_OPTIONAL: { type: 'string' },
    });

    expect(env.TEST_OPTIONAL).toBeUndefined();
  });

  it('shows invalid for mismatched type', () => {
    process.env.TEST_PORT = 'abc';

    try {
      validate({
        TEST_PORT: { type: 'port' },
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
      const result = (err as EnvValidationError).results.find((r) => r.key === 'TEST_PORT');
      expect(result?.status).toBe('invalid');
      expect(result?.error).toContain('expected a numeric port');
    }
  });

  it('validates URL correctly', () => {
    process.env.TEST_URL = 'https://example.com';
    const env = validate({
      TEST_URL: { type: 'url' },
    });
    expect(env.TEST_URL).toBe('https://example.com/');
  });

  it('rejects invalid URL', () => {
    process.env.TEST_URL = 'not-a-url';

    try {
      validate({ TEST_URL: { type: 'url' } });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
    }
  });

  it('validates enum', () => {
    process.env.TEST_ENV = 'production';
    const env = validate({
      TEST_ENV: { type: 'enum', values: ['development', 'production', 'test'] },
    });
    expect(env.TEST_ENV).toBe('production');
  });

  it('rejects invalid enum value', () => {
    process.env.TEST_ENV = 'staging';

    try {
      validate({ TEST_ENV: { type: 'enum', values: ['development', 'production', 'test'] } });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
    }
  });

  it('validates boolean values', () => {
    process.env.TEST_BOOL = 'true';
    const env = validate({ TEST_BOOL: { type: 'boolean' } });
    expect(env.TEST_BOOL).toBe(true);
  });

  it('validates JSON', () => {
    process.env.TEST_JSON = '{"key":"value"}';
    const env = validate({ TEST_JSON: { type: 'json' } });
    expect(env.TEST_JSON).toEqual({ key: 'value' });
  });

  it('validates number', () => {
    process.env.TEST_NUM = '99';
    const env = validate({ TEST_NUM: { type: 'number' } });
    expect(env.TEST_NUM).toBe(99);
  });

  it('validates email', () => {
    process.env.TEST_EMAIL = 'user@example.com';
    const env = validate({ TEST_EMAIL: { type: 'email' } });
    expect(env.TEST_EMAIL).toBe('user@example.com');
  });

  it('validates port range', () => {
    process.env.TEST_PORT = '8080';
    const env = validate({ TEST_PORT: { type: 'port' } });
    expect(env.TEST_PORT).toBe(8080);
  });

  it('rejects port out of range', () => {
    process.env.TEST_PORT = '99999';

    try {
      validate({ TEST_PORT: { type: 'port' } });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError);
    }
  });

  it('uses default for empty string when not required', () => {
    process.env.TEST_EMPTY = '';

    const env = validate({
      TEST_EMPTY: { type: 'string', default: 'fallback' },
    });

    expect(env.TEST_EMPTY).toBe('fallback');
  });

  it('reports default status in results on error', () => {
    process.env.TEST_GOOD = 'ok';

    try {
      validate({
        TEST_GOOD: { type: 'string', required: true },
        TEST_BAD: { type: 'number', required: true },
      });
    } catch (err) {
      const results = (err as EnvValidationError).results;
      const okResult = results.find((r) => r.key === 'TEST_GOOD');
      expect(okResult?.status).toBe('ok');
      expect(okResult?.value).toBe('ok');
    }
  });
});
