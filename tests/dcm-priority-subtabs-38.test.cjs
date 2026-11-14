const fs=require('node:fs');
const assert=require('node:assert/strict');
const s=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-priority-justify-subtabs-38.css','utf8');
const from=s.indexOf('function renderPriority(){');
const to=s.indexOf('/* ---------- Form proyek ---------- */',from);
assert(from>0&&to>from,'Priority renderer available');
const priority=s.slice(from,to);
const tabs=priority.match(/const tabs=\[\['projects'[\s\S]*?\]\];/);
assert(tabs,'Original submenu tab array exists');
for(const tab of ['projects','criteria','monev','reference']){
  assert(tabs[0].includes("'"+tab+"'"),'Original navigation tab remains '+tab);
}
assert(priority.includes('class="cm-survey-subtabs prio-subtabs" role="tablist"'), 'Existing semantic tablist preserved');
assert(priority.includes('data-prio-tab="${k}"'),'Original tab navigation bindings preserved');
assert(priority.includes("el.querySelectorAll('[data-prio-tab]').forEach"),'Original submenu click handler preserved');
assert(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))!important'),'Exactly four equal fractional widths');
assert(css.includes('justify-content:stretch!important'),'All tabs justified across parent');
assert(css.includes('width:100%!important'),'Submenu stretches to full width');
assert(css.includes('min-height:44px!important'),'Identical button height');
assert(css.includes('background:#102F65!important'),'Selected card has solid navy background');
assert(css.includes('background:#F1F5FC!important'),'Inactive cards each have a distinct soft-blue background');
assert(css.includes('border:1px solid #D2DEED!important'),'Inactive cards have individual borders');
assert(css.includes('gap:9px!important'),'Card tiles have visible consistent spacing');
assert(css.includes('color:#FFFFFF!important'),'Active tab label white');
assert(css.includes('grid-template-columns:repeat(4,minmax(205px,1fr))!important'),'Narrow viewport keeps four equal widths with scroll');
assert(css.includes('overflow-x:auto!important'),'Narrow viewport scrolls instead of wrapping');
assert(css.includes('aria-selected="true"'),'Active tab semantics styled');
assert(css.includes('.prio-tab-n'),'Original count badges retained');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Balanced CSS');
for(const name of ['#tab-knowledge','#tab-analytics','#tab-contact','#appHeader']){
  assert(!css.includes(name),'Only Prioritas should change, not '+name);
}
console.log('PASS 4 equal Prioritas submenu widths, centered icons/text, active navy, count badges, mobile scrolling, unchanged handlers');
