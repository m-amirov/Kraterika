/** Pure fixed-step Kraterika logistics simulator: never imports Phaser or browser APIs. */
export type Direction='N'|'E'|'S'|'W';
export type Phase='planning'|'running'|'paused'|'won';
export type Point={x:number;y:number};
export type CargoType='water'|'oxygen'|'parts';
export type Cargo={id:string;type:CargoType;destination:Point;delivered:boolean};
export type Robot={id:string;at:Point;facing:Direction;energy:number;cargoId:string|null;status:'ready'|'moving'|'waiting'|'delivered'};
export type Switch={at:Point;exits:Direction[];selected:Direction};
export type Mission={id:'LV-01'|'LV-02';name:string;description:string;guide:string;width:number;height:number;
 startTracks:Point[];buildable:Point[];trackBudget:number;robots:Robot[];cargo:Cargo[];switches:Switch[];reward:number};
export type MissionState={missionId:Mission['id'];phase:Phase;tick:number;tracks:Point[];built:Point[];
 robots:Robot[];cargo:Cargo[];switches:Switch[];notice:string};
export type Command=({type:'place'|'remove';at:Point}|{type:'switch';at:Point;exit:Direction}|
 {type:'play'|'pause'|'step'|'tick'|'restart'});
export type Result={state:MissionState;error?:string};
export const TICK_MS=250;
const vector:Record<Direction,Point>={N:{x:0,y:-1},E:{x:1,y:0},S:{x:0,y:1},W:{x:-1,y:0}};
const reverse:Record<Direction,Direction>={N:'S',E:'W',S:'N',W:'E'};
const directions:Direction[]=['N','E','S','W'];
export const same=(a:Point,b:Point):boolean=>a.x===b.x&&a.y===b.y;
export const key=(p:Point):string=>String(p.x)+','+String(p.y);
export const adjacent=(p:Point,d:Direction):Point=>({x:p.x+vector[d].x,y:p.y+vector[d].y});
const inBounds=(p:Point,m:Mission):boolean=>p!=null&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<m.width&&p.y<m.height;
export function initial(m:Mission):MissionState {
 return {missionId:m.id,phase:'planning',tick:0,tracks:structuredClone(m.startTracks),built:[],
 robots:structuredClone(m.robots),cargo:structuredClone(m.cargo),switches:structuredClone(m.switches),
 notice:'Разместите пути и нажмите «Запустить».'};
}
const invalid=(state:MissionState,error:string):Result=>({state,error});
function advance(state:MissionState):MissionState {
 const next:MissionState=structuredClone(state);
 const track=new Set(next.tracks.map(key));
 const intents=new Map<string,Point>();
 const notices:string[]=[];
 for(const robot of next.robots){
  if(robot.status==='delivered')continue;
  if(robot.energy<=0){notices.push(robot.id+': нет заряда');continue;}
  const sw=next.switches.find(s=>same(s.at,robot.at));
  const choices=directions.filter(d=>track.has(key(adjacent(robot.at,d)))&&d!==reverse[robot.facing]);
  let selected:Direction|undefined;
  if(sw){
   if(choices.includes(sw.selected))selected=sw.selected;
   else notices.push(robot.id+': стрелка указывает в пустоту');
  } else if(choices.includes(robot.facing))selected=robot.facing;
  else if(choices.length===1)selected=choices[0];
  else if(choices.length>1)notices.push(robot.id+': нужна стрелка');
  else notices.push(robot.id+': маршрут не продолжен');
  if(selected)intents.set(robot.id,adjacent(robot.at,selected));
 }
 const blocked=new Set<string>();
 // Reserve targets simultaneously; same target and head-on swap must both wait.
 for(const [id,target] of intents) {
  if([...intents].some(([other,p])=>other!==id&&same(p,target)))blocked.add(id);
 }
 for(const [id,target] of intents) {
  const robot=next.robots.find(r=>r.id===id)!;
  const occupied=next.robots.find(r=>r.id!==id&&same(r.at,target));
  if(occupied&&same(intents.get(occupied.id)??occupied.at,robot.at)){
   blocked.add(id);blocked.add(occupied.id);
  }
 }
 // Prevent a chain entering a now-blocked or stationary robot's old cell.
 let changed=true;
 while(changed){
  changed=false;
  for(const [id,target] of intents){
   if(blocked.has(id))continue;
   const occupied=next.robots.find(r=>r.id!==id&&same(r.at,target));
   if(occupied&&(!intents.has(occupied.id)||blocked.has(occupied.id))){
    blocked.add(id);changed=true;
   }
  }
 }
 for(const robot of next.robots){
  if(robot.status==='delivered')continue;
  const target=intents.get(robot.id);
  if(!target||blocked.has(robot.id)){
   robot.status='waiting';
   if(blocked.has(robot.id))notices.push(robot.id+': путь занят');
   continue;
  }
  robot.facing=target.x>robot.at.x?'E':target.x<robot.at.x?'W':target.y>robot.at.y?'S':'N';
  robot.at=target;robot.energy--;robot.status='moving';
  const cargo=next.cargo.find(c=>c.id===robot.cargoId&&!c.delivered);
  if(cargo&&same(cargo.destination,robot.at)){cargo.delivered=true;robot.status='delivered';}
 }
 next.tick++;
 if(next.cargo.every(c=>c.delivered)){
  next.phase='won';next.notice='Миссия выполнена за '+String(next.tick)+' тактов!';
 }else next.notice=notices.length?notices.join(' · '):'Такт '+String(next.tick)+'. Доставка продолжается.';
 return next;
}
export function apply(state:MissionState,m:Mission,command:Command):Result {
 if(state.missionId!==m.id)return invalid(state,'Состояние другой миссии.');
 if(command.type==='restart')return {state:initial(m)};
 if(command.type==='place'||command.type==='remove'){
  if(state.phase!=='planning')return invalid(state,'Трассу можно менять только в подготовке. Начните миссию заново.');
  if(!inBounds(command.at,m)||!m.buildable.some(p=>same(p,command.at)))return invalid(state,'На этой клетке строить нельзя.');
  if(command.type==='place'){
   if(state.tracks.some(p=>same(p,command.at)))return invalid(state,'Секция уже существует.');
   if(state.built.length>=m.trackBudget)return invalid(state,'Лимит секций исчерпан.');
   if(state.robots.some(r=>same(r.at,command.at))||state.cargo.some(c=>same(c.destination,command.at)))return invalid(state,'Клетка занята.');
   return {state:{...state,tracks:[...state.tracks,{...command.at}],built:[...state.built,{...command.at}],notice:'Секция построена.'}};
  }
  if(!state.built.some(p=>same(p,command.at)))return invalid(state,'Секцию нельзя удалить.');
  return {state:{...state,tracks:state.tracks.filter(p=>!same(p,command.at)),
   built:state.built.filter(p=>!same(p,command.at)),notice:'Секция удалена, лимит восстановлен.'}};
 }
 if(command.type==='switch'){
  const sw=state.switches.find(s=>same(s.at,command.at));
  if(!sw||!sw.exits.includes(command.exit))return invalid(state,'Недопустимое направление стрелки.');
  if(state.phase==='won')return invalid(state,'Миссия уже завершена.');
  return {state:{...state,switches:state.switches.map(s=>same(s.at,command.at)?{...s,selected:command.exit}:s),
    notice:'Стрелка переведена: '+command.exit+'.'}};
 }
 if(command.type==='play'){
  if(state.phase!=='planning'&&state.phase!=='paused')return invalid(state,'Нельзя запустить из текущего состояния.');
  return {state:{...state,phase:'running',notice:'Роботы выполняют доставку.'}};
 }
 if(command.type==='pause'){
  if(state.phase!=='running')return invalid(state,'Сейчас симуляция не выполняется.');
  return {state:{...state,phase:'paused',notice:'Пауза: можно переключить стрелку или сделать шаг.'}};
 }
 if(command.type==='tick'){
  if(state.phase!=='running')return invalid(state,'Симуляция не запущена.');
  return {state:advance(state)};
 }
 if(command.type==='step'){
  if(state.phase!=='planning'&&state.phase!=='paused')return invalid(state,'Шаг доступен только до запуска или на паузе.');
  const n=advance(state);
  return {state:n.phase==='won'?n:{...n,phase:'paused'}};
 }
 return invalid(state,'Неизвестная команда.');
}
