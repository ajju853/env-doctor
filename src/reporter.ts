import type { FieldResult } from './types.js';
import { EnvValidationError } from './types.js';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

function colored(text: string, color: string): string {
  return process.stdout.isTTY ? `${color}${text}${colors.reset}` : text;
}

export function formatResults(results: FieldResult[]): string {
  const errors = results.filter((r) => r.status === 'missing' || r.status === 'invalid');
  const lines: string[] = [];

  if (errors.length > 0) {
    lines.push('');
    lines.push(
      `${colored('\u2716', colors.red)} ${colored('env-doctor', colors.bold)} ${colored(`\u2014 ${errors.length} issue(s) found`, colors.red)}`
    );
    lines.push('');
  }

  for (const r of results) {
    switch (r.status) {
      case 'missing':
        lines.push(
          `  ${colored('MISSING', colors.red)} ${colored(r.key, colors.bold)} ${colored(r.error || '', colors.dim)} \u00B7 ${r.def.type}`
        );
        break;
      case 'invalid':
        lines.push(
          `  ${colored('INVALID', colors.yellow)} ${colored(r.key, colors.bold)} ${colored(r.error || '', colors.dim)} \u00B7 ${r.def.type}`
        );
        break;
      case 'default':
        lines.push(
          `  ${colored('DEFAULT', colors.cyan)} ${colored(r.key, colors.bold)} ${colored(`"${r.rawValue}"`, colors.dim)}`
        );
        break;
      case 'ok': {
        if (r.value !== undefined) {
          const display = typeof r.value === 'string' ? r.value : JSON.stringify(r.value);
          const truncated = display.length > 60 ? display.slice(0, 57) + '...' : display;
          lines.push(
            `  ${colored('OK', colors.green)} ${colored(r.key, colors.bold)} ${colored(`"${truncated}"`, colors.dim)}`
          );
        }
        break;
      }
    }
  }

  if (errors.length > 0) {
    lines.push('');
    lines.push(colored('  tip Run env-doctor --generate to create .env.example', colors.dim));
    lines.push('');
  }

  return lines.join('\n');
}

export function reportAndThrow(results: FieldResult[]): never {
  const msg = formatResults(results);
  console.error(msg);
  throw new EnvValidationError(results);
}

export function reportSuccess(env: Record<string, unknown>): void {
  if (process.stdout.isTTY) {
    const keys = Object.keys(env);
    const okCount = keys.filter((k) => env[k] !== undefined).length;
    const defaultCount = keys.filter((k) => env[k] === undefined).length;
    console.log(
      `${colored('\u2713', colors.green)} env-doctor: ${okCount} var(s) resolved${defaultCount > 0 ? `, ${defaultCount} optional var(s) not set` : ''}`
    );
  }
}
