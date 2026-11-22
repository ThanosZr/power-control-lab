// 5.0.8 (ROADMAP §98): the commands of tests/test_console.py in the kernel of the page, Pyodide (the npm package in Node), with
// the same pcl/*.py as the worker of the card loads. Prints one JSON line: the answer of every request.
//   node tests/js/console_cases.js '<json [{op, code, block, ctx, text}]>'
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','..');
(async()=>{const reqs=JSON.parse(process.argv[2]||'[]');let loadPyodide;
 try{({loadPyodide}=require('pyodide'));}catch(e){console.log(JSON.stringify({skipped:'pyodide (npm): '+String(e.message||e).slice(0,100)}));return;}
 const py=await loadPyodide();py.FS.mkdirTree('/pcl_pkg/pcl');
 for(const f of ['__init__.py','core.py','formats.py','impulse.py','control.py','console.py'])py.FS.writeFile('/pcl_pkg/pcl/'+f,fs.readFileSync(path.join(ROOT,'pcl',f),'utf8'));
 py.FS.mkdirTree('/home/pyodide/console');py.FS.chdir('/home/pyodide/console');
 py.runPython(`import sys, json
sys.path.insert(0, '/pcl_pkg')
import pcl.console as _pc
_PAGES = []
_CON = _pc.Console(page=lambda op, d=None: _PAGES.append({'op': op, **(d or {})}))
def _handle(s):
    _PAGES.clear()
    r = _CON.handle(json.loads(s))
    r['page'] = list(_PAGES)
    return json.dumps(r, ensure_ascii=False)
`);
 const h=py.globals.get('_handle'),out=[];for(const q of reqs)out.push(JSON.parse(h(JSON.stringify(q))));
 console.log(JSON.stringify({python:py.runPython('import sys; sys.version.split()[0]'),out}));})().catch(e=>{console.log(JSON.stringify({error:String(e&&e.stack||e)}));process.exit(1);});
