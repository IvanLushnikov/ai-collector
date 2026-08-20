Source: https://github.com/obra/superpowers
Upstream commit: b36e0829c6d0140e93cfef2ca599b1b07d4a7797

This directory stores third-party metadata for the vendored Superpowers skills copied into `/skills`.

The actual skill files were copied from the upstream `skills/` directory on 2026-08-16.

Packaging policy for this repo:

- Keep the full Superpowers process set in `/skills` (flat folders for agent discovery).
- Do not replace Superpowers review/debug/plan skills with LobeHub clones.
- Product and craft skills are separate layers; see `/skills/README.md`.
- Curated LobeHub pins live in `/third_party/lobehub/`.
