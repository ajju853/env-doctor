# Changelog

## v1.0.0 — 2026-05-30

### Features
- `validate(schema)` — validates env vars at startup with full TypeScript inference
- 8 built-in types: `string`, `number`, `boolean`, `url`, `email`, `enum`, `json`, `port`
- Beautiful terminal diff — MISSING (red), INVALID (yellow), OK (green), DEFAULT (cyan)
- `generateExample(schema)` — auto-generates `.env.example` with type comments
- CLI: `npx env-doctor --check` and `--generate`
- Dual ESM + CJS output
- Zero runtime dependencies
- 66 tests passing
