/**
 * Bundled-skill access: reading the documents, making their cross-links usable
 * over MCP, and deriving the command index from them.
 *
 * The same files are also loaded directly as a filesystem skill, where the
 * relative links between them are correct. They are only wrong for a client that
 * reads them over stdio and has no access to the package directory, so the
 * rewrite happens on the way out rather than in the files themselves.
 */
import { readFile } from 'node:fs/promises';

/** slug -> { file, title, description }. `skill` is SKILL.md; the rest are its references. */
export const SKILL_DOCS = {
  skill: {
    file: 'SKILL.md',
    title: 'Niblet design skill',
    description: 'The bundled Niblet design workflow: modes, design contract, state coverage, and the rendered finish gate. Available without an API token.',
  },
  commands: {
    file: 'references/commands.md',
    title: 'Niblet command playbook',
    description: 'Every Niblet command — what it does, its scope, and what completion means. Referenced by the design workflow.',
  },
  connection: {
    file: 'references/connection.md',
    title: 'Niblet connection guide',
    description: 'Installing and invoking the MCP tools, diagnosing a connection, and the limits of host-dependent helpers.',
  },
  evidence: {
    file: 'references/evidence.md',
    title: 'Niblet evidence policy',
    description: 'When to retrieve an external reference, and how to use one without copying it.',
  },
  native: {
    file: 'references/native.md',
    title: 'Niblet native platform guidance',
    description: 'Platform constraints and the native finish-gate batch for iOS and other native work.',
  },
};

export const uriFor = (slug) => (slug === 'skill' ? 'niblet://skill' : `niblet://skill/${slug}`);

/** Relative markdown targets in the bundled docs -> the resource URI serving the same document. */
const LINK_REWRITES = [
  [/\]\(\.\.\/SKILL\.md\)/g, `](${uriFor('skill')})`],
  [/\]\(SKILL\.md\)/g, `](${uriFor('skill')})`],
  ...Object.entries(SKILL_DOCS)
    .filter(([slug]) => slug !== 'skill')
    .flatMap(([slug]) => [
      [new RegExp(`\\]\\(references/${slug}\\.md\\)`, 'g'), `](${uriFor(slug)})`],
      [new RegExp(`\\]\\(${slug}\\.md\\)`, 'g'), `](${uriFor(slug)})`],
    ]),
];

/**
 * Point a document's cross-links at the resources that serve them. Without this a
 * client that reads niblet://skill is told to open `references/commands.md`, a path
 * it has no way to resolve.
 */
export function rewriteLinks(text) {
  return LINK_REWRITES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

export async function readSkillDoc(slug) {
  const entry = SKILL_DOCS[slug];
  if (!entry) return null;
  const text = await readFile(new URL(`../skill/niblet/${entry.file}`, import.meta.url), 'utf8');
  return rewriteLinks(text);
}

/**
 * The command index, derived from commands.md so it cannot drift from the playbook.
 * Headings are `## Section` and ``### `name` — purpose``.
 */
export function parseCommands(markdown) {
  const sections = [];
  let current = null;
  for (const line of markdown.split('\n')) {
    const section = /^##\s+(?!#)(.+?)\s*$/.exec(line);
    if (section) {
      current = { section: section[1], commands: [] };
      sections.push(current);
      continue;
    }
    const command = /^###\s+(.+?)\s+—\s+(.+?)\s*$/.exec(line);
    if (command && current) {
      // Names arrive as `polish`, or `pin` / `unpin` for a paired helper.
      const names = [...command[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      if (names.length) current.commands.push({ names, purpose: command[2] });
    }
  }
  return sections.filter((s) => s.commands.length);
}

/** The four surface modes, from the table in SKILL.md, for the same no-drift reason. */
export function parseModes(markdown) {
  const modes = [];
  for (const line of markdown.split('\n')) {
    const row = /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/.exec(line);
    if (row) modes.push({ mode: row[1], job: row[2], surfaces: row[4] });
  }
  return modes;
}
