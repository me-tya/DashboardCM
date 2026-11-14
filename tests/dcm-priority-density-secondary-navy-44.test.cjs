const fs=require('node:fs'),assert=require('node:assert/strict');
const app=fs.readFileSync('index.html','utf8');
const tp=fs.readFileSync('tim-pusmantap.html','utf8');
const tight=fs.readFileSync('dcm-priority-density-44.css','utf8');
const nav=fs.readFileSync('dcm-secondary-navy-44.css','utf8');
const embedded=fs.readFileSync('dcm-pusmantap-secondary-navy-44.css','utf8');
for(const [name,text] of [['priority',tight],['navigation',nav],['pusmantap',embedded]]){
 assert.equal((text.match(/\{/g)||[]).length,(text.match(/\}/g)||[]).length,name+' CSS syntactically balanced');
}
for(const rule of [
 '#tab-priority .prio-page',
 '#tab-priority .prio-page > .prio-hero',
 '#tab-priority .cm-survey-subtabs.prio-subtabs',
 '#tab-priority .prio-kpi-stage',
 '#tab-priority .prio-kpi-stage > .prio-kpis',
 '#tab-priority .prio-kpi-stage .prio-kpis > button.prio-kpi',
 '#tab-priority .prio-filter-panel'
])assert(tight.includes(rule),'Density CSS missing '+rule);
assert(tight.includes('min-height:86px!important'), 'Desktop KPI card height must be compact 86px');
assert(tight.includes('height:86px!important'), 'Desktop KPI card height');
assert(tight.includes('padding:10px 12px!important'), 'Navy KPI panel padding reduced');
assert(tight.includes('gap:9px!important'), 'Tighten vertical gaps');
assert(tight.includes('min-height:49px!important'), 'Secondary navigation bar shorter');
assert(tight.includes('min-height:41px!important'), 'Collapsed filter smaller');
assert(!tight.includes('grid-template-columns:repeat(5'), 'Preserve existing responsive KPI column count');
assert(!tight.includes('#tab-knowledge'), 'Do not change Knowledge body');
assert(!tight.includes('#tab-analytics'), 'Do not change Overview body');
for(const rule of [
 '#dcm-activity-view-tabs .dcm-activity-view-btn.active',
 '#tab-survey .cm-survey-shell > .cm-survey-subtabs > button.cm-survey-subtab.active',
 '#cmAccessPanel .cm-ap-tabs [data-ap-tab].on',
 '.cm-ap-tabs [data-sr-tab].on'
])assert(nav.includes(rule),'All targeted menu sub-tabs missing: '+rule);
assert(nav.includes('linear-gradient(135deg,var(--dcm-44-subnav-active-start),var(--dcm-44-subnav-active-end))!important'));
assert(nav.includes('color:#FFFFFF!important'));
assert(nav.includes('.cm-cra-tab-count'),'CRA numeric indicator remains readable');
assert(!nav.includes('#tab-priority .cm-survey'), 'Existing approved Prioritas active styling untouched');
assert(!nav.includes('#tabNav'), 'Top-level nav untouched');
assert(!nav.includes('.prio-chip')&&!nav.includes('.prio-seg'),'Do not recolor filters as navigation');
assert(embedded.includes('body.cm-embedded .tp-live .seg.tabs2 [data-view].on'));
assert(embedded.includes('linear-gradient(135deg,#17477E,#0E3066)!important'));
assert(embedded.includes('stroke:currentColor!important'));
for(const key of ['dcm-priority-density-44.css?v=261114-44','dcm-secondary-navy-44.css?v=261114-44']){
 assert(app.includes(key),'Missing linked main stylesheet '+key);
}
assert(tp.includes('dcm-pusmantap-secondary-navy-44.css?v=261114-44'),'Embedded page must load its separate style');
for(const key of ['dcm-priority-collapsible-filter-43.css?v=261114-43','dcm-priority-original-mockup-40.css?v=261114-40']){
 assert(app.includes(key),'Existing approved Prioritas implementation retained');
}
assert(app.indexOf('dcm-priority-density-44.css?v=261114-44')>app.indexOf('dcm-priority-collapsible-filter-43.css?v=261114-43'), 'Density override ordered after earlier design');
assert(tp.indexOf('dcm-pusmantap-secondary-navy-44.css?v=261114-44')>tp.indexOf('dcm-navigation-pusmantap-all-25.css?v=261114-25'));
assert(app.includes('function renderPriority(){'), 'Business logic unchanged');
assert(app.includes("el.querySelector('#prioFilterToggle')?.addEventListener('click'"),'Filter controls retained');
assert(app.includes("el.querySelectorAll('[data-prio-kpi]').forEach"),'KPI drilldowns retained');
assert(tp.includes('data-view=')&&tp.includes('role="tablist"'),'Embedded staff submenu semantics retained');
console.log('PASS: Priority compact 86px cards; all active submenus navy; iframe tab colors; scoped CSS only; preserve existing handlers and responsive dimensions.');
