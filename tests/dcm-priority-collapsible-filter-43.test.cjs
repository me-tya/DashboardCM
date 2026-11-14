const fs=require('node:fs'), assert=require('node:assert/strict'), vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-priority-collapsible-filter-43.css','utf8');
const start=html.indexOf('function renderPriority(){');
const end=html.indexOf('/* ---------- Form proyek ---------- */',start);
assert(start>=0&&end>start,'Actual priority renderer must be present');
const p=html.slice(start,end);
new vm.Script(p,{filename:'renderPriority-43.js'});
assert(p.includes("const prioFilterOpen=prioLsGet('cmPrioFilterOpen','0')==='1'"),'Filter default collapsed and state persists');
assert(p.includes("prioLsSet('cmPrioFilterOpen',opening?'1':'0')"),'Click saves toggle state');
assert(p.includes("class=\"prio-filter-panel${prioFilterOpen?'':' is-collapsed'}\""),'Priority filter receives collapsible class');
assert(p.includes('id="prioFilterToggle"'),'Actionable button exists');
assert(p.includes('aria-expanded="${prioFilterOpen}"'),'Screen-reader state reflects persistence');
assert(p.includes('class="prio-filter-active-chip"'),'Visible notice of filters applied while collapsed');
assert(p.includes('class="prio-filter-warning-chip"'),'Visible incomplete-data warning while collapsed');
assert(p.includes("el.querySelector('#prioFilterToggle')?.addEventListener('click'"),'Toggle event wired');
assert(p.includes("el.querySelector('.prio-filter-head')?.addEventListener('click'"),'Entire heading clickable');
const clickStart=p.indexOf("el.querySelector('#prioFilterToggle')?.addEventListener('click'");
const clickEnd=p.indexOf("el.querySelector('#prioCmpSnap')?.addEventListener",clickStart);
const clickCode=p.slice(clickStart,clickEnd);
assert(clickCode.includes("panel.classList.toggle('is-collapsed',!opening)"),'Toggle must change presentation');
assert(clickCode.includes("toggle.setAttribute('aria-expanded',String(opening))"),'Toggle ARIA sync');
assert(!clickCode.includes('renderPriority()'),'Do not rerender project data or lose focus/scroll just to collapse');
assert(p.includes('prioScopeBarHtml()'),'Ranking scope untouched');
assert(p.includes('prioSnapBarHtml(can)'),'Snapshot controls untouched');
assert(p.includes('data-prio-kpi=')&&p.includes('class="prio-kpi-stage"'),'KPI stage preserved');
for(const q of ["[data-prio-filter]","[data-prio-sort]","[data-prio-view]","#prioCmpSnap","#prioSnapSave","#prioSnapDel"]){
 assert(p.includes(q),'Original feature callback must remain: '+q);
}
assert(css.includes('#tab-priority .prio-filter-panel.is-collapsed > :not(.prio-filter-head)'),'All heavy controls hidden, not removed');
assert(css.includes('#tab-priority .prio-filter-panel.is-collapsed > .prio-filter-head'),'Single-row collapsed heading');
assert(css.includes('min-height:46px!important'),'Collapsed height compact');
assert(css.includes('#tab-priority .prio-filter-panel > .prio-filter-head #prioFilterToggle[aria-expanded="true"] svg'),'Chevron direction reflects state');
for(const q of ['.prio-scope','.prio-toolbar','.prio-snapbar','.prio-warn-bar']){
 assert(css.includes('#tab-priority .prio-filter-panel > '+q),'Each expanded filter group has compact style: '+q);
}
for(const t of ['#appHeader','#tab-analytics','#tab-contact','#tab-knowledge']){
 assert(!css.includes(t),'Patch must not change unrelated menu '+t);
}
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Balanced CSS');
assert(html.includes('dcm-priority-filter-option1-42.css?v=261114-42'),'Approved prior design retained');
assert(html.includes('dcm-priority-collapsible-filter-43.css?v=261114-43'),'Updated CSS loaded');
console.log('PASS compact default-collapsed Filter Peringkat, click & keyboard toggle, stored state, filter badges, untouched ranking/snapshot callbacks and all-menu scoping.');
