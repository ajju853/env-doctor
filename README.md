Here's your **professionally rewritten** README — polished, authoritative, and production‑ready:

---

```markdown
# env-doctor

![env-doctor banner](env_doctor_reddit_banner.svg)

**Zero‑dependency, TypeScript‑first environment variable validator.**  
Delivers clear, actionable error messages — eliminating guesswork and runtime crashes.

```ts
import { validate } from '@ajjupateldev/env-doctor';

const env = validate({
  PORT: { type: 'port', required: true },
  DATABASE_URL: { type: 'url', required: true },
  NODE_ENV: { type: 'enum', values: ['development', 'production', 'test'] },
  JWT_SECRET: { type: 'string', minLength: 32, required: true },
  API_BASE_URL: { type: 'url' },
});
```

---

## The Problem

You deploy. The application crashes. You spend precious time digging through logs for `undefined is not a function` — only to discover that `DATABASE_URL` was never set. Or `PORT` contains `"abc"`. Or `NODE_ENV` is `"staging"` instead of `"production"`.

Existing solutions each have critical shortcomings:

| Tool      | Limitation                                    |
|-----------|-----------------------------------------------|
| **Zod**   | Powerful but heavy (50+ KB) with manual parsing boilerplate |
| **envalid** | Solid but unmaintained                         |
| **dotenv** | Loads variables but provides zero validation   |

**env-doctor** solves this in **<5 KB** with **zero runtime dependencies** — purpose‑built for environment validation with zero ceremony.

---

## Installation

```bash
npm install @ajjupateldev/env-doctor
```

---

## Quick Start

```ts
import { validate } from '@ajjupateldev/env-doctor';

const env = validate({
  PORT: { type: 'port', required: true },
  DATABASE_URL: { type: 'url', required: true },
  NODE_ENV: {
    type: 'enum',
    values: ['development', 'production', 'test'],
    default: 'development',
  },
  JWT_SECRET: { type: 'string', minLength: 32, required: true },
  API_BASE_URL: { type: 'url' },
});

// TypeScript automatically infers:
// env.PORT         → number
// env.DATABASE_URL → string (validated URL)
// env.NODE_ENV     → string (default: 'development')
// env.JWT_SECRET   → string (minimum 32 characters)
// env.API_BASE_URL → string | undefined
```

### Terminal Output

```
✖ env-doctor — 3 issue(s) found

  MISSING DATABASE_URL required · url
  MISSING JWT_SECRET   required · string (min 32 chars)
  INVALID PORT         expected a numeric port, got "abc" · port
  OK  NODE_ENV         "development"

  tip Run env-doctor --generate to create .env.example
```

---

## API Reference

### `validate(schema)`

Reads `process.env`, coerces and validates each field against the provided schema. Returns a fully typed object.

**Throws:** `EnvValidationError` if any required field is missing or invalid. The error contains a `results` array with detailed per‑field status information.

### Schema Types

| Type        | Options                          | Coerced Type | Description                                    |
|-------------|----------------------------------|--------------|------------------------------------------------|
| `string`    | `minLength`, `maxLength`         | `string`     | String with optional length constraints        |
| `number`    | —                                | `number`     | Numeric string parser                          |
| `boolean`   | —                                | `boolean`    | Accepts `true`/`false`/`1`/`0`/`yes`/`no`      |
| `url`       | —                                | `string`     | RFC-compliant URL validation using `URL` constructor |
| `email`     | —                                | `string`     | RFC 5322-compliant email regex                 |
| `enum`      | `values: string[]`               | `string`     | Must match one of the predefined values        |
| `json`      | —                                | `unknown`    | Parses and validates JSON string               |
| `port`      | —                                | `number`     | Integer between 1 and 65535                    |

### Common Field Options

| Option        | Type      | Default | Description                                       |
|---------------|-----------|---------|---------------------------------------------------|
| `required`    | `boolean` | `false` | Throws if variable is missing, empty, or whitespace |
| `default`     | `string`  | —       | Fallback value when variable is not present        |
| `description` | `string`  | —       | Human-readable description for `.env.example`      |
| `example`     | `string`  | —       | Example value for `.env.example` generation        |

### `.env.example` Generation

```ts
import { generateExample } from '@ajjupateldev/env-doctor';

generateExample({
  PORT: { 
    type: 'port', 
    required: true, 
    description: 'HTTP server port', 
    example: '3000' 
  },
  DATABASE_URL: { 
    type: 'url', 
    required: true, 
    description: 'PostgreSQL connection string' 
  },
});
```

**Output (`.env.example`):**

```bash
# Environment Variables
# Generated by env-doctor

# HTTP server port
# Type: port — required
PORT=3000

# PostgreSQL connection string
# Type: url — required
DATABASE_URL=https://example.com
```

### Command Line Interface

```bash
npx env-doctor --help         # Display all available commands
npx env-doctor --version      # Show package version
npx env-doctor --check        # Validate against env.schema.ts
npx env-doctor --generate     # Generate .env.example from schema
```

**Discovery:** `env-doctor` automatically detects schema files in the current directory — `env.schema.ts`, `env.config.ts`, `env.schema.js`, or `env.config.js`.

---

## TypeScript Inference

```ts
import { validate } from '@ajjupateldev/env-doctor';
import type { InferEnv, Schema } from '@ajjupateldev/env-doctor';

const schema = {
  PORT: { type: 'port' },
  NODE_ENV: { type: 'enum', values: ['dev', 'prod'] },
  DEBUG: { type: 'boolean' },
  CONFIG: { type: 'json' },
} satisfies Schema;

type Env = InferEnv<typeof schema>;
//   ^? { PORT: number; NODE_ENV: string; DEBUG: boolean; CONFIG: unknown }

const env = validate(schema);
// env.PORT     → number
// env.NODE_ENV → string
// env.DEBUG    → boolean
// env.CONFIG   → unknown
```

---

## Feature Comparison

| Feature                     | env-doctor | envalid | dotenv | Zod + manual |
|-----------------------------|------------|---------|--------|--------------|
| Zero runtime dependencies   | ✓          | ✗       | ✓      | ✗            |
| Full TypeScript inference   | ✓          | ✓       | ✗      | ✓            |
| Colorized terminal output   | ✓          | ✗       | ✗      | ✗            |
| `.env.example` generator    | ✓          | ✗       | ✗      | ✗            |
| Actively maintained (2025+) | ✓          | ✗       | ✓      | ✓            |
| Bundle size                 | **<5 KB**  | ~25 KB  | ~5 KB  | ~50 KB+      |
| Framework agnostic          | ✓          | ✓       | ✓      | ✓            |

**Why choose env-doctor?**
- **envalid** is unmaintained and no longer receives updates
- **dotenv** loads environment variables but performs no validation
- **Zod** requires manual parsing boilerplate and adds significant bundle weight

`env-doctor` is the only solution purpose‑built exclusively for environment variable validation — with zero overhead and maximum developer experience.

---

## Technology Stack

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![tsup](https://img.shields.io/badge/tsup-000?style=for-the-badge&logo=npm&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen?style=for-the-badge)

- **TypeScript** — Full type inference derived directly from your validation schema
- **Node.js** — Framework agnostic (works with Express, Fastify, Next.js, and beyond)
- **tsup** — Dual ESM + CommonJS bundle generation
- **Vitest** — Comprehensive test suite with 66+ passing tests
- **Zero Dependencies** — Minimal installation footprint under 5 KB

---

## License

MIT © [Ajju Patel](https://github.com/ajju853)

---

**Stop debugging missing environment variables. Doctor your `.env`.** 🩺
```

---

## Key Improvements Made

| Area | Enhancement |
|------|-------------|
| **Structure** | Added horizontal rule separators, clear section hierarchy |
| **Problem statement** | Converted to comparison table for clarity |
| **API docs** | Standardized table formatting, added "Coerced Type" column |
| **CLI section** | Added inline comments, bolded discovery note |
| **Comparison** | Bolded `<5 KB` for emphasis, expanded "Why choose" with bullet points |
| **Footer** | Added author credit and closing tagline |
| **Tone** | Consistent professional voice throughout |
| **Grammar** | Fixed passive voice, improved sentence flow |

The README is now production‑grade and ready for enterprise adoption. 🚀
