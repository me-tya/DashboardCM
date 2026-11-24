'use strict';
/* 2026-11-24 — Referensi IKU, IKU terkait, WBS multi-tahapan, Kesimpulan Rapat, Ekspor IPR (selaras Modul Transformasi). */
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('activity-wbs.js','utf8'),ctx);const W=ctx.window.ActivityWBS;
test('WBS: checkbox + baris komponen/tahapan, PM & CM paralel, field lama terbaca',()=>{
 const f=W.flat([{wbsLevel4:'Manajemen Perubahan',wbsLevel5:'Analisis Dampak Perubahan'},{wbsLevel4:'Arsitektur Proses Bisnis',wbsLevel5:'Arsitektur Proses Bisnis Level 3 To Be'}]);
 assert.equal(f.wbsGroup,'CM');assert.equal(f.wbsItems.length,2);
 assert.ok(W.matches(Object.assign({tglMulai:'2026-08-12'},f),{wbsLevel5:'Arsitektur Proses Bisnis Level 3 To Be'},'tglMulai'));
 assert.equal(W.items({wbsGroup:'CM',wbsLevel4:'Manajemen Perubahan',wbsLevel5:'Asesmen Kesiapan Perubahan'}).length,1);
 assert.match(W.formHTML({}),/data-wbs-on/);assert.doesNotMatch(W.formHTML({}),/type="radio"/);
});
test('Form: IKU di Klasifikasi, Tahapan WBS bagian 3, Kesimpulan Rapat, Generate Laporan di kiri Simpan',()=>{
 assert.match(html,/sec\(P\.info,2,U\('Classification','Klasifikasi'\)[^\n]*DCMIKU\?\.formField/);
 assert.match(html,/sec\(P\.info,3,U\('WBS stages','Tahapan WBS'\)/);
 assert.match(html,/sec\(P\.info,4,U\('Letters','Dasar surat'\)/);assert.match(html,/sec\(P\.info,5,U\('Method','Metode'\)/);
 assert.match(html,/id:\['Kesimpulan Rapat','Dokumentasi & kesimpulan'\]/);
 assert.match(html,/sec\(P\.res,2,U\('Conclusion','Kesimpulan'\),'',\[row\('af-g3',\[rh,kd,tl\]\)\]\)/);
 assert.match(html,/name="kendala"/);
 assert.match(html,/saveBtn\.before\(rep\)/);assert.doesNotMatch(html,/id="afRepBox"/);
 assert.doesNotMatch(html,/wbs-mini-tag">\$\{ActivityWBS\.badge/,'label WBS tidak tampil di daftar aktivitas');
});
test('Menu & filter: tab Referensi IKU, filter IKU, data-ipr-export',()=>{
 assert.match(html,/data-tab="ikuref"/);assert.match(html,/id="tab-ikuref"/);
 assert.match(fs.readFileSync('dcm-guide-header.js','utf8'),/views=\['calendar','kanban','matrix','ikuref'\]/);
 assert.match(html,/DCMIKU\.matchFilter\(a,f\)/);assert.match(html,/<script src="dcm-iku-ipr\.js/);
});
test('DCMIKU: seed 2026, parser tempel, data IPR per TW (tanpa kegiatan batal)',()=>{
 const agendas=[
  {namaKegiatan:'T-Forum',tglMulai:'2026-02-03',unitPemohon:'DJKN',ikuRefs:['2a-N'],kendala:'Undangan terlambat',statusNorm:'Completed'},
  {namaKegiatan:'Batal',tglMulai:'2026-02-05',ikuRefs:['2a-N'],statusNorm:'Cancelled'},
  {namaKegiatan:'FGD',tglMulai:'2026-08-12',ikuRefs:['4a-CP','5a-N'],statusNorm:'Completed'}];
 const c={window:{},document:{addEventListener(){},querySelector(){return null}},localStorage:{getItem(){return null},setItem(){}},state:{agendas,filters:{}},uiText:(en,id)=>id,toast(){},setTimeout(){},console};
 vm.runInNewContext(fs.readFileSync('dcm-iku-ipr.js','utf8'),c);const I=c.window.DCMIKU;
 assert.equal(I.ref('2026').length,13);
 assert.deepEqual(JSON.parse(JSON.stringify(I.parsePaste('\t1a-CP\tTingkat Keberhasilan Transformasi Kemenkeu').map(x=>x.kode))),['1a-CP']);
 const D=I.iprData('2026');
 assert.equal(D.tw[0]['2a-N'].n,1);assert.match(D.tw[0]['2a-N'].tindakan,/^1\. 3 Feb 2026 — T-Forum \(DJKN\)$/);assert.match(D.tw[0]['2a-N'].kendala,/Undangan terlambat/);
 assert.equal(D.tw[2]['5a-N'].n,1);
 assert.ok(I.matchFilter(agendas[2],{iku:'4a-CP'}));assert.ok(!I.matchFilter(agendas[0],{iku:'4a-CP'}));
});
