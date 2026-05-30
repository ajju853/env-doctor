import type { FieldDef } from './types.js';

export interface CoerceResult {
  value?: unknown;
  error?: string;
}

export function coerceField(raw: string, def: FieldDef): CoerceResult {
  const trimmed = raw.trim();

  switch (def.type) {
    case 'string': {
      if (def.minLength !== undefined && trimmed.length < def.minLength) {
        return { error: `must be at least ${def.minLength} characters (got ${trimmed.length})` };
      }
      if (def.maxLength !== undefined && trimmed.length > def.maxLength) {
        return { error: `must be at most ${def.maxLength} characters (got ${trimmed.length})` };
      }
      return { value: trimmed };
    }

    case 'number': {
      const num = Number(trimmed);
      if (trimmed === '' || Number.isNaN(num)) {
        return { error: `expected a numeric string, got "${raw}"` };
      }
      return { value: num };
    }

    case 'boolean': {
      const lower = trimmed.toLowerCase();
      if (['true', '1', 'yes'].includes(lower)) return { value: true };
      if (['false', '0', 'no'].includes(lower)) return { value: false };
      return { error: `expected boolean (true/false/1/0/yes/no), got "${raw}"` };
    }

    case 'url': {
      try {
        const url = new URL(trimmed);
        if (!url.protocol.startsWith('http')) {
          return { error: `URL must have http(s) protocol, got "${url.protocol}"` };
        }
        return { value: url.href };
      } catch {
        return { error: `invalid URL: "${raw}"` };
      }
    }

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return { error: `invalid email: "${raw}"` };
      }
      return { value: trimmed };
    }

    case 'enum': {
      if (!def.values || def.values.length === 0) {
        return { error: 'enum type requires values array' };
      }
      if (!def.values.includes(trimmed)) {
        return { error: `expected one of [${def.values.join(', ')}], got "${raw}"` };
      }
      return { value: trimmed };
    }

    case 'json': {
      try {
        const parsed = JSON.parse(trimmed);
        return { value: parsed };
      } catch {
        return { error: `invalid JSON: "${raw}"` };
      }
    }

    case 'port': {
      const num = Number(trimmed);
      if (trimmed === '' || Number.isNaN(num)) {
        return { error: `expected a numeric port, got "${raw}"` };
      }
      if (!Number.isInteger(num) || num < 1 || num > 65535) {
        return { error: `port must be an integer between 1 and 65535, got "${raw}"` };
      }
      return { value: num };
    }

    default:
      return { error: `unknown type: ${(def as FieldDef).type}` };
  }
}
