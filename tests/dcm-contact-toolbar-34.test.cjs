const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const s=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('dcm-contact-toolbar-34.css','utf8');
const fnStart=s.indexOf('function renderReviewDirectory(){');
const fnEnd=s.indexOf('\nfunction reviewOpenPicEditor(){',fnStart);
assert(fnStart>=0&&fnEnd>fnStart,'Squad review directory renderer exists');
const renderer=s.slice(fnStart,fnEnd);
new vm.Script(renderer,{filename:'renderReviewDirectory.js'});
const start=renderer.indexOf('el.innerHTML='+String.fromCharCode(96)+'<section class="review-dir">');
const end=renderer.indexOf('<div class="review-layout">',start);
assert(start>=0&&end>start,'Squad review markup exists');
const bar=renderer.slice(start,end);
assert(!bar.includes('class="review-hero"'),'Redundant navy banner is removed entirely');
assert(!bar.includes('Kontak PMO & CMO'),'No duplicate title remains before filters');
assert(bar.includes('<div class="review-toolbar">'),'Single toolbar remains');
for(const id of ['reviewSearch','reviewPicFilter','reviewUnitFilter','reviewReset','reviewFeedback','reviewAdd','reviewSignIn']){
  assert.equal((bar.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Control reused exactly once '+id);
}
const offsets=['reviewSearch','reviewPicFilter','reviewUnitFilter','reviewReset','reviewFeedback','reviewAdd'].map(k=>bar.indexOf('id="'+k+'"'));
assert(offsets.every((n,i)=>n>=0&&(!i||n>offsets[i-1])),'Toolbar order search/PIC/unit/reset/Feedback/Add');
assert(bar.includes('class="rv-hero-actions"'),'Feedback and Add grouped on the far right');
assert(bar.includes('class="btn btn-sm cm-fb-btn rv-fb-btn"'),'Feedback retains its original styled button');
assert(bar.includes('reviewFeedbackItems().reduce('),'Feedback badge still derives from data');
assert(bar.includes('cmCanMutate()?'),'Permissions check for Add retained');
assert(bar.includes('type="button" class="btn btn-outline btn-sm rv-reset-icon" id="reviewReset"'),'Reset remains clickable icon control');
assert(bar.includes('title="')&&bar.includes('aria-label="'),'Reset has tooltip and aria label');
assert(!bar.includes('>Reset</button>'),'Reset text removed from display');
for(const hook of ["el.querySelector('#reviewFeedback')?.addEventListener('click',reviewOpenFeedback)",
"el.querySelector('#reviewAdd')?.addEventListener('click',()=>reviewOpenEditor())",
"el.querySelector('#reviewSignIn')?.addEventListener('click'",
"el.querySelector('#reviewReset').onclick=()=>{reviewUi.search='';reviewUi.pic='ALL';reviewUi.unit='ALL';renderReviewDirectory()}"]){
  assert(renderer.includes(hook),'Existing action/callback preserved: '+hook);
}
assert(css.includes('#tab-contact .review-toolbar > .rv-hero-actions'));
assert(css.includes('margin:0 0 0 auto!important'));
assert(css.includes('#tab-contact .review-toolbar > #reviewReset::before'));
assert(css.includes('width:40px!important'),'Icon-only Reset width');
assert(css.includes('@media(max-width:1350px)')&&css.includes('@media(max-width:650px)'),'Responsive support');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Balanced CSS');
console.log('PASS Squad banner removed, compact toolbar order, permissions, Reset icon, original handlers and responsive CSS');
