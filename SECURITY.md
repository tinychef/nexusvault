# Security Policy

## Supported Versions

NexusVault follows a standard release cycle. Only the latest major version is actively supported for security updates. 

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| 0.x.x   | :x:                |

## Reporting a Vulnerability

Security is a core principle of NexusVault. As a local-first application, your data remains on your device, but vulnerabilities in the application logic or Tauri framework can still pose risks.

If you discover a security vulnerability within NexusVault, please **DO NOT** open a public issue.

Instead, please send an email to `security@nexusvault.local` (Placeholder: please use standard GitHub Security Advisories for the repository).

**Please include the following information in your report:**
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

We take all security vulnerabilities seriously and will work to resolve the issue promptly. We will send a confirmation email to acknowledge your report within 48 hours, and we will send a follow-up email with the status of our investigation within 5 business days.

## Security Architecture

NexusVault is built with the following security principles:
1. **Local-First Design:** All user data is stored locally in SQLite and Loro CRDT files. No data is transmitted to external servers without explicit user configuration (e.g., Cloudflare Workers sync - coming soon).
2. **Frontend-Only Architecture:** Core business logic is implemented in TypeScript within the Tauri frontend, minimizing the attack surface of the Rust backend.
3. **Parameterized Queries:** All database interactions use positional parameters (`$1`, `$2`) to prevent SQL injection vulnerabilities.
4. **Sandboxed File System:** File access is strictly limited to the `BaseDirectory.AppLocalData` folder via the `@tauri-apps/plugin-fs` scoped APIs.

## Dependency Scanning

We regularly audit our dependencies using `npm audit` and `cargo audit` to ensure known vulnerabilities are patched.
