import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTRACTS, createWorld, startAttempt, dispatchAttempt, commitCompletion,
  runSolutionTrace, careerScore, restartAttempt
} from '../src/game/campaign.ts';

const apply=(state,command)=>{
  const result=dispatchAttempt(state,command);
  assert.equal(result.error,undefined,result.error);
  return result.state;
};

test('CT-01..06 are ordered unique operations with distinct required mechanics and gold traces',()=>{
  assert.deepEqual(CONTRACTS.map(c=>c.id),['CT-01','CT-02','CT-03','CT-04','CT-05','CT-06']);
  assert.deepEqual(CONTRACTS.map(c=>c.requiredMechanics),[
    ['route'],['route','switch','twoRobots'],['route','charger'],
    ['route','arm'],['route','greenhouse'],['route','switch','twoRobots','functionalBuildings']
  ]);
  for(const contract of CONTRACTS){
    const result=runSolutionTrace(contract.id);
    assert.equal(result.attempt.phase,'complete',contract.id);
    assert.equal(result.medal,3,contract.id);
    assert.ok(result.attempt.metrics.ticks<=contract.medals.gold.maxTicks,contract.id);
    assert.ok(result.attempt.metrics.spent<=contract.medals.gold.maxSpent,contract.id);
  }
});

test('campaign unlocks sequentially and commits functional world changes exactly once',()=>{
  let world=createWorld();
  assert.equal(world.materials,12);
  assert.deepEqual(world.unlockedContracts,['CT-01']);
  const expected=[
    ['dispatch','operational'],['distribution','operational'],['power','operational'],
    ['workshop','operational'],['greenhouse','operational'],['district1','operational']
  ];
  const balances=[16,23,26,24,22,28];
  for(let i=0;i<CONTRACTS.length;i++){
    const solved=runSolutionTrace(CONTRACTS[i].id);
    const committed=commitCompletion(world,solved.attempt);
    assert.equal(committed.error,undefined);
    world=committed.world;
    assert.equal(world.materials,balances[i]);
    assert.equal(world.buildings[expected[i][0]].state,expected[i][1]);
    assert.ok(world.clearedContracts.includes(CONTRACTS[i].id));
    const replay=commitCompletion(world,solved.attempt);
    assert.equal(replay.world.materials,world.materials,'replay reward duplicated for '+CONTRACTS[i].id);
    assert.deepEqual(replay.world.production,world.production,'replay production duplicated');
  }
  assert.deepEqual(world.production,{components:2,food:2});
  assert.equal(careerScore(world),1800);
});

test('persistent construction costs stay solvent at every chapter prefix without farming',()=>{
  let world=createWorld();
  for(const contract of CONTRACTS){
    assert.ok(world.materials>=contract.permanentCost,contract.id+' mandatory building unaffordable');
    const solved=runSolutionTrace(contract.id);
    world=commitCompletion(world,solved.attempt).world;
  }
  assert.equal(world.materials,28);
  assert.equal(world.clearedContracts.length,6);
});

test('restart resets only mission attempt and preserves developed colony',()=>{
  let world=createWorld();
  world=commitCompletion(world,runSolutionTrace('CT-01').attempt).world;
  let attempt=startAttempt(world,'CT-02').attempt;
  attempt=apply(attempt,{type:'place',tool:'route',at:CONTRACTS[1].buildSites.route[0]});
  attempt=apply(attempt,{type:'step'});
  const restarted=restartAttempt(world,attempt);
  assert.equal(restarted.tick,0);
  assert.equal(restarted.budget,CONTRACTS[1].attemptBudget);
  assert.equal(world.buildings.dispatch.state,'operational');
  assert.deepEqual(world.clearedContracts,['CT-01']);
});

test('charger is required for CT-03 and insufficient energy stops without negative charge',()=>{
  let attempt=startAttempt(createWorld({clearedContracts:['CT-01','CT-02']}),'CT-03').attempt;
  for(const p of CONTRACTS[2].buildSites.route)attempt=apply(attempt,{type:'place',tool:'route',at:p});
  for(let i=0;i<12;i++)attempt=apply(attempt,{type:'step'});
  assert.notEqual(attempt.phase,'complete');
  assert.equal(attempt.robots[0].energy,0);
  assert.match(attempt.notice,/заряд/i);
});

test('arm transfer is validated and cargo has only one holder',()=>{
  let attempt=startAttempt(createWorld({clearedContracts:['CT-01','CT-02','CT-03']}),'CT-04').attempt;
  assert.ok(dispatchAttempt(attempt,{type:'transfer'}).error);
  for(const command of CONTRACTS[3].solution)attempt=apply(attempt,command);
  const cargo=attempt.cargo[0];
  assert.equal(cargo.delivered,true);
  assert.equal(cargo.holder,'workshop');
  assert.equal(attempt.events.filter(e=>e.type==='arm.transfer.completed').length,1);
  assert.ok(dispatchAttempt(attempt,{type:'transfer'}).error);
});

test('CT-06 needs functional workshop and greenhouse and priority switch prevents robot overlap',()=>{
  const incomplete=createWorld({clearedContracts:['CT-01','CT-02','CT-03','CT-04','CT-05']});
  incomplete.buildings.greenhouse.state='waiting';
  assert.match(startAttempt(incomplete,'CT-06').error,/оранжерея/i);
  const solved=runSolutionTrace('CT-06').attempt;
  assert.equal(solved.metrics.collisions,0);
  assert.equal(solved.metrics.switchRoutes>=1,true);
  for(const event of solved.events.filter(e=>e.type==='tick')){
    const positions=event.positions.map(p=>p.x+','+p.y);
    assert.equal(new Set(positions).size,positions.length,'robots overlap at tick '+event.tick);
  }
  assert.deepEqual(solved.cargo.map(c=>c.delivered),[true,true]);
});

test('medals use logical metrics and best medal never decreases',()=>{
  let world=createWorld();
  const gold=runSolutionTrace('CT-01');
  world=commitCompletion(world,gold.attempt).world;
  assert.equal(world.bestMedals['CT-01'],3);
  const slower=structuredClone(gold.attempt);
  slower.medal=1;slower.metrics.ticks=999;
  world=commitCompletion(world,slower).world;
  assert.equal(world.bestMedals['CT-01'],3);
  assert.equal(careerScore(world),300);
  assert.equal('elapsedMs' in gold.attempt.metrics,false);
});

test('same trace replays bit-for-bit and invalid destination cannot complete',()=>{
  assert.deepEqual(runSolutionTrace('CT-06'),runSolutionTrace('CT-06'));
  let attempt=startAttempt(createWorld(),'CT-01').attempt;
  attempt.cargo[0].destination='wrong-building';
  for(const command of CONTRACTS[0].solution){
    const result=dispatchAttempt(attempt,command);
    if(!result.error)attempt=result.state;
  }
  assert.notEqual(attempt.phase,'complete');
});
