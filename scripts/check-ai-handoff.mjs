import { spawnSync } from 'node:child_process';

const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
  encoding: 'utf8',
});

if (result.error || result.status !== 0) {
  console.error('GRID commit blocked: could not inspect staged Git changes.');
  if (result.error) console.error(result.error.message);
  process.exit(1);
}

const stagedPaths = result.stdout.split(/\r?\n/).filter(Boolean);
if (!stagedPaths.includes('AI_HANDOFF.md')) {
  console.error('\nGRID commit blocked: AI_HANDOFF.md must be updated and staged in every commit.');
  console.error('Update its current status and append a factual COMMIT / SESSION HISTORY entry, then run:');
  console.error('  git add AI_HANDOFF.md');
  console.error('Stage your Timeline changes and retry the commit.');
  process.exit(1);
}

console.log('GRID handoff check passed: AI_HANDOFF.md is updated and staged.');
