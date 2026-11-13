// Regression: approved CRA compact nav and live active survey count.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-cra-compact-27.css','utf8');
const start=src.indexOf('function renderSurveyHub(){');
const end=src.indexOf('\nfunction renderSurveySubtab(){',start);
assert(start>0&&end>start,'renderSurveyHub block available');
const functionCode=src.slice(start,end);
const root={innerHTML:'',querySelectorAll(){return []}};
const help={addEventListener(){}};
const state={
 surveys:[...Array.from({length:4},(_,i)=>({id:'s'+i,status:'active'})),{id:'h',status:'closed'}],
 counts:{a:6},subtab:'active',selectedSurveyId:'',uiFilters:{}
};
let writable=true,logged=true;
const ctx={
 document:{getElementById(id){return id==='tab-survey'?root:id==='cmCraContextHelp'?help:null}},
 isLoggedIn:()=>logged,
 cmEnsureSurveyListener:()=>{},
 cmCanMutate:()=>writable,
 cmSurveyState:state,
 uiText:(_en,id)=>id,
 renderSurveySubtab:()=>{},
 cmManualArticleForContext:()=>({}),
 cmOpenUserManual:()=>{},
 cmResetBuilder:()=>{}
};
vm.createContext(ctx);
vm.runInContext(functionCode+'\nthis.run=renderSurveyHub;',ctx,{filename:'CRA render'});
ctx.run();
assert.match(root.innerHTML,/data-cm-subtab="active"[^>]*>Survei Aktif<span class="cm-cra-tab-count">4<\/span><\/button>/);
assert(!root.innerHTML.includes('cm-mini-stat'),'No three obsolete KPI cards');
assert(!root.innerHTML.includes('cm-survey-hero-stat'),'No KPI layout placeholder');
assert(!root.innerHTML.includes('<div class="cm-survey-hero">'),'No redundant header');
assert(root.innerHTML.includes('data-cm-subtab="analytics"'));
assert(root.innerHTML.includes('data-cm-subtab="history"'));
assert(root.innerHTML.includes('id="cmCraContextHelp"'));
assert(root.innerHTML.includes('data-cm-subtab="create"'),'Editable survey tab remains');
state.surveys.push({id:'s4',status:'active'});
ctx.run();
assert.match(root.innerHTML,/Survei Aktif<span class="cm-cra-tab-count">5<\/span>/,'Count is data-derived');
writable=false;ctx.run();
assert(!root.innerHTML.includes('data-cm-subtab="create"'),'Role permissions retained');
assert.match(root.innerHTML,/Survei Aktif<span class="cm-cra-tab-count">5<\/span>/);
logged=false;ctx.run();
assert(root.innerHTML.includes('Login admin diperlukan'),'Guest login note retained');
assert(!root.innerHTML.includes('cm-cra-tab-count'),'No restricted data shown on public guest login');
for(const needle of ['#appHeader.topbar','min-height:84px!important','padding:5px 22px 8px!important',
'height:45px!important','height:36px!important','#tab-survey .cm-survey-subtabs .cm-cra-tab-count',
'#tab-survey .cm-survey-subtabs #cmCraContextHelp'])assert(css.includes(needle),needle);
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Balanced CSS');
const old=fs.readFileSync('dcm-approved-navigation.css','utf8');
assert(old.includes('#dcm-activity-view-tabs'),'Agenda original tab styles preserved');
console.log('PASS: CRA cards gone, count is dynamic, permissions intact, guest state, 45/36 px nav and proportional header');
