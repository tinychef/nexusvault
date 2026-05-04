# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev (Vite, localhost:1420)
npm run dev

# Full Tauri desktop app in dev mode
npm run tauri dev

# Production build (TS check + Vite bundle)
npm run build

# Build Tauri binary
npm run tauri build

# Tests
npm run test                  # Run all unit tests
npm run test:coverage         # With v8 coverage report
npx vitest run src/lib/loro   # Run a single test directory

# Lint & format
npm run lint
npm run format
npm run typecheck

# Cloudflare Worker (from workers/)
cd workers && npx wrangler dev        # Local worker dev
cd workers && npx wrangler deploy     # Deploy to Cloudflare
```

## Architecture

NexusVault is a **local-first knowledge base** desktop app — a lightweight Obsidian alternative with native CRDT sync and E2E encryption. The codebase is organized as three independent layers:

### 1. Frontend — `src/`
React 19 + TypeScript SPA served by Vite inside the Tauri webview.

- **Editor** (`src/components/editor/`): TipTap 3 over ProseMirror. Custom extensions in `extensions/` handle slash commands, wikilinks (`[[note]]`), and tag autocomplete. The editor state is backed by a Loro CRDT document (not React state).
- **CRDT layer** (`src/lib/loro/`): `doc-manager.ts` owns the lifecycle of Loro documents — create, load from SQLite blob, persist, and export snapshots for sync.
- **Database** (`src/lib/db/`): SQLite accessed via Tauri's `plugin-sql`. `schema.ts` declares the tables; `queries.ts` exposes prepared statements. Migrations live in `src-tauri/migrations/`.
- **Crypto** (`src/lib/crypto/`): Thin wrapper around `libsodium-wrappers`. XChaCha20-Poly1305 for vault encryption. Keys never leave the device unencrypted.
- **Sync engine** (`src/lib/sync-engine.ts`): Orchestrates CRDT diff computation → encryption → upload to the Cloudflare Worker. Uses the `useSync` hook to surface state to UI.
- **State** (`src/stores/`): Zustand stores for vault, editor, and sync state. Keep side-effects in hooks, not stores.
- **Graph** (`src/components/graph/`): react-force-graph-2d visualization fed by `useGraphData` which resolves wikilinks from SQLite.

Path aliases: `@/*` → `src/`, `@components/*`, `@lib/*`, `@stores/*`, `@hooks/*`, `@types/*`.

### 2. Rust backend — `src-tauri/`
Tauri 2.0 shell. Exposes native OS capabilities (file system, dialogs, shell) to the frontend via Tauri commands and plugins. SQLite lives here (plugin-sql). Migrations are applied automatically at startup from `migrations/`. Keep business logic in the frontend; Rust handles OS bridging only.

### 3. Sync backend — `workers/`
Cloudflare Worker (Hono framework) with:
- **R2** (`VAULT_STORAGE` binding → `nexusvault-vaults` bucket) — stores encrypted document snapshots as binary blobs.
- **D1** (`DB` binding → `nexusvault-metadata`) — tracks document metadata (vault_id, doc_id, size, updated_at).
- Bearer token auth on all `/sync/*` routes.
- Configured in `workers/wrangler.toml`; deploy with `wrangler deploy` from the `workers/` directory.

## Key Data Flow

```
User types → TipTap editor → Loro CRDT op → SQLite blob (local)
                                          ↘
                               sync-engine → encrypt (libsodium)
                                           → POST /sync/vault/:id/doc/:id (Worker)
                                           → R2 storage
```

On load, documents are fetched from SQLite (offline-first). Sync runs in the background and merges remote CRDT snapshots into local state.

## Testing

Tests live next to source files (`__tests__/` subdirectories). The `vitest.config.ts` uses JSDOM. WASM (Loro, libsodium) requires the `vite-plugin-wasm` + `vite-plugin-top-level-await` setup already in `vite.config.ts` — do not remove them.

## Constraints

- **Never call Tauri APIs from workers/** — the Worker is a standalone Cloudflare runtime with no Tauri dependency.
- **Documents are always encrypted before leaving the device** — the Worker never receives plaintext; encryption/decryption happens exclusively in `src/lib/crypto/`.
- **SQLite is the source of truth locally** — Zustand stores are derived views, not the persistence layer.
- **CRDT operations must go through `doc-manager.ts`** — do not manipulate Loro documents directly from components.
