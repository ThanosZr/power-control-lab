// Optional real WebGL2 smoke test using the existing PCL CI Playwright dependency.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');

const names=new Map([['/','index.html'],['/geometry.mjs','geometry.mjs'],['/renderer.mjs','renderer.mjs'],['/viewport.mjs','viewport.mjs'],['/sample.json','sample.json']]);
const server=http.createServer((req,res)=>{
  const file=names.get(req.url);if(!file){res.writeHead(404).end();return}
  const type=file.endsWith('.json')?'application/json':file.endsWith('.mjs')?'text/javascript':'text/html';
  res.writeHead(200,{'Content-Type':type});fs.createReadStream(path.join(__dirname,file)).pipe(res);
});

(async()=>{
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1000,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.waitForFunction(()=>document.querySelector('#status').dataset.state==='ready' && +document.querySelector('canvas').dataset.frames>0);
    const canvas=page.locator('canvas');let box=await canvas.boundingBox();
    const initial=await canvas.screenshot();assert.equal(await canvas.getAttribute('data-uploads'),'1');
    const beforePick=+(await canvas.getAttribute('data-frames'));
    await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
    await page.waitForFunction(n=>document.querySelector('#selection').textContent.includes('shaft-body')&&+document.querySelector('canvas').dataset.frames>n,beforePick);
    const selected=await canvas.screenshot();assert.notDeepEqual(initial,selected,'highlight must change rendered image');
    fs.mkdirSync('ui-out',{recursive:true});await page.screenshot({path:'ui-out/cad_t006_viewport.png'});
    const frames=+(await canvas.getAttribute('data-frames'));
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+70,box.y+box.height/2+25,{steps:5});await page.mouse.up();
    await page.waitForFunction(n=>+document.querySelector('canvas').dataset.frames>n,frames);
    const orbit=await canvas.screenshot();assert.notDeepEqual(selected,orbit,'orbit must change rendered image');
    const beforeZoom=+(await canvas.getAttribute('data-frames'));
    await page.mouse.wheel(0,-140);await page.waitForFunction(n=>+document.querySelector('canvas').dataset.frames>n,beforeZoom);
    await page.keyboard.press('Escape');await page.locator('#fit').click();
    await page.setViewportSize({width:640,height:620});await page.waitForFunction(()=>document.querySelector('canvas').width===Math.round(document.querySelector('canvas').getBoundingClientRect().width*Math.min(devicePixelRatio,2)));
    assert.equal(await canvas.getAttribute('data-uploads'),'1');assert.equal(await page.locator('#selection').textContent(),'None');
    await page.locator('#mesh-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});
    await page.waitForFunction(()=>document.querySelector('#status').dataset.state==='error');assert.equal(await canvas.getAttribute('data-uploads'),'1');
    await page.locator('#mesh-file').setInputFiles(path.join(__dirname,'sample.json'));
    await page.waitForFunction(()=>document.querySelector('canvas').dataset.uploads==='2');assert.deepEqual(errors,[]);
    console.log('T006 WebGL2 smoke PASS: native mesh/render, pick, orbit, zoom, resize, replacement, upload retention.');
  } finally {if(browser)await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
