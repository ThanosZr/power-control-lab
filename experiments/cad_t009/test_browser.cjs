const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
  const child=spawn(process.env.PYTHON||'python',['-m','experiments.cad_t009.server','--port','0'],{stdio:['ignore','pipe','inherit']});
  let browser;
  try{
    const url=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Startup deadline')),60000);
      child.once('error',e=>{clearTimeout(timer);reject(e)});
      child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exit '+code))});
      let data='';child.stdout.on('data',s=>{data+=s;if(data.includes('\n')){clearTimeout(timer);resolve(data.trim().split('\n')[0]);}});
    });
    browser=await chromium.launch({headless:true,executablePath:process.env.CAD_CHROMIUM||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1100,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    const ready=async n=>{await page.waitForFunction(n=>document.querySelector('#edit-status').textContent==='Ready'&&document.querySelector('#revision').textContent==='Revision '+n,n,{timeout:70000});};
    await ready(0);await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='1');
    const initial=await page.locator('#volume').textContent();assert.match(initial,/39430\.089/);
    await page.locator('#width').fill('100');await page.locator('#apply').click();await ready(1);
    assert.match(await page.locator('#volume').textContent(),/50230\.089/);assert.match(await page.locator('#tree').textContent(),/profile · sketch · rebuilt/);
    await page.locator('#depth').fill('20');await page.locator('#apply').click();await ready(2);
    assert.match(await page.locator('#tree').textContent(),/profile · sketch · reused/);
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='3');
    const before=await page.locator('#volume').textContent();await page.locator('#width').fill('20');await page.locator('#apply').click();
    await page.waitForFunction(()=>document.querySelector('#edit-status').dataset.state==='error',null,{timeout:70000});
    assert.equal(await page.locator('#revision').textContent(),'Revision 2');assert.equal(await page.locator('#volume').textContent(),before);
    assert.equal(await page.locator('canvas').getAttribute('data-uploads'),'3');
    await page.locator('#undo').click();await ready(3);assert.equal(await page.locator('#depth').inputValue(),'12');
    await page.locator('#redo').click();await ready(4);assert.equal(await page.locator('#depth').inputValue(),'20');
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save').click()]);const saved=await download.path();
    await page.locator('#file').setInputFiles({name:'features.cad.json',mimeType:'application/json',buffer:fs.readFileSync(saved)});await ready(5);
    assert.equal(await page.locator('#undo').isDisabled(),true);await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='6');
    await page.locator('canvas').hover();await page.mouse.wheel(0,-100);assert.equal(await page.locator('canvas').getAttribute('data-uploads'),'6');
    assert.deepEqual(errors,[]);fs.mkdirSync('ui-out',{recursive:true});await page.screenshot({path:'ui-out/cad_t009_feature_history.png'});
    console.log('T009 real native GUI feature edits/rollback/undo/redo/roundtrip PASS');
  }finally{if(browser)await browser.close();if(child.exitCode===null){child.kill();await once(child,'exit');}}
})().catch(e=>{console.error(e);process.exitCode=1});
