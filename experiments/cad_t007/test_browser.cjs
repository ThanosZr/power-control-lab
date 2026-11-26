const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
  const child=spawn(process.env.PYTHON||'python',['-m','experiments.cad_t007.server','--port','0'],{stdio:['ignore','pipe','inherit']});
  let browser;
  try{
    const url=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Server startup timeout')),60000);
      child.once('error',e=>{clearTimeout(timer);reject(e)});
      child.once('exit',code=>{clearTimeout(timer);reject(Error('Server exited: '+code))});
      let data='';child.stdout.on('data',chunk=>{data+=chunk;if(data.includes('\n')){clearTimeout(timer);resolve(data.trim().split('\n')[0]);}});
    });
    browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1000,height:760}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);
    const ready=()=>page.waitForFunction(()=>document.querySelector('#edit-status').textContent==='Ready',null,{timeout:60000});
    const revision=async n=>{await ready();assert.equal(await page.locator('#revision').textContent(),'Revision '+n);};
    await revision(0);
    const canvas=page.locator('canvas');
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='1');
    await page.locator('#diameter').fill('32');await page.locator('#length').fill('180');await page.locator('#apply').click();await revision(1);
    assert.match(await page.locator('#volume').textContent(),/144764\.589/);
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='2');
    await page.locator('#undo').click();await revision(2);
    assert.equal(await page.locator('#diameter').inputValue(),'20');
    await page.locator('#redo').click();await revision(3);
    assert.equal(await page.locator('#length').inputValue(),'180');
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#save').click()]);
    const saved=await download.path();
    await page.locator('#length').fill('200');await page.locator('#apply').click();await revision(4);
    await page.locator('#document-file').setInputFiles(saved);await revision(3);
    assert.equal(await page.locator('#length').inputValue(),'180');
    await page.locator('#undo').click();
    await page.waitForFunction(()=>document.querySelector('#edit-status').dataset.state==='error');
    assert.equal(await page.locator('#revision').textContent(),'Revision 3');
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='6');
    await canvas.hover();await page.mouse.wheel(0,-100);
    assert.equal(await canvas.getAttribute('data-uploads'),'6');
    assert.deepEqual(errors,[]);
    fs.mkdirSync('ui-out',{recursive:true});await page.screenshot({path:'ui-out/cad_t007_parametric.png'});
    console.log('T007 real native GUI edit/undo/redo/save/open PASS');
  }finally{
    if(browser)await browser.close();
    if(child.exitCode===null){child.kill();await once(child,'exit');}
  }
})().catch(e=>{console.error(e);process.exitCode=1});
