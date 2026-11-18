import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,apply,adjacent,TICK_MS} from '../src/game/simulation.ts';
import {MISSIONS} from '../src/game/missions.ts';
function cmd(s,m,c){const out=apply(s,m,c);assert.equal(out.error,undefined,out.error);return out.state;}
function win1(){
 const m=MISSIONS[0];let s=initial(m);
 s=cmd(s,m,{type:'place',at:{x:3,y:3}});
 s=cmd(s,m,{type:'place',at:{x:4,y:3}});
 s=cmd(s,m,{type:'play'});
 for(let i=0;i<5;i++)s=cmd(s,m,{type:'tick'});
 return s;
}
function win2(){
 const m=MISSIONS[1];let s=cmd(initial(m),m,{type:'play'});
 s=cmd(s,m,{type:'tick'});
 s=cmd(s,m,{type:'tick'});
 s=cmd(s,m,{type:'pause'});
 s=cmd(s,m,{type:'switch',at:{x:4,y:4},exit:'E'});
 for(let i=0;i<2;i++)s=cmd(s,m,{type:'step'});
 s=cmd(s,m,{type:'play'});
 for(let i=0;i<3;i++)s=cmd(s,m,{type:'tick'});
 return s;
}
test('LV01 is solved by 2 real route placements and 5 fixed ticks',()=>{
 const s=win1();assert.equal(s.phase,'won');assert.equal(s.tick,5);
 assert.deepEqual(s.cargo.map(c=>c.delivered),[true]);
 assert.deepEqual(s.robots[0].at,{x:6,y:3});assert.equal(s.robots[0].energy,7);
});
test('LV02 is solved by pause, arrow switch, step, resume; both destinations exact',()=>{
 const s=win2();assert.equal(s.phase,'won');assert.equal(s.tick,7);
 assert.deepEqual(s.cargo.map(c=>c.delivered),[true,true]);
 assert.deepEqual(s.robots.map(r=>r.energy),[8,5]);
 assert.deepEqual(s.robots.map(r=>r.at),[{x:4,y:1},{x:7,y:4}]);
});
test('LV01 incomplete route causes waiting, no teleport or battery drain',()=>{
 const m=MISSIONS[0];let s=cmd(initial(m),m,{type:'step'});
 assert.equal(s.phase,'paused');assert.deepEqual(s.robots[0].at,{x:2,y:3});
 s=cmd(s,m,{type:'step'});assert.equal(s.robots[0].status,'waiting');
 assert.equal(s.robots[0].energy,11);assert.deepEqual(s.robots[0].at,{x:2,y:3});
});
test('invalid/out of bounds and out of budget placement is immutable, removal refunds',()=>{
 const m=MISSIONS[0],s=initial(m),before=JSON.stringify(s);
 for(const a of [{type:'place',at:{x:-1,y:3}},{type:'place',at:{x:1,y:3}},{type:'remove',at:{x:3,y:3}}]){
  const r=apply(s,m,a);assert.ok(r.error);assert.equal(r.state,s);
 }
 assert.equal(JSON.stringify(s),before);
 let q=cmd(s,m,{type:'place',at:{x:3,y:2}});
 q=cmd(q,m,{type:'place',at:{x:4,y:2}});
 assert.ok(apply(q,m,{type:'place',at:{x:3,y:3}}).error);
 q=cmd(q,m,{type:'remove',at:{x:3,y:2}});
 q=cmd(q,m,{type:'place',at:{x:3,y:3}});
 assert.equal(q.built.length,2);
});
test('switch accepts only defined exits and cannot mutate completed state',()=>{
 const m=MISSIONS[1],s=initial(m);
 assert.equal(apply(s,m,{type:'switch',at:{x:4,y:4},exit:'W'}).state,s);
 assert.equal(apply(s,m,{type:'switch',at:{x:4,y:1},exit:'N'}).state,s);
 assert.ok(apply(win2(),m,{type:'switch',at:{x:4,y:4},exit:'N'}).error);
});
test('replay is deterministic, restart preserves untouched level definition',()=>{
 const m=MISSIONS[1],script=[
  {type:'play'},{type:'tick'},{type:'tick'},{type:'pause'},{type:'switch',at:{x:4,y:4},exit:'E'},
  ...Array(2).fill({type:'step'}),{type:'play'},...Array(3).fill({type:'tick'})];
 const replay=()=>script.reduce((s,c)=>cmd(s,m,c),initial(m));
 assert.deepEqual(replay(),replay());
 assert.deepEqual(cmd(replay(),m,{type:'restart'}),initial(m));
 assert.equal(TICK_MS,250);
});
test('head-on swaps and duplicate reservations block both without spending energy',()=>{
 const m=MISSIONS[0];
 const a={id:'A',at:{x:2,y:2},facing:'E',energy:5,cargoId:'a',status:'ready'};
 const b={id:'B',at:{x:4,y:2},facing:'W',energy:5,cargoId:'b',status:'ready'};
 const mk=(robots,tracks)=>({...m,robots,startTracks:tracks,cargo:[
  {id:'a',type:'water',destination:{x:7,y:7},delivered:false},
  {id:'b',type:'oxygen',destination:{x:7,y:6},delivered:false}]});
 const hit=mk([a,b],[{x:2,y:2},{x:3,y:2},{x:4,y:2}]);
 const s=cmd(initial(hit),hit,{type:'step'});
 assert.deepEqual(s.robots.map(r=>r.at),[a.at,b.at]);
 assert.deepEqual(s.robots.map(r=>r.energy),[5,5]);
 const swap=mk([a,{...b,at:{x:3,y:2}}],[{x:2,y:2},{x:3,y:2}]);
 const q=cmd(initial(swap),swap,{type:'step'});
 assert.deepEqual(q.robots.map(r=>r.at),[a.at,{x:3,y:2}]);
 assert.deepEqual(q.robots.map(r=>r.energy),[5,5]);
});
test('stationary occupant and cascaded block cannot overlap positions',()=>{
 const m=MISSIONS[0],x={...m,startTracks:[{x:1,y:1},{x:2,y:1},{x:3,y:1}],
 robots:[
  {id:'A',at:{x:1,y:1},facing:'E',energy:5,cargoId:'a',status:'ready'},
  {id:'B',at:{x:2,y:1},facing:'E',energy:0,cargoId:'b',status:'ready'}],
 cargo:[
  {id:'a',type:'water',destination:{x:7,y:7},delivered:false},
  {id:'b',type:'water',destination:{x:7,y:6},delivered:false}]
 };
 const s=cmd(initial(x),x,{type:'step'});
 assert.equal(s.robots[0].status,'waiting');assert.equal(s.robots[0].energy,5);
 assert.notDeepEqual(s.robots[0].at,s.robots[1].at);
});
test('cannot advance won mission or build outside planning; no second delivery',()=>{
 const m=MISSIONS[0],s=win1();
 assert.ok(apply(s,m,{type:'tick'}).error);
 assert.ok(apply(s,m,{type:'place',at:{x:3,y:2}}).error);
 assert.equal(s.cargo.filter(c=>c.delivered).length,1);
});
test('teaching levels represent distinct tasks, complete switch is present',()=>{
 assert.equal(MISSIONS.length,2);assert.equal(MISSIONS[0].trackBudget,2);
 assert.equal(MISSIONS[1].switches[0].selected,'N');
 assert.deepEqual(MISSIONS[1].cargo.map(c=>c.type),['water','oxygen']);
 assert.deepEqual(adjacent({x:3,y:3},'N'),{x:3,y:2});
});
