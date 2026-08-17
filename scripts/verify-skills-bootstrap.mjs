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
  goal: path.join(repoRoot, "CODEX_SPARK_5_3_GOAL.md"),
  backlog: path.join(repoRoot, "TECH_BACKLOG_1SP.md"),
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
];

const expectedSnippets = [
  {
    file: files.agents,
    snippets: [
      "read `/Users/ivanlusnikov/ai-collector/skills/using-superpowers/SKILL.md` before doing anything else",
      "use `/Users/ivanlusnikov/ai-collector/skills/ru-ai-collector-product-design/SKILL.md` first",
      "use `/Users/ivanlusnikov/ai-collector/skills/russian-product-copy/SKILL.md` after",
      "Treat `/Users/ivanlusnikov/ai-collector/CODEX_SPARK_5_3_GOAL.md` as the delivery contract",
      "Follow `/Users/ivanlusnikov/ai-collector/TECH_BACKLOG_1SP.md` and complete at most one `1 SP` task per iteration",
    ],
  },
  {
    file: files.claude,
    snippets: [
      "read `/Users/ivanlusnikov/ai-collector/AGENTS.md` and then `/Users/ivanlusnikov/ai-collector/skills/using-superpowers/SKILL.md`",
      "Treat `/Users/ivanlusnikov/ai-collector/AGENTS.md` as the canonical routing table",
      "Do not finish a non-trivial task without reading `/Users/ivanlusnikov/ai-collector/skills/verification-before-completion/SKILL.md`",
    ],
  },
  {
    file: files.readme,
    snippets: [
      "## Agent bootstrap и обязательные skills",
      "`npm run verify:skills`",
      "Если `verify:skills` падает, значит skill-маршрутизация репозитория нарушена",
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
const referencedSkillPaths = new Set(
  bootstrapTexts
    .flatMap((text) =>
      text.match(/\/Users\/ivanlusnikov\/ai-collector\/skills\/[a-z0-9-]+\/SKILL\.md/g) ?? [],
    ),
);

for (const absoluteSkillPath of referencedSkillPaths) {
  assertExists(absoluteSkillPath);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Skill bootstrap verification passed.");
