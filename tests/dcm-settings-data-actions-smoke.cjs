const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('dcm-guide-header.js','utf8');
const a=src.indexOf('function dcmSettingsDataLayer('),b=src.indexOf('function metadataValue(',a);
assert(a>0&&b>a,'Scoped Settings action functions must be present');
let originalButtons={},activeLayers={},childButtons=[],alerts=[];
const classList=(values)=>({contains:(v)=>values.has(v),add:v=>values.add(v),remove:v=>values.delete(v)});
let statusNode=null;
const meta={querySelector:()=>statusNode,prepend(node){statusNode=node}};
const toggle={attrs:{},setAttribute(k,v){this.attrs[k]=v}};
const anchor={querySelector:()=>toggle};
const drop={hidden:false,querySelector:()=>meta};
const doc={createElement(tag){
 const el={tagName:tag,textContent:'',attrs:{},style:{color:'',fontWeight:''},children:[],listeners:{},setAttribute(k,v){this.attrs[k]=v;},appendChild(c){this.children.push(c);},addEventListener(type,fn){this.listeners[type]=fn;},closest(q){if(q==='.dcm-settings-utility-drop')return drop;if(q==='.dcm-settings-utility-anchor')return anchor;return null;}};
 childButtons.push(el);return el;
}};
const makeLayer=()=>{
 const values=new Set(['hidden']);return{classList:classList(values),style:{properties:{},setProperty(k,v,important){this.properties[k]={value:v,important};}}};
};
const ids=['btnImport','btnExport','btnBackupAll','btnRestoreAll'];
for(const id of ids){
 const target=id==='btnImport'?'importModal':id==='btnExport'?null:'backupModal';
 if(target&&!activeLayers[target])activeLayers[target]=makeLayer();
 originalButtons[id]={disabled:false,clicks:0,click(){this.clicks++;if(target)activeLayers[target].classList.remove('hidden')}};
}
const ctx={
 $id:(id)=>originalButtons[id]||activeLayers[id],
 svgFor:()=>null,document:doc,
 window:{cmCanMutate:()=>true,cmCanReport:()=>true}
};
vm.createContext(ctx);
vm.runInContext(src.slice(a,b)+'\nthis.makeUtility=utilityButton;',ctx,{filename:'dcm-guide-header.js'});
for(const id of ids){
 drop.hidden=false;statusNode=null;
 const button=ctx.makeUtility(id,id);
 assert(button.listeners.click, 'Missing listener for '+id);
 const ev={prevented:false,stopped:false,preventDefault(){this.prevented=true},stopPropagation(){this.stopped=true}};
 button.listeners.click(ev);
 assert(ev.prevented&&ev.stopped,id+' click should be explicit');
 assert.equal(originalButtons[id].clicks,1,id+' legacy handler must fire exactly once');
 if(id!=='btnExport'){
  const layer=activeLayers[id==='btnImport'?'importModal':'backupModal'];
  assert.equal(layer.style.properties['z-index'].value,'2147483000',id+' modal should be above Settings');
  assert(!layer.classList.contains('hidden'),id+' modal should be visible');
  assert(drop.hidden,'utility popover should close for modal '+id);
 }else{
  assert(statusNode&&/Ekspor dimulai/.test(statusNode.textContent),'export should show download status');
 }
}
const deny=ctx.makeUtility('btnBackupAll','Backup');
ctx.window.cmCanMutate=()=>false;const old=originalButtons.btnBackupAll.clicks;statusNode=null;
deny.listeners.click({preventDefault(){},stopPropagation(){}});
assert.equal(originalButtons.btnBackupAll.clicks,old,'Read-only must not launch backup');
assert(/tidak memiliki hak akses/.test(statusNode.textContent),'Read-only should receive clear message');
console.log('PASS: Import, Export, Backup, Restore dispatch originals; dialogs are frontmost; export feedback; readonly protection');
