const fs=require('node:fs'),assert=require('node:assert/strict');
const css=fs.readFileSync('dcm-primary-nav-justify-33.css','utf8');
const index=fs.readFileSync('index.html','utf8');
const header=fs.readFileSync('dcm-header-reference-30.js','utf8');
const main=fs.readFileSync('dcm-approved-navigation.css','utf8');
const all=fs.readFileSync('dcm-navigation-all-menus-25.css','utf8');
const nav=index.slice(index.indexOf('<nav class="tabs" id="tabNav">'),index.indexOf('</nav>',index.indexOf('<nav class="tabs" id="tabNav">'))+6);
const names=['analytics','table','tasks','knowledge','survey','priority','contact','resource','pusmantap'];
for(const name of names){
  assert(nav.includes('data-tab="'+name+'"'),'Main navigation tab still exists: '+name);
}
assert(nav.includes('id="cmContextHelp"'),'Original contextual manual button preserved in markup');
assert(css.includes('#tabNav #cmContextHelp{')&&css.includes('display:none!important'),'Duplicate help is hidden visually');
assert(header.includes('dcmRefHelp')&&header.includes('cmOpenContextHelp'),'Header context help is still functional');
assert(header.includes('dcmRefBook')&&header.includes('cmOpenUserManual'),'Header user manual still functional');
assert(css.includes('justify-content:space-between!important'));
assert(css.includes('flex:1 1 0%!important'),'Equal width allocation for each visible tab');
assert(css.includes('flex-grow:1!important'),'Active tab also expands');
assert(css.includes('border-left:0!important'),'No legacy separators distort equal card widths');
assert(css.includes('box-sizing:border-box!important'),'Tab width including padding remains proportional');
assert(css.includes('display:none!important')&&css.includes('.tab-btn.hidden'),'Role restrictions remain applied');
assert(css.includes('overflow-x:auto!important')&&css.includes('flex:0 0 126px!important'),'Narrow view can scroll equal-width tabs');
assert(css.includes('flex:0 0 112px!important'),'Small phones get equally-sized compact tabs');
assert(main.includes('var(--dcm-nav-gold)'),'Approved active icon colors remain');
assert(all.includes('[aria-hidden="true"]'),'Role visibility remains protected');
for(const token of ['background:#092B60','background:#FDB913','onclick=','onClick=','window.fbAuth','fbUpdateDoc','textContent=','classList.toggle']){
  assert(!css.includes(token),'Unwanted functional/color change: '+token);
}
assert.equal((css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length,'CSS braces must balance');
console.log('PASS 9 main menus, equal width including active, no duplicate help, desktop justify, mobile scroll, permissions and header help');
