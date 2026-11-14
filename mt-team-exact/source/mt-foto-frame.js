/* Bingkai foto profil Satu Kemenkeu.
   Foto aset-satu.kemenkeu.go.id berlatar merah polos dengan banyak ruang kosong di atas kepala, sehingga di lingkaran
   avatar wajah terlihat kecil. Modul ini mendeteksi letak kepala (piksel yang berbeda dari warna latar) lalu
   memotong tampilan ke kepala + bahu memakai CSS object-view-box. Yang disimpan hanya koordinat bingkai
   (kpCfg().fbox + cache peramban), bukan salinan foto. Bila server foto menolak dibaca (CORS), dipakai bingkai bawaan via CSS. */
(function(){
 'use strict';
 const HOST='aset-satu.kemenkeu.go.id';
 /* Hanya foto tautan Satu Kemenkeu; foto hasil impor skrinsyut sudah dipotong saat impor (tidak dibingkai ulang). */
 const SEL='img[src*="'+HOST+'"]';
 const MEM={},FAIL={},BUSY={};let saveT=0,applyT=0;
 const key=u=>{u=String(u||'');if(u.startsWith('data:')){let h=0;for(let i=0;i<u.length;i+=7)h=(h*31+u.charCodeAt(i))|0;return 'd'+u.length.toString(36)+'_'+(h>>>0).toString(36)}return u.split('/').pop().slice(0,64)};
 try{Object.assign(MEM,JSON.parse(localStorage.getItem('MT_FBOX')||'{}'))}catch(e){}
 const store=()=>{try{const k=kpCfg();k.fbox=k.fbox||{};return k.fbox}catch(e){return MEM}};
 /* Kembalikan bingkai "atas% kanan% bawah% kiri%" (kepala & bahu) atau null.
    Mendukung dua bentuk: foto persegi berlatar polos (Satu Kemenkeu), dan potongan lingkaran avatar dari
    skrinsyut (sudut putih + lingkaran berlatar warna) — sudut putih di luar lingkaran diabaikan. */
 function frameOf(img){
  const IW=img.naturalWidth||img.width,IH=img.naturalHeight||img.height;if(!IW||!IH)return null;
  const W=120,H=Math.max(1,Math.round(IH*W/IW));const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,W,H);
  const d=x.getImageData(0,0,W,H).data,px=(i,j)=>{i=Math.max(0,Math.min(W-1,Math.round(i)));j=Math.max(0,Math.min(H-1,Math.round(j)));const o=(j*W+i)*4;return [d[o],d[o+1],d[o+2]]};
  const white=p=>p[0]>232&&p[1]>232&&p[2]>232,avg=a=>[0,1,2].map(k=>a.reduce((s,b)=>s+b[k],0)/a.length),df=(p,q)=>Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])+Math.abs(p[2]-q[2]);
  /* 1) Potongan skrinsyut: lingkaran foto berlatar warna (merah/biru) di tengah bidang putih.
        Cari warna latar foto (warna jenuh dominan), ambil batas lingkarannya, lalu bingkai pas ke lingkaran itu. */
  {const bins=new Map();for(let j=0;j<H;j++)for(let i=0;i<W;i++){const p=px(i,j),mx=Math.max(...p),mn=Math.min(...p);if(mx-mn>70){const k=(p[0]>>5)<<6|(p[1]>>5)<<3|(p[2]>>5);const e=bins.get(k)||{n:0,s:[0,0,0]};e.n++;e.s[0]+=p[0];e.s[1]+=p[1];e.s[2]+=p[2];bins.set(k,e)}}
   /* Latar foto = warna paling jenuh & luas (merah/biru); kulit wajah kurang jenuh sehingga tidak terpilih. */
   const sat=e=>{const c=e.s.map(v=>v/e.n);return (Math.max(...c)-Math.min(...c))/255};
   const top1=[...bins.values()].filter(e=>e.n>W*H*.02).sort((a,b)=>b.n*sat(b)**3-a.n*sat(a)**3)[0];
   if(top1&&top1.n>W*H*.05){const c=top1.s.map(v=>v/top1.n);let l=W,r=-1,t=H,bt=-1;
    for(let j=0;j<H;j++){let n=0,a=-1,z=-1;for(let i=0;i<W;i++)if(df(px(i,j),c)<90){n++;if(a<0)a=i;z=i}if(n>=2){if(a<l)l=a;if(z>r)r=z;if(j<t)t=j;bt=j}}
    const D=r-l+1;
    if(r>0&&D<W*.9&&D>W*.25&&(bt-t+1)>D*.4){const cx=(l+r)/2,cy=t+D/2,sd=D*.96;
     let x0=cx-sd/2,y0=cy-sd/2;const f=v=>(Math.max(0,v)*100).toFixed(1)+'%';
     return [f(y0/H),f(1-(x0+sd)/W),f(1-(y0+sd)/H),f(x0/W)].join(' ')}}}
  /* 2) Foto persegi berlatar polos (asli Satu Kemenkeu): cari kepala lalu bingkai kepala & bahu. */
  const corners=[px(1,1),px(W-2,1),px(1,H-2),px(W-2,H-2)];
  let circ=false,bg;
  /* Lingkaran yang sudah memenuhi gambar = sudah dibingkai; jangan diperbesar lagi (mencegah bingkai ganda). */
  if(corners.every(white)&&Math.abs(W-H)<=W*.08)return null;
  else bg=avg([px(2,2),px(W-3,2),px(2,Math.min(H-1,20)),px(W-3,Math.min(H-1,20))]);
  const R=Math.min(W,H)*.45,inC=(i,j)=>!circ||((i-W/2)**2+(j-H/2)**2<=R*R);
  const fg=(i,j)=>{if(!inC(i,j))return false;const p=px(i,j);return df(p,bg)>90};
  let top=-1;for(let j=0;j<H&&top<0;j++){let n=0;for(let i=Math.round(W*.2);i<W*.8;i++)if(fg(i,j))n++;if(n>=Math.max(2,W*.03))top=j}
  if(top<0)return null;
  const band=Math.max(4,Math.round(H*.16)),Ls=[],Rs=[];
  for(let j=top;j<Math.min(H,top+band);j++){let l=-1,r=-1;for(let i=0;i<W;i++)if(fg(i,j)){if(l<0)l=i;r=i}if(l>=0){Ls.push(l);Rs.push(r)}}
  if(!Ls.length)return null;Ls.sort((a,b)=>a-b);Rs.sort((a,b)=>a-b);
  const l=Ls[Math.floor(Ls.length/2)],r=Rs[Math.floor(Rs.length/2)],hw=Math.max(8,r-l),cx=(l+r)/2;
  const lim=circ?R*2/Math.SQRT2*1.12:Math.min(W,H);
  let s=Math.min(lim,hw*2.6),y0=Math.max(0,top-s*.16),x0=Math.min(Math.max(0,cx-s/2),W-s);if(y0+s>H)y0=Math.max(0,H-s);
  if(s>=Math.min(W,H)*.97)return null;
  const f=v=>(Math.max(0,v)*100).toFixed(1)+'%';
  return [f(y0/H),f(1-(x0+s)/W),f(1-(y0+s)/H),f(x0/W)].join(' ');
 }
 function detect(url){if(BUSY[url]||FAIL[url])return;BUSY[url]=1;const im=new Image();im.crossOrigin='anonymous';im.decoding='async';
  im.onload=()=>{let b=null;try{b=frameOf(im)}catch(e){FAIL[url]=1}BUSY[url]=0;if(!b){FAIL[url]=1;MEM[key(url)]='-';schedSave();return}const S2=store();if(!url.startsWith('data:'))S2[key(url)]=b;MEM[key(url)]=b;schedSave();schedApply()};
  im.onerror=()=>{BUSY[url]=0;FAIL[url]=1};im.src=url}
 /* Disimpan di cache peramban; ikut tersimpan ke data bersama saat editor menyimpan perubahan berikutnya. */
 function schedSave(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem('MT_FBOX',JSON.stringify(MEM))}catch(e){}},800)}
 function apply(){const S2=store();document.querySelectorAll(SEL).forEach(img=>{const b=S2[key(img.src)]||MEM[key(img.src)];if(b==='-')return;if(b){if(img.dataset.fb!==b){img.style.objectViewBox='inset('+b+')';img.style.objectFit='cover';img.style.objectPosition='50% 50%';img.dataset.fb=b}}else detect(img.src)})}
 function schedApply(){clearTimeout(applyT);applyT=setTimeout(apply,60)}
 window.MT_FOTO_FRAME={apply,detect,frameOf};
 /* Untuk potongan baru: hasilkan dataURL persegi kepala & bahu dari sebuah canvas/img. */
 window.MT_FOTO_FRAME.cropTo=function(src,OUT){const b=frameOf(src);if(!b)return null;const v=b.split(' ').map(t=>parseFloat(t)/100),W=src.naturalWidth||src.width,H=src.naturalHeight||src.height;const sx=v[3]*W,sy=v[0]*H,sw=W*(1-v[1]-v[3]),sh=H*(1-v[0]-v[2]);const o=document.createElement('canvas');o.width=o.height=OUT||160;const g=o.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(src,sx,sy,sw,sh,0,0,o.width,o.height);return o};
 const st=document.createElement('style');st.id='mt-foto-frame-css';
 /* Bingkai bawaan bila deteksi belum/tidak bisa: dekatkan ke kepala & bahu. */
 st.textContent='img[src*="'+HOST+'"]:not([data-fb]){object-fit:cover;object-position:50% 30%;object-view-box:inset(16% 18% 18% 18%)}';
 (document.head||document.documentElement).appendChild(st);
 new MutationObserver(schedApply).observe(document.documentElement,{childList:true,subtree:true});
 document.addEventListener('DOMContentLoaded',schedApply);
})();
