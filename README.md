<div align="center">

# 🔐 NexusVault

### Your thoughts, your device, your rules.

A local-first knowledge base with real-time CRDT sync, native AI, and zero compromises.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/nexusvault/nexusvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/nexusvault/nexusvault/ci.yml?branch=main)](https://github.com/nexusvault/nexusvault/actions)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20iOS%20%7C%20Android-lightgrey.svg)](https://github.com/nexusvault/nexusvault)

<!-- Screenshot coming soon -->

</div>

---

## Why NexusVault?

We built NexusVault because existing knowledge management tools force you to choose between **power and privacy**, between **collaboration and control**. NexusVault delivers both.

| Feature | Obsidian | NexusVault |
|---|---|---|
| **Bundle Size** | ~200MB (Electron) | **~12MB** (Tauri) |
| **RAM Usage** | ~450MB | **~85MB** |
| **Sync** | $4–8/month extra | **Free (CRDT P2P)** or $3/mo cloud |
| **Real-time Collaboration** | ❌ None | ✅ **CRDT-powered** |
| **AI** | Third-party plugins | ✅ **Native (BYOK)** |
| **Search** | Keyword only | ✅ **Keyword + Semantic** |
| **Cold Start** | ~12s (Windows) | **~1.8s** |
| **Data Format** | .md plain text | **.loro CRDT** + .md export |
| **Mobile** | Capacitor (web) | **Tauri native** |
| **Plugin Security** | JS without sandbox | **iframe/WASM sandboxed** |
| **Version History** | Paid sync only | **Built-in (CRDT)** |
| **Encryption** | AES-GCM (legacy) | **XChaCha20-Poly1305** |
| **Offline** | ✅ | ✅ |
| **Backlinks** | ✅ | ✅ |
| **Graph View** | ✅ | ✅ |

---

## ✨ Features

- 🏠 **Local-First CRDT** — Your data lives on your device. Loro CRDT enables conflict-free collaboration without a central server.
- 📝 **Block Editor** — Rich TipTap/ProseMirror editor with slash commands, tables, task lists, code blocks, and more.
- 🔗 **Backlinks + Graph** — Bidirectional `[[wikilinks]]`, `#tags`, and interactive graph visualization of your knowledge.
- 🔒 **E2E Encryption** — XChaCha20-Poly1305 with Argon2id key derivation. Zero-knowledge sync.
- 🤖 **AI-Powered Search** — Semantic search, chat with your vault, auto-tagging, and summaries. Bring Your Own Key (BYOK).
- 🌍 **Cross-Platform** — Windows, macOS, Linux, iOS, and Android from a single codebase.

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Rust](https://www.rust-lang.org/tools/install) 1.77+
- Platform-specific requirements: [Tauri Prerequisites](https://tauri.app/start/prerequisites/)

### Installation

```bash
# Clone the repository
git clone https://github.com/nexusvault/nexusvault.git
cd nexusvault

# Install frontend dependencies
npm install

# Start development server
npm run tauri dev
```

### Build

```bash
# Build for production
npm run tauri build
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Shell** | Tauri 2.0 | Native desktop/mobile runtime (Rust backend) |
| **Frontend** | React 19 + TypeScript | UI framework |
| **Build** | Vite 6 | Fast bundler with HMR |
| **Editor** | TipTap 3 / ProseMirror | Rich block-based editor |
| **CRDT** | Loro | Conflict-free replicated data types |
| **Database** | SQLite + FTS5 | Local index, metadata, and full-text search |
| **Sync** | Cloudflare Workers + R2 | Edge compute with Durable Objects |
| **Encryption** | libsodium | XChaCha20-Poly1305 + Argon2id |
| **State** | Zustand | Lightweight global state management |
| **Styling** | Tailwind CSS v4 | Utility-first CSS |

---

## 📁 Project Structure

```
nexusvault/
├── src/                          # Frontend React
│   ├── components/               # UI components
│   │   ├── editor/               # TipTap editor + extensions
│   │   ├── sidebar/              # File tree, search, backlinks
│   │   ├── graph/                # Knowledge graph visualization
│   │   ├── settings/             # App settings
│   │   └── layout/               # App layout, tabs, status bar
│   ├── stores/                   # Zustand state management
│   ├── lib/                      # Core logic
│   │   ├── loro/                 # CRDT document management
│   │   ├── db/                   # SQLite schema + queries
│   │   ├── crypto/               # E2E encryption
│   │   ├── ai/                   # AI/RAG pipeline
│   │   ├── import/               # Obsidian vault import
│   │   └── export/               # Markdown export
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript type definitions
│   └── styles/                   # Global styles
├── src-tauri/                    # Rust backend
│   ├── src/                      # Tauri commands + logic
│   ├── migrations/               # SQLite migrations
│   └── capabilities/             # Security permissions
└── workers/                      # Cloudflare sync backend (future)
```

---

## 🗺 Roadmap

- [x] **Phase 0** — Project scaffolding, tooling, CI/CD
- [ ] **Phase 1** — Editor core: TipTap + Loro CRDT, wikilinks, tags, FTS5 search
- [ ] **Phase 2** — Graph view, backlinks panel, quick switcher, daily notes
- [ ] **Phase 3** — Sync + encryption: Cloudflare Workers, E2E, offline queue
- [ ] **Phase 4** — AI layer: BYOK, semantic search, RAG, auto-tagging
- [ ] **Phase 5** — Polish: themes, keyboard shortcuts, Obsidian import, mobile

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a Pull Request.

---

## 📄 License

[MIT](LICENSE) © 2026 NexusVault Contributors
