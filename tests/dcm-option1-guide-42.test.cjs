const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const app=fs.readFileSync('index.html','utf8');
const guide=fs.readFileSync('dcm-guide-header.js','utf8');
const css=fs.readFileSync('dcm-priority-filter-option1-42.css','utf8');
new vm.Script(guide,{filename:'dcm-guide-header.js'});
const priority=app.slice(app.indexOf('function renderPriority(){'),app.indexOf('/* ---------- Form proyek ---------- */'));
const snap=app.slice(app.indexOf('function prioSnapBarHtml(can){'),app.indexOf('function prioSnapDelta(',app.indexOf('function prioSnapBarHtml(can){')));
assert(snap.includes('id="prioSnapSave"'));
assert(snap.includes('class="prio-snapshot-help"'));
assert(snap.includes('class="prio-snapshot-popover"'));
assert(snap.includes('40 snapshot terbaru'));
assert(snap.includes('Bukan backup aplikasi dan tidak mengubah proyek'));
assert(app.includes('function prioSnapData(){const {rows}=prioCompute({normMode:'));
assert(app.includes('function prioMakeSnapshot(label,type)'));
assert(app.includes("prioState.snapshots=(prioState.snapshots||[]).concat([sn]).slice(-40)"),'Real 40-item snapshot retention remains');
assert(priority.includes('class="prio-filter-panel'), 'Original Opsi 1 filter panel retained, with optional collapsed-state class');
assert(priority.includes('class="prio-filter-head"'));
assert(priority.includes('class="prio-toolbar"'));
assert(priority.includes('class="prio-snapbar"')||priority.includes('prioSnapBarHtml(can)'));
assert(priority.includes('class="prio-warn-bar"'));
for(const v of ['#tab-priority .prio-filter-panel > .prio-filter-head','#tab-priority .prio-filter-panel > .prio-scope','#tab-priority .prio-filter-panel > .prio-toolbar','#tab-priority .prio-filter-panel > .prio-snapbar','#tab-priority .prio-filter-panel > .prio-warn-bar','.prio-snapshot-help','.prio-snapshot-popover']){
  assert(css.includes(v),'Opsi 1 visual hierarchy missing '+v);
}
assert(css.includes('grid-template-columns:minmax(190px,1.6fr) minmax(395px,2.65fr) max-content max-content!important'));
assert(css.includes('background:linear-gradient(105deg,#0B2A5C,#153A75 72%,#123568)!important'));
assert(css.includes('@media(max-width:800px)'),'Responsive layout not present');
assert(!css.includes('#tab-knowledge')&&!css.includes('#appHeader')&&!css.includes('#tab-survey'),'CSS must be Prioritas-only');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Balanced CSS');
const tabs=guide.slice(guide.indexOf('var TABS={'),guide.indexOf('var ACTIONS={'));
for(const k of ['analytics','table','tasks','calendar','kanban','matrix','knowledge','survey','priority','contact','resource','pusmantap']){
  assert(tabs.includes(k+':['),'Missing meaningful main menu guide '+k);
}
assert(guide.includes('var PRIORITY_SUBTABS={')&&guide.includes('var PRIORITY_KPIS={'));
assert(guide.includes('Menyimpan skor, peringkat, kategori prioritas'));
assert(guide.includes('CRA menunjukkan persepsi responden'));
assert(guide.includes('return null;'),'Unknown Guide action must not produce tautological fake instructions');
assert(!guide.includes("return ['Membuka bagian '+label"));
assert(!guide.includes("return ['Membuka atau menjalankan fitur '+label"));
assert(guide.includes('if(!spec)return;'));
assert(app.includes("priority:'priority-projects',pusmantap:'tim-pusmantap'"));
for(const id of ['priority-projects','priority-criteria','priority-monev','priority-references','priority-snapshot','tim-pusmantap']){
 assert(app.includes("id:'"+id+"'"),'Manual article missing '+id);
}
assert(app.includes("if(tab==='priority'){const key=typeof prioUi"),'Context help routes to submenus');
assert(app.includes("const CM_MANUAL_OPERATIONAL_LIMITS={"));
const notes=app.slice(app.indexOf('const CM_MANUAL_OPERATIONAL_LIMITS={'),app.indexOf('CM_USER_MANUAL_ARTICLES.forEach(article=>{const limit=',app.indexOf('const CM_MANUAL_OPERATIONAL_LIMITS={')));
const ids=['getting-started','overview','activities','today-calendar','workboard','matrix','knowledge','cra-create','cra-share-qr','cra-answer','cra-analytics','cra-action-plan','cra-rounds-version','cra-question-bank','squad','resource','backup','ai-assistant','activity-auto-status','crud-guide','ai-reference-library','reminders','whats-new','reports-export','report-compilation','chart-explanations','guest-access','user-access-admin','schedule-request','cm-team-tasks'];
for(const k of ids)assert(notes.includes("'"+k+"':{en:"),'Missing practical limits for '+k);
assert(app.includes('dcm-priority-filter-option1-42.css?v=261114-42'),'Chosen mockup stylesheet is linked');
assert(app.includes('dcm-guide-header.js?v=261114-42'),'Updated guide cache busted');
for(const action of ['#prioSnapSave','#prioCmpSnap','[data-prio-filter]','[data-prio-sort]','[data-prio-view]']){
 assert(priority.includes(action),'Original callback/data action remains '+action);
}
console.log('PASS Opsi 1 visual hierarchy, verified historical snapshot info, 12 main menu guides, 6 new manuals, all 30 existing manual limits, and original handlers.');
