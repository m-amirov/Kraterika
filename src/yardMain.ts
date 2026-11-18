import Phaser from 'phaser';
import {YardScene} from './ui/YardScene.ts';
import {initialYard,dispatchYard,canTransfer,YARD_TICK_MS,SITES,at} from './game/yard.ts';
import type {Yard,YardCommand,Tool,Pt} from './game/yard.ts';
import {restoreYard,saveYard} from './game/yardSave.ts';

let state:Yard=restoreYard();
let tool:Tool='route';
let tab:'build'|'routes'|'robots'='build';
let accumulator=0;
let error:string|null=null;
let saving=true;
const scene=new YardScene();
const get=(id:string):HTMLElement=>{
 const el=document.getElementById(id);
 if(!el)throw Error('Missing game control '+id);
 return el;
};
const btn=(id:string):HTMLButtonElement=>get(id) as HTMLButtonElement;
const text=(id:string,value:string):void=>{get(id).textContent=value;};
const cargoLabel=(id:'water'|'parts'):string=>id==='water'?'Вода':'Детали';

function hud():void {
 const delivered=state.cargo.filter(c=>c.delivered).length;
 text('yard-phase',state.phase==='planning'?'ПОДГОТОВКА':state.phase==='running'?'В РАБОТЕ':
   state.phase==='paused'?'ПАУЗА':'УЗЕЛ ЗАПУЩЕН');
 text('yard-tick','Такт '+String(state.tick));
 text('yard-budget',String(state.budget));
 text('yard-reward',state.completedOnce?'9':'0');
 text('yard-progress',String(delivered)+'/2');
 text('yard-water',state.cargo[0].delivered?'Доставлена':'Требуется');
 text('yard-parts',state.cargo[1].delivered?'Доставлены':'Требуются');
 text('yard-greenhouse',state.modules.find(m=>m.id==='greenhouse')?.active?'Работает':
   state.modules.find(m=>m.id==='greenhouse')?.built?'Ожидает воду':'Нужен купол');
 text('yard-workshop',state.modules.find(m=>m.id==='workshop')?.active?'Работает':'Ожидает детали');
 text('yard-next',state.nextContract?'НОВЫЙ КОНТРАКТ: ДОСТАВИТЬ ПИТАНИЕ':'После запуска оранжереи появится новый заказ');
 text('yard-rovers',state.robots.map(r=>r.id+' · '+cargoLabel(r.cargo)+' · '+String(r.energy)+' ⚡ · '+
   (r.status==='delivered'?'готово':r.status==='charging'?'зарядка':r.status==='waiting'?'ожидание':'в пути')).join('\n'));
 text('yard-notice',(error??state.notice)+(saving?'':' · Сохранение недоступно; прогресс не гарантирован.'));
 text('yard-built','Сеть '+String(state.added.length)+
   ' • зарядка '+(state.equipment.some(e=>e.kind==='charger')?'✓':'—')+
   ' • кран '+(state.equipment.some(e=>e.kind==='arm')?'✓':'—'));
 btn('yard-play').disabled=state.phase==='running'||state.phase==='complete';
 btn('yard-pause').disabled=state.phase!=='running';
 btn('yard-step').disabled=state.phase==='running'||state.phase==='complete';
 btn('yard-transfer').disabled=!canTransfer(state);
 btn('yard-restart').disabled=state.phase==='planning'&&state.tick===0&&state.added.length===0&&
   state.equipment.length===0&&!state.modules.find(m=>m.id==='greenhouse')?.built;
 get('yard-tool-list').hidden=tab==='robots';
 get('yard-robot-panel').hidden=tab!=='robots';
 for(const el of document.querySelectorAll<HTMLButtonElement>('[data-tool]'))
   el.setAttribute('aria-pressed',String(el.dataset.tool===tool));
 for(const el of document.querySelectorAll<HTMLButtonElement>('[data-tab]'))
   el.setAttribute('aria-pressed',String(el.dataset.tab===tab));
 scene.display(state,tool);
}
function commit(command:YardCommand):void {
 const result=dispatchYard(state,command);
 error=result.error??null;
 if(!result.error){
  state=result.state;
  saving=saveYard(state);
  if(command.type==='play'||command.type==='reset')accumulator=0;
 }
 hud();
}
function selectTool(next:Tool):void{
 tool=next;tab='build';error=null;hud();
}
scene.onCell=(atPoint:Pt)=>{
 if(tool==='switch'){
  if(at(atPoint,SITES.switch))commit({type:'switch'});
  else{error='Для стрелки выберите центральный перекрёсток.';hud();}
 }else if(tool==='erase')commit({type:'erase',at:atPoint});
 else if(tool==='route'&&state.added.some(p=>at(p,atPoint)))commit({type:'erase',at:atPoint});
 else commit({type:'place',tool,at:atPoint});
};
scene.onFrame=(delta)=>{
 if(state.phase!=='running'){accumulator=0;return;}
 accumulator+=Math.min(450,delta);
 let count=0;
 while(accumulator>=YARD_TICK_MS&&count++<6&&state.phase==='running'){
  accumulator-=YARD_TICK_MS;
  commit({type:'tick'});
 }
};
for(const el of document.querySelectorAll<HTMLButtonElement>('[data-tool]')){
 el.addEventListener('click',()=>selectTool(el.dataset.tool as Tool));
}
for(const el of document.querySelectorAll<HTMLButtonElement>('[data-tab]')){
 el.addEventListener('click',()=>{
  tab=el.dataset.tab as typeof tab;
  if(tab==='routes')tool='route';
  error=null;hud();
 });
}
btn('yard-play').addEventListener('click',()=>commit({type:'play'}));
btn('yard-pause').addEventListener('click',()=>commit({type:'pause'}));
btn('yard-step').addEventListener('click',()=>commit({type:'step'}));
btn('yard-transfer').addEventListener('click',()=>commit({type:'transfer'}));
btn('yard-restart').addEventListener('click',()=>{
 if(state.phase!=='complete'&&state.tick>0&&
  !window.confirm('Начать новую инженерную попытку? Схема текущей смены будет сброшена.'))return;
 commit({type:'reset'});
});
window.addEventListener('keydown',(event)=>{
 const target=event.target as HTMLElement|null;
 if(target&&['BUTTON','INPUT','TEXTAREA','SELECT'].includes(target.tagName))return;
 if(event.code==='Space'){
  event.preventDefault();
  commit({type:state.phase==='running'?'pause':'play'});
 }
 if(event.code==='KeyS'&&event.shiftKey){event.preventDefault();commit({type:'step'});}
 if(event.code==='KeyR'){event.preventDefault();btn('yard-restart').click();}
});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden&&state.phase==='running')commit({type:'pause'});
});
const config:Phaser.Types.Core.GameConfig={
 type:Phaser.AUTO,parent:'game',backgroundColor:'#111b31',
 scale:{mode:Phaser.Scale.RESIZE,width:960,height:620},
 render:{antialias:true,pixelArt:false},
 scene:[scene]
};
new Phaser.Game(config);
hud();
(window as unknown as {kraterikaYard:{
 getState:()=>Yard;getLayout:()=>ReturnType<YardScene['layout']>;getTool:()=>Tool;
}}).kraterikaYard={
 getState:()=>structuredClone(state),
 getLayout:()=>scene.layout(),
 getTool:()=>tool
};
