'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const root=process.cwd(),base='https://me-tya.github.io/DashboardCM/';
class Loader extends ResourceLoader{
 fetch(url){
  const u=new URL(url);if(!u.href.startsWith(base))return null;
  const p=path.join(root,decodeURIComponent(u.pathname.slice('/DashboardCM/'.length)));
  if(!p.startsWith(root+path.sep)||!fs.existsSync(p))return null;
  return Promise.resolve(fs.readFileSync(p));
 }
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const errors=[],vc=new VirtualConsole();
 vc.on('error',(...a)=>errors.push(a.join(' ')));vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync('tim-pusmantap-mt.html','utf8'),{
  url:base+'tim-pusmantap-mt.html',resources:new Loader(),runScripts:'dangerously',
  pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){w.confirm=()=>true;w.ResizeObserver=undefined;w.HTMLElement.prototype.scrollIntoView=function(){}}
 });
 const w=dom.window;
 await new Promise((res,rej)=>{w.addEventListener('load',res,{once:true});setTimeout(()=>rej(new Error('App scripts did not load')),20000)});
 const people=Array.from({length:25},(_,i)=>({n:'Pegawai '+String(i+1).padStart(2,'0'),nip:'19850101201601'+String(i).padStart(4,'0'),jab:'Analis',jenis:'Definitif',status:'WFO',wfhDays:[5],foto:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ'}));
 const teamNames=['Tim CM','Tim DCS','Tim SPP','Tim SSB','Tim DOA'];
 const pt={};people.forEach((p,i)=>pt[p.n]=teamNames[i%5]);
 const kp={tims:teamNames,pt,ptx:{},asg:{DJP:[people[0].n,people[1].n],DJA:[people[2].n]},rl:{},str:{},stp:{},tem:{},prog:{}};
 const contacts=Array.from({length:50},(_,i)=>({id:'cfg-kp-unit-'+i,kind:'cfg',kp:{nama:'Kontak '+i,unit:i%2?'DJP':'DJA',nip:'19900101201801'+String(i).padStart(4,'0'),peran:['pmo']}}));
 const snapshot={source:'dcm-tim-pusmantap',type:'snapshot',today:'2026-11-15',canEdit:true,
  resources:[],activities:[],manual:{members:[],teams:{},structural:{},mtState:{docs:[
   {id:'cfg-master',kind:'cfg',master:{pic:people}},
   {id:'cfg-kp',kind:'cfg',kp},...contacts
  ],ui:{t2v:'profil',t2pv:'orang',t2pum:'pic',mtProfilesAuthoritative:true}}},
  role:'superadmin',email:'qa@example.test',user:'QA'};
 w.dispatchEvent(new w.MessageEvent('message',{source:w.parent,origin:w.location.origin,data:snapshot}));
 await delay(130);
 const doc=w.document,click=s=>{const e=doc.querySelector(s);assert(e,'missing '+s);e.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
 // Profil Individu: tampilan & baris filter bawaan Modul Transformasi
 const tabs=[...doc.querySelectorAll('#t2 .t-pvs [data-tpv]')].map(b=>b.textContent.replace(/\d+$/,'').trim());
 assert.deepEqual(tabs,['Profil Individu','Pegawai sementara','Pendampingan Unit'],'tab order/labels '+tabs);
 assert.equal(doc.querySelectorAll('#t2 .tm-bar').length,1,'native one-row filter bar');
 assert(doc.querySelector('.tm-bar [data-tmteam]')&&doc.querySelector('.tm-bar [data-tmq]'),'team dropdown + search in bar');
 assert(doc.querySelector('.tm-list .tm-p.tm-pc2'),'compact list cards');
 assert(doc.querySelector('.tm-right .tm-hero'),'navy detail header');
 assert(doc.querySelector('#t2 .t-pvw #mt-import-profiles'),'DCM import button kept in tab row');
 for(const t of ['c','a','u']){click('[data-act="tmDt"][data-v="'+t+'"]');await delay(30)}
 assert(doc.querySelector('.tm-dtabs button.on[data-v="u"]'),'detail tabs work');
 // Form Ubah profil per langkah + zona impor ringkas
 click('[data-act="tmEdit"]');await delay(60);
 assert.equal(doc.querySelectorAll('.tm-wzt [data-wz]').length,3,'3-step profile form');
 assert(doc.querySelector('.ov #tm-drop.imz'),'compact screenshot import zone');
 assert.equal(typeof w.impZone,'function','impZone helper available');
 doc.querySelectorAll('.ov').forEach(o=>o.remove());
 // Pendampingan Unit: baris filter bawaan (Lihat dari · Tim · Cari)
 click('[data-tpv="unit"]');await delay(60);
 assert.equal(doc.querySelectorAll('#t2 .t-pubar').length,1,'native unit toolbar');
 assert(!doc.querySelector('.dcm-pu-toolbar'),'no duplicate legacy toolbar');
 assert(doc.querySelector('.t-pubar .t-fg-pri [data-tpum="pic"] input:checked'),'Lihat dari radio');
 click('[data-tpum="unit"]');await delay(60);
 assert(doc.querySelector('.t-pubar [data-tpum="unit"] input:checked'),'switch to unit view');
 click('[data-tunitset]');await delay(60);
 assert(doc.querySelectorAll('.upf-c').length>0,'clustered pendamping picker');
 doc.querySelectorAll('.ov').forEach(o=>o.remove());
 // Bandingkan Profil & Foto memakai zona impor ringkas
 click('#mt-import-profiles');await delay(60);
 assert(doc.querySelector('.cmp50 .imz #cmp-file'),'compare modal uses compact import zone');
 assert(!errors.some(e=>/ReferenceError|TypeError|SyntaxError|Uncaught/.test(e)),'runtime error '+errors.join(' | '));
 assert.equal(w.S.oneonone.find(d=>d.id==='cfg-master').master.pic.length,25,'no data modified');
 console.log('PASS dcm-mt-sync-60');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
