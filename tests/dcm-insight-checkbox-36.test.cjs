const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-insight-checkbox-36.css','utf8');
const first=source.indexOf('/* ---------- Penjelasan grafik: buka/tutup per grafik ---------- */');
const last=source.indexOf('/* Narasi grafik CRA */',first);
assert(first>0&&last>first,'Narration feature source present');
const block=source.slice(first,last);
const eventHandlers={};
const saved={};
const storage={getItem:k=>Object.prototype.hasOwnProperty.call(saved,k)?saved[k]:null,setItem:(k,v)=>saved[k]=String(v)};
function narr(key){
  let closed=false;
  const title={setAttribute(name,val){this[name]=val}};
  const preview={textContent:''};
  const description={textContent:'This description is generated from chart data. Additional details.'};
  const wrap={
    dataset:{narrKey:key},
    classList:{toggle(name,on){if(name==='closed')closed=!!on},contains(name){return name==='closed'&&closed}},
    querySelector(selector){
      return selector==='.chart-narr'?description:selector==='.narr-head'?title:selector==='.narr-peek'?preview:null;
    },
    closest(selector){return selector==='.tab-panel'?panel:null}
  };
  return wrap;
}
let wraps;
const checkbox={
  checked:false,indeterminate:false,
  matches(selector){return selector==='[data-narr-toggle-all]'},
  closest(selector){return selector==='.tab-panel'?panel:null}
};
const bar={
  closest(selector){return selector==='.tab-panel'?panel:null},
  querySelector(selector){return selector==='[data-narr-toggle-all]'?checkbox:null}
};
const panel={
  querySelectorAll(selector){
    if(selector==='.narr-wrap')return wraps;
    if(selector==='.narr-all')return [bar];
    return [];
  }
};
wraps=[narr('ov-trend'),narr('ov-status'),narr('ov-category')];
const document={
  addEventListener(name,fn){eventHandlers[name]=fn},
  querySelectorAll(selector){
    if(selector==='.narr-wrap')return wraps;
    if(selector==='.narr-all')return [bar];
    return [];
  }
};
const context={document,localStorage:storage,uiText:(en,id)=>id};
vm.createContext(context);
vm.runInContext(block,context);
const html=context.cmNarrToolbar();
assert(html.includes('<label class="cm-narr-all-check">'),'Checkbox label matches MT');
assert(html.includes('type="checkbox" data-narr-toggle-all'),'One real checkbox');
assert(html.includes('Tampilkan semua penjelasan'),'Indonesian label');
assert(!html.includes('data-narr-all="open"')&&!html.includes('data-narr-all="close"'),'Old two buttons removed');
assert.equal((html.match(/type="checkbox"/g)||[]).length,1,'Exactly one global checkbox');
assert(eventHandlers.change&&eventHandlers.click,'Checkbox change + chart click both delegated');
context.cmNarrSync(document);
assert.equal(checkbox.checked,true,'All-open defaults to checked');
assert.equal(checkbox.indeterminate,false);
checkbox.checked=false;
eventHandlers.change({target:checkbox});
assert(wraps.every(w=>w.classList.contains('closed')),'Unchecking closes every description');
assert.equal(checkbox.checked,false);
assert.equal(checkbox.indeterminate,false);
assert.equal(Object.keys(JSON.parse(saved.cmNarrCollapsed)).length,3,'Original localStorage persistence unchanged');
checkbox.checked=true;
eventHandlers.change({target:checkbox});
assert(wraps.every(w=>!w.classList.contains('closed')),'Checking opens every description');
assert.equal(Object.keys(JSON.parse(saved.cmNarrCollapsed)).length,0);
const firstWrap=wraps[0];
const head={closest(selector){return selector==='.narr-wrap'?firstWrap:null}};
eventHandlers.click({target:{closest(selector){return selector==='.narr-head'?head:null}}});
assert(firstWrap.classList.contains('closed'),'Individual chart toggle still works');
assert.equal(checkbox.indeterminate,true,'Mixed chart state is indeterminate like MT');
assert.equal(checkbox.checked,false,'Partial opening is not falsely marked all checked');
context.cmNarrSync(document);
assert.equal(checkbox.indeterminate,true,'Sync maintains mixed state after chart refresh');
assert(css.includes('accent-color:var(--navy-800,#12275A)'),'Checkbox matches navy accent');
assert(css.includes('width:16px!important')&&css.includes('border-radius:999px'),'Checkbox and pill size match MT');
assert(css.includes('#tab-analytics .narr-all > .cm-narr-all-check'),'Scoped to Overview');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS balanced');
console.log('PASS Insight checkbox UI, show/hide all, per-chart toggle, mixed/indeterminate, saved state and MT visual style.');
