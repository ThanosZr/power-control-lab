const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
  const child=spawn(process.env.PYTHON||'python',['-m','experiments.cad_t010.server','--port','0'],{stdio:['ignore','pipe','inherit']});
  let browser;
  try{
    const url=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Startup deadline')),70000);let data='';
      child.once('error',e=>{clearTimeout(timer);reject(e)});
      child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exit '+code))});
      child.stdout.on('data',s=>{data+=s;if(data.includes('\n')){clearTimeout(timer);resolve(data.trim().split('\n')[0]);}});
    });
    browser=await chromium.launch({headless:true,executablePath:process.env.CAD_CHROMIUM||undefined,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1100,height:800}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);const ready=async n=>page.waitForFunction(n=>document.querySelector('#edit-status').textContent==='Ready'&&document.querySelector('#revision').textContent==='Revision '+n,n,{timeout:70000});
    const volume=async x=>assert.ok(Math.abs(parseFloat((await page.locator('#volume').textContent()).split(': ')[1])-x)<.001);
    await ready(0);await volume(11000*Math.PI);await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='1');
    await page.locator('#boolean').selectOption('union');await page.locator('#apply-feature').click();await ready(1);await volume(19250*Math.PI);
    assert.match(await page.locator('#tree').textContent(),/body · revolve ← profile · reused/);
    await page.locator('#angle').fill('180');await page.locator('#boolean').selectOption('subtract');await page.locator('#apply-feature').click();await ready(2);await volume(5500*Math.PI);
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='3');
    await page.locator('summary').click();const doc=JSON.parse(await page.locator('#document').inputValue());doc.features[4].right='profile';
    await page.locator('#document').fill(JSON.stringify(doc));await page.locator('#apply-document').click();
    await page.waitForFunction(()=>document.querySelector('#edit-status').dataset.state==='error',null,{timeout:70000});
    await volume(5500*Math.PI);assert.equal(await page.locator('canvas').getAttribute('data-uploads'),'3');
    await page.locator('#undo').click();await ready(3);await volume(19250*Math.PI);
    await page.locator('#redo').click();await ready(4);await volume(5500*Math.PI);
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='5');
    await page.locator('canvas').hover();await page.mouse.wheel(0,-100);assert.equal(await page.locator('canvas').getAttribute('data-uploads'),'5');
    assert.deepEqual(errors,[]);fs.mkdirSync('ui-out',{recursive:true});await page.screenshot({path:'ui-out/cad_t010_native_features.png'});
    console.log('T010 native revolve/boolean GUI, reuse, rollback, history and retained buffers PASS');
  }finally{if(browser)await browser.close();if(child.exitCode===null){child.kill();await once(child,'exit');}}
})().catch(e=>{console.error(e);process.exitCode=1});
