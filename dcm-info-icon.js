/* Ikon Informasi (ⓘ) di samping judul bagian — disalin dari Modul Transformasi (mt-info-icon.js) agar perilaku sama di Dashboard CM.
 * Aturan UI: deskripsi/penjelasan judul bagian tidak ditulis terbuka di halaman,
 * tetapi dibungkus ikon ⓘ di samping judul. Isi tampil saat hover, fokus keyboard,
 * atau klik/tap (untuk layar sentuh). Ikon ini selalu tersedia (tidak bergantung Guide).
 *
 * Pemakaian di render HTML:  '<h3>Judul'+MT_INFO_ICON('Penjelasan bagian...')+'</h3>'
 * Ikon lama .psbank-helpicon[data-mt-info] memakai perilaku yang sama.
 */
(function(){
'use strict';
if(window.MT_INFO_ICON)return;
function toText(v){
 // Buang tag HTML (mis. <b>) dan pulihkan entitas agar teks tooltip bersih.
 var s=String(v==null?'':v).replace(/<[^>]*>/g,'');
 return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
}
function attr(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
window.MT_INFO_ICON=function(text){
 var t=toText(text);if(!t)return '';
 return '<button type="button" class="mt-info-ic" data-mt-info="'+attr(t)+'" aria-label="Informasi: '+attr(t)+'">ⓘ</button>';
};
if(typeof document==='undefined'||typeof document.addEventListener!=='function')return;
var pop=null,owner=null,pinned=false,timer=0;
var SEL='.mt-info-ic,[data-mt-info].psbank-helpicon';
function css(){
 if(document.getElementById('mt-info-icon-css'))return;
 var s=document.createElement('style');s.id='mt-info-icon-css';
 s.textContent=
 // Spesifisitas #app + !important: tombol global aplikasi memiliki border/padding/min-width sendiri.
 '#app .mt-info-ic,.mt-info-ic{display:inline-grid!important;place-items:center;box-sizing:border-box!important;width:17px!important;min-width:17px!important;height:17px!important;min-height:0!important;margin:0 0 0 7px!important;padding:0!important;border:0!important;border-radius:50%!important;background:#ecf4ff!important;color:#285e99!important;box-shadow:none!important;font:800 12px/1 Inter,"Nunito Sans",Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;vertical-align:2px;cursor:help;flex:none}'+
 '#app .mt-info-ic:hover,#app .mt-info-ic[aria-expanded="true"]{background:#fdb913!important;color:#102c4e!important}'+
 '.mt-info-ic:focus-visible,[data-mt-info].psbank-helpicon:focus-visible{outline:2px solid #fdb913;outline-offset:2px}'+
 '#mt-info-pop{position:fixed;z-index:290001;box-sizing:border-box;max-width:min(360px,calc(100vw - 20px));padding:9px 12px;color:#e9f3ff;background:#102c4e;border:1px solid #476783;border-top:3px solid #fdb913;border-radius:10px;box-shadow:0 8px 24px rgba(4,16,36,.24);font:500 12px/1.5 Inter,"Nunito Sans",Arial,sans-serif;white-space:normal;pointer-events:none}'+
 '#mt-info-pop[hidden]{display:none}';
 document.head.appendChild(s);
}
function ensure(){
 if(pop)return pop;css();
 pop=document.createElement('div');pop.id='mt-info-pop';pop.setAttribute('role','tooltip');pop.hidden=true;
 document.body.appendChild(pop);return pop;
}
function place(el){
 var r=el.getBoundingClientRect(),w=pop.offsetWidth,h=pop.offsetHeight;
 var left=Math.round(r.left+r.width/2-w/2),top=Math.round(r.bottom+8);
 if(left+w>window.innerWidth-8)left=window.innerWidth-w-8;
 if(left<8)left=8;
 if(top+h>window.innerHeight-8)top=Math.round(r.top-h-8);
 if(top<8)top=8;
 pop.style.left=left+'px';pop.style.top=top+'px';
}
function show(el,pin){
 clearTimeout(timer);
 var text=el.getAttribute('data-mt-info');if(!text)return;
 ensure();
 if(owner&&owner!==el)owner.setAttribute('aria-expanded','false');
 owner=el;pinned=!!pin;
 if(el.hasAttribute('title'))el.removeAttribute('title'); // hindari tooltip ganda bawaan browser
 pop.textContent=text;pop.hidden=false;
 el.setAttribute('aria-expanded','true');el.setAttribute('aria-describedby','mt-info-pop');
 place(el);
}
function hide(){
 clearTimeout(timer);
 if(owner){owner.setAttribute('aria-expanded','false');owner.removeAttribute('aria-describedby')}
 owner=null;pinned=false;if(pop)pop.hidden=true;
}
if(document.head)css();else document.addEventListener('DOMContentLoaded',css,{once:true});
function target(n){return n&&n.closest?n.closest(SEL):null}
document.addEventListener('pointerover',function(e){
 if(e.pointerType==='touch')return;
 var el=target(e.target);if(!el||el===owner)return;
 if(!pinned){clearTimeout(timer);timer=setTimeout(function(){show(el,false)},120)}
});
document.addEventListener('pointerout',function(e){
 var el=target(e.target);if(!el)return;
 if(e.relatedTarget&&el.contains(e.relatedTarget))return;
 clearTimeout(timer);if(el===owner&&!pinned)hide();
});
document.addEventListener('focusin',function(e){var el=target(e.target);if(el&&el!==owner)show(el,false)});
document.addEventListener('focusout',function(e){if(owner&&e.target===owner&&!pinned)hide()});
// Fase capture: klik ikon tidak boleh memicu aksi elemen induk (kartu, baris, accordion).
document.addEventListener('click',function(e){
 var el=target(e.target);
 if(el){e.preventDefault();e.stopPropagation();if(owner===el&&pinned)hide();else show(el,true);return}
 if(pinned)hide();
},true);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&owner)hide()});
document.addEventListener('scroll',function(){if(owner)hide()},true);
window.addEventListener('resize',function(){if(owner)hide()});
})();
