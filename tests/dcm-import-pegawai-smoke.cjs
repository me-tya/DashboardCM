const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const parserSrc=fs.readFileSync('dcm-pusmantap-import.js','utf8');
const browser={};const sandbox={window:browser,document:{},console,Promise,Intl,Array,Object,Map,Set,Date,Error};
vm.createContext(sandbox);vm.runInContext(parserSrc,sandbox,{filename:'dcm-pusmantap-import.js'});
const imp=browser.cmTpImport;
assert(imp,'Import parser should be exposed to iframe');
function plain(x){return JSON.parse(JSON.stringify(x))}
const json=imp.parseJson(JSON.stringify({kind:'cm-dashboard-backup',version:3,resources:[
 {nama:'Rina Setiawati',nip:'198501012010012001',jabatan:'Analis',unit:'Pusmantap',peran:'Ketua Tim',jenisKepegawaian:'Pegawai',team:'Tim DCS'},
 {nama:'Johan Pandu Asa',status:'aktif',jabatan:'Analis',jenis:'Secondment',tim:'CM'}
]}));
assert.equal(json.length,2);assert.equal(json[0].name,'Rina Setiawati');assert.equal(json[0].nip,'198501012010012001');assert.equal(json[0].team,'DCS');
assert.equal(json[1].jenis,'Secondment');assert.equal(json[1].team,'CM');
const json2=imp.parseJson(JSON.stringify([{name:'Putri Rahma',nip:'',job:'Staff',unit:'Pusmantap',team:'SPP',jenis:'Pegawai'}]));
assert.equal(json2[0].name,'Putri Rahma');assert.equal(json2[0].team,'SPP');
const excel=imp.parseMatrix([
 ['No','Nama Pegawai','NIP','Jabatan','Unit Kerja','Tim Utama','Jenis Kepegawaian'],
 [1,'Agus Putra','198801012010011001','Staff','Pusmantap','Tim DOA','Pegawai'],
 [2,'Mega Kusuma','','Magang','Pusmantap','CM','Magang Kemnaker']
]);
assert.equal(excel.length,2);assert.equal(excel[0].name,'Agus Putra');assert.equal(excel[0].team,'DOA');assert.equal(excel[1].jenis,'Magang Kemnaker');
const csv=imp.parseCsv('\uFEFFNama;NIP;Jabatan;Unit;Tim;Jenis Kepegawaian\n"Rosa Putri";;Analis;Pusmantap;SSB;Pegawai');
assert.equal(csv.length,1);assert.equal(csv[0].team,'SSB');
const ocr=imp.parseOcr('No Nama Jabatan Unit\n1. Sarah Khairina   Analis   Pusmantap   CM\n2. Dina Septiani   Analis   Pusmantap   DCS');
assert.equal(ocr.length,2);assert.equal(ocr[0].name,'Sarah Khairina');assert.equal(ocr[1].team,'DCS');
assert.equal(imp.normTeam('TIM SPP'),'SPP');
assert.throws(()=>imp.parseJson(JSON.stringify({foo:'bar'})),/tidak ditemukan/);
assert.throws(()=>imp.normalizeRows(Array.from({length:501},(_,i)=>({name:'Pegawai '+i}))),/500/);
console.log('PASS import parsing: DashboardCM JSON, array JSON, Excel header mapping, CSV, OCR, and row limits');

const bridgeSource=fs.readFileSync('dcm-pusmantap-bridge.js','utf8');
const listeners={},outgoing=[],store=new Map(),local=new Map();
const frameWindow={postMessage:m=>outgoing.push(m)};
const frame={contentWindow:frameWindow,addEventListener(){}};
const win={
 fbAuth:{currentUser:{isAnonymous:false}},fbDb:{},fbRunTransaction:async(db,fn)=>{
  const tx={get:async()=>({exists:()=>store.has('key'),data:()=>({value:store.get('key')})}),set:(ref,value)=>store.set('key',value.value)};
  return await fn(tx);
 },fbDoc:()=>({}),fbOnSnapshot:()=>()=>{},
 addEventListener:(name,fn)=>{listeners[name]=fn}
};
const userState={resources:[{id:'cm-1',nama:'Atitya Pritasari',nip:'198510101010101010',jabatan:'Katim',unit:'Pusmantap',peran:'CM'}],agendas:[]};
const localStorage={getItem:key=>local.get(key)||null,setItem:(key,val)=>local.set(key,val)};
const document={getElementById:key=>key==='cmTpFrame'?frame:null,readyState:'loading',addEventListener(){}};
const context={window:win,document,location:{origin:'https://dashboard.test'},
 state:userState,localStorage,console,Intl,Date,JSON,setTimeout:()=>1,setInterval:()=>1,
 cmCanMutate:()=>true,isLoggedIn:()=>true,cmGetAccessRole:()=> 'admin',
 getCurrentUserEmail:()=> 'test@example.test',cmCanReport:()=>true};
vm.createContext(context);vm.runInContext(bridgeSource,context,{filename:'dcm-pusmantap-bridge.js'});
async function request(entries,mode,id){
 await listeners.message({origin:'https://dashboard.test',source:frameWindow,data:{
  source:'dcm-tim-pusmantap',type:'mutation',requestId:id,action:'members-import',data:{entries,mode}
 }});
 const response=outgoing.find(x=>x.requestId===id);
 assert(response&&response.ok,JSON.stringify(response));
 return response.stats;
}
(async()=>{
 let stats=await request([
  {name:'Bella Kurnia',nip:'199010101010101010',job:'Analis',unit:'Pusmantap',team:'DCS',jenis:'Pegawai'},
  {name:'Atitya Pritasari',nip:'198510101010101010',job:'Should not overwrite',unit:'Other',team:'SSB',jenis:'Pegawai'}
 ],'skip','a');
 assert.equal(stats.added,1);assert.equal(stats.skipped,1);
 let manual=JSON.parse(store.get('key'));
 assert.equal(manual.members.length,1);assert.equal(manual.members[0].name,'Bella Kurnia');
 assert.equal(manual.teams['Atitya Pritasari'],undefined);
 stats=await request([
  {name:'Bella Kurnia',nip:'199010101010101010',job:'Analis Senior',unit:'Pusmantap',team:'SPP',jenis:'Pegawai'},
  {name:'Atitya Pritasari',nip:'198510101010101010',job:'Should not overwrite',unit:'Other',team:'DOA',jenis:'Pegawai'},
  {name:'Bella Kurnia',nip:'199010101010101010',job:'Duplicate File',team:'DOA'}
 ],'merge','b');
 assert.equal(stats.updated,1);assert.equal(stats.assigned,1);assert.equal(stats.skipped,1);
 manual=JSON.parse(store.get('key'));
 assert.equal(manual.members.length,1);
 assert.equal(manual.members[0].job,'Analis Senior');
 assert.equal(manual.teams['Bella Kurnia'],'SPP');
 assert.equal(manual.teams['Atitya Pritasari'],'DOA');
 assert.equal(userState.resources[0].jabatan,'Katim','CM Team master data must not change');
 console.log('PASS Firebase import: atomic batch, safe skip/merge, NIP duplicate detection and CM Team protection');
})().catch(e=>{console.error(e);process.exitCode=1});
