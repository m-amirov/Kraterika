import Phaser from 'phaser';
import {key,same} from '../game/simulation.ts';
import type {Mission,MissionState,Point,Direction} from '../game/simulation.ts';

/** G2 greybox: drawing only. Source of truth always lives in simulation.ts. */
export class PlayScene extends Phaser.Scene {
  onCell:((at:Point)=>void)|null=null;
  onFrame:((deltaMs:number)=>void)|null=null;
  private ready=false;
  private mission:Mission|null=null;
  private state:MissionState|null=null;
  private layout={left:0,top:0,cell:0};
  constructor(){super('dispatch');}
  create():void{
    this.ready=true;
    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      const {left,top,cell}=this.layout;
      if(!cell)return;
      const x=Math.floor((pointer.x-left)/cell),y=Math.floor((pointer.y-top)/cell);
      if(this.mission&&x>=0&&y>=0&&x<this.mission.width&&y<this.mission.height)this.onCell?.({x,y});
    });
    this.scale.on('resize',()=>this.paint());
    this.paint();
  }
  update(_time:number,delta:number):void {this.onFrame?.(Math.min(delta,500));}
  show(mission:Mission,state:MissionState):void {
    this.mission=mission;this.state=state;
    if(this.ready)this.paint();
  }
  getBoardLayout(){return {...this.layout};}
  private center(point:Point):{x:number;y:number}{
    return {x:this.layout.left+(point.x+0.5)*this.layout.cell,
      y:this.layout.top+(point.y+0.5)*this.layout.cell};
  }
  private drawText(text:string,x:number,y:number,px:number,color='#edf7fa'){
    return this.add.text(x,y,text,{
      fontFamily:'system-ui, Arial, sans-serif',fontSize:String(px)+'px',fontStyle:'bold',
      color,align:'center'
    }).setOrigin(0.5,0.5);
  }
  private paint():void{
    if(!this.ready||!this.mission||!this.state)return;
    const m=this.mission,s=this.state;
    this.children.removeAll(true);
    const w=this.scale.width,h=this.scale.height;
    const cell=Math.max(18,Math.floor(Math.min((w-20)/m.width,(h-24)/m.height,74)));
    const left=Math.floor((w-cell*m.width)/2),top=Math.floor((h-cell*m.height)/2);
    this.layout={left,top,cell};
    const g=this.add.graphics();
    g.fillStyle(0x0c1b2d,1);g.fillRect(0,0,w,h);
    g.fillStyle(0x233a55,1);g.fillRoundedRect(left-7,top-7,cell*m.width+14,cell*m.height+14,14);
    // Gridded moon surface. These are temporary technical shapes, not Art Pack sprites.
    for(let y=0;y<m.height;y++)for(let x=0;x<m.width;x++){
      const x0=left+x*cell,y0=top+y*cell;
      g.fillStyle((x+y)%2===0?0x263b56:0x2b4260,1);
      g.fillRect(x0+1,y0+1,cell-2,cell-2);
    }
    for(const p of m.buildable){
      if(s.tracks.some(q=>same(q,p)))continue;
      const {x,y}=this.center(p);g.lineStyle(2,0xf4be75,0.8);
      g.strokeRoundedRect(x-cell*0.38,y-cell*0.38,cell*0.76,cell*0.76,5);
      this.drawText('+',x,y,Math.max(14,cell*0.35),'#ffdda5');
    }
    const track=new Set(s.tracks.map(key));
    for(const p of s.tracks){
      const a=this.center(p);
      const custom=s.built.some(q=>same(q,p));
      g.lineStyle(Math.max(5,cell*0.16),custom?0x69d9dc:0x94bac8,0.9);
      for(const n of [{x:p.x+1,y:p.y},{x:p.x,y:p.y+1}]){
        if(track.has(key(n))){const b=this.center(n);g.lineBetween(a.x,a.y,b.x,b.y);}
      }
      g.fillStyle(custom?0x6fdde0:0xa3bfcc,1);g.fillCircle(a.x,a.y,Math.max(3,cell*0.07));
    }
    for(const cargo of s.cargo){
      const a=this.center(cargo.destination);
      const col=cargo.type==='water'?0x61cbd9:cargo.type==='oxygen'?0x87d6a0:0xf3b75b;
      g.fillStyle(col,0.14);g.fillRoundedRect(a.x-cell*0.38,a.y-cell*0.38,cell*0.76,cell*0.76,6);
      g.lineStyle(2,col,1);g.strokeRoundedRect(a.x-cell*0.38,a.y-cell*0.38,cell*0.76,cell*0.76,6);
      this.drawText(cargo.delivered?'✓':cargo.type==='water'?'H₂O':cargo.type==='oxygen'?'O₂':'⚙',
        a.x,a.y,Math.max(11,cell*0.23),cargo.delivered?'#dbffe5':'#eefbff');
    }
    for(const sw of s.switches){
      const a=this.center(sw.at);
      g.fillStyle(0x405a73,1);g.fillCircle(a.x,a.y,cell*0.31);
      g.lineStyle(2,0xf3b65c,1);g.strokeCircle(a.x,a.y,cell*0.31);
      const mark:Record<Direction,string>={N:'↑',E:'→',S:'↓',W:'←'};
      this.drawText(mark[sw.selected],a.x,a.y,Math.max(17,cell*0.43),'#ffd188');
    }
    for(const robot of s.robots){
      const a=this.center(robot.at),size=cell*0.52;
      g.fillStyle(robot.status==='waiting'?0xcf8877:0xe6edf7,1);
      g.fillRoundedRect(a.x-size/2,a.y-size/2,size,size*0.8,Math.max(4,size*0.13));
      g.fillStyle(0x173348,1);
      g.fillRoundedRect(a.x-size*0.28,a.y-size*0.31,size*0.56,size*0.31,3);
      g.fillStyle(0x6de4ec,1);g.fillCircle(a.x-size*0.12,a.y-size*0.16,Math.max(2,size*0.07));
      g.fillCircle(a.x+size*0.12,a.y-size*0.16,Math.max(2,size*0.07));
      if(robot.cargoId&&!s.cargo.find(c=>c.id===robot.cargoId)?.delivered){
        g.fillStyle(0xf3ae4e,1);g.fillRoundedRect(a.x-size*0.24,a.y-size*0.48,size*0.48,size*0.18,2);
      }
      this.drawText(robot.id,a.x,a.y+size*0.59,Math.max(9,cell*0.16));
      this.drawText(String(robot.energy)+'⚡',a.x,a.y-size*0.65,Math.max(9,cell*0.17),'#ffe3a7');
    }
    if(s.phase==='won'){
      g.fillStyle(0x0c2b35,0.9);
      g.fillRoundedRect(left+cell*1.2,top+cell*3.08,cell*5.6,cell*1.75,18);
      g.lineStyle(2,0x8ce0b6,1);g.strokeRoundedRect(left+cell*1.2,top+cell*3.08,cell*5.6,cell*1.75,18);
      this.drawText('ДОСТАВКА ВЫПОЛНЕНА',w/2,top+cell*3.65,Math.max(12,cell*0.27),'#caffdb');
      this.drawText('Перейдите к следующей миссии',w/2,top+cell*4.2,Math.max(11,cell*0.19),'#f1f9ff');
    }
  }
}
