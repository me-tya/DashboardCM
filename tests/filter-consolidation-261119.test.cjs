const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-filter-consolidated-261119.css','utf8');
test('WBS selectors live in the common top activity filter and not below the agenda',()=>{
 assert.match(html,/id="filterPic"><\/select>\$\{cmWbsFilterSelects\(\)\}<div class="cm-fper">/);
 assert.doesNotMatch(html,/class="wbs-filter-bar"/);
 assert.match(html,/function cmWbsFilterToolbar\(items\)/);
 assert.match(html,/class="wbs-summary"/);
 assert.match(html,/\['analytics','table','calendar','kanban','matrix'\]/);
});
test('single Reset clears standard and WBS filters',()=>{
 assert.match(html,/wbsGroup:'ALL',wbsLevel4:'ALL',wbsLevel5:'ALL',wbsQuarter:'ALL',iku:'ALL'\};configureContextToolbar\(tab\)/);
 assert.match(html,/state\.page=1;configureContextToolbar\(state\.activeTab\);renderActiveTab\(\);updateFilterActiveBadge\(\);/);
});
test('WBS selects: triwulan, komponen, tahapan (narrowed by komponen) plus IKU filter (2026-11-24)',()=>{
 const start=html.indexOf('function cmWbsFilterSelects()');
 const end=html.indexOf('\nfunction cmWbsFilterToolbar(items)',start);
 assert.ok(start>=0&&end>start);
 const sandbox={state:{filters:{wbsLevel4:'Tahap PM',wbsLevel5:'ALL'}},window:{DCMIKU:{filterSelect:()=>'<select data-wbs-filter="iku"></select>'}},
 ActivityWBS:{COMPONENTS:['Tahap PM','Tahap CM'],LABELS:{'Tahap CM':'Change Management'},stages:{'Tahap PM':['Langkah PM'],'Tahap CM':['Langkah CM']},E:s=>String(s)}};
 const output=vm.runInNewContext(html.slice(start,end)+'\ncmWbsFilterSelects();',sandbox);
 assert.equal((output.match(/<select /g)||[]).length,4);
 for(const k of ['wbsQuarter','wbsLevel4','wbsLevel5','iku'])assert.match(output,new RegExp('data-wbs-filter="'+k+'"'));
 assert.doesNotMatch(output,/data-wbs-filter="wbsGroup"/);
 assert.match(output,/Langkah PM/);
 assert.doesNotMatch(output,/Langkah CM/);
});
test('IPR export replaces CSV IKU beside activity list title; style is compact and responsive',()=>{
 assert.doesNotMatch(html,/data-wbs-export="dcm"/);
 assert.equal((html.match(/class="cm-iku-export" data-ipr-export/g)||[]).length,1);
 assert.match(css,/#contextFilterBar #filterBarBody\.cm-fgrid/);
 assert.match(css,/#tab-table \.cm-iku-export/);
 assert.match(css,/@media\(max-width:650px\)/);
});
