#!/usr/bin/env node
/**
 * Builds the three step cards in the README header: one mascot with its own caption beneath it.
 *
 * GitHub strips `style` from README HTML and draws a border on every table cell, so a row of
 * image-over-caption cells cannot be built out of markup — the caption has to be part of the
 * picture. Each card nests the existing mascot artwork unchanged and adds one line of text, so
 * the mascots stay a single source of truth and only the wrapper is generated.
 *
 * Run after editing a mascot or a caption:  node scripts/build-step-cards.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const CARDS = [
  { mascot: 'niblet-mascot-thinking.svg', out: 'niblet-step-contract.svg', caption: 'Settle the contract' },
  { mascot: 'niblet-mascot-focused.svg', out: 'niblet-step-build.svg', caption: 'Build from your system' },
  { mascot: 'niblet-mascot-celebration.svg', out: 'niblet-step-check.svg', caption: 'Check the rendered screen' },
];

const W = 210;
const H = 112;
const MASCOT = 86;
/** The mascots are drawn on a 512 canvas; this is the only number that ties the two together. */
const SCALE = MASCOT / 512;

/** The artwork without its own root element, so it can be placed rather than embedded whole. */
function body(file) {
  const svg = readFileSync(join(ASSETS, file), 'utf8');
  const inner = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>'));
  // The ids inside are unique per card because each card holds exactly one mascot.
  return inner.replace(/<title[\s\S]*?<\/title>|<desc[\s\S]*?<\/desc>/g, '').trim();
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const { mascot, out, caption } of CARDS) {
  const x = (W - MASCOT) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escape(caption)}">
<title>${escape(caption)}</title>
<style>
/* GitHub renders the README on white or on #0d1117 and gives an img no way to inherit either,
   so the card asks the viewer directly. Both values are GitHub's own body text colours. */
.nb-caption { fill: #1f2328; }
@media (prefers-color-scheme: dark) { .nb-caption { fill: #e6edf3; } }
</style>
<g transform="translate(${x} 2) scale(${SCALE})">
${body(mascot)}
</g>
<text class="nb-caption" x="${W / 2}" y="${H - 9}" text-anchor="middle" font-size="14.5" font-weight="700"
  font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif">${escape(caption)}</text>
</svg>
`;
  writeFileSync(join(ASSETS, out), svg);
  console.log(`${out}  ${caption}`);
}
