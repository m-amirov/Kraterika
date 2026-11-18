import type { Mission } from './simulation.ts';
const horizontal=(a:number,b:number,y:number)=>Array.from({length:b-a+1},(_,i)=>({x:a+i,y}));
export const MISSIONS:readonly Mission[]=[
 {id:'LV-01',name:'Первый сигнал',description:'Восстановите недостающий участок трассы и доставьте воду.',
 guide:'Нажмите на пустые клетки между рельсами: (3,3) и (4,3). Ошибочную секцию можно убрать повторным нажатием. Затем нажмите «Запустить».',
 width:8,height:8,trackBudget:2,
 startTracks:[{x:1,y:3},{x:2,y:3},{x:5,y:3},{x:6,y:3}],
 buildable:[{x:3,y:3},{x:4,y:3},{x:3,y:2},{x:4,y:2}],
 robots:[{id:'R-01',at:{x:1,y:3},facing:'E',energy:12,cargoId:'water-01',status:'ready'}],
 cargo:[{id:'water-01',type:'water',destination:{x:6,y:3},delivered:false}],
 switches:[],reward:8},
 {id:'LV-02',name:'Два адресата',description:'Доставьте воду наверх, а кислород — направо.',
 guide:'Стрелка на перекрёстке сначала ведёт на север. Запустите первый робот, поставьте на паузу после его поворота, нажмите на стрелку, затем продолжите. Кнопка «Шаг» отменяет необходимость спешить.',
 width:8,height:8,trackBudget:0,
 startTracks:[...horizontal(0,7,4),{x:4,y:3},{x:4,y:2},{x:4,y:1}],buildable:[],
 robots:[
  {id:'R-01',at:{x:3,y:4},facing:'E',energy:12,cargoId:'water-02',status:'ready'},
  {id:'R-02',at:{x:0,y:4},facing:'E',energy:12,cargoId:'oxygen-02',status:'ready'}],
 cargo:[
  {id:'water-02',type:'water',destination:{x:4,y:1},delivered:false},
  {id:'oxygen-02',type:'oxygen',destination:{x:7,y:4},delivered:false}],
 switches:[{at:{x:4,y:4},exits:['N','E'],selected:'N'}],reward:9}
];
export function findMission(id:string):Mission{
 const found=MISSIONS.find(m=>m.id===id);
 if(!found)throw new Error('Unknown mission '+id);
 return found;
}
