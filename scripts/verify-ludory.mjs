#!/usr/bin/env node
// Read-only Core-compatible manifest check on a pinned local Ludory checkout.
import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

function fail(message) {
  console.error(JSON.stringify({status:'BLOCKED',reason:message,studioProvenance:'NOT_RUN',runtimePhaser:'NOT_RUN',platformAcceptance:'NOT_RUN'}));
  process.exit(1);
}
const index = process.argv.indexOf('--ludory');
if (index === -1 || !process.argv[index + 1]) fail('Usage: node scripts/verify-ludory.mjs --ludory /path/to/pinned/ludory');
try {
  const project = resolve(import.meta.dirname, '..');
  const toolchain = JSON.parse(readFileSync(join(project,'integrations/toolchain.json'), 'utf8'));
  const ludory = resolve(process.argv[index + 1]);
  const head = execFileSync('git', ['-C',ludory,'rev-parse','HEAD'], {encoding:'utf8'}).trim();
  const origin = execFileSync('git', ['-C',ludory,'remote','get-url','origin'], {encoding:'utf8'}).trim();
  if (head !== toolchain.ludory.sourceSha) fail('Ludory source SHA differs from pinned revision');
  if (!/^(https:\/\/github\.com\/|git@github\.com:)m-amirov\/ludory(\.git)?$/.test(origin)) fail('Ludory origin mismatch');
  const definitionUrl = pathToFileURL(join(ludory,'packages','core','src','definition.mjs'));
  const { defineGame } = await import(definitionUrl.href);
  const parsed = JSON.parse(readFileSync(join(project,'ludory.project.json'), 'utf8'));
  const game = defineGame(parsed);
  if (game.id !== 'kraterika' || game.engine !== 'phaser' ||
      game.targets.length !== 2 ||
      game.targets[0] !== 'yandex-games' || game.targets[1] !== 'vk-games') {
    fail('Unexpected game identity, engine or targets');
  }
  console.log(JSON.stringify({
    status:'CORE_MANIFEST_VERIFIED',gameId:game.id,engine:game.engine,
    ludoryHead:head,studioProvenance:'NOT_RUN',runtimePhaser:'NOT_RUN',
    genericPhaserExport:'NOT_VERIFIED',platformAcceptance:'NOT_RUN'
  },null,2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
