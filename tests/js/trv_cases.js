// The rated TRV in the browser (web/studio/trv.js, 4.9) for a set of ratings and test-duties, to compare with pcl.trv.
// Usage: node trv_cases.js -> JSON
const path=require('path');const TRV=require(path.resolve(__dirname,'../../web/studio/trv.js'));
const cases=[[3.6e3,'T100',1.5,'S1'],[12e3,'T60',1.3,'S1'],[72.5e3,'T10',1.5,'S1'],[12e3,'T100',1.5,'S2'],[36e3,'OP',2.0,'S1'],[12e3,'OP',2.5,'S2'],[20e3,'T100',1.3,'S1'],
 [15e3,'SLF',null,'S1'],[145e3,'T100',null,'S1'],[145e3,'T60',null,'S1'],[145e3,'T30',null,'S1'],[245e3,'T10',null,'S1'],[170e3,'T100',1.5,'S1'],[145e3,'OP',null,'S1'],
 [1100e3,'T100',null,'S1'],[1200e3,'T60',null,'S1'],[1100e3,'OP',null,'S1'],[245e3,'SLF',null,'S1']];
const out={rated:cases.map(c=>TRV.rated(...c)),slf:[0.9,0.75].map(r=>TRV.slf(245e3,50e3,r))};
console.log(JSON.stringify(out));
