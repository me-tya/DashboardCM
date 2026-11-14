const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-priority-spacing-45.css','utf8');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Balanced CSS');
assert(css.includes('#tab-priority .prio-page{'),'Only Prioritas spacing affected');
assert(css.includes('gap:7px!important;')&&css.includes('row-gap:7px!important;'),'Identical 7px vertical rhythm');
assert(css.includes('#tab-priority .prio-page > .prio-hero{'),'Title wrapper spacing');
assert(css.includes('min-height:0!important;'),'Remove inherited 52px minimum title height');
assert(css.includes('padding:0 0 0 20px!important;'),'No extra top/bottom padding on title');
assert(css.includes('#tab-priority .prio-page > .cm-survey-subtabs.prio-subtabs{'),'Submenu');
assert(css.includes('margin-block:0!important;'),'No extra margins around submenu');
assert(css.includes('#tab-priority .prio-page > .prio-kpi-stage{'),'KPI stage');
assert(css.includes('#tab-priority .prio-page > .prio-filter-panel{'),'Filter group');
for(const forbidden of ['#tab-survey','#tab-resource','#tab-contact','#appHeader','#tabNav','.prio-kpi >','background:','color:','height:86px','data-prio-']){
 assert(!css.includes(forbidden),'No changes to other menus or card designs: '+forbidden);
}
assert(html.includes('dcm-priority-spacing-45.css?v=261114-45'),'New CSS must load');
assert(html.indexOf('dcm-priority-spacing-45.css?v=261114-45')>html.indexOf('dcm-priority-density-44.css?v=261114-44'),'Must override old spacing last');
assert(html.includes('function renderPriority(){'),'App and data bindings preserved');
assert(html.includes("el.querySelectorAll('[data-prio-kpi]').forEach"),'KPI drilldowns retained');
assert(html.includes("el.querySelector('#prioFilterToggle')?.addEventListener('click'"),'Toggle retained');
assert(html.includes("el.querySelectorAll('[data-prio-tab]').forEach"),'Submenu behavior retained');
console.log('PASS: equal tight 7px gaps around Prioritas submenu, no visual/function changes outside spacing.');
