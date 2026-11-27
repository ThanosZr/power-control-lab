const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
  const child=spawn(process.env.PYTHON||'python',['-m','experiments.cad_t011.server','--port','0'],{stdio:['ignore','pipe','inherit']});
  let browser;
  try{
    const url=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Startup deadline')),70000);let data='';
      child.once('error',e=>{clearTimeout(timer);reject(e)});child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exit '+code))});
      child.stdout.on('data',s=>{data+=s;if(data.includes('\n')){clearTimeout(timer);resolve(data.trim().split('\n')[0]);}});
    });
    browser=await chromium.launch({headless:true,executablePath:process.env.CAD_CHROMIUM||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);const ready=async n=>page.waitForFunction(n=>document.querySelector('#edit-status').textContent==='Ready'&&document.querySelector('#revision').textContent==='Revision '+n,n,{timeout:70000});
    const volume=async x=>assert.ok(Math.abs(parseFloat((await page.locator('#volume').textContent()).split(': ')[1])-x)<.001);
    const uploads=async n=>page.waitForFunction(n=>document.querySelector('canvas').dataset.uploads===String(n),n);
    const feature=id=>page.locator(`[data-feature="${id}"]`).click();
    await ready(0);await volume(40*Math.PI**2);await uploads(1);
    await feature('spine');await page.locator('#field-kind').selectOption('line');await page.locator('#field-points').fill('[[0,0,0],[0,0,20]]');await page.locator('#apply-feature').click();await ready(1);await volume(80*Math.PI);await uploads(2);
    assert.match(await page.locator('#tree').textContent(),/lofted · loft ← section, endSection · reused/);
    await feature('endPlane');await page.locator('#field-origin').fill('[0,0,14]');await page.locator('#apply-feature').click();await ready(2);await volume(80*Math.PI);await uploads(2);
    assert.match(await page.locator('#tree').textContent(),/swept · sweep ← section, spine · reused/);
    await page.locator('#output').selectOption('lofted');await ready(3);await volume(14*28*Math.PI/3);await uploads(3);
    await feature('lofted');await page.locator('#field-profiles').fill('["endSection","section"]');await page.locator('#apply-feature').click();
    await page.waitForFunction(()=>document.querySelector('#edit-status').dataset.state==='error',null,{timeout:70000});await volume(14*28*Math.PI/3);await uploads(3);
    assert.equal(await page.locator('#revision').textContent(),'Revision 3');
    await page.locator('#undo').click();await ready(4);await volume(80*Math.PI);await uploads(4);
    await page.locator('#redo').click();await ready(5);await volume(14*28*Math.PI/3);await uploads(5);
    const downloaded=page.waitForEvent('download');await page.locator('#save').click();const file=await downloaded;
    const savedPath=await file.path(),saved=JSON.parse(fs.readFileSync(savedPath,'utf8'));assert.equal(saved.schema,3);assert.equal(saved.output,'lofted');assert.ok(!('vertices' in saved));
    await page.locator('#file').setInputFiles(savedPath);await ready(6);await uploads(5);await volume(14*28*Math.PI/3);assert.ok(await page.locator('#undo').isDisabled());
    await feature('datum');await page.locator('#field-origin').fill('[5,0,0]');await page.locator('#apply-feature').click();
    await page.waitForFunction(async()=>Boolean((await (await fetch('/api/activity')).json()).active));await page.locator('#cancel').click();
    await page.waitForFunction(()=>document.querySelector('#edit-status').dataset.state==='error'&&document.querySelector('#edit-status').textContent.includes('cancelled'),null,{timeout:70000});
    assert.equal(await page.locator('#revision').textContent(),'Revision 6');await uploads(5);await volume(14*28*Math.PI/3);
    await page.locator('canvas').hover();await page.mouse.wheel(0,-100);await uploads(5);
    assert.deepEqual(errors,[]);fs.mkdirSync('ui-out',{recursive:true});await page.screenshot({path:'ui-out/cad_t011_sweep_loft.png'});
    console.log('T011 real native sweep/loft GUI, datum dependencies, rollback/cancel, save/open and retained buffers PASS');
  }finally{if(browser)await browser.close();if(child.exitCode===null){child.kill();await once(child,'exit');}}
})().catch(e=>{console.error(e);process.exitCode=1});
