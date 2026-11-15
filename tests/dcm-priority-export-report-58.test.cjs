'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process'),vm=require('node:vm');
const baseline='92b7481f7ca343c90211cbc45e97f55054f42b34';
const old=cp.execFileSync('git',['show',baseline+':index.html'],{encoding:'utf8',maxBuffer:12*1024*1024});
const now=fs.readFileSync('index.html','utf8');
const top='<button class="btn btn-outline btn-sm prio-btn-light" id="prioExport" ${prioState.projects.length?\'\':\'disabled\'}>${iconDownload()} Excel</button><button class="btn btn-outline btn-sm prio-btn-light" id="prioReport" ${prioState.projects.length?\'\':\'disabled\'}>📄 ${uiText(\'Report\',\'Laporan\')}</button>';
const bottom='<button type="button" class="btn btn-outline btn-sm" id="prioExport2" ${prioState.projects.length?\'\':\'disabled\'}>${iconDownload()} Excel</button></div>';
const moved='<button type="button" class="btn btn-outline btn-sm" id="prioExport2" ${prioState.projects.length?\'\':\'disabled\'}>${iconDownload()} Excel</button><button type="button" class="btn btn-outline btn-sm" id="prioReport" ${prioState.projects.length?\'\':\'disabled\'}>📄 ${uiText(\'Report\',\'Laporan\')}</button></div>';
function once(input,from,to,label){
 assert.equal(input.split(from).length-1,1,label+' should have exactly one match');
 return input.replace(from,to);
}
let expected=old;
expected=once(expected,top,'','remove duplicate top buttons');
expected=once(expected,bottom,moved,'move Report beside lower Excel');
expected=once(expected,"el.querySelector('#prioExport')?.addEventListener('click',prioExportExcel);",'','remove upper handler');
expected=once(expected,"document.querySelectorAll('#prioExport,#prioExport2')","document.querySelectorAll('#prioExport2')",'remove upper busy state');
assert.equal(now,expected,'Only four requested priority-control changes allowed in index');
assert(!now.includes('id="prioExport"'),'upper Excel absent');
assert.equal(now.split('id="prioExport2"').length-1,1,'lower Excel exactly once');
assert.equal(now.split('id="prioReport"').length-1,1,'Report exactly once');
assert(now.includes(moved),'lower Excel and Report share toolbar');
assert(now.includes("el.querySelector('#prioExport2')?.addEventListener('click',prioExportExcel);"),'retained Excel callback');
assert(now.includes("el.querySelector('#prioReport')?.addEventListener('click',prioOpenReport);"),'moved Report callback');
assert(now.includes('class="btn btn-gold btn-sm" id="prioAdd"'),'gold main CTA unchanged');
let checked=0;
for(const match of now.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
 const attrs=match[1]||'',script=match[2]||'';
 if(!script.trim()||/\bsrc\s*=/i.test(attrs)||/type\s*=\s*["'](?:module|application\/(?:json|ld\+json))["']/i.test(attrs))continue;
 new vm.Script(script,{filename:'index-inline-'+(++checked)+'.js'});
}
assert(checked>2,'inline script validation ran');
console.log('PASS: one Excel, report moved beside it, gold unchanged, scripts syntactically valid ('+checked+')');
