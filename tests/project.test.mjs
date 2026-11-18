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

test('GDD v0.2 links resolve and 30 mission IDs replace obsolete product design',()=>{
 const gdd=read('docs/GDD.md');
 const targets=[...gdd.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)]
  .map(match=>match[1]).filter(path=>!path.startsWith('http'));
 assert.ok(targets.length>=12);
 for(const target of targets)assert.ok(existsSync(resolve(ROOT,'docs',target)),'Broken GDD link: '+target);
 const campaign=json('docs/design/CAMPAIGN_CONTRACTS_V2.json');
 assert.equal(campaign.contracts.length,30);
 assert.equal(campaign.chapters.length,5);
 const levels=read('docs/design/LEVELS.md');
 assert.match(levels,/CT-01/);
 assert.match(levels,/CT-30/);
 const effects=campaign.contracts.map(item=>item.worldEffect).join(' ').toLowerCase();
 assert.match(effects,/мастерск/);
 assert.match(effects,/оранжере/);
 assert.match(levels,/LV-01.*regression/i);
});

test('Legacy v0.1 economy is not silently adopted as new campaign balance',()=>{
 const old=[8,9,10,10,11,12];
 assert.equal(old.reduce((a,b)=>a+b,0),60); // historical only
 const campaign=json('docs/design/CAMPAIGN_CONTRACTS_V2.json');
 assert.deepEqual(campaign.contracts.slice(0,6).map(c=>c.rewardMaterials),[8,7,9,10,12,14]);
 assert.ok(campaign.contracts.slice(0,6).every(c=>c.medalTargets!==null));
 assert.ok(campaign.contracts.slice(6).every(c=>c.rewardMaterials===null&&c.medalTargets===null));
 assert.notDeepEqual(campaign.contracts.slice(0,6).map(c=>c.rewardMaterials),old);
 assert.match(campaign.campaignRules.numericBalance,/CT-01\.\.CT-06 CALIBRATED/);
 const economy=read('docs/design/COLONY.md');
 assert.match(economy,/22\/32/);
 assert.match(economy,/Баланс CT-01\.\.CT-06 рассчитан/);
 assert.match(read('docs/acceptance/REQUIREMENTS.md'),/истории требований/);
});

test('G3 is engineering verified while G4–G7 remain gated', () => {
  const status = read('docs/PROJECT_STATUS.md');
  assert.match(status,/\| G3 [^\n]+\| ENGINEERING_VERIFIED \/ ART_OR_PRODUCT_GATE_PENDING \|/);
  for (const gate of ['G4','G5','G6']) {
    assert.match(status, new RegExp('\\| ' + gate + ' [^\\n]+\\| NOT_RUN \\|'));
  }
  assert.match(status, /\| G7 [^\n]+\| BLOCKED \|/);
  assert.match(status, /\| G2 — First playable \| FIRST_PLAYABLE_VERIFIED \|/);
  assert.match(read('src/main.ts'), /G2 first playable/);
  assert.match(read('docs/G2_FIRST_PLAYABLE.md'), /44285741577/);
  assert.match(read('scripts/browser-smoke.mjs'), /G2_BROWSER_SMOKE_VERIFIED/);
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

test('Owner gameplay rejection is recorded and prior G2 engineering PASS is not product acceptance', () => {
 const status=read('docs/PROJECT_STATUS.md');
 assert.match(status,/PRODUCT_REJECTED/);
 assert.match(status,/G2-R/);
 const reset=read('docs/design/GAMEPLAY_RESET_2026-11-18.md');
 assert.match(reset,/Небесной почты/);
 assert.match(reset,/Манипулятор/);
 assert.match(reset,/заряд/);
 const reference=json('docs/art/REVIEW_REFERENCE_2026-11-18.json');
 assert.equal(reference.fileInGit,false);
 assert.equal(reference.width,1672);
 assert.equal(reference.height,941);
 assert.match(reference.sha256,/^[a-f0-9]{64}$/);
 assert.equal(reference.runtimeMatch,'NOT_IMPLEMENTED');
 assert.match(read('AGENTS.md'),/Technical CI PASS/);
});

test('G2-R browser HUD mounts every required static control to prevent bootstrap crash',()=>{
 const source=read('src/yardMain.ts');
 const html=read('g2r.html');
 const ids=new Set([...source.matchAll(/(?:get|text|btn)\('([^']+)'/g)].map(m=>m[1]));
 assert.ok(ids.size>12);
 for(const id of ids)assert.ok(html.includes('id="'+id+'"'),'Missing element '+id);
 assert.match(html,/src\/yardMain\.ts/);
 assert.match(read('src/game/yard.ts'),/function move/);
 assert.match(read('scripts/yard-browser-smoke.mjs'),/G2R_LIVE_YARD_BROWSER_VERIFIED/);
});

test('G2-R engineering receipts are concrete, product approval remains explicitly pending',()=>{
 const status=read('docs/PROJECT_STATUS.md');
 const g2r=read('docs/G2R_LIVE_YARD.md');
 assert.match(status,/\| G2-R [^\n]+\| ENGINEERING_VERIFIED \/ PRODUCT_REVIEW_PENDING \|/);
 assert.match(g2r,/44304280297/);
 assert.match(g2r,/44304280512/);
 assert.match(g2r,/14427765921/);
 assert.match(g2r,/getBoundingClientRect/);
 assert.match(read('docs/art/ART_DIRECTION.md'),/ART_DIRECTION_APPROVED/);
});
