const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-knowledge-priority-compact-37.css','utf8');
const start=html.indexOf('function renderPriority(){');
const end=html.indexOf('/* ---------- Form proyek ---------- */',start);
assert(start>=0&&end>start,'Existing Priority renderer must be present');
const render=html.slice(start,end);
assert(render.includes('const {rows,others}=prioScopeCompute()'),'Card data remains based on current scope');
assert(render.includes('const cnt={high:0,mid:0,low:0}'),'Counts still derive from current ranked data');
assert(render.includes('const top=rows[0]'),'Top project follows computed ranking');
assert(!render.includes('<div class="prio-kpi"'),'Original static KPI divs replaced with accessible buttons');
for(const value of ['all','high','mid','low','top']){
 assert.equal((render.match(new RegExp('data-prio-kpi="'+value+'"','g'))||[]).length,1,
   'All five KPI cards should be clickable: '+value);
}
assert.equal((render.match(/<button[^>]*class="prio-kpi/g)||[]).length,5,'Five real keyboard buttons');
assert(render.includes('aria-pressed="${prioUi.filter'), 'Active card exposes pressed state');
assert(render.includes("el.querySelectorAll('[data-prio-kpi]').forEach"),'All KPI buttons wired to one handler');
assert(render.includes("['high','mid','low'].includes(kind)?kind:'all'"),
 'Category card re-uses the existing filter');
assert(render.includes("prioUi.open.add(topId)"),'Top card opens existing project details');
assert(render.includes("prioUi.view='list'"),'Card click forces read-only list mode');
assert(render.includes("prioUi.q=''"),'Search query reset reveals filtered results');
assert(render.includes("scrollIntoView("),'Card click navigates to project list/details');
assert(render.includes("kind==='top'&&top?top.p.id:''"),'Uses actual top project ID');
assert(render.includes("data-prio-detail"),'Original per-project read-only details remain');
for(const selector of [
 '#tab-knowledge .kb-category-row',
 '#tab-knowledge .knowledge-group',
 '#tab-knowledge .cm-ref-v2',
 '#tab-knowledge .cm-ref-v2.collapsed',
 '#tab-priority .prio-page',
 '#tab-priority .prio-page > .prio-hero',
 '#tab-priority .cm-survey-subtabs.prio-subtabs',
 '#tab-priority .prio-kpis > button.prio-kpi',
 '#tab-priority .prio-kpis > button.prio-kpi:focus-visible'
])assert(css.includes(selector),'Expected compact or accessible CSS selector missing: '+selector);
assert(css.includes('cursor:pointer!important'));
assert(css.includes('scroll-margin-top:150px'));
assert(css.includes('@media(max-width:760px)'));
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Stylesheet balanced');
for(const key of ['cmCanMutate()','prioPersist();','prioOpenForm','prioBindRows']){
 assert(render.includes(key),'Existing permission/action logic unchanged: '+key);
}
console.log('PASS compact Knowledge/Priority, five accessible KPI drilldowns, top details, permissions and existing actions.');
