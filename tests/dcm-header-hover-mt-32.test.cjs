const fs=require('node:fs');
const assert=require('node:assert/strict');
const css=fs.readFileSync('dcm-header-hover-mt-32.css','utf8');
const original=fs.readFileSync('dcm-header-reference-30.css','utf8');
const js=fs.readFileSync('dcm-header-reference-30.js','utf8');
const app=fs.readFileSync('index.html','utf8');
function body(selector) {
  const at=css.indexOf(selector);
  assert(at>=0, 'Required MT-matched selector missing: '+selector);
  const open=css.indexOf('{',at),close=css.indexOf('}',open);
  assert(open>at && close>open);
  return css.slice(open+1,close);
}
function has(rule,decl) { assert(rule.includes(decl), 'Missing CSS value '+decl); }
const help=body('#appHeader .topbar-actions.dcm-reference-toolbar-30 .dcm-ref-icon:focus-visible');
has(help,'background:#FFFFFF!important');has(help,'color:#102C4E!important');
has(help,'box-shadow:none!important');has(help,'transform:none!important');
const bell=body('#appHeader .topbar-actions.dcm-reference-toolbar-30 #btnReminderCenter.has-notifications:hover');
has(bell,'background:#FDB913!important');has(bell,'color:#102C4E!important');
has(bell,'box-shadow:none!important');
const bellSvg=body('#appHeader .topbar-actions.dcm-reference-toolbar-30 #btnReminderCenter:focus-visible svg *');
has(bellSvg,'fill:#102C4E!important');has(bellSvg,'stroke:#102C4E!important');
const guide=body('#appHeader .topbar-actions.dcm-reference-toolbar-30 #cmGuideToggle:focus-visible');
has(guide,'background:transparent!important');has(guide,'color:#FFFFFF!important');
const bellBadge=body('#appHeader .topbar-actions.dcm-reference-toolbar-30 #btnReminderCenter:focus-visible .cm-reminder-badge:not(.hidden)');
has(bellBadge,'border-color:#FDB913!important');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'CSS braces balanced');
for(const token of ['padding:','height:36px','width:36px','grid-template','display:none!important','position:','userAvatar','btnLangToggle','authPill']) {
  assert(!css.includes(token),'Hover color file should not modify layout/actions: '+token);
}
for(const token of ['dcmRefHelp','dcmRefBook','btnReminderCenter','cmGuideToggle','dcmRefAvatarTrigger']) {
  assert(js.includes(token),'Existing interactive header control is retained: '+token);
}
assert(original.includes('dcm-ref-icon:hover'),'Original header styles retained');
assert(app.includes('dcm-header-reference-30.css?v=261114-30'),'Previous header design unchanged');
console.log('PASS matched hover: white/navy help and guidebook, gold/navy bell, transparent Guide; no layout or action changes');
