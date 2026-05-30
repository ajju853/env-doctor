#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './validate.js';
import { generateExample } from './generate.js';
import { formatResults, reportSuccess } from './reporter.js';
import type { Schema } from './types.js';
import { EnvValidationError } from './types.js';

let version = '0.0.0';
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const pkgPath = path.resolve(__dirname, '../package.json');
  version = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')).version;
} catch {
  // fallback — CJS build doesn't have import.meta.url
}

function findSchemaFile(): string | null {
  const candidates = ['env.schema.ts', 'env.config.ts', 'env.schema.js', 'env.config.js', 'env.schema.mjs', 'env.config.mjs'];
  const cwd = process.cwd();

  for (const file of candidates) {
    const fullPath = path.join(cwd, file);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

function showHelp(): void {
  console.log(`
  env-doctor \u2014 environment variable validator

  Usage:
    env-doctor --help        Show this help message
    env-doctor --version     Show package version
    env-doctor --check       Validate environment variables using schema file
    env-doctor --generate    Generate .env.example from schema file

  Schema file:
    env-doctor looks for one of these files in the current directory:
      env.schema.ts, env.config.ts, env.schema.js, env.config.js

  Examples:
    npx env-doctor --check
    npx env-doctor --generate
`);
}

async function loadSchema(filePath: string): Promise<Schema> {
  const mod = await import(filePath);
  const schema = (mod.default || mod) as Record<string, unknown>;
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new Error(`Schema file "${filePath}" must export a Schema object (default export)`);
  }
  return schema as Schema;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--version')) {
    console.log(version);
    process.exit(0);
  }

  const schemaFile = findSchemaFile();
  if (!schemaFile) {
    console.error(`\n  ${'\u2716'} env-doctor: no schema file found

  Create an env.schema.ts file in your project root:

    import type { Schema } from 'env-doctor';
    export default {
      PORT: { type: 'port', required: true },
      DATABASE_URL: { type: 'url', required: true },
      NODE_ENV: { type: 'enum', values: ['development', 'production', 'test'], default: 'development' },
    } satisfies Schema;

  Then run:
    npx env-doctor --check
`);
    process.exit(1);
  }

  let schema: Schema;
  try {
    schema = await loadSchema(schemaFile);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n  ${'\u2716'} env-doctor: failed to load schema: ${msg}\n`);
    process.exit(1);
  }

  if (args.includes('--generate')) {
    const outPath = path.join(process.cwd(), '.env.example');
    generateExample(schema, outPath);
    console.log(`  ${'\u2713'} env-doctor: wrote .env.example\n`);
    process.exit(0);
  }

  if (args.includes('--check')) {
    try {
      const env = validate(schema);
      reportSuccess(env);
      process.exit(0);
    } catch (err) {
      if (err instanceof EnvValidationError) {
        const msg = formatResults(err.results);
        console.error(msg);
        process.exit(1);
      }
      throw err;
    }
  }

  showHelp();
  process.exit(0);
}

main().catch((err) => {
  console.error('env-doctor:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
