import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const skillPath = (name) => path.join(repoRoot, "skills", name, "SKILL.md");

const files = {
  agents: path.join(repoRoot, "AGENTS.md"),
  claude: path.join(repoRoot, "CLAUDE.md"),
  readme: path.join(repoRoot, "README.md"),
  skillsReadme: path.join(repoRoot, "skills", "README.md"),
  research: path.join(repoRoot, "docs", "skills", "research-lobehub-superpowers-2026-08-20.md"),
  lobehubManifest: path.join(repoRoot, "third_party", "lobehub", "manifest.json"),
  goal: path.join(repoRoot, "CODEX_SPARK_5_3_GOAL.md"),
  backlog: path.join(repoRoot, "TECH_BACKLOG_1SP.md"),
  agentsContext: path.join(repoRoot, "docs", "agents", "PROJECT_AGENT_CONTEXT.md"),
  agentsContract: path.join(repoRoot, "docs", "agents", "AGENT_WORK_CONTRACT.md"),
  agentsOwnership: path.join(repoRoot, "docs", "agents", "AGENT_OWNERSHIP.md"),
  agentsHandoff: path.join(repoRoot, "docs", "agents", "AGENT_HANDOFF_MATRIX.md"),
  agentsSimulations: path.join(repoRoot, "docs", "agents", "SIMULATION_SCENARIOS.md"),
  agentsChangelog: path.join(repoRoot, "docs", "agents", "CHANGELOG_AGENT_SKILLS.md"),
};

const requiredSkillFiles = [
  "using-superpowers",
  "brainstorming",
  "systematic-debugging",
  "executing-plans",
  "test-driven-development",
  "verification-before-completion",
  "dispatching-parallel-agents",
  "subagent-driven-development",
  "receiving-code-review",
  "requesting-code-review",
  "writing-plans",
  "ru-ai-collector-product-design",
  "russian-product-copy",
  "frontend-design",
  "interface-design",
  "ui-ux-audit",
  "laws-of-ux",
  "accessibility",
  "ux-design-review",
  "prd-from-context",
  "team-orchestrator",
  "final-reviewer",
  "product-agent",
  "architect-agent",
  "backend-engineer",
  "frontend-engineer",
  "product-designer",
  "qa-engineer",
  "test-automation-engineer",
  "security-engineer",
  "devops-sre",
  "release-manager",
  "documentation-agent",
  "research-agent",
  "skill-governor",
  "feedback-analyzer",
];

const expectedSnippets = [
  {
    file: files.agents,
    snippets: [
      "read `skills/using-superpowers/SKILL.md` before doing anything else",
      "use `skills/ru-ai-collector-product-design/SKILL.md` first",
      "use `skills/russian-product-copy/SKILL.md` after",
      "use `skills/ui-ux-audit/SKILL.md`",
      "use `skills/ux-design-review/SKILL.md`",
      "Treat `CODEX_SPARK_5_3_GOAL.md` as the delivery contract",
      "Follow `TECH_BACKLOG_1SP.md` and complete at most one `1 SP` task per iteration",
      "skills/team-orchestrator/SKILL.md",
      "skills/security-engineer/SKILL.md",
      "skills/skill-governor/SKILL.md",
      "docs/agents/PROJECT_AGENT_CONTEXT.md",
    ],
  },
  {
    file: files.claude,
    snippets: [
      "read `AGENTS.md` and then `skills/using-superpowers/SKILL.md`",
      "Treat `AGENTS.md` as the canonical routing table",
      "Do not finish a non-trivial task without reading `skills/verification-before-completion/SKILL.md`",
    ],
  },
  {
    file: files.readme,
    snippets: [
      "## Agent bootstrap и обязательные skills",
      "`npm run verify:skills`",
      "Если `verify:skills` падает, значит skill-маршрутизация репозитория нарушена",
      "skills/README.md",
      "docs/agents/PROJECT_AGENT_CONTEXT.md",
      "Layer 3",
    ],
  },
  {
    file: files.skillsReadme,
    snippets: [
      "Layer 0 — Process (obra/superpowers)",
      "Layer 1 — Product",
      "Layer 2 — Craft / audit",
      "Layer 3 — Role agents",
      "team-orchestrator",
      "skill-governor",
    ],
  },
];

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function assertExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    fail(`Missing required file: ${targetPath}`);
  }
}

function readText(targetPath) {
  assertExists(targetPath);
  return fs.readFileSync(targetPath, "utf8");
}

for (const target of Object.values(files)) {
  assertExists(target);
}

for (const skillName of requiredSkillFiles) {
  assertExists(skillPath(skillName));
  const sourcePath = path.join(repoRoot, "skills", skillName, "SOURCE.md");
  const vendoredWithSource = [
    "frontend-design",
    "interface-design",
    "ui-ux-audit",
    "laws-of-ux",
    "accessibility",
    "prd-from-context",
  ];
  if (vendoredWithSource.includes(skillName)) {
    assertExists(sourcePath);
  }
}

for (const { file, snippets } of expectedSnippets) {
  const text = readText(file);
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      fail(`Missing required snippet in ${path.basename(file)}: ${snippet}`);
    }
  }
}

const bootstrapTexts = [readText(files.agents), readText(files.claude)];
const skillRefPattern = /skills\/[a-z0-9-]+\/SKILL\.md/g;
const referencedSkillPaths = new Set(
  bootstrapTexts.flatMap((text) => text.match(skillRefPattern) ?? []),
);

for (const relativeSkillPath of referencedSkillPaths) {
  assertExists(path.join(repoRoot, relativeSkillPath));
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Skill bootstrap verification passed.");
