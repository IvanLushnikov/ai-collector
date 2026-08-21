# Packaging in AI Collector

Token-efficiency rules from [JetBrains/benjamin-plus-skill](https://github.com/JetBrains/benjamin-plus-skill).

## Decision

Upstream measured that a **discoverable skill folder saves nothing**; the same text **injected** into the session bootstrap saves cost without changing quality. In this repo:

1. Keep the upstream tree under `third_party/benjamin-plus/` (pin in [`SOURCE.md`](./SOURCE.md)).
2. Inject [`injected-instruction.md`](./injected-instruction.md) into root [`AGENTS.md`](../../AGENTS.md).
3. Do **not** add `skills/benjamin-plus/SKILL.md`.

`CLAUDE.md` already requires reading `AGENTS.md`, so one inject covers Claude-oriented flows too.

## Update

1. Refresh this directory from a newer upstream commit.
2. Replace the Benjamin-Plus block in `AGENTS.md` with the new `injected-instruction.md`.
3. Update `SOURCE.md` commit SHA and date.
4. Run `npm run verify:skills`.
