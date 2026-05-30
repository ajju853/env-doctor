import { describe, it, expect } from 'vitest';
import { coerceField } from '../src/coerce.js';
import type { FieldDef } from '../src/types.js';

describe('coerceField', () => {
  describe('string', () => {
    const def: FieldDef = { type: 'string' };

    it('returns trimmed string value', () => {
      expect(coerceField('  hello  ', def)).toEqual({ value: 'hello' });
    });

    it('validates minLength', () => {
      expect(coerceField('ab', { ...def, minLength: 3 })).toEqual({
        error: 'must be at least 3 characters (got 2)',
      });
    });

    it('validates maxLength', () => {
      expect(coerceField('abcdef', { ...def, maxLength: 3 })).toEqual({
        error: 'must be at most 3 characters (got 6)',
      });
    });

    it('passes when minLength satisfied', () => {
      expect(coerceField('hello', { ...def, minLength: 3 })).toEqual({ value: 'hello' });
    });
  });

  describe('number', () => {
    const def: FieldDef = { type: 'number' };

    it('parses valid number string', () => {
      expect(coerceField('42', def)).toEqual({ value: 42 });
    });

    it('parses negative numbers', () => {
      expect(coerceField('-3.14', def)).toEqual({ value: -3.14 });
    });

    it('rejects empty string', () => {
      const result = coerceField('', def);
      expect(result.error).toBeDefined();
    });

    it('rejects non-numeric string', () => {
      const result = coerceField('abc', def);
      expect(result.error).toContain('expected a numeric string');
    });
  });

  describe('boolean', () => {
    const def: FieldDef = { type: 'boolean' };

    it.each(['true', '1', 'yes'])('accepts "%s" as true', (val) => {
      expect(coerceField(val, def)).toEqual({ value: true });
    });

    it.each(['false', '0', 'no'])('accepts "%s" as false', (val) => {
      expect(coerceField(val, def)).toEqual({ value: false });
    });

    it('rejects unknown value', () => {
      const result = coerceField('maybe', def);
      expect(result.error).toContain('expected boolean');
    });

    it('handles uppercase', () => {
      expect(coerceField('TRUE', def)).toEqual({ value: true });
    });
  });

  describe('url', () => {
    const def: FieldDef = { type: 'url' };

    it('validates http URL', () => {
      const result = coerceField('http://example.com/path?q=1', def);
      expect(result.value).toBe('http://example.com/path?q=1');
    });

    it('validates https URL', () => {
      const result = coerceField('https://api.example.com', def);
      expect(result.value).toBe('https://api.example.com/');
    });

    it('rejects invalid URL', () => {
      const result = coerceField('not-a-url', def);
      expect(result.error).toContain('invalid URL');
    });

    it('rejects non-http protocol', () => {
      const result = coerceField('ftp://example.com', def);
      expect(result.error).toContain('URL must have http(s) protocol');
    });
  });

  describe('email', () => {
    const def: FieldDef = { type: 'email' };

    it('validates simple email', () => {
      expect(coerceField('user@example.com', def)).toEqual({ value: 'user@example.com' });
    });

    it('validates email with dots', () => {
      expect(coerceField('first.last@sub.example.co.uk', def)).toEqual({ value: 'first.last@sub.example.co.uk' });
    });

    it('rejects missing @', () => {
      const result = coerceField('userexample.com', def);
      expect(result.error).toContain('invalid email');
    });

    it('rejects missing domain', () => {
      const result = coerceField('user@', def);
      expect(result.error).toContain('invalid email');
    });
  });

  describe('enum', () => {
    const def: FieldDef = { type: 'enum', values: ['development', 'production', 'test'] };

    it('accepts valid value', () => {
      expect(coerceField('production', def)).toEqual({ value: 'production' });
    });

    it('rejects invalid value', () => {
      const result = coerceField('staging', def);
      expect(result.error).toContain('expected one of');
    });

    it('errors if no values array', () => {
      const result = coerceField('x', { type: 'enum' });
      expect(result.error).toContain('values array');
    });
  });

  describe('json', () => {
    const def: FieldDef = { type: 'json' };

    it('parses valid JSON object', () => {
      expect(coerceField('{"a":1,"b":"two"}', def)).toEqual({ value: { a: 1, b: 'two' } });
    });

    it('parses valid JSON array', () => {
      expect(coerceField('[1,2,3]', def)).toEqual({ value: [1, 2, 3] });
    });

    it('rejects invalid JSON', () => {
      const result = coerceField('{bad json}', def);
      expect(result.error).toContain('invalid JSON');
    });
  });

  describe('port', () => {
    const def: FieldDef = { type: 'port' };

    it('accepts valid port', () => {
      expect(coerceField('3000', def)).toEqual({ value: 3000 });
    });

    it('accepts port 1', () => {
      expect(coerceField('1', def)).toEqual({ value: 1 });
    });

    it('accepts port 65535', () => {
      expect(coerceField('65535', def)).toEqual({ value: 65535 });
    });

    it('rejects port 0', () => {
      const result = coerceField('0', def);
      expect(result.error).toContain('port must be');
    });

    it('rejects port 65536', () => {
      const result = coerceField('65536', def);
      expect(result.error).toContain('port must be');
    });

    it('rejects non-integer port', () => {
      const result = coerceField('3.5', def);
      expect(result.error).toContain('port must be');
    });

    it('rejects non-numeric port', () => {
      const result = coerceField('abc', def);
      expect(result.error).toContain('expected a numeric port');
    });
  });
});
