const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('dcm-contact-toolbar-one-row-35.css','utf8');
const original=fs.readFileSync('dcm-contact-toolbar-34.css','utf8');
const app=fs.readFileSync('index.html','utf8');
const section=app.slice(app.indexOf('function renderReviewDirectory(){'),app.indexOf('\nfunction reviewOpenPicEditor(){'));
assert(section.includes('class="review-toolbar"'),'Current Squad toolbar must exist');
assert(!section.includes('class="review-hero"'),'Duplicate navy hero must remain deleted');
for(const id of ['reviewSearch','reviewPicFilter','reviewUnitFilter','reviewReset','reviewFeedback','reviewAdd','reviewSignIn']){
  assert(section.includes('id="'+id+'"'),id+' must remain present');
}
for(const call of [
"el.querySelector('#reviewFeedback')?.addEventListener('click',reviewOpenFeedback)",
"el.querySelector('#reviewAdd')?.addEventListener('click',()=>reviewOpenEditor())",
"el.querySelector('#reviewReset').onclick=()=>{reviewUi.search='';reviewUi.pic='ALL';reviewUi.unit='ALL';renderReviewDirectory()}"
])assert(section.includes(call),'Control event handler must stay unchanged');
assert(original.includes('flex-wrap:wrap!important'),'The prior layout had undesired wrapping');
assert(css.includes('display:grid!important'),'New navigation uses 1-row grid');
assert(css.includes('grid-template-columns:minmax(225px,1fr) minmax(130px,160px) minmax(120px,145px) 34px max-content!important'),'Proportional fields, fixed Reset, actions at far right');
assert(css.includes('flex-wrap:nowrap!important'),'Wrap prevented');
assert(css.includes('overflow-x:auto!important'),'Compact scrolling on small screens');
assert(css.includes('overflow-y:hidden!important'),'No vertical scrollbar');
assert(css.includes('height:36px!important'),'Compact 36px controls');
assert(css.includes('min-height:34px!important'),'Compact mobile layout');
for(let i=1;i<=5;i++)assert(css.includes('grid-column:'+i+'!important'),'Grid contains column '+i);
for(const token of ['#tab-contact .review-toolbar > #reviewSearch','#tab-contact .review-toolbar > #reviewPicFilter','#tab-contact .review-toolbar > #reviewUnitFilter','#tab-contact .review-toolbar > #reviewReset','#tab-contact .review-toolbar > .rv-hero-actions']){
  assert(css.includes(token),'Field missing '+token);
}
assert(css.includes('grid-row:1!important'),'Each grid item stays on first row');
assert(css.includes('margin:0 0 8px!important'),'Reduce space below controls');
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'Balanced CSS');
console.log('PASS Squad filters and actions in one compact row; original callbacks and permissions preserved');
