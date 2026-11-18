import Phaser from 'phaser';
import {CONTRACTS} from '../game/campaign.ts';
import type {PersistentWorld,MissionAttempt,Point,Tool,BuildingId} from '../game/campaign.ts';

const labels:Record<BuildingId,string>={dispatch:'Диспетчерская',distribution:'Распределитель',power:'Энергоузел',workshop:'Мастерская',greenhouse:'Оранжерея',district1:'Первые огни'};
const stateColor={locked:0x566273,available:0xb88750,built:0x7e91a8,waiting:0x9d784f,operational:0x4d9a7b} as const;
export class ColonyScene extends Phaser.Scene{
  onCell:((point:Point)=>void)|null=null;
  private world:PersistentWorld|null=null;private attempt:MissionAttempt|null=null;private tool:Tool='route';private active=false;
  private cell=58;private left=42;private top=62;private lastPointer:{x:number;y:number;picked:Point|null}|null=null;
  constructor(){super('colony');}
  create():void{
    this.active=true;
    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      const event=pointer.event as MouseEvent|TouchEvent;let clientX:number,clientY:number;
      if('changedTouches' in event){if(!event.changedTouches.length)return;clientX=event.changedTouches[0].clientX;clientY=event.changedTouches[0].clientY;}
      else{clientX=event.clientX;clientY=event.clientY;}
      const rect=this.game.canvas.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;
      const x=(clientX-rect.left)*this.scale.width/rect.width,y=(clientY-rect.top)*this.scale.height/rect.height;
      const picked=this.pick(x,y);this.lastPointer={x,y,picked};if(picked)this.onCell?.(picked);
    });
    this.scale.on('resize',()=>this.paint());this.paint();
  }
  display(world:PersistentWorld,attempt:MissionAttempt|null,tool:Tool):void{this.world=world;this.attempt=attempt;this.tool=tool;if(this.active)this.paint();}
  layout(){return {cell:this.cell,left:this.left,top:this.top};}
  lastInput(){return this.lastPointer?structuredClone(this.lastPointer):null;}
  private center(p:Point):Point{return{x:this.left+(p.x+.5)*this.cell,y:this.top+(p.y+.5)*this.cell};}
  private pick(x:number,y:number):Point|null{const p={x:Math.floor((x-this.left)/this.cell),y:Math.floor((y-this.top)/this.cell)};return p.x>=0&&p.x<12&&p.y>=0&&p.y<8?p:null;}
  private text(value:string,x:number,y:number,size=12,color='#eff8ff',bold=false):void{this.add.text(x,y,value,{fontFamily:'Arial,system-ui,sans-serif',fontSize:`${size}px`,fontStyle:bold?'bold':'normal',color,stroke:'#0b1728',strokeThickness:2,align:'center'}).setOrigin(.5);}
  private building(g:Phaser.GameObjects.Graphics,id:BuildingId,at:Point,state:PersistentWorld['buildings'][BuildingId]['state']):void{
    const p=this.center(at),c=stateColor[state],u=this.cell;
    g.fillStyle(0x07111f,.48);g.fillEllipse(p.x+6,p.y+15,u*1.25,u*.48);g.fillStyle(c,1);g.fillRoundedRect(p.x-u*.48,p.y-u*.38,u*.96,u*.67,9);g.lineStyle(2,state==='operational'?0xa5efc7:0xc3d1db,.9);g.strokeRoundedRect(p.x-u*.48,p.y-u*.38,u*.96,u*.67,9);
    if(id==='greenhouse'){g.fillStyle(state==='operational'?0x78c487:0x70869a,.85);g.fillEllipse(p.x,p.y-u*.30,u*.8,u*.65);}
    if(id==='power'){g.fillStyle(0x7de5e8,1);g.fillCircle(p.x,p.y-u*.06,u*.11);}
    this.text(labels[id],p.x,p.y+u*.45,Math.max(10,u*.17),'#f2f7fa',true);this.text(state,p.x,p.y+u*.66,Math.max(9,u*.14),state==='operational'?'#b9f5d2':'#d1dbe2');
  }
  private paint():void{
    if(!this.active||!this.world)return;this.children.removeAll(true);
    const w=this.scale.width,h=this.scale.height;this.cell=Math.max(45,Math.min(66,Math.floor(Math.min((w-78)/12,(h-110)/8))));this.left=(w-this.cell*12)/2;this.top=Math.max(54,(h-this.cell*8)/2+12);
    const g=this.add.graphics();g.fillStyle(0x111b30,1);g.fillRect(0,0,w,h);g.fillStyle(0x293650,1);g.fillEllipse(w*.5,h*.62,w*1.15,h*.82);
    for(let y=0;y<8;y++)for(let x=0;x<12;x++){const p=this.center({x,y});g.fillStyle((x+y)%2?0x33425a:0x38475f,.86);g.fillRoundedRect(p.x-this.cell*.47,p.y-this.cell*.43,this.cell*.94,this.cell*.86,6);g.lineStyle(1,0x6e7e94,.23);g.strokeRoundedRect(p.x-this.cell*.47,p.y-this.cell*.43,this.cell*.94,this.cell*.86,6);}
    g.lineStyle(Math.max(7,this.cell*.13),0x24566a,.9);const network=[{x:1,y:4},{x:2,y:4},{x:3,y:4},{x:4,y:4},{x:5,y:4},{x:6,y:4},{x:7,y:4},{x:8,y:4},{x:8,y:3},{x:9,y:2}];for(let i=1;i<network.length;i++){const a=this.center(network[i-1]),b=this.center(network[i]);g.lineBetween(a.x,a.y,b.x,b.y);}g.lineStyle(2,0x7ce9e8,.9);for(let i=1;i<network.length;i++){const a=this.center(network[i-1]),b=this.center(network[i]);g.lineBetween(a.x,a.y,b.x,b.y);}
    for(const [id,b] of Object.entries(this.world.buildings) as [BuildingId,PersistentWorld['buildings'][BuildingId]][])this.building(g,id,b.at,b.state);
    if(this.attempt){
      const c=CONTRACTS.find(x=>x.id===this.attempt!.contractId)!;
      for(const robotConfig of c.robots){g.lineStyle(4,robotConfig.id==='R-01'?0x65d4df:0xf0b96d,.5);for(let i=1;i<robotConfig.path.length;i++){const a=this.center(robotConfig.path[i-1]),b=this.center(robotConfig.path[i]);g.lineBetween(a.x,a.y,b.x,b.y);}}
      for(const robot of this.attempt.robots){const p=this.center(robot.at);g.fillStyle(robot.id==='R-01'?0xbdebf0:0xffd894,1);g.fillRoundedRect(p.x-this.cell*.27,p.y-this.cell*.24,this.cell*.54,this.cell*.45,8);g.fillStyle(0x152238,1);g.fillCircle(p.x-this.cell*.12,p.y-this.cell*.03,3);g.fillCircle(p.x+this.cell*.12,p.y-this.cell*.03,3);this.text(`${robot.id} · ${robot.energy}⚡`,p.x,p.y+this.cell*.34,10,'#fff',true);}
      for(const [siteTool,sites] of Object.entries(c.buildSites) as [Tool,Point[]][])for(const site of sites??[]){const p=this.center(site),installed=this.attempt.placements.some(x=>x.tool===siteTool&&x.at.x===site.x&&x.at.y===site.y);g.lineStyle(3,siteTool===this.tool?0xffdd82:0x9fc4d3,.9);g.strokeRoundedRect(p.x-this.cell*.38,p.y-this.cell*.34,this.cell*.76,this.cell*.68,8);if(installed)this.text(siteTool==='charger'?'ϟ':siteTool==='arm'?'⚒':siteTool==='greenhouse'?'✿':'⌁',p.x,p.y,22,'#fce7ae',true);}
      this.text(`${c.id} · ${c.name}`,w*.5,27,17,'#e9f7ff',true);
    }else this.text('КОЛОНИЯ «ПЕРВЫЕ ОГНИ»',w*.5,27,17,'#e9f7ff',true);
  }
}

