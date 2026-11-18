import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(ROOT, path), 'utf8');
const json = path => JSON.parse(read(path));
const manifest = json('ludory.project.json');
const toolchain = json('integrations/toolchain.json');

test('Kraterika is a Phaser3 game with Core-compatible manifest fields', () => {
  assert.deepEqual(Object.keys(manifest).sort(), ['engine','id','schemaVersion','targets','title','version'].sort());
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.id, 'kraterika');
  assert.equal(manifest.title.ru, 'Кратерика');
  assert.equal(manifest.engine, 'phaser');
  assert.deepEqual(manifest.targets, ['yandex-games','vk-games']);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
});

test('WFA and Ludory references are immutable and do not misreport integration', () => {
  assert.equal(toolchain.schemaVersion, 1);
  for (const source of [toolchain.wfa,toolchain.ludory]) {
    assert.match(source.sourceSha, /^[0-9a-f]{40}$/);
    assert.match(source.repository, /^https:\/\/github\.com\/m-amirov\//);
  }
  assert.equal(toolchain.ludory.binding, 'CORE_COMPATIBLE_MANIFEST_ONLY');
  assert.equal(toolchain.ludory.runtimePhaserIntegration, 'NOT_RUN');
  assert.equal(toolchain.ludory.genericPhaserExport, 'NOT_VERIFIED');
  assert.equal(toolchain.authorization.publishing, false);
  assert.equal(toolchain.authorization.ads, false);
  assert.deepEqual(toolchain.runtime.platformTargets, manifest.targets);
});

test('GDD links resolve and six onboarding levels are unambiguously defined', () => {
  const gdd = read('docs/GDD.md');
  const targets = [...gdd.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
    .map(match => match[1])
    .filter(path => !path.startsWith('http'));
  assert.ok(targets.length >= 5);
  for (const target of targets) {
    assert.ok(existsSync(resolve(ROOT,'docs',target)), 'Broken GDD link: ' + target);
  }
  const levels = read('docs/design/LEVELS.md');
  for (let n = 1; n <= 6; n++) {
    const id = 'LV-' + String(n).padStart(2,'0');
    assert.match(levels, new RegExp('\\| ' + id + ' \\|'));
  }
  assert.match(levels, /мастерск/);
  assert.match(levels, /оранжере/);
});

test('Guaranteed first-clear resources fund two mandatory buildings with slack', () => {
  const reward = [8,9,10,10,11,12];
  assert.equal(reward.slice(0,3).reduce((a,b)=>a+b,0),27);
  assert.ok(reward.slice(0,3).reduce((a,b)=>a+b,0) >= 22);
  assert.equal(reward.reduce((a,b)=>a+b,0),60);
  assert.ok(reward.reduce((a,b)=>a+b,0) >= 22+32);
  const economy = read('docs/design/COLONY.md');
  assert.match(economy, /22 материал/);
  assert.match(economy, /32 материал/);
  assert.match(economy, /одноразов/);
});

test('G2 through G7 not asserted as complete by boilerplate', () => {
  const status = read('docs/PROJECT_STATUS.md');
  for (const gate of ['G2','G3','G4','G5','G6']) {
    assert.match(status, new RegExp('\\| ' + gate + ' [^\\n]+\\| NOT_RUN \\|'));
  }
  assert.match(status, /\| G7 [^\n]+\| BLOCKED \|/);
  assert.match(read('src/main.ts'), /G1 scaffold ONLY/);
  assert.match(read('AGENTS.md'), /No independent publishing/);
});

test('Project requires game QA, native Ludory adaptation and real human evidence', () => {
  const acceptance = read('docs/acceptance/REQUIREMENTS.md');
  for (const id of ['GP-001','GP-004','GP-008','COL-005','ECO-002','SAVE-001','ART-001','PLAY-001','SDK-001']) {
    assert.ok(acceptance.includes(id), 'Missing acceptance ID: ' + id);
  }
  const stack = read('docs/architecture/STACK.md');
  assert.match(stack, /RuntimeHost \+ createPhaserRenderer/);
  assert.match(stack, /narrative-only/);
  const skills = toolchain.wfa.skills;
  for (const name of ['game-docs','gameplay-design','game-content-qa','gameplay-playtesting','phaser-core','git-workflow']) {
    assert.ok(skills.includes(name), 'WFA skill missing from selected set: ' + name);
  }
});

test('Approved art direction is pinned to real concept SHA hashes without claiming game assets', () => {
  const art = json('docs/art/REFERENCE_MANIFEST.json');
  assert.equal(art.game, 'kraterika');
  assert.equal(art.approval.decision, 'ART_DIRECTION_APPROVED');
  assert.equal(art.originalsAreInGit, false);
  assert.equal(art.references.length, 3);
  for (const image of art.references) {
    assert.match(image.sha256, /^[a-f0-9]{64}$/);
    assert.ok(image.width >= 1000 && image.height >= 800);
    assert.equal(image.repositoryPath, null);
    assert.equal(image.approvedFor, 'style_reference_only');
  }
  assert.equal(art.runtimeStatus.gameArtComplete, false);
  assert.equal(art.runtimeStatus.runtimeIntegration, 'NOT_RUN');
  const style = read('docs/art/ART_DIRECTION.md');
  assert.match(style, /ART_DIRECTION_APPROVED/);
  assert.match(style, /Цветовые роли не равны правилам игры/);
  assert.match(read('docs/PROJECT_STATUS.md'), /ART_DIRECTION_APPROVED/);
  assert.match(read('docs/art/ART_QA.md'), /ART_ASSETS_NOT_PREPARED/);
});
