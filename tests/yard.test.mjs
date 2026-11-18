import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
 initialYard,dispatchYard,canTransfer,SITES,COST,INITIAL_BUDGET,YARD_TICK_MS
} from '../src/game/yard.ts';
const apply=(state,command)=>{
 const result=dispatchYard(state,command);
 assert.equal(result.error,undefined,result.error);
 return result.state;
};
const prepare=()=>{
 let s=initialYard();
 s=apply(s,{type:'place',tool:'greenhouse',at:SITES.greenhouse});
 s=apply(s,{type:'place',tool:'route',at:{x:6,y:4}});
 s=apply(s,{type:'place',tool:'charger',at:SITES.charger});
 s=apply(s,{type:'place',tool:'arm',at:SITES.arm});
 return s;
};
function finish(){
 let s=prepare();
 for(let i=0;i<2;i++)s=apply(s,{type:'step'});
 s=apply(s,{type:'switch'});
 for(let i=0;i<6;i++)s=apply(s,{type:'step'});
 assert.equal(s.tick,8);
 assert.equal(canTransfer(s),true);
 return apply(s,{type:'transfer'});
}
test('G2-R: greenhouse, track, charger and arm are real buildable devices with material costs',()=>{
 const s=prepare();
 assert.equal(s.budget,INITIAL_BUDGET-COST.greenhouse-COST.route-COST.charger-COST.arm);
 assert.equal(s.modules.find(m=>m.id==='greenhouse').built,true);
 assert.equal(s.modules.find(m=>m.id==='greenhouse').active,false);
 assert.deepEqual(s.equipment.map(e=>e.kind).sort(),['arm','charger']);
 assert.ok(s.tracks.some(p=>p.x===6&&p.y===4));
});
test('G2-R: two simultaneous rover deliveries require operating the network and activate functional colony',()=>{
 const s=finish();
 assert.equal(s.phase,'complete');
 assert.equal(s.tick,8);
 assert.deepEqual(s.cargo.map(x=>x.delivered),[true,true]);
 assert.deepEqual(s.modules.map(x=>[x.id,x.active]),[['dispatch',true],['greenhouse',true],['workshop',true]]);
 assert.equal(s.nextContract,true,'Greenhouse must produce a follow-up food contract');
 assert.equal(s.completedOnce,true);
 assert.deepEqual(s.robots.map(r=>[r.at,r.energy]),[[{x:8,y:2},2],[{x:7,y:4},4]]);
});
test('G2-R: without a charger second rover runs out of battery and cannot be rescued by route alone',()=>{
 let s=initialYard();
 s=apply(s,{type:'place',tool:'greenhouse',at:SITES.greenhouse});
 s=apply(s,{type:'place',tool:'route',at:{x:6,y:4}});
 s=apply(s,{type:'place',tool:'arm',at:SITES.arm});
 s=apply(s,{type:'step'});s=apply(s,{type:'step'});s=apply(s,{type:'switch'});
 for(let i=0;i<8;i++)s=apply(s,{type:'step'});
 const rover=s.robots[1];
 assert.deepEqual(rover.at,{x:5,y:4});
 assert.equal(rover.energy,0);
 assert.equal(s.phase,'paused');
 assert.equal(canTransfer(s),false);
});
test('G2-R: without arm there is no way to deliver parts across fractured terminal',()=>{
 let s=initialYard();
 s=apply(s,{type:'place',tool:'greenhouse',at:SITES.greenhouse});
 s=apply(s,{type:'place',tool:'route',at:{x:6,y:4}});
 s=apply(s,{type:'place',tool:'charger',at:SITES.charger});
 s=apply(s,{type:'step'});s=apply(s,{type:'step'});s=apply(s,{type:'switch'});
 for(let i=0;i<9;i++)s=apply(s,{type:'step'});
 assert.deepEqual(s.robots[1].at,SITES.pickup);
 assert.equal(s.cargo[1].delivered,false);
 assert.equal(s.phase,'paused');
 assert.ok(dispatchYard(s,{type:'transfer'}).error);
});
test('G2-R: greenhouse is not just decorative: supply without constructed dome cannot unlock food',()=>{
 let s=initialYard();
 s=apply(s,{type:'place',tool:'route',at:{x:6,y:4}});
 s=apply(s,{type:'place',tool:'charger',at:SITES.charger});
 s=apply(s,{type:'place',tool:'arm',at:SITES.arm});
 s=apply(s,{type:'step'});s=apply(s,{type:'step'});s=apply(s,{type:'switch'});
 for(let i=0;i<6;i++)s=apply(s,{type:'step'});
 assert.equal(s.robots[0].at.x,8);
 assert.equal(s.robots[0].at.y,2);
 assert.equal(s.cargo[0].delivered,false);
 assert.equal(s.nextContract,false);
 s=apply(s,{type:'place',tool:'greenhouse',at:SITES.greenhouse});
 assert.equal(s.cargo[0].delivered,true);
 assert.equal(s.nextContract,true);
});
test('G2-R: cannot duplicate material award; reset preserves first-clear flag but restores sandbox build budget',()=>{
 const s=finish();
 assert.equal(s.completedOnce,true);
 assert.ok(dispatchYard(s,{type:'transfer'}).error);
 const again=apply(s,{type:'reset'});
 assert.equal(again.completedOnce,true);
 assert.equal(again.budget,20);
 assert.equal(again.phase,'planning');
 const twice=finish(); // fresh independent trace deterministic
 assert.deepEqual(s,twice);
});
test('G2-R: invalid builds, inaccessible sites, no payment and action outside pause fail-closed',()=>{
 const s=initialYard(),copy=JSON.stringify(s);
 for(const command of [
  {type:'place',tool:'route',at:{x:-1,y:4}},
  {type:'place',tool:'route',at:{x:4,y:4}},
  {type:'place',tool:'arm',at:{x:2,y:5}},
  {type:'place',tool:'charger',at:SITES.arm},
  {type:'transfer'},
  {type:'erase',at:SITES.greenhouse}
 ]){
  const result=dispatchYard(s,command);
  assert.ok(result.error,JSON.stringify(command));
  assert.equal(result.state,s);
 }
 assert.equal(JSON.stringify(s),copy);
 const running=apply(s,{type:'play'});
 assert.ok(dispatchYard(running,{type:'place',tool:'arm',at:SITES.arm}).error);
 assert.ok(dispatchYard(running,{type:'switch'}).error);
});
test('G2-R: removal refunds cost and blocks deletion under occupied rover',()=>{
 let s=prepare();const spent=s.budget;
 s=apply(s,{type:'erase',at:SITES.arm});
 assert.equal(s.budget,spent+COST.arm);
 s=apply(s,{type:'place',tool:'arm',at:SITES.arm});
 s=apply(s,{type:'erase',at:SITES.greenhouse});
 assert.equal(s.modules.find(m=>m.id==='greenhouse').built,false);
 assert.equal(s.budget,spent+COST.greenhouse);
 s=apply(s,{type:'place',tool:'greenhouse',at:SITES.greenhouse});
 s=apply(s,{type:'step'});s=apply(s,{type:'step'});s=apply(s,{type:'switch'});
 for(let i=0;i<3;i++)s=apply(s,{type:'step'});
 assert.equal(s.robots[1].at.x,5);
 assert.ok(dispatchYard(s,{type:'erase',at:SITES.charger}).error);
});
test('G2-R: same script deterministically replays with no RNG or wall clock',()=>{
 const a=finish(),b=finish();
 assert.deepEqual(a,b);
 assert.equal(YARD_TICK_MS,250);
 assert.equal(a.notice.includes('Новый заказ'),true);
});
