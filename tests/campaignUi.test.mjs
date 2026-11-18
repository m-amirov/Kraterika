import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('G3 page mounts colony, operation and result controls without fake future buttons',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const id of ['colony-view','operation-view','result-view','contract-list','game','g3-step','g3-play','g3-pause','g3-restart','g3-transfer','back-to-colony']){
    assert.match(html,new RegExp(`id=["']${id}["']`),id);
  }
  assert.doesNotMatch(html,/<button[^>]*>\s*(Задания дня|Лунный журнал|Лидеры)/i);
  assert.match(html,/campaignMain\.ts/);
});

test('G2-R browser fixture remains independently mountable',()=>{
  const html=readFileSync(new URL('../g2r.html',import.meta.url),'utf8');
  for(const id of ['yard-play','yard-pause','yard-step','yard-transfer','yard-restart'])assert.match(html,new RegExp(`id=["']${id}["']`));
  assert.match(html,/yardMain\.ts/);
});
