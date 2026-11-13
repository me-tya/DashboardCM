const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('tim-pusmantap.html','utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert(match,'Tim Pusmantap script missing');
const app={innerHTML:''}, dialog={innerHTML:''}, toast={textContent:'',style:{},classList:{add(){},remove(){}}};
const elements={'#app':app,'#dialog':dialog,'#tpToast':toast};
const listeners={},messages=[];
const parent={postMessage:(msg)=>messages.push(msg)};
const window={parent,top:parent,location:{origin:'https://dashboard.test'},addEventListener:(name,fn)=>{listeners[name]=fn}};
window.self=window;
const document={
 querySelector:(sel)=>elements[sel]||null,
 querySelectorAll:()=>[],
 documentElement:{scrollHeight:900},
 body:{classList:{add(){},remove(){},toggle(){}}}
};
const context={
 window,document,location:{origin:'https://dashboard.test'},
 console,setTimeout:()=>1,clearTimeout:()=>{},Date,Intl,FormData,confirm:()=>true
};
vm.createContext(context);
const script=match[1].replace(/\}\)\(\);\s*$/,"globalThis._test={go,staff,leaves,actOn,status,limitLeave};})();");
vm.runInContext(script,context,{filename:'tim-pusmantap.html'});
assert.equal(messages[0].type,'ready');
function emit(activities,resources,manual){
 listeners.message({origin:'https://dashboard.test',source:parent,data:{source:'dcm-tim-pusmantap',type:'snapshot',
  today:'2026-11-13',canEdit:true,activities,resources,manual:manual||{members:[],teams:{},attendance:{},leaves:[]}}});
}
const resource={id:'r1',name:'Real Employee',job:'Staff',unit:'Pusmantap',wfhDays:[5],leavePlans:[]};
const act={id:'ACT-REAL-1',date:'2026-11-13',end:'2026-11-13',title:'UAT dari basis data nyata',time:'08.00',unit:'DJP',people:'Real Employee',pic:'Real Employee',location:'Ruang 1'};
emit([act],[resource]);
assert(app.innerHTML.includes('UAT dari basis data nyata'),'Expected real activity title');
assert(!app.innerHTML.includes('Rapat Pimpinan BaTii'),'Legacy mock should be absent');
context._test.go('agenda');
assert(app.innerHTML.includes('UAT dari basis data nyata'),'Agenda must render from snapshot');
emit([{...act,title:'Kegiatan diperbarui dari Firebase'}],[resource]);
assert(app.innerHTML.includes('Kegiatan diperbarui dari Firebase'),'Live updates must replace old data');
assert(!app.innerHTML.includes('UAT dari basis data nyata'),'Deleted title must disappear after update');
emit([],[resource]);
assert(app.innerHTML.includes('Tidak ada aktivitas'),'Empty state must not be synthetic');
context._test.go('hadir');
assert(app.innerHTML.includes('WFH'),'Friday follows employee WFH schedule');
context._test.go('profil');
assert(app.innerHTML.includes('Real Employee'),'Employee profile from actual CM Team data');
emit([],[resource],{members:[],teams:{'Real Employee':'CM'},structural:{'Real Employee':'Kepala Pusat'},attendance:{},leaves:[]});
context._test.go('tempat');
assert(app.innerHTML.includes('KAKI 1 · STRUKTURAL')&&app.innerHTML.includes('KAKI 2 · PENUGASAN TIM'),'Both organization legs displayed');
assert(app.innerHTML.includes('Kepala Pusat'),'Structural title displayed');
assert(app.innerHTML.split('Real Employee').length>=3,'Same person visible in both structural and team columns');
assert.equal(context._test.staff().length,1,'Dual placement must never duplicate employee count');
console.log('PASS: actual source data, live replacements, empty state, WFH and employee registry');
