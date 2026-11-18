import Phaser from 'phaser';
import {apply,initial,same,TICK_MS} from './game/simulation.ts';
import type {Command,MissionState,Point} from './game/simulation.ts';
import {MISSIONS} from './game/missions.ts';
import {PlayScene} from './ui/PlayScene.ts';

// G2 first playable. Domain owns all game rules; Phaser owns rendering and input only.
// Art Pack 0.1 is an approved direction; the board still uses explicit greybox visuals.
type Campaign={schemaVersion:1;completed:string[];materials:number};
const STORAGE='kraterika:g2:campaign:v1';
function loadCampaign():Campaign{
  const empty:Campaign={schemaVersion:1,completed:[],materials:0};
  try{
    const raw=localStorage.getItem(STORAGE);
    if(!raw)return empty;
    const value:unknown=JSON.parse(raw);
    if(typeof value!=='object'||value===null||Array.isArray(value))return empty;
    const record=value as Record<string,unknown>;
    if(record.schemaVersion!==1||!Array.isArray(record.completed))return empty;
    const completed=MISSIONS.filter(m=>record.completed!.includes(m.id)).map(m=>m.id);
    return {schemaVersion:1,completed,materials:MISSIONS.filter(m=>completed.includes(m.id)).reduce((sum,m)=>sum+m.reward,0)};
  }catch{return empty;}
}
const campaign=loadCampaign();
let mission=MISSIONS[0];
let state:MissionState=initial(mission);
let feedback:string|null=null;
let accumulator=0;
let savingAvailable=true;
const scene=new PlayScene();

const required=(id:string)=>{const el=document.getElementById(id);if(!el)throw Error('Missing UI '+id);return el;};
const button=(id:string)=>required(id) as HTMLButtonElement;
function updateHud(){
 const count=state.cargo.filter(c=>c.delivered).length;
 required('mission-title').textContent=mission.id+' · '+mission.name;
 required('mission-description').textContent=mission.description;
 required('mission-guide').textContent=mission.guide;
 required('notice').textContent=(feedback??state.notice)+(savingAvailable?'':' · Прогресс не сохраняется в этом браузере.');
 required('phase').textContent=state.phase==='planning'?'Подготовка':state.phase==='running'?'Выполнение':state.phase==='paused'?'Пауза':'Доставка завершена';
 required('progress').textContent='Доставлено '+String(count)+' / '+String(state.cargo.length);
 required('tick').textContent='Такт: '+String(state.tick);
 required('materials').textContent=String(campaign.materials);
 required('budget').textContent='Свободные секции: '+String(mission.trackBudget-state.built.length);
 required('robots').textContent=state.robots.map(r=>r.id+': '+String(r.energy)+' ⚡'+(r.status==='waiting'?' · ожидание':'')).join('  |  ');
 required('cargo-types').textContent=state.cargo.map(c=>
   (c.type==='water'?'Вода':c.type==='oxygen'?'Кислород':'Детали')+': '+(c.delivered?'доставлено':'в пути')).join('  ·  ');
 button('play').disabled=state.phase==='running'||state.phase==='won';
 button('pause').disabled=state.phase!=='running';
 button('step').disabled=state.phase==='running'||state.phase==='won';
 button('next').disabled=mission.id==='LV-02'||state.phase!=='won';
 button('select-lv02').disabled=!campaign.completed.includes('LV-01');
 button('select-lv01').setAttribute('aria-pressed',String(mission.id==='LV-01'));
 button('select-lv02').setAttribute('aria-pressed',String(mission.id==='LV-02'));
 required('end-note').textContent=state.phase==='won'?
   ('Первое прохождение: +'+String(mission.reward)+' материалов. '+(mission.id==='LV-01'?'Открылась следующая миссия.':'Обе миссии пройдены.')):'';
 scene.show(mission,state);
}
function persist(){
 try{localStorage.setItem(STORAGE,JSON.stringify(campaign));savingAvailable=true;}
 catch{savingAvailable=false;}
}
function dispatch(command:Command){
 const before=state.phase;
 const result=apply(state,mission,command);
 feedback=result.error??null;
 if(result.error){updateHud();return;}
 state=result.state;
 if(before!=='won'&&state.phase==='won'&&!campaign.completed.includes(mission.id)){
   campaign.completed.push(mission.id);
   campaign.materials+=mission.reward;
   persist();
 }
 if(command.type==='play'||command.type==='restart')accumulator=0;
 updateHud();
}
function choose(id:string){
 if(id==='LV-02'&&!campaign.completed.includes('LV-01'))return;
 const next=MISSIONS.find(m=>m.id===id);
 if(!next)return;
 mission=next;state=initial(mission);feedback=null;accumulator=0;updateHud();
}
scene.onCell=(at:Point)=>{
 const sw=state.switches.find(s=>same(s.at,at));
 if(sw){
   const current=sw.exits.indexOf(sw.selected);
   const next=sw.exits[(current+1)%sw.exits.length];
   dispatch({type:'switch',at,exit:next});
   return;
 }
 if(state.phase==='planning'&&mission.buildable.some(p=>same(p,at))){
   const built=state.built.some(p=>same(p,at));
   dispatch({type:built?'remove':'place',at});
 }
};
scene.onFrame=(delta)=>{
 if(state.phase!=='running'){accumulator=0;return;}
 accumulator+=Math.min(delta,500);
 let count=0;
 while(accumulator>=TICK_MS&&count++<8&&state.phase==='running'){
   accumulator-=TICK_MS;
   dispatch({type:'tick'});
 }
};
button('play').addEventListener('click',()=>dispatch({type:'play'}));
button('pause').addEventListener('click',()=>dispatch({type:'pause'}));
button('step').addEventListener('click',()=>dispatch({type:'step'}));
button('restart').addEventListener('click',()=>{
 if(state.tick>0&&!window.confirm('Перезапустить текущую попытку? Прогресс других миссий сохранится.'))return;
 dispatch({type:'restart'});
});
button('select-lv01').addEventListener('click',()=>choose('LV-01'));
button('select-lv02').addEventListener('click',()=>choose('LV-02'));
button('next').addEventListener('click',()=>{if(state.phase==='won')choose('LV-02');});
window.addEventListener('keydown',event=>{
 const target=event.target as HTMLElement|null;
 if(target&&['INPUT','TEXTAREA','SELECT','BUTTON'].includes(target.tagName))return;
 if(event.code==='Space'){event.preventDefault();dispatch({type:state.phase==='running'?'pause':'play'});}
 else if(event.code==='KeyS'&&event.shiftKey){event.preventDefault();dispatch({type:'step'});}
 else if(event.code==='KeyR'){event.preventDefault();button('restart').click();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='running')dispatch({type:'pause'});});

const config:Phaser.Types.Core.GameConfig={
 type:Phaser.AUTO,parent:'game',backgroundColor:'#0c1b2d',
 scale:{mode:Phaser.Scale.RESIZE,width:800,height:590},
 render:{antialias:true,pixelArt:false},
 scene:[scene]
};
new Phaser.Game(config);
updateHud();
// Observation API is deliberately read-only. Browser tests must interact with real controls.
Object.assign(window,{
 kraterika:{
  getState:()=>structuredClone(state),
  getCampaign:()=>structuredClone(campaign),
  getLayout:()=>scene.getBoardLayout()
 }
});
