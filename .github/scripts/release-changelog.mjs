#!/usr/bin/env node
// Promote the CHANGELOG "## [Unreleased]" section to a dated release heading and
// emit that section's body as release notes.
//
// Usage: node .github/scripts/release-changelog.mjs <version> <date> <notesOutFile>
//   - Rewrites CHANGELOG.md in place: inserts "## <version> - <date>" below a
//     fresh, empty "## [Unreleased]" heading, keeping the moved bullets under it.
//   - Writes the moved bullets (the user-facing notes) to <notesOutFile>.
//   - Exits 1 if there is no non-empty [Unreleased] content (nothing to release).

import { readFileSync, writeFileSync } from 'node:fs';

const [version, date, notesOut] = process.argv.slice(2);
if (!version || !date || !notesOut) {
	console.error('Usage: release-changelog.mjs <version> <date> <notesOutFile>');
	process.exit(2);
}

const path = 'CHANGELOG.md';
const text = readFileSync(path, 'utf8');
const lines = text.split('\n');

const unreleasedIdx = lines.findIndex((l) => /^##\s+\[Unreleased\]\s*$/i.test(l));
if (unreleasedIdx === -1) {
	console.error('CHANGELOG.md has no "## [Unreleased]" section.');
	process.exit(1);
}

// Find the end of the [Unreleased] body: the next "## " heading, or EOF.
let endIdx = lines.length;
for (let i = unreleasedIdx + 1; i < lines.length; i++) {
	if (/^##\s+/.test(lines[i])) {
		endIdx = i;
		break;
	}
}

const body = lines.slice(unreleasedIdx + 1, endIdx);
const notes = body.join('\n').trim();
if (!notes) {
	console.error(
		'The "## [Unreleased]" section is empty. Add user-facing changelog entries before releasing.',
	);
	process.exit(1);
}

// Rebuild: keep a fresh empty [Unreleased], then the dated version heading + body.
const rebuilt = [
	...lines.slice(0, unreleasedIdx + 1),
	'',
	`## ${version} - ${date}`,
	...body,
	...lines.slice(endIdx),
];

writeFileSync(path, rebuilt.join('\n'));
writeFileSync(notesOut, notes + '\n');
console.log(`Promoted [Unreleased] -> ${version} (${date}); notes written to ${notesOut}`);
