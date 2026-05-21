# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

Use **pnpm** to install packages. Scripts are run with `pnpm run <script>` or `npm run <script>`.

## Key Commands

```bash
pnpm run lint           # ESLint (flat config via eslint.config.js)
pnpm run format         # Prettier --write (auto-fix formatting)
pnpm run format:check   # Prettier validation without writing (CI-safe)
pnpm run start          # Expo dev server
pnpm run eas:build:dev  # Development APK (Android, local EAS build)
pnpm run eas:build:prod # Production app-bundle (Android, local EAS build)
```

There is **no test runner** configured. Lint and format checks are the primary code quality gates.

## Code Style

Prettier config (`.prettierrc`):
- `singleQuote: true`
- `semi: true`
- `tabWidth: 2`
- `trailingComma: "all"`
- `printWidth: 100`
- `arrowParens: "always"`

TypeScript is configured with `strict: true` (via `tsconfig.json` extending `expo/tsconfig.base`). All new code must pass strict mode.

## Architecture

- **Local-first**: SQLite via `expo-sqlite` is the permanent source of truth. There is no backend or sync layer.
- **State management**: React Context API only (see `src/theme/ThemeContext.tsx`). Do not introduce Redux or Zustand.
- **Expo New Architecture** (`newArchEnabled: true` in `app.json`) — check native module compatibility before adding new packages that use native code.

## SQLite Migrations

Schema changes require explicit approval before implementation. If a feature requires schema changes, flag the required migration and wait for confirmation before writing to `src/db/database.ts`. When approved:
- Bump the database version constant
- Add a migration block (ALTER TABLE or CREATE TABLE) under the appropriate version check

## Pre-commit Hooks

Lefthook runs `lint-staged` automatically before every commit: ESLint --fix + Prettier on `*.{js,ts,tsx}`, and Prettier on `*.{json,md}`. Run `pnpm run format:check` and `pnpm run lint` before presenting work for review.
