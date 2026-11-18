import {initialYard,YARD_WIDTH,YARD_HEIGHT} from './yard.ts';
import type {Yard,Pt} from './yard.ts';

export const YARD_SAVE_KEY='kraterika:yard:g2r:v2';
type Envelope={schema:2;state:Yard};
const obj=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const coords=(p:unknown):p is Pt=>obj(p)&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&
  (p.x as number)>=0&&(p.y as number)>=0&&(p.x as number)<YARD_WIDTH&&(p.y as number)<YARD_HEIGHT;
function isYard(v:unknown):v is Yard {
 if(!obj(v)||v.revision!==2||!['planning','running','paused','complete'].includes(String(v.phase))||
   !Number.isInteger(v.tick)||(v.tick as number)<0||(v.tick as number)>1000000||
   !Number.isInteger(v.budget)||(v.budget as number)<0||(v.budget as number)>20||
   !['N','E'].includes(String(v.switchTo))||
   typeof v.completedOnce!=='boolean'||typeof v.nextContract!=='boolean'||
   typeof v.notice!=='string'||(v.notice as string).length>500)return false;
 if(!Array.isArray(v.tracks)||v.tracks.length>150||!v.tracks.every(coords))return false;
 if(!Array.isArray(v.added)||v.added.length>4||!v.added.every(coords))return false;
 if(!Array.isArray(v.equipment)||v.equipment.length>2||!v.equipment.every(e=>obj(e)&&
   ['arm','charger'].includes(String(e.kind))&&coords(e.at)))return false;
 if(!Array.isArray(v.robots)||v.robots.length!==2||!v.robots.every(r=>obj(r)&&coords(r.at)&&
   typeof r.energy==='number'&&Number.isInteger(r.energy)&&r.energy>=0&&r.energy<=12&&
   ['N','S','W','E'].includes(String(r.dir))&&
   ['ready','moving','waiting','charging','delivered'].includes(String(r.status))))return false;
 if(v.robots[0].id!=='R-01'||v.robots[1].id!=='R-02'||v.robots[0].cargo!=='water'||v.robots[1].cargo!=='parts')return false;
 if(!Array.isArray(v.cargo)||v.cargo.length!==2||v.cargo[0].id!=='water'||v.cargo[1].id!=='parts'||
    !v.cargo.every(c=>obj(c)&&typeof c.delivered==='boolean'))return false;
 if(!Array.isArray(v.modules)||v.modules.length!==3||!v.modules.every(m=>obj(m)&&coords(m.at)&&
    typeof m.built==='boolean'&&typeof m.active==='boolean')||
   v.modules.map(m=>m.id).join(',')!=='dispatch,greenhouse,workshop')return false;
 if(v.phase==='complete'&&(!v.cargo.every(c=>c.delivered)||!v.completedOnce))return false;
 return true;
}
export function deserializeYard(raw:string|null):Yard|null {
 if(!raw||raw.length>150000)return null;
 try{
  const v:unknown=JSON.parse(raw);
  if(!obj(v)||v.schema!==2||!isYard(v.state))return null;
  const state: Yard=structuredClone(v.state);
  if(state.phase==='running')state.phase='paused'; // background tabs never auto-play
  return state;
 }catch{return null;}
}
export function serializeYard(state:Yard):string{
 const record:Envelope={schema:2,state};
 return JSON.stringify(record);
}
export function restoreYard():Yard {
 try{return deserializeYard(localStorage.getItem(YARD_SAVE_KEY))??initialYard();}
 catch{return initialYard();}
}
export function saveYard(state:Yard):boolean{
 try{localStorage.setItem(YARD_SAVE_KEY,serializeYard(state));return true;}
 catch{return false;}
}
