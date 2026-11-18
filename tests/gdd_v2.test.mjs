import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf-8');
const json=path=>JSON.parse(read(path));
const c=json('docs/design/CAMPAIGN_CONTRACTS_V2.json');
const d=json('docs/design/DAILY_QUESTS_REGISTRY.json');
const a=json('docs/design/ACHIEVEMENTS_REGISTRY.json');
const lb=read('docs/design/LEADERBOARDS.md');
const gdd=read('docs/GDD.md');
const acc=read('docs/acceptance/REQUIREMENTS_V2.md');

test('V2 GDD records owner-approved design while limiting runtime proof to G3 chapter one',()=>{
 assert.match(gdd,/v0\.2/);
 assert.match(gdd,/G1_DESIGN_APPROVED/);
 assert.match(gdd,/CT-01(?:\.\.|…)CT-30/);
 assert.match(gdd,/NOT_IMPLEMENTED/);
 assert.equal(c.designStatus,'G1_DESIGN_APPROVED');
 assert.equal(c.implementation.contractsImplemented,6);
 assert.equal(c.implementation.runtimeScope,'CT-01..CT-06');
});
test('Five districts and 30 unique, gapless, ordered contract IDs',()=>{
 assert.equal(c.schemaVersion,2);
 assert.equal(c.gameId,'kraterika');
 assert.equal(c.contracts.length,30);
 assert.deepEqual(c.chapters.map(z=>z.number),[1,2,3,4,5]);
 const ids=c.contracts.map(x=>x.id);
 assert.equal(new Set(ids).size,30);
 assert.deepEqual(ids,Array.from({length:30},(_,i)=>'CT-'+String(i+1).padStart(2,'0')));
 for(const [i,item] of c.contracts.entries()){
  assert.equal(item.chapter,Math.floor(i/6)+1);
  assert.deepEqual(item.prerequisites,i?[ids[i-1]]:[]);
  assert.match(item.worldEffect,/\S+/);
  assert.ok(item.mechanics.length>=1);
  assert.equal(item.scope,i<6?'IMPLEMENTED_G3':'PLANNED');
  if(i<6)assert.match(item.solutionTrace,/campaignContracts\.ts/);
  else assert.equal(item.solutionTrace,'NOT_RUN');
 }
});
test('Each chapter includes actual structural change to the colony',()=>{
 assert.equal(c.chapters.length,5);
 for(const chapter of c.chapters){
  assert.match(chapter.name,/\S/);
  assert.match(chapter.effect,/\S/);
  assert.equal(c.contracts.filter(x=>x.chapter===chapter.number).length,6);
 }
 for(const name of ['Первые огни','Зелёный купол','Тёмная сторона','Пылевые кратеры','Дальний горизонт'])
  assert.ok(c.chapters.some(x=>x.name===name));
});
test('Training chapter covers new engineering rather than just route-and-play',()=>{
 const early=c.contracts.slice(0,6).flatMap(x=>x.mechanics).join(' ').toLowerCase();
 for(const target of ['стрелка','зарядка','манипулятор','постройка','робота'])
  assert.ok(early.includes(target),'missing '+target);
});
test('G3 economics and medals are calibrated only for six implemented contracts',()=>{
 for(const [i,x] of c.contracts.entries()){
  if(i<6){
   assert.ok(Number.isInteger(x.rewardMaterials)&&x.rewardMaterials>0);
   assert.ok(Number.isInteger(x.permanentCost)&&x.permanentCost>=0);
   assert.ok(Number.isInteger(x.attemptBudget)&&x.attemptBudget>0);
   assert.ok(x.medalTargets.gold.maxTicks<=x.medalTargets.silver.maxTicks);
  }else{
   assert.equal(x.rewardMaterials,null);
   assert.equal(x.medalTargets,null);
  }
  assert.equal(x.artStatus,'NOT_CREATED');
 }
 assert.match(c.campaignRules.numericBalance,/CT-01\.\.CT-06 CALIBRATED/);
 assert.equal(c.campaignRules.firstClearOnce,true);
 assert.equal(c.campaignRules.dailyMissionsRequired,false);
 assert.equal(c.campaignRules.authenticationRequiredForCampaign,false);
});
test('Daily registry defines 3 slots after CT-02 with usable category fallback IDs',()=>{
 assert.equal(d.status,'G1_DESIGN_APPROVED_RUNTIME_NOT_IMPLEMENTED');
 assert.equal(d.reset,'00:00 UTC');
 assert.equal(d.sourceTime,'ysdk.serverTime()');
 assert.equal(d.startAfter,'CT-02');
 assert.deepEqual(d.slotCategories,['basic','engineering','mastery']);
 assert.equal(d.slotsPerDay,3);
 assert.equal(d.templates.length,12);
 const map=new Map(d.templates.map(q=>[q.id,q]));
 assert.equal(map.size,12);
 for(const category of d.slotCategories){
  const fallback=map.get(d.fallbacks[category]);
  assert.ok(fallback,'missing fallback for '+category);
  assert.equal(fallback.category,category);
 }
 for(const q of d.templates){
  assert.match(q.id,/^DQ-[A-Z]+$/);
  assert.ok(q.target>=1);
  assert.ok(q.minChapter>=1 && q.minChapter<=5);
 }
});
test('Daily rewards are cosmetic only and deduplicated per UTC date',()=>{
 assert.equal(d.rewards.cosmeticOnly,true);
 assert.equal(d.rewards.requiredForCampaign,false);
 assert.equal(d.rewards.dailyStamp,'one stamp after 2-of-3 completed on a UTC day');
 assert.deepEqual(d.rewards.milestones,[3,7,14,30]);
 assert.match(d.claimPolicy,/exactly once/i);
 assert.match(d.offlinePolicy,/no time trust/);
 assert.match(read('docs/design/DAILY_QUESTS.md'),/23:59:59/);
});
test('22 unique achievements across five groups with explicit event trigger',()=>{
 assert.equal(a.designStatus,'G1_DESIGN_APPROVED_RUNTIME_NOT_IMPLEMENTED');
 assert.equal(a.achievementCount,22);
 assert.equal(a.records.length,22);
 assert.equal(new Set(a.records.map(x=>x.id)).size,22);
 const count={campaign:6,engineering:8,mastery:4,daily:3,world:1};
 for(const [group,n] of Object.entries(count))
  assert.equal(a.records.filter(x=>x.group===group).length,n,group);
 for(const ach of a.records){
  assert.match(ach.id,/^ACH-[A-Z]+-\d{2}$/);
  assert.match(ach.trigger,/\S/);
  assert.equal(ach.once,true);
  assert.equal(ach.reward,'badge');
  assert.equal(ach.status,'DESIGN_ONLY');
 }
 assert.equal(a.mandatoryForCampaign,false);
 assert.equal(a.leaderboardContribution,false);
});
test('Achievement story milestones all resolve to real campaign contracts',()=>{
 for(const row of a.records.filter(x=>x.group==='campaign')){
  assert.ok(c.contracts.some(item=>item.id===row.trigger),'invalid '+row.trigger);
 }
});
test('Career leaderboard has score max 9000 without grind and SDK guest boundaries',()=>{
 const sample=[3,2,2,1,3,2];
 assert.equal(sample.reduce((sum,medal)=>sum+100*medal,0),1300);
 assert.equal(Array(30).fill(3).reduce((s,v)=>s+100*v,0),9000);
 assert.match(lb,/kraterika_mastery_v1/);
 assert.match(lb,/0…9000/);
 assert.match(lb,/setScore/);
 assert.match(lb,/getEntries/);
 assert.match(lb,/1\/сек/);
 assert.match(lb,/client-calculated, anti-cheat NOT_GUARANTEED/);
 assert.match(lb,/NOT_CONFIGURED/);
 assert.match(gdd,/добровольной авторизации/);
});
test('Yandex auth, server time and saving rules are specified without pretending to be integrated',()=>{
 const p=read('docs/architecture/PROGRESSION_SAVES_V2.md');
 assert.match(p,/200 КБ/);
 assert.match(p,/100 setData\/5 мин/);
 assert.match(p,/guest/);
 assert.match(p,/ysdk.serverTime/);
 assert.match(p,/merge/);
 assert.match(p,/NOT_RUN/);
 assert.match(gdd,/NOT_CONFIGURED/);
});
test('V2 acceptance distinguishes design evidence and real runtime tests',()=>{
 for(const id of ['CAM-001','CAM-003','CAM-006','DAY-001','DAY-003',
  'ACH-101','ACH-102','LB-101','LB-104','SAVE-101','SDK-101','QA-101'])
  assert.ok(acc.includes(id),'missing acceptance '+id);
 assert.match(acc,/G1_DESIGN_APPROVED/);
 assert.match(acc,/NOT_RUN/);
 assert.match(acc,/runtime/i);
});
