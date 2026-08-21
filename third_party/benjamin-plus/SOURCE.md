# Source

- Upstream: https://github.com/JetBrains/benjamin-plus-skill
- Upstream commit: `532771be5687566b12a9f62e17fbe7ad3591518c`
- Vendored: 2026-08-20
- License: MIT (see `LICENSE`)
- Integration: **inject**, do not install as a discoverable `skills/*/SKILL.md` folder
- Active payload: `injected-instruction.md` is appended into root `AGENTS.md`
- Evidence: discoverable skill folder measured ≈0 savings; SessionStart / AGENTS inject measured median cost reduction (see upstream `EXPECTED-RESULTS.md`)
