// Real, interactive Phaser browser smoke on the built Vite preview.
// Uses browser pointer/touch interactions and observes game state read-only.
import {spawn} from 'node:child_process';
import {mkdirSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const origin='http://127.0.0.1:4173';
const errors=[];
mkdirSync('test-results',{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'pipe'});
let browser;
const inspect=page=>page.evaluate(()=>({
 state:window.kraterika.getState(),campaign:window.kraterika.getCampaign(),
 layout:window.kraterika.getLayout()
}));
async function cellClick(page,x,y,mobile=false){
 const layout=await page.evaluate(()=>window.kraterika.getLayout());
 assert.ok(layout.cell>0,'Board layout missing');
 const point={x:layout.left+(x+0.5)*layout.cell,y:layout.top+(y+0.5)*layout.cell};
 if(mobile){
  const rect=await page.locator('#game canvas').boundingBox();
  assert.ok(rect,'Canvas unavailable');
  await page.touchscreen.tap(rect.x+point.x,rect.y+point.y);
 }else await page.locator('#game canvas').click({position:point});
}
function captureErrors(page,label){
 page.on('pageerror',e=>errors.push(label+' pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(label+' console: '+m.text());});
}
async function readiness(page){
 await page.goto(origin,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.kraterika?.getLayout().cell>0,null,{timeout:15000});
 assert.ok(await page.locator('#game canvas').isVisible(),'Real Phaser canvas must be rendered');
}
async function level1(page,mobile=false){
 await cellClick(page,3,3,mobile);
 await cellClick(page,4,3,mobile);
 let p=await inspect(page);
 assert.equal(p.state.built.length,2,'Real pointer input must build two tiles');
 await page.locator('#play').click();
 await page.waitForFunction(()=>window.kraterika.getState().phase==='won',null,{timeout:10000});
 p=await inspect(page);
 assert.equal(p.state.tick,5);
 assert.equal(p.campaign.materials,8);
 assert.deepEqual(p.campaign.completed,['LV-01']);
}
async function level2(page){
 await page.locator('#next').click();
 let p=await inspect(page);
 assert.equal(p.state.missionId,'LV-02');
 await page.locator('#step').click(); // tick1, first rover enters switch
 await page.locator('#step').click(); // tick2, first rover leaves to north
 p=await inspect(page);
 assert.equal(p.state.phase,'paused');
 assert.deepEqual(p.state.robots[0].at,{x:4,y:3});
 await cellClick(page,4,4);
 assert.equal((await inspect(page)).state.switches[0].selected,'E');
 await page.locator('#step').click();
 await page.locator('#step').click();
 await page.locator('#play').click();
 await page.waitForFunction(()=>window.kraterika.getState().phase==='won',null,{timeout:10000});
 p=await inspect(page);
 assert.equal(p.state.tick,7);
 assert.deepEqual(p.state.cargo.map(c=>c.delivered),[true,true]);
 assert.equal(p.campaign.materials,17);
 assert.deepEqual(p.campaign.completed,['LV-01','LV-02']);
}
try {
 let live=false;
 for(let i=0;i<160;i++){
  if(server.exitCode!==null)throw Error('Vite server exited before startup');
  try{if((await fetch(origin)).ok){live=true;break;}}catch{}
  await sleep(100);
 }
 if(!live)throw Error('Vite preview did not start');
 browser=await chromium.launch({headless:true});
 const desktop=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const page=await desktop.newPage();
 captureErrors(page,'desktop');await readiness(page);
 assert.equal(await page.locator('#select-lv02').isDisabled(),true);
 await level1(page);
 await page.screenshot({path:'test-results/desktop-lv01-win.png',fullPage:true});
 await level2(page);
 await page.screenshot({path:'test-results/desktop-lv02-win.png',fullPage:true});
 await page.reload();await readiness(page);
 assert.equal((await inspect(page)).campaign.materials,17,'Persistent first-clear rewards must survive reload');
 assert.equal(await page.locator('#select-lv02').isEnabled(),true);
 // Re-completion must NOT pay the reward again.
 await page.locator('#select-lv02').click();
 await page.locator('#step').click();await page.locator('#step').click();
 await cellClick(page,4,4);
 await page.locator('#step').click();await page.locator('#step').click();
 await page.locator('#play').click();
 await page.waitForFunction(()=>window.kraterika.getState().phase==='won',null,{timeout:10000});
 assert.equal((await inspect(page)).campaign.materials,17,'Replay must not duplicate campaign rewards');
 await desktop.close();

 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const phone=await mobile.newPage();
 captureErrors(phone,'mobile');await readiness(phone);
 const overflow=await phone.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);
 assert.equal(overflow,false,'Mobile page must not overflow horizontally');
 await level1(phone,true);
 await phone.screenshot({path:'test-results/mobile-lv01-win.png',fullPage:true});
 await mobile.close();
 assert.deepEqual(errors,[],'Browser console or JS errors');
 console.log(JSON.stringify({status:'G2_BROWSER_SMOKE_VERIFIED',desktop:'LV-01+LV-02 pointer/step/switch/win',
  persistentRewards:'idempotent after reload',mobile:'LV-01 touch/win',
  screenshots:['desktop-lv01-win.png','desktop-lv02-win.png','mobile-lv01-win.png'],errors},null,2));
}finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
