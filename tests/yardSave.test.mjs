import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialYard,dispatchYard} from '../src/game/yard.ts';
import {serializeYard,deserializeYard,YARD_SAVE_KEY} from '../src/game/yardSave.ts';

test('G2-R: save and restore full yard, normalizing in-progress run to pause on reload',()=>{
 let state=initialYard();
 state=dispatchYard(state,{type:'place',tool:'route',at:{x:6,y:4}}).state;
 state=dispatchYard(state,{type:'play'}).state;
 state=dispatchYard(state,{type:'tick'}).state;
 const loaded=deserializeYard(serializeYard(state));
 assert.ok(loaded);
 assert.equal(loaded.phase,'paused');
 assert.equal(loaded.tick,state.tick);
 assert.deepEqual(loaded.tracks,state.tracks);
 assert.deepEqual(loaded.robots,state.robots);
 assert.equal(loaded.budget,19);
 assert.equal(YARD_SAVE_KEY,'kraterika:yard:g2r:v2');
});
test('G2-R: corrupt, incompatible, outside-grid and oversized saves fail closed',()=>{
 const state=initialYard();
 assert.equal(deserializeYard('{garbled'),null);
 assert.equal(deserializeYard(null),null);
 assert.equal(deserializeYard(' '.repeat(150001)),null);
 let saved=JSON.parse(serializeYard(state));
 saved.schema=1;assert.equal(deserializeYard(JSON.stringify(saved)),null);
 saved=JSON.parse(serializeYard(state));saved.state.robots[1].at.x=1000;
 assert.equal(deserializeYard(JSON.stringify(saved)),null);
 saved=JSON.parse(serializeYard(state));saved.state.budget=-100;
 assert.equal(deserializeYard(JSON.stringify(saved)),null);
 saved=JSON.parse(serializeYard(state));saved.state.phase='complete';
 assert.equal(deserializeYard(JSON.stringify(saved)),null);
});
test('G2-R: state cannot be mutated through deserialized object alias',()=>{
 const state=initialYard();
 const raw=serializeYard(state);
 const loaded=deserializeYard(raw);
 assert.ok(loaded);
 loaded.robots[0].energy=0;
 assert.equal(state.robots[0].energy,9);
});
