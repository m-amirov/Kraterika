/**
 * Real G2-R browser acceptance: pointer/touch into the actual Phaser canvas,
 * not direct mutating calls to domain. Uses read-only observation API.
 */
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

mkdirSync('test-results',{recursive:true});
const url='http://127.0.0.1:4173';
const processServer=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview',
 '--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'pipe'});
const browserErrors=[];
let browser;
const snapshot=page=>page.evaluate(()=>window.kraterikaYard.getState());
const tap=async(page,x,y,mobile=false)=>{
 const layout=await page.evaluate(()=>window.kraterikaYard.getLayout());
 const p={x:layout.originX+(x+.5+(y+.5)*layout.skew)*layout.unit,
          y:layout.originY+(y+.5)*layout.unit*layout.rise};
 await page.locator('#viewport').scrollIntoViewIfNeeded();
 await page.locator('#viewport').evaluate((el,px)=>{
  el.scrollLeft=Math.max(0,px-el.clientWidth/2);
 },p.x);
 const canvas=await page.locator('#game canvas').boundingBox();
 assert.ok(canvas,'Phaser Canvas must exist');
 const px=canvas.x+p.x,py=canvas.y+p.y;
 if(mobile)await page.touchscreen.tap(px,py);
 else await page.mouse.click(px,py);
};
const choose=async(page,tool)=>{await page.locator('[data-tool="'+tool+'"]').click();
 assert.equal(await page.locator('[data-tool="'+tool+'"]').getAttribute('aria-pressed'),'true');};
const observeErrors=(page,name)=>{
 page.on('pageerror',error=>browserErrors.push(name+' pageerror '+error.message));
 page.on('console',entry=>{if(entry.type()==='error')browserErrors.push(name+' console '+entry.text());});
};
async function ready(page){
 await page.goto(url,{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.kraterikaYard?.getLayout().unit>=34,{timeout:16000});
 assert.ok(await page.locator('#game canvas').isVisible());
 assert.equal((await snapshot(page)).revision,2);
}
async function finishYard(page,mobile=false){
 await choose(page,'route');await tap(page,6,4,mobile);
 await choose(page,'charger');await tap(page,5,4,mobile);
 await choose(page,'arm');await tap(page,8,3,mobile);
 await choose(page,'greenhouse');await tap(page,8,2,mobile);
 let state=await snapshot(page);
 assert.equal(state.budget,6,'All 4 actual build costs must apply');
 assert.equal(state.modules.find(x=>x.id==='greenhouse').built,true);
 assert.equal(state.equipment.length,2);
 // Deterministic single-step controls avoid races with wall-clock Play/Pause.
 await page.locator('#yard-step').click();
 await page.locator('#yard-step').click();
 state=await snapshot(page);
 assert.deepEqual(state.robots[0].at,{x:4,y:3},'Water rover must leave switch first');
 await choose(page,'switch');await tap(page,4,4,mobile);
 assert.equal((await snapshot(page)).switchTo,'E');
 for(let i=0;i<6;i++)await page.locator('#yard-step').click();
 state=await snapshot(page);
 assert.equal(state.tick,8);
 assert.equal(state.robots[0].status,'delivered');
 assert.equal(state.modules.find(m=>m.id==='greenhouse').active,true);
 assert.equal(state.nextContract,true,'Live greenhouse must create new food order');
 assert.deepEqual(state.robots[1].at,{x:7,y:4});
 assert.equal(state.cargo.find(c=>c.id==='parts').delivered,false);
 await page.locator('#yard-transfer').click();
 state=await snapshot(page);
 assert.equal(state.phase,'complete');
 assert.deepEqual(state.cargo.map(c=>c.delivered),[true,true]);
 assert.deepEqual(state.modules.map(m=>m.active),[true,true,true]);
 assert.equal(state.completedOnce,true);
 assert.equal(await page.locator('#yard-reward').textContent(),'9');
 assert.match(await page.locator('#yard-next').textContent(),/ПИТАНИЕ/);
 return state;
}
try{
 let live=false;
 for(let i=0;i<180;i++){
  if(processServer.exitCode!==null)throw Error('Vite preview exited');
  try{if((await fetch(url)).ok){live=true;break;}}catch{}
  await sleep(100);
 }
 if(!live)throw Error('No preview server');
 browser=await chromium.launch({headless:true});
 const desktop=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await desktop.newPage();observeErrors(page,'desktop');await ready(page);
 assert.match(await page.locator('#yard-notice').textContent(),/Постройте/);
 await finishYard(page);
 await page.screenshot({path:'test-results/g2r-desktop-complete.png',fullPage:true});
 await page.reload();await ready(page);
 assert.equal((await snapshot(page)).phase,'complete','Session must restore finished yard');
 assert.equal((await snapshot(page)).completedOnce,true);
 await page.locator('#yard-restart').click();
 assert.equal((await snapshot(page)).completedOnce,true,'Award flag must survive restart');
 await finishYard(page);
 assert.equal(await page.locator('#yard-reward').textContent(),'9','No duplicate award on replay');
 // Exercise Play/Pause on a separate reset so elapsed UI interaction time cannot
 // change the source-derived tick-by-tick solution fixture.
 await page.locator('#yard-restart').click();
 await page.locator('#yard-play').click();
 assert.equal((await snapshot(page)).phase,'running');
 await page.locator('#yard-pause').click();
 assert.equal((await snapshot(page)).phase,'paused');
 await desktop.close();

 const mobile=await browser.newContext({
  viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true
 });
 const phone=await mobile.newPage();observeErrors(phone,'mobile');await ready(phone);
 const hasDocumentOverflow=await phone.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
 assert.equal(hasDocumentOverflow,false,'Page must fit mobile; map scroll stays inside viewport');
 await finishYard(phone,true);
 await phone.screenshot({path:'test-results/g2r-mobile-complete.png',fullPage:true});
 // Confirm that controls remain reachable at the phone layout and no horizontal body overflow.
 const visible=await phone.locator('#yard-transfer').isVisible();
 assert.equal(visible,true);
 await mobile.close();

 assert.deepEqual(browserErrors,[],'No unhandled browser JS or console errors');
 console.log(JSON.stringify({status:'G2R_LIVE_YARD_BROWSER_VERIFIED',desktop:'build route+charger+arm+greenhouse;2 rovers;switch;transfer;complete',
  mobile:'touch same real actions on scrollable 3/4 board',persistence:'reload, replay, award idempotence',errors:browserErrors},null,2));
}finally{
 if(browser)await browser.close();
 processServer.kill('SIGTERM');
}
