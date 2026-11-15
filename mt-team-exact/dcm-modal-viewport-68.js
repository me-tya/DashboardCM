/* DCM-68 · Pop-up di dalam bingkai Tim Pusmantap selalu muncul di layar yang sedang dilihat.
 * Bingkai (iframe) setinggi isinya dan yang bergulir adalah halaman Dashboard CM, sehingga
 * position:fixed di dalam bingkai berarti "puncak bingkai", bukan layar pengguna. Skrip ini
 * menghitung bagian bingkai yang terlihat dan menaruh pop-up (.ov > .md) di tengahnya,
 * mengikuti saat halaman digulir. Hanya tata letak; tidak mengubah data atau perilaku pop-up. */
(function(w){
'use strict';
if(w.DCM_MODAL_VP)return;
const D=w.document;
const frame=()=>{try{return w.frameElement}catch(e){return null}};
function view(){
 const f=frame();if(!f)return null;
 let P;try{P=w.parent;void P.innerHeight}catch(e){return null}
 const r=f.getBoundingClientRect(),top=Math.max(0,-r.top),bottom=Math.min(r.height,P.innerHeight-r.top);
 return {top,height:Math.max(240,bottom-top)};
}
function place(){
 const v=view();if(!v)return;
 D.querySelectorAll('body > .ov, body > div.ov').forEach(o=>{
  if(w.getComputedStyle(o).position!=='fixed')return;
  const md=o.querySelector(':scope > .md')||o.firstElementChild;
  if(md)md.style.setProperty('max-height',(v.height-32)+'px','important');
  const h=md?md.getBoundingClientRect().height:0;
  o.style.setProperty('padding-top',Math.round(v.top+Math.max(16,(v.height-h)/2))+'px','important');
  o.style.setProperty('align-items','flex-start','important');
 });
}
let raf=0;const soon=()=>{if(raf)return;raf=w.requestAnimationFrame(()=>{raf=0;place()})};
new w.MutationObserver(list=>{for(const m of list)for(const n of m.addedNodes)if(n.nodeType===1&&n.classList&&n.classList.contains('ov')){place();soon();return}})
 .observe(D.body,{childList:true});
try{w.parent.addEventListener('scroll',soon,{passive:true});w.parent.addEventListener('resize',soon)}catch(e){}
w.addEventListener('resize',soon);
w.DCM_MODAL_VP={place};
})(window);
