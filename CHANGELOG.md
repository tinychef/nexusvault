# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Project scaffolding with Tauri 2.0 + React 19 + TypeScript 5
- TipTap block editor integrated with Loro CRDT via loro-prosemirror
- SQLite database schema with FTS5 full-text search
- Zustand state management (vault + editor stores)
- Tauri Rust commands for vault and document CRUD
- Dark theme with custom CSS variables
- Editor toolbar with formatting controls (bold, italic, headings, lists, code, tables)
- Sidebar with file tree and search panel
- Status bar with word count, sync status, and save indicator
- Cloudflare Workers sync skeleton (Durable Objects + R2)
- GitHub CI/CD workflow (lint + test + build on 3 platforms)
- Contributing guidelines, code of conduct, and issue/PR templates
