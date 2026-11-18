/**
 * G2-R live lunar yard, isolated from the two rejected G2 training fixtures.
 * Pure deterministic domain model: no Phaser, DOM, clock, random numbers or storage.
 */
export type Dir='N'|'E'|'S'|'W';
export type Pt={x:number;y:number};
export type Phase='planning'|'running'|'paused'|'complete';
export type Tool='route'|'charger'|'arm'|'greenhouse'|'erase'|'switch';
export type CargoKind='water'|'parts';
export type Cargo={id:'water'|'parts';kind:CargoKind;destination:'greenhouse'|'workshop';delivered:boolean};
export type Rover={id:'R-01'|'R-02';at:Pt;dir:Dir;energy:number;cargo:'water'|'parts';status:'ready'|'moving'|'waiting'|'charging'|'delivered'};
export type Module={id:'dispatch'|'workshop'|'greenhouse';at:Pt;built:boolean;active:boolean;needs?:CargoKind};
export type Equipment={kind:'charger'|'arm';at:Pt};
export type Yard={
  revision:2;phase:Phase;tick:number;budget:number;
  tracks:Pt[];added:Pt[];equipment:Equipment[];
  robots:Rover[];cargo:Cargo[];modules:Module[];
  switchTo:'N'|'E';completedOnce:boolean;nextContract:boolean;
  notice:string;
};
export type YardCommand=
  |{type:'place';tool:Exclude<Tool,'erase'|'switch'>;at:Pt}
  |{type:'erase';at:Pt}
  |{type:'switch'}
  |{type:'transfer'}
  |{type:'play'|'pause'|'step'|'tick'|'reset'};
export type YardResult={state:Yard;error?:string};
export const YARD_TICK_MS=250;
export const YARD_WIDTH=12,YARD_HEIGHT=9;
export const SITES={switch:{x:4,y:4},charger:{x:5,y:4},arm:{x:8,y:3},greenhouse:{x:8,y:2},pickup:{x:7,y:4},workshop:{x:9,y:4}} as const;
export const COST={route:1,charger:3,arm:4,greenhouse:6} as const;
export const INITIAL_BUDGET=20;
const point=(x:number,y:number):Pt=>({x,y});
const hLine=(from:number,to:number,y:number):Pt[]=>Array.from({length:to-from+1},(_,i)=>point(from+i,y));
const ORIGINAL_TRACKS=[
  ...hLine(0,5,4),point(7,4),point(4,3),point(4,2),...hLine(5,8,2)
];
const reverse:Record<Dir,Dir>={N:'S',E:'W',S:'N',W:'E'};
const vector:Record<Dir,Pt>={N:point(0,-1),E:point(1,0),S:point(0,1),W:point(-1,0)};
const directions:Dir[]=['N','E','S','W'];
export const at=(a:Pt,b:Pt):boolean=>a.x===b.x&&a.y===b.y;
export const ptKey=(a:Pt):string=>String(a.x)+','+String(a.y);
const add=(p:Pt,d:Dir):Pt=>point(p.x+vector[d].x,p.y+vector[d].y);
const inWorld=(p:Pt):boolean=>p!=null&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&
 p.x>=0&&p.y>=0&&p.x<YARD_WIDTH&&p.y<YARD_HEIGHT;
const equipment=(s:Yard,kind:Equipment['kind']):Equipment|undefined=>s.equipment.find(e=>e.kind===kind);
const moduleOf=(s:Yard,id:Module['id']):Module=>s.modules.find(m=>m.id===id)!;
const cloned=(s:Yard):Yard=>structuredClone(s);
const invalid=(s:Yard,reason:string):YardResult=>({state:s,error:reason});
const isMutable=(phase:Phase):boolean=>phase==='planning'||phase==='paused';
function newlyUnlocked(s:Yard):void {
 const g=moduleOf(s,'greenhouse');
 if(g.active)s.nextContract=true; // future supply order appears in the SAME colony
 if(s.cargo.every(c=>c.delivered)&&g.active&&moduleOf(s,'workshop').active){
  s.phase='complete';
  s.notice='Узел работает! Оранжерея и мастерская снабжены. Новый заказ: пища.';
  s.completedOnce=true;
 }
}
function deliverWater(s:Yard,rover:Rover):void {
 const cargo=s.cargo.find(c=>c.id===rover.cargo)!;
 const greenhouse=moduleOf(s,'greenhouse');
 if(rover.cargo==='water'&&at(rover.at,greenhouse.at)&&greenhouse.built&&!cargo.delivered){
  cargo.delivered=true;greenhouse.active=true;rover.status='delivered';
  s.notice='Оранжерея запущена: появился новый заказ на питание!';
  newlyUnlocked(s);
 }
}
export function initialYard(previouslyCompleted=false):Yard{
 return {
  revision:2,phase:'planning',tick:0,budget:INITIAL_BUDGET,tracks:structuredClone(ORIGINAL_TRACKS),added:[],
  equipment:[],switchTo:'N',
  robots:[
   {id:'R-01',at:point(3,4),dir:'E',energy:9,cargo:'water',status:'ready'},
   {id:'R-02',at:point(0,4),dir:'E',energy:5,cargo:'parts',status:'ready'}
  ],
  cargo:[
   {id:'water',kind:'water',destination:'greenhouse',delivered:false},
   {id:'parts',kind:'parts',destination:'workshop',delivered:false}
  ],
  modules:[
   {id:'dispatch',at:point(1,2),built:true,active:true},
   {id:'greenhouse',at:point(8,2),built:false,active:false,needs:'water'},
   {id:'workshop',at:point(9,4),built:true,active:false,needs:'parts'}
  ],
  completedOnce:previouslyCompleted,nextContract:false,
  notice:'Постройте теплицу, восстановите ветку, установите зарядку и манипулятор.'
 };
}
export function canTransfer(s:Yard):boolean {
 return s.phase==='paused'&&Boolean(equipment(s,'arm'))&&
 s.robots.some(r=>r.cargo==='parts'&&at(r.at,SITES.pickup)&&r.status!=='delivered')&&
 !s.cargo.find(c=>c.id==='parts')?.delivered;
}
function move(s:Yard):Yard{
 const next=cloned(s),rails=new Set(next.tracks.map(ptKey));
 const intent=new Map<string,Pt>(),messages:string[]=[];
 for(const rover of next.robots){
  if(rover.status==='delivered')continue;
  if(at(rover.at,SITES.greenhouse)&&rover.cargo==='water') {
   deliverWater(next,rover);
   if(rover.status==='delivered')continue;
   messages.push('Постройте оранжерею для разгрузки воды');
   rover.status='waiting';continue;
  }
  if(at(rover.at,SITES.pickup)&&rover.cargo==='parts'){
   rover.status='waiting';
   messages.push('Детали ждут передачи манипулятором');continue;
  }
  if(rover.energy<=1&&equipment(next,'charger')&&at(rover.at,SITES.charger)){
   rover.energy=6;rover.status='charging';
   messages.push(rover.id+': заряд восстановлен');continue;
  }
  if(rover.energy<=0){rover.status='waiting';messages.push(rover.id+': нужен заряд');continue;}
  const available=directions.filter(d=>rails.has(ptKey(add(rover.at,d)))&&d!==reverse[rover.dir]);
  let direction:Dir|undefined;
  if(at(rover.at,SITES.switch)){
   if(available.includes(next.switchTo))direction=next.switchTo;
   else messages.push(rover.id+': стрелка направлена в пустоту');
  }else if(available.includes(rover.dir))direction=rover.dir;
  else if(available.length===1)direction=available[0];
  else messages.push(rover.id+(available.length?' требует настройки':' ждёт достройки пути'));
  if(direction)intent.set(rover.id,add(rover.at,direction));
 }
 const blocked=new Set<string>();
 for(const [id,target] of intent)if([...intent].some(([other,p])=>id!==other&&at(p,target)))blocked.add(id);
 for(const [id,target] of intent){
  const r=next.robots.find(x=>x.id===id)!;
  const other=next.robots.find(x=>x.id!==id&&at(x.at,target));
  if(other&&at(intent.get(other.id)??other.at,r.at)){blocked.add(id);blocked.add(other.id);}
 }
 let changed=true;
 while(changed){
  changed=false;
  for(const [id,target] of intent){
   if(blocked.has(id))continue;
   const other=next.robots.find(x=>x.id!==id&&at(x.at,target));
   if(other&&(!intent.has(other.id)||blocked.has(other.id))){blocked.add(id);changed=true;}
  }
 }
 for(const rover of next.robots){
  if(rover.status==='delivered'||rover.status==='charging')continue;
  const dest=intent.get(rover.id);
  if(!dest||blocked.has(rover.id)){
   rover.status='waiting';
   if(blocked.has(rover.id))messages.push(rover.id+': коридор занят');continue;
  }
  rover.dir=dest.x>rover.at.x?'E':dest.x<rover.at.x?'W':dest.y>rover.at.y?'S':'N';
  rover.at=dest;rover.energy--;rover.status='moving';
  if(rover.cargo==='water')deliverWater(next,rover);
 }
 next.tick++;
 if(next.phase!=='complete')next.notice=messages.length?messages.join(' · '):'Оборудование работает. Такт '+String(next.tick)+'.';
 newlyUnlocked(next);
 return next;
}
export function dispatchYard(state:Yard,command:YardCommand):YardResult{
 if(command.type==='reset')return {state:initialYard(state.completedOnce)};
 if(state.phase==='complete')return invalid(state,'Узел уже запущен. Для новой попытки нажмите «Заново».');
 if(command.type==='place'){
  if(!isMutable(state.phase))return invalid(state,'Стройте на паузе или при подготовке.');
  const {tool,at:p}=command;
  if(!inWorld(p))return invalid(state,'Клетка вне карты.');
  if(tool==='route'){
   // Building routes is possible on an extensible branch, not in the old 8×8 level.
   const free=[point(6,4),point(6,5),point(7,5),point(5,5)];
   if(!free.some(x=>at(x,p))||state.tracks.some(x=>at(x,p)))return invalid(state,'На этой площадке нельзя построить маршрут.');
   if(state.budget<COST.route)return invalid(state,'Недостаточно материалов.');
   const n=cloned(state);n.tracks.push({...p});n.added.push({...p});n.budget-=COST.route;
   n.notice='Ветка сети расширена.';return {state:n};
  }
  if(tool==='charger'||tool==='arm'){
   const site=tool==='charger'?SITES.charger:SITES.arm;
   if(!at(site,p)||equipment(state,tool))return invalid(state,'Для устройства доступна только свободная отмеченная площадка.');
   if(state.budget<COST[tool])return invalid(state,'Недостаточно материалов.');
   const n=cloned(state);
   n.equipment.push({kind:tool,at:{...p}});n.budget-=COST[tool];
   n.notice=tool==='charger'?'Зарядная площадка готова.':'Манипулятор установлен: будет переносить детали.';
   return {state:n};
  }
  if(tool==='greenhouse'){
   if(!at(p,SITES.greenhouse)||moduleOf(state,'greenhouse').built)return invalid(state,'Для оранжереи доступен только проектный купол.');
   if(state.budget<COST.greenhouse)return invalid(state,'Недостаточно материалов.');
   const n=cloned(state),g=moduleOf(n,'greenhouse');
   g.built=true;n.budget-=COST.greenhouse;
   const waiting=n.robots.find(r=>r.cargo==='water'&&at(r.at,g.at));
   if(waiting)deliverWater(n,waiting);
   n.notice=g.active?'Оранжерея запущена и выдаёт новый контракт!':'Купол построен, ожидается доставка воды.';
   return {state:n};
  }
 }
 if(command.type==='erase'){
  if(!isMutable(state.phase))return invalid(state,'Удалять оборудование можно только на паузе.');
  const n=cloned(state),index=n.added.findIndex(x=>at(x,command.at));
  if(index>=0){
   // Do not remove the track under a robot, or the charged rover may be stranded.
   if(n.robots.some(r=>at(r.at,command.at)))return invalid(state,'На секции находится робот.');
   n.added.splice(index,1);n.tracks=n.tracks.filter(x=>!at(x,command.at));
   n.budget+=COST.route;n.notice='Путь разобран. Материалы возвращены.';return {state:n};
  }
  const device=n.equipment.findIndex(x=>at(x.at,command.at));
  if(device>=0){
   // A pad currently occupied by a rover must stay until it leaves.
   if(n.robots.some(r=>at(r.at,command.at)))return invalid(state,'Устройство занято роботом.');
   const kind=n.equipment[device].kind;
   n.equipment.splice(device,1);n.budget+=COST[kind];
   n.notice='Устройство убрано. Материалы возвращены.';return {state:n};
  }
  if(at(command.at,SITES.greenhouse)){
   const g=moduleOf(n,'greenhouse');
   if(!g.built||g.active)return invalid(state,'Работающий купол нельзя разбирать.');
   g.built=false;n.budget+=COST.greenhouse;n.notice='Пустая площадка восстановлена.';return {state:n};
  }
  return invalid(state,'Здесь нет вашего оборудования.');
 }
 if(command.type==='switch'){
  if(!isMutable(state.phase))return invalid(state,'Переводите стрелку на паузе.');
  return {state:{...state,switchTo:state.switchTo==='N'?'E':'N',notice:'Маршрут стрелки переключён.'}};
 }
 if(command.type==='transfer'){
  if(!canTransfer(state))return invalid(state,'Дождитесь робота с деталями у крана и включите паузу.');
  const n=cloned(state),c=n.cargo.find(x=>x.id==='parts')!;
  c.delivered=true;
  const rover=n.robots.find(r=>r.cargo==='parts')!;
  rover.status='delivered';
  moduleOf(n,'workshop').active=true;
  n.notice='Манипулятор передал детали. Мастерская запущена!';
  newlyUnlocked(n);return {state:n};
 }
 if(command.type==='play'){
  if(!isMutable(state.phase))return invalid(state,'Симуляция уже выполняется.');
  return {state:{...state,phase:'running',notice:'Два ровера выполняют поставки.'}};
 }
 if(command.type==='pause'){
  if(state.phase!=='running')return invalid(state,'Сейчас не запущено.');
  return {state:{...state,phase:'paused',notice:'Пауза: настройте инфраструктуру или сделайте шаг.'}};
 }
 if(command.type==='step'){
  if(!isMutable(state.phase))return invalid(state,'Шаг доступен только на паузе.');
  const result=move(state);
  return {state:result.phase==='complete'?result:{...result,phase:'paused'}};
 }
 if(command.type==='tick'){
  if(state.phase!=='running')return invalid(state,'Сначала запустите симуляцию.');
  return {state:move(state)};
 }
 return invalid(state,'Неизвестная команда.');
}
