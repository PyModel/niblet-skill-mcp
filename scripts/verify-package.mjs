#!/usr/bin/env node
/**
 * Verify the packed artifact before publish: the tarball must contain the runtime
 * entry, every bundled skill document the server serves as a resource, the MCP
 * config example, and the licence files. Run against `npm pack --dry-run --json`.
 *
 *   npm pack --dry-run --json > pack.json && node scripts/verify-package.mjs pack.json
 */
import { readFileSync } from 'node:fs';

const REQUIRED = [
  'src/index.mjs',
  'src/server.mjs',
  'src/skill.mjs',
  'skill/niblet/SKILL.md',
  'skill/niblet/references/commands.md',
  'skill/niblet/references/connection.md',
  'skill/niblet/references/evidence.md',
  'skill/niblet/references/native.md',
  'skill/niblet/agents/openai.yaml',
  'skill/niblet/LICENSE',
  'skill/niblet/NOTICE',
  'mcp.json',
  'LICENSE',
  'README.md',
];

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/verify-package.mjs <npm-pack-dry-run-json>');
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(file, 'utf8'))[0];
} catch (error) {
  console.error(`Could not read pack output: ${error.message}`);
  process.exit(1);
}

if (!manifest?.files?.length) {
  console.error('Pack output contains no files.');
  process.exit(1);
}

const packed = new Set(manifest.files.map((f) => f.path));
const missing = REQUIRED.filter((path) => !packed.has(path));
if (missing.length) {
  console.error(`Packed artifact is missing required files:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.['niblet-mcp'];
if (!bin) {
  console.error('package.json has no bin entry; npx @pymodel/niblet would not start the server.');
  process.exit(1);
}
if (!packed.has(bin)) {
  console.error(`bin entry "${bin}" is not in the packed artifact.`);
  process.exit(1);
}
if (!pkg.engines?.node) {
  console.error('package.json declares no engines.node; the supported Node range would be unrecorded.');
  process.exit(1);
}

console.log(`Packed artifact OK: ${packed.size} files, bin "${bin}", ${REQUIRED.length} required entries present.`);
