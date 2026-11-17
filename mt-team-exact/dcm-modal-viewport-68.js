/* DCM-71 · Modal Tim Pusmantap mengikuti viewport Dashboard CM yang sedang terlihat.
 * Iframe setinggi kontennya: position:fixed di dalamnya tidak otomatis mengikuti
 * posisi scroll halaman induk. Berlaku untuk dialog native (.ov) dan dialog tim
 * (#t2-layer .t-modal), termasuk seluruh detail yang sebelumnya berupa drawer.
 * Tidak menyentuh data, event save, maupun filter. */
(function(w){
'use strict';
if(w.DCM_MODAL_VP)return;
const D=w.document;
const frame=()=>{try{return w.frameElement}catch(e){return null}};
function view(){
 const f=frame();if(!f)return null;
 let P;try{P=w.parent;void P.innerHeight}catch(e){return null}
 const r=f.getBoundingClientRect();
 const top=Math.max(0,-r.top),bottom=Math.min(r.height,P.innerHeight-r.top);
 return {top,height:Math.max(0,bottom-top)};
}
function place(){
 const v=view();if(!v||v.height<50)return;
 D.querySelectorAll('body > .ov, body > div.ov').forEach(o=>{
  if(w.getComputedStyle(o).position!=='fixed')return;
  const md=o.querySelector(':scope > .md')||o.firstElementChild;
  if(md)md.style.setProperty('max-height',Math.max(100,v.height-32)+'px','important');
  const h=md?md.getBoundingClientRect().height:0;
  o.style.setProperty('padding-top',Math.round(v.top+Math.max(12,(v.height-h)/2))+'px','important');
  o.style.setProperty('align-items','flex-start','important');
 });
 D.querySelectorAll('#t2-layer .t-modal').forEach(md=>{
  md.style.setProperty('top',Math.round(v.top+v.height/2)+'px','important');
  md.style.setProperty('max-height',Math.max(110,Math.min(760,v.height-28))+'px','important');
 });
}
let raf=0;
const soon=()=>{if(raf)return;raf=w.requestAnimationFrame(()=>{raf=0;place()})};
new w.MutationObserver(list=>{
 for(const m of list)for(const n of m.addedNodes){
  if(n.nodeType!==1)continue;
  if(n.matches?.('.ov, #t2-layer, .t-modal')||n.querySelector?.('.ov, #t2-layer .t-modal, .t-modal')){place();soon();return}
 }
}).observe(D.body,{childList:true,subtree:true});
try{
 w.parent.addEventListener('scroll',soon,{passive:true,capture:true});
 w.parent.addEventListener('resize',soon);
}catch(e){}
w.addEventListener('resize',soon);
w.DCM_MODAL_VP={place};
soon();
})(window);
