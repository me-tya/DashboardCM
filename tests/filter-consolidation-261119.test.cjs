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
 assert.match(html,/wbsGroup:'ALL',wbsLevel4:'ALL',wbsLevel5:'ALL',wbsQuarter:'ALL'\};configureContextToolbar\(tab\)/);
 assert.match(html,/state\.page=1;configureContextToolbar\(state\.activeTab\);renderActiveTab\(\);updateFilterActiveBadge\(\);/);
});
test('dependent WBS selects preserve all four fields and narrow choices by PM/CM',()=>{
 const start=html.indexOf('function cmWbsFilterSelects()');
 const end=html.indexOf('\nfunction cmWbsFilterToolbar(items)',start);
 assert.ok(start>=0&&end>start);
 const sandbox={state:{filters:{wbsGroup:'PM',wbsLevel4:'ALL',wbsLevel5:'ALL'}},
 ActivityWBS:{stages:{'Tahap PM':['Langkah PM'],'Tahap CM':['Langkah CM']},l4:g=>g==='PM'?['Tahap PM']:['Tahap CM'],E:s=>String(s)}};
 const output=vm.runInNewContext(html.slice(start,end)+'\ncmWbsFilterSelects();',sandbox);
 assert.equal((output.match(/<select /g)||[]).length,4);
 assert.match(output,/data-wbs-filter="wbsQuarter"/);
 assert.match(output,/data-wbs-filter="wbsGroup"/);
 assert.match(output,/data-wbs-filter="wbsLevel4"/);
 assert.match(output,/data-wbs-filter="wbsLevel5"/);
 assert.match(output,/Tahap PM/);
 assert.doesNotMatch(output,/Tahap CM/);
});
test('CSV IKU stays beside activity list title; style is compact and responsive',()=>{
 assert.match(html,/class="cm-iku-export" data-wbs-export="dcm"/);
 assert.equal((html.match(/data-wbs-export="dcm"/g)||[]).length,2); // event handler + one rendered button
 assert.match(css,/#contextFilterBar #filterBarBody\.cm-fgrid/);
 assert.match(css,/#tab-table \.cm-iku-export/);
 assert.match(css,/@media\(max-width:650px\)/);
});