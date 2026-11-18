import Phaser from 'phaser';
import {
 at,ptKey,SITES,YARD_HEIGHT,YARD_WIDTH
} from '../game/yard.ts';
import type {Yard,Pt,Tool,Rover,Module} from '../game/yard.ts';

/**
 * G2-R live yard renderer. Temporary styled procedural 2.5D greybox ONLY:
 * final hand-made/generative sprite assets are a separate approved Art Production gate.
 * Domain state is rendered read-only; every pointer action is delegated to yardMain.ts.
 */
export class YardScene extends Phaser.Scene {
  onCell:((point:Pt)=>void)|null=null;
  onFrame:((delta:number)=>void)|null=null;
  private state:Yard|null=null;
  private lastPointer:{x:number;y:number;picked:Pt|null}|null=null;
  private tool:Tool='route';
  private active=false;
  private unit=40;
  private originX=0;
  private originY=0;
  private readonly skew=0.29;
  private readonly rise=0.77;
  constructor(){super('yard');}

  create():void {
    this.active=true;
    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      // Phaser's cached pointer.x can be wrong when the canvas lives inside a
      // horizontally scrolled mobile viewport. Derive coordinates from the
      // actual event client position and CURRENT canvas DOM rectangle.
      const e=pointer.event as MouseEvent | TouchEvent;
      const client=('changedTouches' in e && e.changedTouches.length>0)?e.changedTouches[0]:e;
      const rect=this.game.canvas.getBoundingClientRect();
      if(rect.width<=0||rect.height<=0)return;
      const x=(client.clientX-rect.left)*this.scale.width/rect.width;
      const y=(client.clientY-rect.top)*this.scale.height/rect.height;
      const point=this.pick(x,y);
      this.lastPointer={x,y,picked:point};
      if(point)this.onCell?.(point);
    });
    this.scale.on('resize',()=>this.paint());
    this.paint();
  }
  update(_time:number,delta:number):void {this.onFrame?.(Math.min(450,delta));}
  display(state:Yard,tool:Tool):void {
    this.state=state;this.tool=tool;
    if(this.active)this.paint();
  }
  layout(){return {unit:this.unit,originX:this.originX,originY:this.originY,skew:this.skew,rise:this.rise};}
  lastInput(){return this.lastPointer?structuredClone(this.lastPointer):null;}
  center(point:Pt):Pt {
    return {x:this.originX+(point.x+.5+(point.y+.5)*this.skew)*this.unit,
      y:this.originY+(point.y+.5)*this.unit*this.rise};
  }
  private pick(x:number,y:number):Pt|null{
    const row=Math.round((y-this.originY)/(this.unit*this.rise)-.5);
    const col=Math.round((x-this.originX)/this.unit-(row+.5)*this.skew-.5);
    if(row<0||col<0||row>=YARD_HEIGHT||col>=YARD_WIDTH)return null;
    const q={x:col,y:row},p=this.center(q);
    if(Math.abs(x-p.x)>this.unit*.61||Math.abs(y-p.y)>this.unit*.56)return null;
    return q;
  }
  private label(text:string,x:number,y:number,size:number,color='#f7fbff',strong=false):void {
    this.add.text(x,y,text,{fontFamily:'Arial, system-ui, sans-serif',fontSize:String(size)+'px',
      fontStyle:strong?'bold':'normal',color,stroke:'#102038',strokeThickness:size>12?2:1,
      align:'center'}).setOrigin(.5,.5);
  }
  private plaque(g:Phaser.GameObjects.Graphics,x:number,y:number,w:number,h:number,
     color:number,edge:number):void{
    g.fillStyle(0x050e19,.55);g.fillRoundedRect(x-w/2+3,y-h/2+5,w,h,8);
    g.fillStyle(color,1);g.fillRoundedRect(x-w/2,y-h/2,w,h,8);
    g.lineStyle(1.6,edge,.9);g.strokeRoundedRect(x-w/2,y-h/2,w,h,8);
    g.fillStyle(edge,.16);g.fillRoundedRect(x-w/2+3,y-h/2+3,w-6,h*.28,4);
  }
  private dome(g:Phaser.GameObjects.Graphics,atPoint:Pt,active:boolean,built:boolean):void{
    const p=this.center(atPoint),u=this.unit;
    if(!built){
      this.plaque(g,p.x,p.y,u*1.35,u*.60,0x293b50,0x769fb7);
      g.lineStyle(2,0xf3bd65,.88);g.strokeEllipse(p.x,p.y-u*.11,u*1.20,u*.68);
      this.label('КУПОЛ',p.x,p.y+u*.46,Math.max(10,u*.21),'#edc684',true);
      return;
    }
    g.fillStyle(0x0b101f,.44);g.fillEllipse(p.x+u*.12,p.y+u*.22,u*1.65,u*.65);
    g.fillStyle(0x6e8396,1);g.fillEllipse(p.x,p.y,u*1.48,u*.76);
    g.fillStyle(active?0x4b8e78:0x4a6477,1);
    g.fillEllipse(p.x,p.y-u*.23,u*1.27,u*.77);
    g.fillStyle(active?0x7ec888:0x6989a7,.81);
    g.fillEllipse(p.x,p.y-u*.38,u*1.24,u*1.06);
    g.lineStyle(1.5,active?0xb7e2a4:0x9bc0db,.92);
    for(let k=-2;k<=2;k++){
      const x=p.x+(k/5)*u;
      g.lineBetween(x,p.y-u*.91,x,p.y+u*.04);
    }
    g.strokeEllipse(p.x,p.y-u*.38,u*1.24,u*1.06);
    g.fillStyle(0xe3c486,1);g.fillRoundedRect(p.x-u*.61,p.y-u*.07,u*1.22,u*.15,3);
    if(active){
      for(let k=0;k<4;k++){
        g.fillStyle(k%2?0xbde381:0x72bd74,.95);
        g.fillCircle(p.x+(k-1.5)*u*.17,p.y-u*.35-(k%2)*u*.12,u*.085);
      }
    }
    this.label(active?'Оранжерея · РАБОТАЕТ':'Оранжерея · ждёт воду',p.x,p.y+u*.65,Math.max(10,u*.18),'#e5f6e5');
  }
  private workshop(g:Phaser.GameObjects.Graphics,module:Module):void{
    const p=this.center(module.at),u=this.unit;
    g.fillStyle(0x080f20,.45);g.fillEllipse(p.x+u*.14,p.y+u*.29,u*1.75,u*.72);
    g.fillStyle(0x758399,1);g.fillRoundedRect(p.x-u*.71,p.y-u*.75,u*1.45,u*.99,9);
    g.fillStyle(0x3c4b67,1);g.fillRoundedRect(p.x-u*.68,p.y-u*.80,u*1.4,u*.37,8);
    g.fillStyle(module.active?0xedb56e:0x6f8795,1);g.fillRoundedRect(p.x-u*.36,p.y-u*.42,u*.77,u*.59,7);
    g.fillStyle(module.active?0xffda91:0x8ba1ad,.56);
    g.fillRoundedRect(p.x-u*.26,p.y-u*.29,u*.55,u*.34,4);
    g.lineStyle(3,0xb3c7d4,.9);g.lineBetween(p.x-u*.64,p.y-u*.39,p.x+u*.67,p.y-u*.39);
    g.fillStyle(0xf6b868,1);g.fillCircle(p.x+u*.61,p.y-u*.76,u*.075);
    this.label(module.active?'Мастерская · РАБОТАЕТ':'Мастерская · ждёт детали',
      p.x,p.y+u*.65,Math.max(10,u*.18),module.active?'#ffdcab':'#cfdae5');
  }
  private dispatch(g:Phaser.GameObjects.Graphics,module:Module):void{
    const p=this.center(module.at),u=this.unit;
    this.plaque(g,p.x,p.y-u*.20,u*1.23,u*.85,0x687c9a,0xd4b995);
    g.fillStyle(0x16364d,1);g.fillRoundedRect(p.x-u*.39,p.y-u*.36,u*.78,u*.32,5);
    g.fillStyle(0xf8be7a,1);
    for(let k=0;k<3;k++)g.fillRoundedRect(p.x-u*.28+k*u*.23,p.y-u*.30,u*.11,u*.12,2);
    g.lineStyle(2,0xb3dbe8,1);g.lineBetween(p.x+u*.24,p.y-u*.65,p.x+u*.35,p.y-u*1.13);
    g.strokeEllipse(p.x+u*.42,p.y-u*1.07,u*.46,u*.20);
    this.label('Диспетчерская',p.x,p.y+u*.44,Math.max(10,u*.18),'#e0e9fa',true);
  }
  private rover(g:Phaser.GameObjects.Graphics,rover:Rover):void{
    const p=this.center(rover.at),u=this.unit;
    const cyan=rover.cargo==='water',body=cyan?0xc9e2e7:0xf3e2b6;
    g.fillStyle(0x071520,.55);g.fillEllipse(p.x+u*.08,p.y+u*.20,u*.82,u*.35);
    g.fillStyle(0x1b2b42,1);
    for(const side of [-1,1]){
      g.fillRoundedRect(p.x+side*u*.23-u*.08,p.y-u*.02,u*.15,u*.40,5);
    }
    g.fillStyle(body,1);g.fillRoundedRect(p.x-u*.28,p.y-u*.27,u*.63,u*.48,8);
    g.fillStyle(0x5e8396,1);g.fillRoundedRect(p.x-u*.25,p.y-u*.21,u*.33,u*.23,4);
    g.fillStyle(0x72f3f3,1);
    g.fillCircle(p.x-u*.17,p.y-u*.13,u*.042);g.fillCircle(p.x-u*.03,p.y-u*.13,u*.042);
    if(rover.status!=='delivered'){
      g.fillStyle(cyan?0x52c7d6:0xe9a74c,1);
      g.fillRoundedRect(p.x+u*.08,p.y-u*.40,u*.31,u*.33,5);
      g.lineStyle(1,0xffffff,.62);g.strokeRoundedRect(p.x+u*.08,p.y-u*.40,u*.31,u*.33,5);
    }
    this.label(rover.id,p.x,p.y+u*.39,Math.max(10,u*.16),'#ecf4fa',true);
    this.label(String(rover.energy)+'⚡',p.x,p.y-u*.65,Math.max(10,u*.17),'#ffe7a7',true);
  }
  private equipmentNode(g:Phaser.GameObjects.Graphics,kind:'charger'|'arm',p:Pt,installed:boolean):void{
    const c=this.center(p),u=this.unit;
    if(!installed){
      g.fillStyle(0x142e40,.8);g.fillEllipse(c.x,c.y,u*.84,u*.47);
      g.lineStyle(2,0xe6b86d,.85);g.strokeEllipse(c.x,c.y,u*.85,u*.48);
      this.label(kind==='charger'?'⚡':'✚',c.x,c.y,Math.max(14,u*.33),'#f6c980');
      return;
    }
    if(kind==='charger'){
      g.fillStyle(0x0d617a,.52);g.fillEllipse(c.x,c.y,u*.98,u*.66);
      g.lineStyle(3,0x66eff0,1);g.strokeEllipse(c.x,c.y,u*.88,u*.54);
      this.label('⚡',c.x,c.y-u*.07,Math.max(17,u*.45),'#a5ffff',true);
      this.label('Зарядка',c.x,c.y+u*.51,Math.max(9,u*.16),'#d5f9ff');
    }else{
      g.fillStyle(0x374b66,1);g.fillRoundedRect(c.x-u*.35,c.y-u*.05,u*.72,u*.38,7);
      g.fillStyle(0xbec7d7,1);g.fillCircle(c.x,c.y-u*.28,u*.21);
      g.lineStyle(Math.max(5,u*.13),0xeab05f,1);
      g.lineBetween(c.x,c.y-u*.27,c.x+u*.30,c.y-u*.86);
      g.lineBetween(c.x+u*.30,c.y-u*.86,c.x+u*.51,c.y-u*.61);
      g.fillStyle(0xfce1ac,1);g.fillCircle(c.x+u*.30,c.y-u*.86,u*.13);
      g.lineStyle(2,0xeaf8ff,1);g.lineBetween(c.x+u*.48,c.y-u*.61,c.x+u*.48,c.y-u*.41);
      this.label('Манипулятор',c.x,c.y+u*.56,Math.max(9,u*.16),'#f3ead6');
    }
  }
  private paint():void{
    if(!this.active||!this.state)return;
    const s=this.state,w=this.scale.width,h=this.scale.height;
    this.children.removeAll(true);
    this.unit=Math.max(34,Math.floor(Math.min((w-38)/(YARD_WIDTH+YARD_HEIGHT*this.skew+1),
      (h-100)/(YARD_HEIGHT*this.rise+1.4),63)));
    this.originX=(w-(YARD_WIDTH+YARD_HEIGHT*this.skew)*this.unit)/2+1;
    this.originY=Math.max(88,(h-(YARD_HEIGHT*this.rise)*this.unit)/2+32);
    const u=this.unit;
    const g=this.add.graphics();
    // Minimal bespoke procedural technical rendering, NOT a production art pack.
    g.fillStyle(0x111b31,1);g.fillRect(0,0,w,h);
    g.fillStyle(0x26334f,1);g.fillEllipse(w*.52,h*.83,w*1.25,h*.38);
    g.fillStyle(0x303951,.75);g.fillEllipse(w*.12,h*.24,w*.68,h*.23);
    g.fillStyle(0x3d4360,.75);g.fillEllipse(w*.88,h*.18,w*.65,h*.22);
    // Regolith grid in 3/4 projection.
    for(let y=0;y<YARD_HEIGHT;y++)for(let x=0;x<YARD_WIDTH;x++){
      const p=this.center({x,y}),a=u*.52,b=u*this.rise*.52;
      g.fillStyle((x+y)%3===0?0x36445c:0x334159,.87);
      g.fillPoints([{x:p.x-u*.52,y:p.y-b},{x:p.x+u*.52,y:p.y-b},
        {x:p.x+u*.52+u*.12,y:p.y+b},{x:p.x-u*.52+u*.12,y:p.y+b}],true);
      g.lineStyle(1,0x708098,.30);
      g.lineBetween(p.x-u*.52,p.y-b,p.x+u*.52,p.y-b);
      g.lineBetween(p.x+u*.52,p.y-b,p.x+u*.64,p.y+b);
      if((x*7+y*3)%13===1){
        g.fillStyle(0x8991a8,.32);g.fillEllipse(p.x-u*.18,p.y+u*.10,u*.21,u*.11);
      }
    }
    // Multi-layer luminous routes; rails and switches are functional, not a background image.
    const rails=new Set(s.tracks.map(ptKey));
    for(const cell of s.tracks){
      const p=this.center(cell);
      for(const neighbor of [{x:cell.x+1,y:cell.y},{x:cell.x,y:cell.y+1}]){
        if(!rails.has(ptKey(neighbor)))continue;
        const b=this.center(neighbor),built=s.added.some(a=>at(a,cell)||at(a,neighbor));
        g.lineStyle(Math.max(11,u*.29),0x0b2638,.96);g.lineBetween(p.x,p.y,b.x,b.y);
        g.lineStyle(Math.max(7,u*.17),built?0x18a8af:0x427e99,.93);g.lineBetween(p.x,p.y,b.x,b.y);
        g.lineStyle(Math.max(2,u*.052),built?0x9cfbfa:0x7ce6f3,.95);g.lineBetween(p.x,p.y,b.x,b.y);
      }
      g.fillStyle(s.added.some(a=>at(a,cell))?0x7cffff:0x9acddc,1);
      g.fillCircle(p.x,p.y,Math.max(2,u*.055));
    }
    // Site pads show constrained but functional equipment placement.
    for(const [site,kind] of [
      [SITES.charger,'charger'],[SITES.arm,'arm']
    ] as const){
      const installed=s.equipment.some(e=>e.kind===kind);
      this.equipmentNode(g,kind,site,installed);
    }
    const sw=this.center(SITES.switch);
    g.fillStyle(0x283a58,1);g.fillCircle(sw.x,sw.y,u*.34);
    g.lineStyle(3,0xf9bf71,1);g.strokeCircle(sw.x,sw.y,u*.34);
    this.label(s.switchTo==='N'?'↑':'→',sw.x,sw.y-u*.01,Math.max(17,u*.49),'#ffdd9d',true);
    this.label('СТРЕЛКА',sw.x,sw.y+u*.49,Math.max(9,u*.15),'#ffe0b1');
    // Ground destination: workshop is served by manipulator, never driven onto.
    const depot=this.center(SITES.pickup);
    g.fillStyle(0x7e6548,.7);g.fillEllipse(depot.x,depot.y,u*.75,u*.47);
    g.lineStyle(2,0xf6bd71,.9);g.strokeEllipse(depot.x,depot.y,u*.75,u*.47);
    this.label('⇄',depot.x,depot.y,Math.max(14,u*.34),'#ffe0a0',true);
    const blocks=s.modules.filter(m=>m.id==='dispatch'||m.id==='workshop'||m.id==='greenhouse');
    for(const m of blocks){
      if(m.id==='dispatch')this.dispatch(g,m);
      if(m.id==='greenhouse')this.dome(g,m.at,m.active,m.built);
      if(m.id==='workshop')this.workshop(g,m);
    }
    // Decorative warehouse is non-interactive and makes the map feel inhabited.
    const store=this.center({x:0,y:4});
    this.plaque(g,store.x-u*.13,store.y-u*.59,u*.9,u*.45,0x668399,0x9bceda);
    this.label('СКЛАД',store.x-u*.13,store.y-u*.59,Math.max(9,u*.17),'#e4f5ff',true);
    for(const rover of s.robots)this.rover(g,rover);
    // Active tool footprint; every outlined hotspot corresponds to actual domain action.
    let hotspots:Pt[]=[];
    if(this.tool==='route')hotspots=[{x:6,y:4},{x:5,y:5},{x:6,y:5},{x:7,y:5}];
    else if(this.tool==='charger')hotspots=[SITES.charger];
    else if(this.tool==='arm')hotspots=[SITES.arm];
    else if(this.tool==='greenhouse')hotspots=[SITES.greenhouse];
    else if(this.tool==='switch')hotspots=[SITES.switch];
    else hotspots=[...s.added,...s.equipment.map(e=>e.at)];
    for(const q of hotspots){
      const p=this.center(q),valid=this.tool==='route'?!s.tracks.some(t=>at(t,q)):true;
      g.lineStyle(2,valid?0x9ef2ed:0xfaad82,.78);
      g.strokeRoundedRect(p.x-u*.40,p.y-u*.31,u*.8,u*.62,7);
    }
    if(s.phase==='complete'){
      g.fillStyle(0x102b33,.95);
      g.fillRoundedRect(w*.28,h*.42,w*.43,74,14);
      g.lineStyle(2,0x9af0b9,1);g.strokeRoundedRect(w*.28,h*.42,w*.43,74,14);
      this.label('КОЛОНИЯ СНАБЖЕНА',w*.495,h*.42+28,Math.max(17,Math.min(25,w*.022)),'#d3ffe1',true);
      this.label('Новый контракт: питание',w*.495,h*.42+55,Math.max(11,Math.min(15,w*.016)),'#dbebfa');
    }
    this.label('ЛУННЫЙ ЛОГИСТИЧЕСКИЙ УЗЕЛ · G2-R',w*.5,26,Math.max(13,Math.min(17,u*.29)),'#d4e6f1',true);
  }
}
