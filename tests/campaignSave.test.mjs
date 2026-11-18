import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,startAttempt,dispatchAttempt,runSolutionTrace,commitCompletion} from '../src/game/campaign.ts';
import {CAMPAIGN_SAVE_KEY,serializeCampaignSave,deserializeCampaignSave} from '../src/game/campaignSave.ts';

test('campaign save restores persistent world and pauses an interrupted operation',()=>{
  let world=createWorld();
  world=commitCompletion(world,runSolutionTrace('CT-01').attempt).world;
  let attempt=startAttempt(world,'CT-02').attempt;
  attempt=dispatchAttempt(attempt,{type:'play'}).state;
  attempt=dispatchAttempt(attempt,{type:'tick'}).state;
  const restored=deserializeCampaignSave(serializeCampaignSave(world,attempt));
  assert.ok(restored);
  assert.deepEqual(restored.world,world);
  assert.equal(restored.attempt.phase,'paused');
  assert.equal(restored.attempt.tick,1);
  assert.equal(CAMPAIGN_SAVE_KEY,'kraterika:campaign:g3:v3');
});

test('campaign save rejects corruption, schema drift, duplicate receipts and impossible medals',()=>{
  const raw=serializeCampaignSave(createWorld(),null);
  assert.equal(deserializeCampaignSave('{broken'),null);
  assert.equal(deserializeCampaignSave(null),null);
  assert.equal(deserializeCampaignSave(' '.repeat(300001)),null);
  let value=JSON.parse(raw);value.schema=2;
  assert.equal(deserializeCampaignSave(JSON.stringify(value)),null);
  value=JSON.parse(raw);value.world.rewardReceipts=['first-clear:CT-01','first-clear:CT-01'];
  assert.equal(deserializeCampaignSave(JSON.stringify(value)),null);
  value=JSON.parse(raw);value.world.bestMedals['CT-01']=4;
  assert.equal(deserializeCampaignSave(JSON.stringify(value)),null);
  value=JSON.parse(raw);value.world.materials=-1;
  assert.equal(deserializeCampaignSave(JSON.stringify(value)),null);
});

test('G2-R save is never interpreted as G3 progress and deserialized values do not alias input',()=>{
  const legacy=JSON.stringify({schema:2,state:{revision:2,completedOnce:true}});
  assert.equal(deserializeCampaignSave(legacy),null);
  const world=createWorld();
  const loaded=deserializeCampaignSave(serializeCampaignSave(world,null));
  assert.ok(loaded);
  loaded.world.materials=999;
  assert.equal(world.materials,12);
});

test('completed attempt and best medals remain valid after reload without another reward',()=>{
  const solved=runSolutionTrace('CT-01').attempt;
  const world=commitCompletion(createWorld(),solved).world;
  const loaded=deserializeCampaignSave(serializeCampaignSave(world,solved));
  assert.ok(loaded);
  assert.equal(loaded.attempt.phase,'complete');
  assert.equal(loaded.world.materials,16);
  assert.equal(loaded.world.bestMedals['CT-01'],3);
  assert.deepEqual(loaded.world.rewardReceipts,['first-clear:CT-01']);
});
