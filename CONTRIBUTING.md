# Contributing to NexusVault

Thank you for your interest in contributing to NexusVault! This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Code Review](#code-review)

---

## Development Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 22+ | [nodejs.org](https://nodejs.org/) |
| Rust | 1.77+ | [rustup.rs](https://rustup.rs/) |
| OS | Windows 10+, macOS 12+, Ubuntu 22.04+ | — |

#### Platform-Specific Dependencies

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
- Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with "Desktop development with C++" workload
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (included in Windows 11)

### Getting Started

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/nexusvault.git
cd nexusvault

# 3. Add upstream remote
git remote add upstream https://github.com/nexusvault/nexusvault.git

# 4. Install dependencies
npm install

# 5. Start development server
npm run tauri dev
```

---

## Making Changes

### Branch Naming

Create a feature branch from `develop`:

```bash
git checkout develop
git pull upstream develop
git checkout -b feat/your-feature-name
```

Branch prefixes:
- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation changes
- `refactor/` — Code refactoring
- `test/` — Adding or updating tests
- `chore/` — Maintenance tasks

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `chore` | Build process, CI, or auxiliary tool changes |
| `perf` | Performance improvement |
| `style` | Code style (formatting, semicolons, etc.) |

### Examples

```
feat(editor): add slash command menu
fix(sync): resolve WebSocket reconnection loop
docs(readme): update installation instructions
refactor(stores): migrate vault store to Zustand slices
test(db): add FTS5 search query tests
chore(ci): update Node.js version in CI workflow
```

---

## Pull Request Process

1. **Update your branch** with the latest `develop`:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```

2. **Run checks locally** before pushing:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm run test
   ```

3. **Push your branch** and create a PR:
   ```bash
   git push origin feat/your-feature-name
   ```

4. **Fill out the PR template** completely:
   - Clear description of changes
   - Screenshots for UI changes
   - Link to related issue(s)

5. **Ensure CI passes** — all checks must be green.

6. **Request review** from at least one maintainer.

---

## Code Style

### TypeScript

- **Strict mode** — `strict: true` in `tsconfig.json`
- **No `any`** — avoid `any` unless absolutely necessary (document with `// eslint-disable-next-line`)
- **Functional components** — no class components
- **Custom hooks** — extract logic into hooks (`useDocument`, `useSearch`, etc.)
- **Path aliases** — always use `@/`, `@components/`, `@lib/`, never deep relative paths

### Rust

- Run `cargo clippy` — zero warnings
- Run `cargo fmt` — consistent formatting
- Use `Result<T, E>` for error handling — no `unwrap()` in production code
- Add `#[doc]` comments to public items

### CSS

- Use Tailwind CSS v4 utilities
- No CSS-in-JS or styled-components
- Custom properties in `src/styles/globals.css`

### General

- All exported functions must have JSDoc comments
- No magic strings — use constants or enums
- Error messages must be descriptive and actionable

---

## Code Review

### What We Look For

- **Correctness** — Does the code do what it claims?
- **Types** — Are all types properly defined?
- **Tests** — Are there tests for new functionality?
- **Performance** — Are there any obvious performance issues?
- **Security** — Are there any security concerns?
- **Documentation** — Is the code self-documenting? Are complex parts commented?

### Response Times

- We aim to review PRs within **48 hours**
- Please be patient and responsive to feedback
- Small, focused PRs are reviewed faster than large ones

---

## Questions?

- Open a [Discussion](https://github.com/nexusvault/nexusvault/discussions) for general questions
- Open an [Issue](https://github.com/nexusvault/nexusvault/issues) for bugs or feature requests

Thank you for contributing! 🚀
