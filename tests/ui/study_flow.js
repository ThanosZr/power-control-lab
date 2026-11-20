// 5.0 (ROADMAP §91, THEORY §8ΩΕ, GUIDE §36): the study folder and the viewer in the browser. The page runs line_fd into a
// folder (its own worker: study_worker.js); the viewer (viewer/) opens the run while it is written and follows it; the
// values of the folder rounded to float32 are those of the scope of the page; a second run and the difference of the two
// (zero: the same circuit); the two line models in the folder once; a plot file of the EMTP in the viewer.
// Usage: python run.py --no-browser --port 8765  then  node tests/ui/study_flow.js http://127.0.0.1:8765/ <out-dir>
const {chromium}=require('playwright');const fs=require('fs'),os=require('os'),path=require('path');const OUT=process.argv[3]||'.';
(async()=>{const URL=process.argv[2];const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1500,height:1000}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(String(e.stack||e)));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const ok=(c,msg)=>{if(!c){console.error('FAIL: '+msg);process.exitCode=1;}else console.log('ok: '+msg);};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pcl-study-flow-')),study=path.join(dir,'μελέτη');
 await p.goto(URL);await p.waitForSelector('#tutorials');await p.click('#tutorials');await p.click('[data-tut="line_fd"]');await p.waitForTimeout(900);
 await p.waitForFunction(()=>window.PCL&&PCL.S.sim&&!PCL.S.error,null,{timeout:30000});
 await p.fill('#stop','20');await p.dispatchEvent('#stop','change');await p.waitForTimeout(200);
 await p.evaluate(async d=>{await PCL.folderSettings({dir:d,create:true,netlist:true,mode:'all',dtype:'float64',dt:0});},study);
 ok(await p.evaluate(d=>PCL.SFOLD.path.endsWith('μελέτη')&&PCL.S.stopT===0.02,study),'ο φάκελος μελέτης ορίστηκε, διάρκεια 20 ms');
 await p.click('#study-run');await p.waitForFunction(()=>PCL.SFOLD.run,null,{timeout:30000});
 const run1=await p.evaluate(()=>({run:PCL.SFOLD.run,path:PCL.SFOLD.runPath}));ok(/^runs\/0001-/.test(run1.run),'το πρώτο τρέξιμο: '+run1.run);
 // the viewer while the run is written
 const v=await ctx.newPage();v.on('pageerror',e=>errs.push('viewer: '+String(e.stack||e)));
 await v.goto(URL+'viewer/?source='+encodeURIComponent(run1.path)+'&follow=1');
 await v.waitForFunction(()=>window.Viewer&&Viewer.V.sources.length===1&&Viewer.V.panes[0].data.size>0,null,{timeout:30000});
 const first=await v.evaluate(()=>({rows:Viewer.V.sources[0].info.rows,status:Viewer.V.sources[0].info.status}));
 await p.waitForFunction(()=>!PCL.SFOLD.w,null,{timeout:180000});
 const st1=await p.evaluate(()=>({status:PCL.SFOLD.status,rows:PCL.SFOLD.rows,keys:PCL.S.sim.keys.length,err:PCL.SFOLD.err}));
 ok(st1.status==='τελείωσε'&&!st1.err,'το τρέξιμο τελείωσε: '+st1.rows+' γραμμές');
 await v.waitForFunction(r=>Viewer.V.sources[0].info.status==='done'&&Viewer.V.sources[0].info.rows===r,st1.rows,{timeout:20000});
 const vi=await v.evaluate(()=>({n:Viewer.V.sources[0].info.channels.length,rows:Viewer.V.sources[0].info.rows}));
 ok(vi.n===st1.keys,`το εργαλείο προβολής: όλα τα κανάλια (${vi.n})`);
 ok(first.rows<=st1.rows,`με ανανέωση όσο γραφόταν (${first.rows} γραμμές, ${first.status}) ως το τέλος (${vi.rows})`);
 // the files of the run and the two line models (once each)
 const files=fs.readdirSync(run1.path).sort();
 ok(['channels.json','data.f64','events.jsonl','log.jsonl','netlist.json','netlist.txt','project.json','run.json','summary.html','summary.json'].every(f=>files.includes(f)),'τα αρχεία του τρεξίματος: '+files.join(' '));
 const models=fs.readdirSync(path.join(study,'models','lines'));ok(models.length===2,'δύο μοντέλα γραμμής στον φάκελο: '+models.join(' '));
 ok(models.every(m=>fs.readdirSync(path.join(study,'models','lines',m)).some(f=>/\.mod$|_CP\.net$/.test(f))),'με το αρχείο τους στη μορφή του EMTP');
 // the scope of the page: the same run to 20 ms, the values of the folder rounded to float32 against the ring
 await p.click('#toend');await p.waitForFunction(()=>PCL.S.sim.t>=0.02-1e-9,null,{timeout:120000});
 const cmp=await p.evaluate(async src=>{const s=PCL.S.sim,R=s.ring,k=s.recKeys.find(x=>x.startsWith('I:'))||s.recKeys[0],i=s.chIndex.get(k),n=Math.min(R.n,400);
  const a=(R.head-n+R.cap)%R.cap,t0=R.t[a],t1=R.t[(R.head-1+R.cap)%R.cap];
  const r=await (await fetch('/api/study',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'range',source:src,t0,t1,keys:[k],n:20000})})).json();
  let same=0,diff=0,j=0;for(let q=0;q<n;q++){const x=(a+q)%R.cap,t=R.t[x];while(j<r.t.length&&r.t[j]<t)j++;if(r.t[j]!==t){diff++;continue;}if(Object.is(Math.fround(r.cols[k].v[j]),R.d[x*R.nch+i]))same++;else diff++;j++;}
  return {k,same,diff,raw:r.raw};},run1.path);
 ok(cmp.raw&&cmp.diff===0&&cmp.same>=200,`τιμές του φακέλου = τιμές του scope (float32), ${cmp.k}: ${cmp.same} σημεία`);
 // a second run, and A − B of the two in the viewer
 await p.click('#study-run');await p.waitForFunction(()=>PCL.SFOLD.run&&/^runs\/0002-/.test(PCL.SFOLD.run)&&!PCL.SFOLD.w,null,{timeout:180000});
 const run2=await p.evaluate(()=>PCL.SFOLD.runPath);
 await v.evaluate(async q=>{await Viewer.openSource(q);},run2);
 const d=await v.evaluate(async()=>{const V=Viewer.V,[a,b]=V.sources,k=a.info.channels.find(c=>c.key.startsWith('I:')).key;
  V.sel=[{src:a,key:k,c:a.info.channels.find(c=>c.key===k)},{src:b,key:k,c:b.info.channels.find(c=>c.key===k)}];Viewer.diff();
  await new Promise(z=>setTimeout(z,1500));const t=V.panes[0].traces.find(x=>x.a);return {stats:t&&t.stats,runs:(a.runs||[]).length};});
 ok(d.stats&&d.stats.max===0&&d.stats.n>1000,`A − B των δύο τρεξιμάτων: μέγιστη διαφορά ${d.stats&&d.stats.max} σε ${d.stats&&d.stats.n} σημεία`);
 ok(d.runs>=2,'η λίστα των τρεξιμάτων της μελέτης: '+d.runs);
 // the plot file of the EMTP (<name>m.m with its .mda, as the EMTP writes them)
 const em=path.join(dir,'emtp');fs.mkdirSync(em);fs.writeFileSync(path.join(em,'casem.m'),"filn='case.mda';\nt=1;\nprecision='float64';\nn_scopes=3;\nn_time_scopes=1;\nNtime='time';\ntime=1:1:1;\nn_vn_scopes=2;\nNvn='BUS1';\nNvn=strvcat(Nvn,'BUS2');\nvn=2:1:3;\n");
 {const n=200,B=Buffer.alloc(n*(24+8));for(let i=0;i<n;i++){const o=i*32,t=i*1e-5;B.writeInt32LE(24,o);B.writeDoubleLE(t,o+4);B.writeDoubleLE(Math.sin(2*Math.PI*50*t),o+12);B.writeDoubleLE(Math.cos(2*Math.PI*50*t),o+20);B.writeInt32LE(24,o+28);}fs.writeFileSync(path.join(em,'case.mda'),B);}
 await v.evaluate(async q=>{await Viewer.openSource(q);},path.join(em,'casem.m'));
 const e=await v.evaluate(()=>{const s=Viewer.V.sources.find(x=>x.info.kind==='emtp');return s&&{n:s.info.channels.length,rows:s.info.rows,keys:s.info.channels.map(c=>c.key)};});
 ok(e&&e.n===2&&e.rows===200&&e.keys.join()==='vn:BUS1,vn:BUS2','αρχείο του EMTP στο εργαλείο προβολής: '+JSON.stringify(e));
 await v.screenshot({path:OUT+'/study_flow.png'});
 ok(!errs.length,'χωρίς σφάλματα στις σελίδες'+(errs.length?': '+errs.slice(0,3).join(' | '):''));
 fs.rmSync(dir,{recursive:true,force:true});await b.close();})().catch(e=>{console.error(e);process.exit(1);});
