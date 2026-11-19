// 4.22 (ROADMAP §69): the viewer of the network on the map (web/studio/netview.js with view.geo) headless: the routes in the
// model, a frame with the graticule and the scale bar, a branch picked on its route (not on the chord), the middle of a route.
// Usage: node geo_cases.js data.json -> JSON
const fs=require('fs'),path=require('path');const NV=require(path.resolve(__dirname,'../../web/studio/netview.js'));
function fake(){const c={segs:0,texts:[],saves:0};const ctx={clearRect(){},beginPath(){},setTransform(){},fillRect(){},moveTo(){},lineTo(){c.segs++;},arc(){},stroke(){},fill(){},
 fillText(t){c.texts.push(String(t));},setLineDash(){},save(){c.saves++;},restore(){},strokeRect(){},fillStyle:'',strokeStyle:'',lineWidth:1,lineCap:'',font:'',textBaseline:'',textAlign:''};return {ctx,c};}
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),R={};
for(const [name,d] of Object.entries(data)){const m=NV.model(d),w=900,h=600,tr=NV.fit(m,w,h),sx=x=>(x-tr.cx)*tr.s+w/2,sy=y=>(y-tr.cy)*tr.s+h/2;
 const {ctx,c}=fake(),out=NV.draw(ctx,m,tr,w,h,d.layer||'base',{});
 const r={rt:m.rt?[...m.rt.keys()]:null,grid:out.grid??null,scale:out.scale??null,texts:c.texts.filter(t=>/°|km|\bm$/.test(t)),saves:c.saves};
 if(m.rt){r.picks=[...m.rt].map(([j,p])=>{const q=NV.routeMid(p),hit=NV.pick(m,tr,w,h,sx(q[0]),sy(q[1])),chord=NV.pick(m,tr,w,h,sx((m.x1[j]+m.x2[j])/2),sy((m.y1[j]+m.y2[j])/2));
  return {j,onRoute:!!(hit&&hit.kind==='branch'&&hit.j===j),onChord:!!(chord&&chord.kind==='branch'&&chord.j===j)};});}
 r.mid=NV.routeMid([[0,0],[3,0],[3,4]]);r.scaleLen=[NV.scaleLen(80),NV.scaleLen(12),NV.scaleLen(0.3),NV.scaleLen(260)];
 R[name]=r;}
process.stdout.write(JSON.stringify(R));
