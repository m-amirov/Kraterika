export type ContractId='CT-01'|'CT-02'|'CT-03'|'CT-04'|'CT-05'|'CT-06';
export type Point={x:number;y:number};
export type Tool='route'|'switch'|'charger'|'arm'|'greenhouse';
export type BuildingId='dispatch'|'distribution'|'power'|'workshop'|'greenhouse'|'district1';
export type BuildingState='locked'|'available'|'built'|'waiting'|'operational';
export type AttemptPhase='planning'|'running'|'paused'|'complete';
export type AttemptCommand=
  |{type:'place';tool:Exclude<Tool,'switch'>;at:Point}
  |{type:'priority';robotId:string}
  |{type:'transfer'}
  |{type:'play'|'pause'|'step'|'tick'};
export type ContractConfig={
  id:ContractId;name:string;goal:string;prerequisite:ContractId|null;
  requiredMechanics:string[];availableTools:Tool[];attemptBudget:number;permanentCost:number;
  rewardMaterials:number;worldEffect:BuildingId;production:null|{components?:number;food?:number};
  buildSites:Partial<Record<Exclude<Tool,'switch'>,Point[]>>&{switch?:Point[]};toolCosts:Partial<Record<Tool,number>>;
  robots:{id:string;energy:number;cargoId:string;path:Point[]}[];
  cargo:{id:string;kind:string;destination:string}[];
  medals:{gold:{maxTicks:number;maxSpent:number;maxEnergy:number};silver:{maxTicks:number;maxSpent:number;maxEnergy:number}};
  solution:AttemptCommand[];requiresBuildings?:BuildingId[];
};
export type CampaignEvent={type:string;eventId:string;contractId:ContractId;attemptId:string;tick?:number;positions?:Point[]};
export type MissionAttempt={
  revision:3;attemptId:string;contractId:ContractId;phase:AttemptPhase;tick:number;budget:number;
  placements:{tool:Exclude<Tool,'switch'>;at:Point}[];priorityRobot:string|null;
  robots:{id:string;at:Point;pathIndex:number;energy:number;maxEnergy:number;cargoId:string;status:'ready'|'moving'|'waiting'|'charging'|'delivered'}[];
  cargo:{id:string;kind:string;destination:string;holder:string;delivered:boolean}[];
  metrics:{ticks:number;spent:number;energyUsed:number;collisions:number;switchRoutes:number;charges:number;armTransfers:number};
  events:CampaignEvent[];notice:string;medal:0|1|2|3;
};
export type PersistentWorld={
  revision:3;sourceVersion:'g3-v1';materials:number;clearedContracts:ContractId[];unlockedContracts:ContractId[];
  buildings:Record<BuildingId,{state:BuildingState;at:Point}>;technologies:string[];
  bestMedals:Partial<Record<ContractId,1|2|3>>;rewardReceipts:string[];
  production:{components:number;food:number};eventIds:string[];
};
export type AttemptResult={state:MissionAttempt;error?:string};
export type StartResult={attempt:MissionAttempt;error?:string};

import {CONTRACTS} from './campaignContracts.ts';
export {CONTRACTS};

const same=(a:Point,b:Point):boolean=>a.x===b.x&&a.y===b.y;
const key=(p:Point):string=>`${p.x},${p.y}`;
const clone=<T>(v:T):T=>structuredClone(v);
const contract=(id:ContractId):ContractConfig=>CONTRACTS.find(c=>c.id===id)!;
const initialBuildings=():PersistentWorld['buildings']=>({
  dispatch:{state:'available',at:{x:2,y:4}},distribution:{state:'locked',at:{x:5,y:4}},
  power:{state:'locked',at:{x:3,y:3}},workshop:{state:'locked',at:{x:8,y:5}},
  greenhouse:{state:'locked',at:{x:9,y:2}},district1:{state:'locked',at:{x:6,y:1}}
});
const worldEffect=(world:PersistentWorld,c:ContractConfig):void=>{
  world.buildings[c.worldEffect].state='operational';
  if(c.production){
    world.production.components+=c.production.components??0;
    world.production.food+=c.production.food??0;
  }
  const next=CONTRACTS[CONTRACTS.indexOf(c)+1];
  if(next){
    if(!world.unlockedContracts.includes(next.id))world.unlockedContracts.push(next.id);
    world.buildings[next.worldEffect].state='available';
  }
  if(c.id==='CT-03')world.buildings.workshop.state='available';
  if(c.id==='CT-04')world.buildings.greenhouse.state='available';
};
export function createWorld(overrides:Partial<PersistentWorld>={}):PersistentWorld{
  const cleared=clone(overrides.clearedContracts??[]);
  const world:PersistentWorld={revision:3,sourceVersion:'g3-v1',materials:12,clearedContracts:[],unlockedContracts:['CT-01'],
    buildings:initialBuildings(),technologies:[],bestMedals:{},rewardReceipts:[],production:{components:0,food:0},eventIds:[]};
  for(const id of cleared){
    const c=contract(id);world.materials=world.materials-c.permanentCost+c.rewardMaterials;
    world.clearedContracts.push(id);world.rewardReceipts.push('first-clear:'+id);world.bestMedals[id]=3;worldEffect(world,c);
  }
  return Object.assign(world,clone(overrides),{buildings:overrides.buildings?clone(overrides.buildings):world.buildings});
}
function isUnlocked(world:PersistentWorld,c:ContractConfig):boolean{
  return world.unlockedContracts.includes(c.id)||(c.prerequisite!==null&&world.clearedContracts.includes(c.prerequisite));
}
export function startAttempt(world:PersistentWorld,id:ContractId):StartResult{
  const c=contract(id);
  const fail=(message:string):StartResult=>({attempt:null as unknown as MissionAttempt,error:message});
  if(!isUnlocked(world,c))return fail('Контракт ещё заблокирован.');
  if(world.materials<c.permanentCost&&!world.clearedContracts.includes(id))return fail('Недостаточно постоянных материалов для обязательного объекта.');
  for(const building of c.requiresBuildings??[]){
    if(world.buildings[building].state!=='operational')return fail(building==='greenhouse'?'Оранжерея должна работать.':'Мастерская должна работать.');
  }
  const attemptId=`${id}:attempt`;
  return {attempt:{revision:3,attemptId,contractId:id,phase:'planning',tick:0,budget:c.attemptBudget,
    placements:[],priorityRobot:null,
    robots:c.robots.map(r=>({id:r.id,at:clone(r.path[0]),pathIndex:0,energy:r.energy,maxEnergy:Math.max(r.energy,6),cargoId:r.cargoId,status:'ready'})),
    cargo:c.cargo.map(x=>({...x,holder:c.robots.find(r=>r.cargoId===x.id)?.id??'source',delivered:false})),
    metrics:{ticks:0,spent:0,energyUsed:0,collisions:0,switchRoutes:0,charges:0,armTransfers:0},
    events:[],notice:c.goal,medal:0}};
}
const invalid=(state:MissionAttempt,error:string):AttemptResult=>({state,error});
const siteAllowed=(c:ContractConfig,tool:Exclude<Tool,'switch'>,at:Point):boolean=>(c.buildSites[tool]??[]).some(p=>same(p,at));
const placed=(s:MissionAttempt,tool:Exclude<Tool,'switch'>,at?:Point):boolean=>s.placements.some(p=>p.tool===tool&&(!at||same(p.at,at)));
const canCompleteDestination=(s:MissionAttempt,c:ContractConfig,cargo:MissionAttempt['cargo'][number]):boolean=>{
  if(cargo.destination==='greenhouse'&&c.id==='CT-05')return placed(s,'greenhouse');
  return c.cargo.some(x=>x.id===cargo.id&&x.destination===cargo.destination);
};
function evaluateMedal(s:MissionAttempt,c:ContractConfig):1|2|3{
  const m=s.metrics;
  if(m.ticks<=c.medals.gold.maxTicks&&m.spent<=c.medals.gold.maxSpent&&m.energyUsed<=c.medals.gold.maxEnergy&&m.collisions===0)return 3;
  if(m.ticks<=c.medals.silver.maxTicks&&m.spent<=c.medals.silver.maxSpent&&m.energyUsed<=c.medals.silver.maxEnergy)return 2;
  return 1;
}
function finishIfReady(s:MissionAttempt,c:ContractConfig):void{
  if(!s.cargo.every(x=>x.delivered))return;
  s.phase='complete';s.medal=evaluateMedal(s,c);s.notice=`Контракт выполнен: ${s.medal} медаль.`;
  s.events.push({type:'contract.completed',eventId:`${s.attemptId}:complete`,contractId:s.contractId,attemptId:s.attemptId});
}
function advance(state:MissionAttempt,c:ContractConfig):MissionAttempt{
  const s=clone(state),targets=new Map<string,Point>(),blocked=new Set<string>();
  for(const robot of s.robots){
    if(robot.status==='delivered')continue;
    const charger=(c.buildSites.charger??[]).find(x=>same(x,robot.at));
    if(robot.energy<=0){
      if(charger&&placed(s,'charger',charger)){
        robot.energy=robot.maxEnergy;robot.status='charging';s.metrics.charges++;continue;
      }
      robot.status='waiting';s.notice=`${robot.id}: нужен заряд`;continue;
    }
    const path=c.robots.find(r=>r.id===robot.id)!.path;
    if(robot.pathIndex>=path.length-1){
      if(c.id==='CT-04'){robot.status='waiting';s.notice='Груз ожидает передачи манипулятором.';continue;}
      const cargo=s.cargo.find(x=>x.id===robot.cargoId)!;
      if(canCompleteDestination(s,c,cargo)){cargo.delivered=true;cargo.holder=cargo.destination;robot.status='delivered';}
      continue;
    }
    const target=path[robot.pathIndex+1];
    if((c.buildSites.route??[]).some(x=>same(x,target))&&!placed(s,'route',target)){
      robot.status='waiting';s.notice=`${robot.id}: маршрут не достроен`;continue;
    }
    targets.set(robot.id,target);
  }
  const groups=new Map<string,string[]>();
  for(const [id,target] of targets)groups.set(key(target),[...(groups.get(key(target))??[]),id]);
  for(const ids of groups.values())if(ids.length>1){
    if(s.priorityRobot&&ids.includes(s.priorityRobot)){
      for(const id of ids)if(id!==s.priorityRobot)blocked.add(id);
      s.metrics.switchRoutes++;
    }else{
      ids.forEach(id=>blocked.add(id));s.metrics.collisions++;s.notice='Транспортный конфликт: назначьте приоритет.';
    }
  }
  for(const [id,target] of targets){
    const robot=s.robots.find(r=>r.id===id)!;
    if(blocked.has(id)){robot.status='waiting';continue;}
    const occupant=s.robots.find(r=>r.id!==id&&same(r.at,target)&&!targets.has(r.id));
    if(occupant){robot.status='waiting';continue;}
    robot.at=target;robot.pathIndex++;robot.energy--;robot.status='moving';s.metrics.energyUsed++;
    const path=c.robots.find(r=>r.id===robot.id)!.path;
    if(robot.pathIndex===path.length-1&&c.id!=='CT-04'){
      const cargo=s.cargo.find(x=>x.id===robot.cargoId)!;
      if(canCompleteDestination(s,c,cargo)){cargo.delivered=true;cargo.holder=cargo.destination;robot.status='delivered';}
    }
  }
  s.tick++;s.metrics.ticks=s.tick;
  s.events.push({type:'tick',eventId:`${s.attemptId}:tick:${s.tick}`,contractId:s.contractId,attemptId:s.attemptId,tick:s.tick,positions:s.robots.map(r=>clone(r.at))});
  finishIfReady(s,c);
  if(s.phase!=='complete'&&!s.notice.includes('конфликт')&&!s.notice.includes('заряд')&&!s.notice.includes('маршрут'))s.notice=`Такт ${s.tick}. Система работает.`;
  return s;
}
export function dispatchAttempt(state:MissionAttempt,command:AttemptCommand):AttemptResult{
  const c=contract(state.contractId);
  if(state.phase==='complete')return invalid(state,'Контракт уже завершён.');
  if(command.type==='place'){
    if(state.phase==='running')return invalid(state,'Стройте на паузе.');
    if(!c.availableTools.includes(command.tool)||!siteAllowed(c,command.tool,command.at))return invalid(state,'Инструмент недоступен на этой площадке.');
    if(placed(state,command.tool,command.at))return invalid(state,'Объект уже установлен.');
    const cost=c.toolCosts[command.tool]??0;if(state.budget<cost)return invalid(state,'Недостаточно временного бюджета.');
    const s=clone(state);s.placements.push({tool:command.tool,at:clone(command.at)});s.budget-=cost;s.metrics.spent+=cost;s.notice='Оборудование установлено.';return {state:s};
  }
  if(command.type==='priority'){
    if(!c.availableTools.includes('switch')||!state.robots.some(r=>r.id===command.robotId))return invalid(state,'Стрелка или робот недоступны.');
    return {state:{...state,priorityRobot:command.robotId,notice:`Приоритет: ${command.robotId}.`}};
  }
  if(command.type==='transfer'){
    const robot=state.robots.find(r=>r.cargoId===state.cargo[0]?.id),arm=(c.buildSites.arm??[])[0],cargo=state.cargo[0];
    if(!arm||!placed(state,'arm',arm)||!robot||!same(robot.at,arm)||cargo.delivered)return invalid(state,'Передача манипулятором сейчас невозможна.');
    const s=clone(state),nextCargo=s.cargo[0],nextRobot=s.robots.find(r=>r.id===robot.id)!;
    nextCargo.holder='workshop';nextCargo.delivered=true;nextRobot.status='delivered';s.metrics.armTransfers++;
    s.events.push({type:'arm.transfer.completed',eventId:`${s.attemptId}:arm`,contractId:s.contractId,attemptId:s.attemptId});
    finishIfReady(s,c);return {state:s};
  }
  if(command.type==='play'){
    if(state.phase==='running')return invalid(state,'Симуляция уже запущена.');
    return {state:{...state,phase:'running',notice:'Операция запущена.'}};
  }
  if(command.type==='pause'){
    if(state.phase!=='running')return invalid(state,'Симуляция не запущена.');
    return {state:{...state,phase:'paused',notice:'Пауза.'}};
  }
  if(command.type==='step'){
    if(state.phase==='running')return invalid(state,'Один шаг доступен на паузе.');
    const s=advance({...state,phase:'paused'},c);return {state:s.phase==='complete'?s:{...s,phase:'paused'}};
  }
  if(command.type==='tick'){
    if(state.phase!=='running')return invalid(state,'Сначала запустите симуляцию.');
    return {state:advance(state,c)};
  }
  return invalid(state,'Неизвестная команда.');
}
export function restartAttempt(world:PersistentWorld,attempt:MissionAttempt):MissionAttempt{
  const result=startAttempt(world,attempt.contractId);if(result.error)throw Error(result.error);return result.attempt;
}
export function commitCompletion(world:PersistentWorld,attempt:MissionAttempt):{world:PersistentWorld;error?:string}{
  if(attempt.phase!=='complete'||attempt.medal<1)return {world,error:'Нельзя зафиксировать незавершённую операцию.'};
  const c=contract(attempt.contractId),next=clone(world),old=next.bestMedals[c.id]??0;
  next.bestMedals[c.id]=Math.max(old,attempt.medal) as 1|2|3;
  const receipt=`first-clear:${c.id}`;
  if(!next.rewardReceipts.includes(receipt)){
    if(next.materials<c.permanentCost)return {world,error:'Обязательная постройка больше недоступна.'};
    next.materials=next.materials-c.permanentCost+c.rewardMaterials;next.rewardReceipts.push(receipt);
    if(!next.clearedContracts.includes(c.id))next.clearedContracts.push(c.id);
    worldEffect(next,c);next.eventIds.push(`${attempt.attemptId}:complete`);
  }
  return {world:next};
}
function preparedWorld(id:ContractId):PersistentWorld{
  const index=CONTRACTS.findIndex(c=>c.id===id);return createWorld({clearedContracts:CONTRACTS.slice(0,index).map(c=>c.id)});
}
export function runSolutionTrace(id:ContractId):{attempt:MissionAttempt;medal:1|2|3}{
  const start=startAttempt(preparedWorld(id),id);if(start.error)throw Error(start.error);let attempt=start.attempt;
  for(const command of contract(id).solution){const result=dispatchAttempt(attempt,command);if(result.error)throw Error(`${id}: ${result.error}`);attempt=result.state;}
  if(attempt.phase!=='complete')throw Error(`${id}: trace did not complete`);
  return {attempt,medal:attempt.medal as 1|2|3};
}
export const careerScore=(world:PersistentWorld):number=>100*Object.values(world.bestMedals).reduce<number>((sum,v)=>sum+(v??0),0);
