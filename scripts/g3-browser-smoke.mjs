/** G3 acceptance through real DOM/canvas input; observation API is read-only. */
import {spawn} from 'node:child_process';
import {setTimeout as sleep} from 'node:timers/promises';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

mkdirSync('test-results',{recursive:true});
const origin='http://127.0.0.1:4173';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'pipe'});
const errors=[];let browser;
const world=page=>page.evaluate(()=>window.kraterikaCampaign.getWorld());
const attempt=page=>page.evaluate(()=>window.kraterikaCampaign.getAttempt());
function observe(page,label){page.on('pageerror',e=>errors.push(`${label} pageerror ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`${label} console ${m.text()}`);});}
async function ready(page,clear=false){
  await page.goto(origin,{waitUntil:'networkidle'});if(clear){await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'networkidle'});}
  await page.waitForFunction(()=>window.kraterikaCampaign?.getLayout().cell>0,{timeout:16000});assert.ok(await page.locator('#game canvas').isVisible());
}
async function tapCell(page,at,mobile){
  const layout=await page.evaluate(()=>window.kraterikaCampaign.getLayout());
  const local={x:layout.left+(at.x+.5)*layout.cell,y:layout.top+(at.y+.5)*layout.cell};
  await page.locator('#game canvas').scrollIntoViewIfNeeded();
  await page.locator('#viewport').evaluate((el,x)=>{el.scrollLeft=Math.max(0,x-el.clientWidth/2);},local.x);
  const box=await page.locator('#game canvas').boundingBox();assert.ok(box);
  // Canvas boundingBox is already expressed in viewport coordinates and
  // therefore already includes the scroll container offset exactly once.
  const x=box.x+local.x,y=box.y+local.y;
  if(mobile)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
  const last=await page.evaluate(()=>window.kraterikaCampaign.getLastInput());
  assert.deepEqual(last.picked,at,'canvas coordinate mapping mismatch');
}
async function solve(page,id,mobile=false){
  await page.locator(`[data-contract="${id}"]`).click();
  const spec=await page.evaluate(id=>window.kraterikaCampaign.getContract(id),id);
  assert.equal((await attempt(page)).contractId,id);
  for(const command of spec.solution){
    if(command.type==='place'){
      await page.locator(`[data-g3-tool="${command.tool}"]`).click();
      await tapCell(page,command.at,mobile);
    }else if(command.type==='priority')await page.locator(command.robotId==='R-01'?'#priority-r1':'#priority-r2').click();
    else if(command.type==='step')await page.locator('#g3-step').click();
    else if(command.type==='transfer')await page.locator('#g3-transfer').click();
  }
  await page.locator('#result-view').waitFor({state:'visible'});
  const done=await attempt(page);assert.equal(done.phase,'complete');assert.equal(done.medal,3,id+' reference trace must be gold');
  await page.locator('#result-colony').click();
  return done;
}
async function fullChapter(page,mobile=false,label='desktop'){
  const initial=await world(page);assert.equal(initial.materials,12);assert.deepEqual(initial.clearedContracts,[]);
  await page.screenshot({path:`test-results/g3-${label}-colony-start.png`,fullPage:true});
  for(let i=1;i<=6;i++){
    const id=`CT-0${i}`;assert.equal(await page.locator(`[data-contract="${id}"]`).isEnabled(),true,id+' must unlock');
    if(i===1){await page.locator(`[data-contract="${id}"]`).click();await page.locator('#g3-play').click();await page.locator('#g3-pause').click();assert.equal((await attempt(page)).phase,'paused');await page.locator('#g3-restart').click();await page.locator('#back-to-colony').click();}
    await solve(page,id,mobile);
  }
  const final=await world(page);assert.deepEqual(final.clearedContracts,['CT-01','CT-02','CT-03','CT-04','CT-05','CT-06']);assert.equal(final.materials,28);assert.equal(final.production.components,2);assert.equal(final.production.food,2);assert.equal(final.buildings.workshop.state,'operational');assert.equal(final.buildings.greenhouse.state,'operational');assert.equal(final.buildings.district1.state,'operational');assert.equal(await page.locator('#career-score').textContent(),'1800');
  await page.screenshot({path:`test-results/g3-${label}-colony-complete.png`,fullPage:true});return final;
}
try{
  let live=false;for(let i=0;i<180;i++){if(server.exitCode!==null)throw Error('Vite preview exited');try{if((await fetch(origin)).ok){live=true;break;}}catch{}await sleep(100);}if(!live)throw Error('No preview server');
  browser=await chromium.launch({headless:true});
  const desktop=await browser.newContext({viewport:{width:1440,height:900}});const page=await desktop.newPage();observe(page,'desktop');await ready(page,true);const final=await fullChapter(page,false,'desktop');
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.kraterikaCampaign?.getWorld().clearedContracts.length===6);assert.equal((await world(page)).materials,28,'reload must restore chapter');
  await solve(page,'CT-06',false);assert.equal((await world(page)).materials,28,'replay must not duplicate reward');await desktop.close();
  const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});const phone=await mobile.newPage();observe(phone,'mobile');await ready(phone,true);assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'body must not overflow horizontally');await fullChapter(phone,true,'mobile');assert.equal(await phone.locator('#contract-list').isVisible(),true);await mobile.close();
  assert.deepEqual(errors,[],'No page/console errors');console.log(JSON.stringify({status:'G3_BROWSER_VERIFIED',contracts:6,goldTraces:6,desktop:'mouse+reload+replay',mobile:'touch+scroll+all contracts',finalMaterials:final.materials,screenshots:4,errors},null,2));
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
