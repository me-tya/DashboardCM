const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-priority-original-mockup-40.css','utf8');
const a=html.indexOf('function renderPriority(){');
const b=html.indexOf('/* ---------- Form proyek ---------- */',a);
assert(a>0&&b>a,'Original priority renderer present');
const render=html.slice(a,b);
new vm.Script(render,{filename:'renderPriority-user-mockup-40.js'});
for(const [needle,count] of [
 ['class="prio-title-group"',1],['class="prio-kpi-stage"',1],
 ['class="prio-filter-panel"',1],['class="prio-filter-head"',1],
 ['class="prio-kpis"',1],['class="prio-list"',1],
 ['data-prio-kpi=',5],['class="prio-kpi-symbol"',5]
]){
 const n=render.split(needle).length-1;
 assert.equal(n,count,needle+' count mismatch');
}
const order=[
 'class="prio-hero"',
 'class="prio-kpi-stage"',
 'class="cm-survey-subtabs prio-subtabs"',
 'class="prio-filter-panel"',
 'class="prio-list"'
];
for(let i=1;i<order.length;i++)assert(render.indexOf(order[i-1])<render.indexOf(order[i]),'Wrong mockup order '+order[i-1]+' -> '+order[i]);
assert(render.includes("uiText('Project Prioritization','Prioritas Proyek')"));
assert(render.includes("Pemeringkatan proyek transformasi berdasarkan kriteria, bobot, dan indikator manfaat."));
assert(render.includes("uiText('Ranking Filters','Filter Peringkat')"));
assert(render.includes("Tentukan lingkup untuk melihat dan meranking proyek."));
assert(render.includes("const prioKpisHtml="),'KPI cards must use computed live values');
assert(render.includes('const top=rows[0]')&&render.includes('const cnt={high:0,mid:0,low:0}'));
assert(render.includes("el.querySelectorAll('[data-prio-kpi]').forEach"),'Original KPI click behavior still attached');
assert(render.includes("el.querySelectorAll('[data-prio-tab]').forEach"),'Original submenu click behavior preserved');
assert(render.includes("el.querySelectorAll('[data-prio-filter]').forEach"),'Original filters remain');
for(const token of ['prioScopeBarHtml()','prioSnapBarHtml(can)','prioCapacityHtml(rows)','data-prio-detail','prioListHtml(rows,can)']){
 assert(html.includes(token),'Existing form/list/functionality retained '+token);
}
for(const token of [
 '#tab-priority .prio-page > .prio-hero',
 '#tab-priority .prio-page > .prio-hero > div.prio-title-group:first-child:has(h2)',
 '#tab-priority .prio-kpi-stage',
 '#tab-priority .prio-filter-panel',
 '#tab-priority .prio-filter-head',
 '#tab-priority .cm-survey-subtabs.prio-subtabs'
])assert(css.includes(token),'Required scoped style missing '+token);
assert(css.includes('background:linear-gradient(115deg,#0C2A5D 0%,#173C7D 62%,#174887 100%)!important'),'Navy KPI panel');
assert(css.includes('background:linear-gradient(120deg,#FFE985,#F6C344)!important'),'Gold first KPI card');
assert(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))!important'),'Five adjacent KPI cards');
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))!important'),'Four equal submenu tabs');
assert(css.includes('background:transparent!important'),'Inactive submenu strip is neutral');
assert(css.includes('border-left:1px solid #D3DEEF')===false,'Do not introduce uneven card widths');
assert(css.includes('display:flex!important'),'Title restored over old hidden rule');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
for(const token of ['#appHeader','.tabs-row','.topbar-actions','#tab-contact','#tab-knowledge']){
 assert(!css.includes(token),'Visual patch must not touch other areas: '+token);
}
console.log('PASS true approved mockup hierarchy: header -> navy KPI panel -> equal tabs -> separate filter -> rankings; live cards/handlers unchanged.');
