import {CONTRACTS,createWorld} from './campaign.ts';
import type {PersistentWorld,MissionAttempt,ContractId,BuildingId} from './campaign.ts';

export const CAMPAIGN_SAVE_KEY='kraterika:campaign:g3:v3';
type Envelope={schema:3;savedAt:string;world:PersistentWorld;attempt:MissionAttempt|null;extensions:{daily:unknown;achievements:unknown;cloud:unknown}};
const ids=CONTRACTS.map(c=>c.id);
const buildingIds:BuildingId[]=['dispatch','distribution','power','workshop','greenhouse','district1'];
const obj=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const unique=(v:unknown[]):boolean=>new Set(v).size===v.length;
const point=(v:unknown):boolean=>obj(v)&&Number.isInteger(v.x)&&Number.isInteger(v.y)&&Number(v.x)>=0&&Number(v.x)<12&&Number(v.y)>=0&&Number(v.y)<8;
function validWorld(v:unknown):v is PersistentWorld{
  if(!obj(v)||v.revision!==3||v.sourceVersion!=='g3-v1'||!Number.isInteger(v.materials)||Number(v.materials)<0||Number(v.materials)>100000)return false;
  if(!Array.isArray(v.clearedContracts)||!v.clearedContracts.every(x=>ids.includes(x as ContractId))||!unique(v.clearedContracts))return false;
  if(!Array.isArray(v.unlockedContracts)||!v.unlockedContracts.every(x=>ids.includes(x as ContractId))||!unique(v.unlockedContracts))return false;
  if(!obj(v.buildings)||!buildingIds.every(id=>obj(v.buildings)&&obj(v.buildings[id])&&point(v.buildings[id].at)&&
    ['locked','available','built','waiting','operational'].includes(String(v.buildings[id].state))))return false;
  if(!obj(v.bestMedals)||!Object.entries(v.bestMedals).every(([id,medal])=>ids.includes(id as ContractId)&&[1,2,3].includes(Number(medal))))return false;
  if(!Array.isArray(v.rewardReceipts)||!v.rewardReceipts.every(x=>typeof x==='string'&&/^first-clear:CT-0[1-6]$/.test(x))||!unique(v.rewardReceipts))return false;
  if(!Array.isArray(v.eventIds)||!v.eventIds.every(x=>typeof x==='string')||!unique(v.eventIds))return false;
  if(!Array.isArray(v.technologies)||!v.technologies.every(x=>typeof x==='string')||!unique(v.technologies))return false;
  if(!obj(v.production)||!Number.isInteger(v.production.components)||Number(v.production.components)<0||!Number.isInteger(v.production.food)||Number(v.production.food)<0)return false;
  return true;
}
function validAttempt(v:unknown):v is MissionAttempt{
  if(!obj(v)||v.revision!==3||!ids.includes(v.contractId as ContractId)||typeof v.attemptId!=='string'||
    !['planning','running','paused','complete'].includes(String(v.phase))||!Number.isInteger(v.tick)||Number(v.tick)<0||Number(v.tick)>10000||
    !Number.isInteger(v.budget)||Number(v.budget)<0||Number(v.budget)>100)return false;
  if(!Array.isArray(v.placements)||v.placements.length>20||!v.placements.every(x=>obj(x)&&['route','charger','arm','greenhouse'].includes(String(x.tool))&&point(x.at)))return false;
  if(v.priorityRobot!==null&&typeof v.priorityRobot!=='string')return false;
  if(!Array.isArray(v.robots)||v.robots.length<1||v.robots.length>2||!v.robots.every(r=>obj(r)&&typeof r.id==='string'&&point(r.at)&&
    Number.isInteger(r.pathIndex)&&Number(r.pathIndex)>=0&&Number.isInteger(r.energy)&&Number(r.energy)>=0&&Number(r.energy)<=20&&
    Number.isInteger(r.maxEnergy)&&Number(r.maxEnergy)>=1&&['ready','moving','waiting','charging','delivered'].includes(String(r.status))))return false;
  if(!Array.isArray(v.cargo)||v.cargo.length<1||v.cargo.length>2||!v.cargo.every(c=>obj(c)&&typeof c.id==='string'&&typeof c.kind==='string'&&typeof c.destination==='string'&&typeof c.holder==='string'&&typeof c.delivered==='boolean'))return false;
  if(!obj(v.metrics))return false;
  const metrics=v.metrics;
  if(!['ticks','spent','energyUsed','collisions','switchRoutes','charges','armTransfers'].every(k=>Number.isInteger(metrics[k])&&Number(metrics[k])>=0))return false;
  if(!Array.isArray(v.events)||v.events.length>1000||typeof v.notice!=='string'||v.notice.length>500||![0,1,2,3].includes(Number(v.medal)))return false;
  if(v.phase==='complete'&&(!v.cargo.every(c=>obj(c)&&c.delivered===true)||Number(v.medal)<1))return false;
  return true;
}
export function serializeCampaignSave(world:PersistentWorld,attempt:MissionAttempt|null):string{
  const envelope:Envelope={schema:3,savedAt:new Date().toISOString(),world,attempt,extensions:{daily:null,achievements:null,cloud:null}};
  return JSON.stringify(envelope);
}
export function deserializeCampaignSave(raw:string|null):{world:PersistentWorld;attempt:MissionAttempt|null}|null{
  if(!raw||raw.length>300000)return null;
  try{
    const value:unknown=JSON.parse(raw);
    if(!obj(value)||value.schema!==3||!validWorld(value.world)||(value.attempt!==null&&!validAttempt(value.attempt)))return null;
    const world=structuredClone(value.world),attempt=value.attempt===null?null:structuredClone(value.attempt);
    if(attempt?.phase==='running')attempt.phase='paused';
    return {world,attempt};
  }catch{return null;}
}
export function restoreCampaign():{world:PersistentWorld;attempt:MissionAttempt|null;recovered:boolean}{
  try{
    const raw=localStorage.getItem(CAMPAIGN_SAVE_KEY),loaded=deserializeCampaignSave(raw);
    return loaded?{...loaded,recovered:false}:{world:createWorld(),attempt:null,recovered:raw!==null};
  }catch{return {world:createWorld(),attempt:null,recovered:true};}
}
export function saveCampaign(world:PersistentWorld,attempt:MissionAttempt|null):boolean{
  try{localStorage.setItem(CAMPAIGN_SAVE_KEY,serializeCampaignSave(world,attempt));return true;}catch{return false;}
}
