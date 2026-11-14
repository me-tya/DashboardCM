/* Exact original MT common helpers extracted by top-level AST spans from commit 2c2077757cac1215db74804f80078888ea1e7b46. Never hand-modify these snippets. */

/* chLib */
function chLib(src,test){if(test())return Promise.resolve();return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=()=>res();s.onerror=()=>rej(new Error('Pustaka ekspor tidak dapat dimuat.'));document.head.appendChild(s)})}

/* KP_TIM0,KP_PERAN */
const KP_TIM0=['Tim DCS','Tim DOA','Tim SPP','Tim SSB','Tim CM'],KP_PERAN=[['pmo','PMO','#2F6FCE'],['cmo','CMO','#6D53C7'],['probis','Pemilik Proses Bisnis','#B85C10']];

/* kpIni */
const kpIni=n=>String(n||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();

/* kpAv */
function kpAv(p,cls){return p.foto?'<img class="kp-ph '+(cls||'')+'" src="'+esc(p.foto)+'" alt="">':'<i class="kp-ph kp-in '+(cls||'')+'">'+esc(kpIni(p.nama))+'</i>'}

/* ACT.kpTimAdd */
ACT.kpTimAdd=()=>{modal('Tambah tim','<div class="fld"><label>Nama tim</label><input class="inp" id="kp-tn" placeholder="mis. Tim XYZ"></div>','Tambah',ov=>{const n=ov.querySelector('#kp-tn').value.trim();if(!n){toast('Nama tim wajib diisi.');return false}const k=kpCfg();if(k.tims.includes(n)){toast('Tim sudah ada.');return false}k.tims.push(n);S.ui.kpTim=n;save();render()},{size:'sm'})};

/* ACT.kpUnits */
ACT.kpUnits=el=>{const n=el.dataset.id,k=kpCfg(),all=kpUnitList();
 modal('Unit yang dipegang '+esc(n),'<p class="s" style="margin:0 0 8px">Centang unit yang dipegang. Unit boleh dipegang lebih dari satu PIC.</p><div class="kp-ug">'+all.map(u=>'<label class="kp-uc"><input type="checkbox" value="'+esc(u)+'"'+((k.asg[u]||[]).includes(n)?' checked':'')+'><span>'+esc(u)+'</span></label>').join('')+'</div><div class="fld" style="margin-top:8px"><label>Tambah unit lain</label><input class="inp" id="kp-un" placeholder="mis. Kanwil DJPb Jawa Barat"></div>','Simpan',ov=>{const ex=ov.querySelector('#kp-un').value.trim(),on=new Set([...ov.querySelectorAll('.kp-ug input:checked')].map(i=>i.value));if(ex)on.add(ex);const all2=new Set([...Object.keys(k.asg),...on]);all2.forEach(u=>{let a=(k.asg[u]||[]).filter(x=>x!==n);if(on.has(u))a.push(n);if(a.length)k.asg[u]=a;else delete k.asg[u]});save();render()},{size:'lg'})};

/* KQ_ESELON1 */
const KQ_ESELON1=[
  [/direktorat\s+jenderal\s+stabilitas\s+dan\s+pengembangan\s+sektor\s+keuangan/i,'DJSPSK'],
  [/direktorat\s+jenderal\s+strategi\s+ekonomi\s+dan\s+fiskal/i,'DJSEF'],
  [/direktorat\s+jenderal\s+pengelolaan\s+pembiayaan\s+dan\s+risiko/i,'DJPPR'],
  [/direktorat\s+jenderal\s+perimbangan\s+keuangan/i,'DJPK'],
  [/direktorat\s+jenderal\s+kekayaan\s+negara/i,'DJKN'],
  [/direktorat\s+jenderal\s+perbendaharaan/i,'DJPB'],
  [/direktorat\s+jenderal\s+bea\s+dan\s+cukai/i,'DJBC'],
  [/direktorat\s+jenderal\s+anggaran/i,'DJA'],
  [/direktorat\s+jenderal\s+pajak/i,'DJP'],
  [/badan\s+teknologi,?\s+informasi,?\s+dan\s+intelijen\s+keuangan/i,'BaTii'],
  [/badan\s+pendidikan\s+dan\s+pelatihan\s+keuangan/i,'BPPK'],
  [/lembaga\s+national\s+single\s+window/i,'LNSW'],
  [/inspektorat\s+jenderal/i,'Itjen'],
  [/sekretariat\s+jenderal/i,'Setjen'],
];

/* kqSuggestUnit */
function kqSuggestUnit(unitKerja){
  const u=String(unitKerja||'').replace(/\s+/g,' ').trim();if(!u)return '';
  for(const [re,ab] of KQ_ESELON1){if(re.test(u))return ab}
  return '';
}

/* kqJabFull */
function kqJabFull(jab,unit){jab=String(jab||'').replace(/\s+/g,' ').trim();unit=String(unit||'').replace(/\s+/g,' ').trim();if(!unit)return jab;if(!jab)return unit;if(jab.toLowerCase().includes(unit.toLowerCase()))return jab;
 for(const [t,u] of [['Direktur','Direktorat'],['Sekretaris','Sekretariat'],['Inspektur','Inspektorat'],['Kepala Kantor','Kantor'],['Kepala Pusat','Pusat'],['Kepala Biro','Biro']])if(new RegExp('\\b'+t+'$','i').test(jab)&&new RegExp('^'+u+'\\s','i').test(unit))return jab+' '+unit.slice(u.length+1);
 const a=jab.split(' '),b=unit.split(' '),lc=x=>x.toLowerCase().replace(/[.,]/g,'');for(let k=Math.min(a.length,b.length);k>0;k--){if(a.slice(-k).map(lc).join(' ')===b.slice(0,k).map(lc).join(' '))return a.concat(b.slice(k)).join(' ')}
 return /^(kepala|direktur|sekretaris|inspektur|kabag|kabid|kasubbag|kasubbid|kasi|kepala\s)/i.test(jab)?jab+' '+unit:jab+' pada '+unit}

/* kqParseProfile */
function kqParseProfile(lines){
  const out={nama:'',nip:'',email:'',hp:'',jabatan:'',unitKerja:'',pangkat:'',_nameLine:null,_nipLine:null,_emailLine:null};
  const T=lines.map(l=>l.text);
  // NIP: 18 digit (toleran spasi & huruf O/o yang terbaca sebagai 0)
  let nipIdx=-1;
  for(let i=0;i<T.length;i++){const d=T[i].replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/[\s.\-]/g,'');const m=d.match(/(?<!\d)(\d{18})(?!\d)/);if(m&&/^[\d\s.\-OoIl|]+$/.test(T[i].trim().replace(/^NIP[:\s]*/i,''))){out.nip=m[1];nipIdx=i;break;}}
  if(nipIdx<0){for(let i=0;i<T.length;i++){const m=T[i].replace(/\s/g,'').match(/(?<!\d)(\d{18})(?!\d)/);if(m){out.nip=m[1];nipIdx=i;break;}}}
  // Email
  for(let i=0;i<T.length;i++){const t=T[i].replace(/[®©]/g,'@').replace(/\s*@\s*/g,'@');const m=t.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+/);if(m){out.email=m[0].replace(/[.,;]+$/,'').toLowerCase();out._emailLine=lines[i];break;}}
  // HP (boleh tersamar ******)
  for(let i=0;i<T.length;i++){if(i===nipIdx)continue;const t=T[i].replace(/[•·xX]/g,'*');const m=t.match(/(\+?62|0)\s?8[0-9*\s\-]{6,18}[0-9*]/);if(m){let hp=m[0].replace(/\s+/g,'').replace(/-+/g,'');
    // Satu Kemenkeu menyamarkan nomor (0857******49); OCR sering membaca * sebagai deretan angka sama.
    const raw=T[i];
    // Satu Kemenkeu selalu menyamarkan bagian tengah nomor (0857******49). OCR sering membaca * sebagai deretan angka sama (1111…).
    if(/\*/.test(raw)||/^(\+?\d{4})\d*?(\d)\2{2,}/.test(hp.slice(0,10))){const dg=hp.replace(/\*/g,'');const head=hp.slice(0,4),tail=hp.replace(/\D/g,'').slice(-2);if(dg.length>=8||/\*/.test(hp))hp=head+'******'+tail;}
    out.hp=hp;break;}}
  // Nama: baris berhuruf tepat di atas NIP
  const isNameLike=t=>{const c=kqCleanName(t);return c.length>=3&&!/@|\d{4,}/.test(t)&&!/jabatan|pangkat|golongan|unit|satu\s*kemenkeu/i.test(t)&&c.replace(/[^A-Za-z]/g,'').length>=c.length*0.6;};
  // Buang token sampah di depan nama (foto/ikon sering terbaca "O", "@", "&").
  const takeName=i=>{const L=lines[i];const words=(L.words&&L.words.length)?L.words:T[i].split(' ').map(t=>({text:t,bbox:null}));
    /* Token di depan nama yang berasal dari foto bulat: tanpa huruf, satu huruf, mengandung kurung (mis. "La)"), atau kotaknya jauh lebih tinggi dari kata berikutnya. */
    const tall=(a,b)=>a&&b&&a.bbox&&b.bbox&&(a.bbox.y1-a.bbox.y0)>1.8*(b.bbox.y1-b.bbox.y0);
    let k=0;while(k<words.length-1&&(/^[^A-Za-z]+$/.test(words[k].text)||(/^[A-Za-z]$/.test(words[k].text)&&words.length>2)||/[()\[\]{}|]/.test(words[k].text)||tall(words[k],words[k+1])))k++;
    const kept=words.slice(k);out.nama=kqCleanName(kept.map(w=>w.text).join(' '));
    const fb=kept[0]&&kept[0].bbox;out._nameLine={text:out.nama,bbox:fb?{x0:fb.x0,y0:L.bbox.y0,x1:L.bbox.x1,y1:L.bbox.y1}:L.bbox};};
  if(nipIdx>0){for(let i=nipIdx-1;i>=0;i--){if(isNameLike(T[i])){takeName(i);break;}}}
  if(!out.nama){for(let i=0;i<T.length;i++){if(isNameLike(T[i])&&T[i].split(' ').length>=2){takeName(i);break;}}}
  if(nipIdx>=0)out._nipLine=lines[nipIdx];
  // Bagian Jabatan & Pangkat
  const hdrJab=T.findIndex(t=>/jabatan\s*(saat\s*ini)?\s*:?/i.test(t)&&t.length<40);
  const hdrPkt=T.findIndex(t=>/^\s*(pangkat|golongan)/i.test(t));
  const isHeader=t=>/:\s*$/.test(t)&&t.length<40;
  if(hdrJab>=0){
    const inline=T[hdrJab].split(':').slice(1).join(':').trim();
    const block=[];if(inline)block.push(inline);
    for(let i=hdrJab+1;i<T.length;i++){if(i===hdrPkt||isHeader(T[i])||/^\s*(pangkat|golongan)/i.test(T[i]))break;block.push(T[i]);}
    let cut=block.findIndex((t,i)=>i>0&&KQ_UNIT_START.test(t));
    if(cut<0&&block.length>=2)cut=1;
    const jab=(cut<0?block:block.slice(0,cut)).join(' '),unit=(cut<0?[]:block.slice(cut)).join(' ');
    out.jabatan=jab.replace(/\s+/g,' ').replace(/^[^A-Za-z]+/,'').trim();
    /* OCR sering membuang angka Romawi "I" setelah "Tk." (mis. "Penelaah Teknis Kebijakan Tk.I"). */
    if(/\bTk\.?$/i.test(out.jabatan))out.jabatan=out.jabatan.replace(/\bTk\.?$/i,'Tk.I');
    out.unitKerja=unit.replace(/\s+/g,' ').replace(/\s+,/g,',').trim();
    out.jabatanPendek=out.jabatan;out.jabatan=kqJabFull(out.jabatan,out.unitKerja);
  }
  // Pangkat / golongan
  const pktSrc=(hdrPkt>=0?T.slice(hdrPkt,hdrPkt+3):T).join(' \n ');
  const pm=pktSrc.match(/(Juru|Pengatur|Penata|Pembina)[A-Za-z .]*?\s*[-–—]?\s*([IVl1|]{1,3})\s*\/\s*([a-eA-E])/);
  if(pm){const rom=pm[2].replace(/[l1|]/g,'I');const name=pm[0].split(/[-–—]/)[0].replace(/[IVl1|]{1,3}\s*\/.*$/,'').trim();out.pangkat=`${name} - ${rom}/${pm[3].toLowerCase()}`;}
  else if(hdrPkt>=0){const nx=(T[hdrPkt].split(':').slice(1).join(':').trim())||T[hdrPkt+1]||'';out.pangkat=nx.trim();}
  return out;
}

/* kqCropAvatar */
function kqCropAvatar(img,parsed){
  try{
    const W=img.naturalWidth,H=img.naturalHeight,nb=parsed._nameLine&&parsed._nameLine.bbox;if(!nb)return '';
    const xMax=Math.floor(nb.x0-3);if(xMax<24)return '';
    const nipB=parsed._nipLine&&parsed._nipLine.bbox,emB=parsed._emailLine&&parsed._emailLine.bbox;
    let yMax=emB&&emB.y0>nb.y1?Math.floor(emB.y0-2):Math.floor(Math.min(H,nb.y0+Math.max(xMax*1.3,(nipB?nipB.y1-nb.y0:40)*3)));
    yMax=Math.min(H,Math.max(yMax,Math.floor(nb.y1)));
    const cv=document.createElement('canvas');cv.width=xMax;cv.height=yMax;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const d=ctx.getImageData(0,0,xMax,yMax).data;
    // Warna latar = warna terbanyak pada tepi kanan region (sisi dekat teks nama).
    const counts=new Map();const key=(r,g,b)=>((r>>4)<<8)|((g>>4)<<4)|(b>>4);
    for(let y=0;y<yMax;y++){const p=(y*xMax+(xMax-1))*4;const k=key(d[p],d[p+1],d[p+2]);counts.set(k,(counts.get(k)||0)+1);}
    for(let x=0;x<xMax;x++){const p=((yMax-1)*xMax+x)*4;const k=key(d[p],d[p+1],d[p+2]);counts.set(k,(counts.get(k)||0)+1);}
    const bk=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0][0];const br=((bk>>8)&15)*16+8,bg=((bk>>4)&15)*16+8,bb=(bk&15)*16+8;
    const rowHits=new Array(yMax).fill(0),colHits=new Array(xMax).fill(0);
    for(let y=0;y<yMax;y++)for(let x=0;x<xMax;x++){const p=(y*xMax+x)*4;if(Math.abs(d[p]-br)+Math.abs(d[p+1]-bg)+Math.abs(d[p+2]-bb)>60){rowHits[y]++;colHits[x]++;}}
    const thr=3;let y0=rowHits.findIndex(v=>v>thr),y1=yMax-1-[...rowHits].reverse().findIndex(v=>v>thr),x0=colHits.findIndex(v=>v>thr),x1=xMax-1-[...colHits].reverse().findIndex(v=>v>thr);
    if(y0<0||x0<0||x1-x0<20||y1-y0<20)return '';
    const side=Math.max(x1-x0,y1-y0)+1,cx=(x0+x1)/2,cy=(y0+y1)/2,R=side/2;
    // Ambil lingkaran foto Satu Kemenkeu secara utuh (proporsi asli), dipotong sedikit ke dalam tepi lingkaran
    // supaya tidak ada sisa tepi/sudut putih — garis putih di kartu murni dari bingkai CSS: tipis & merata.
    // Pusat lingkaran diperhalus dari titik tengah baris/kolom terlebar subjek.
    let ccx=cx,ccy=cy;{let best=0;for(let y=y0;y<=y1;y++){let a=-1,b=-1;for(let x=x0;x<=x1;x++){const q=(y*xMax+x)*4;if(Math.abs(d[q]-br)+Math.abs(d[q+1]-bg)+Math.abs(d[q+2]-bb)>60){if(a<0)a=x;b=x;}}if(b-a>best){best=b-a;ccx=(a+b)/2;ccy=y;}}
      let bestC=0;for(let x=x0;x<=x1;x++){let a=-1,b=-1;for(let y=y0;y<=y1;y++){const q=(y*xMax+x)*4;if(Math.abs(d[q]-br)+Math.abs(d[q+1]-bg)+Math.abs(d[q+2]-bb)>60){if(a<0)a=y;b=y;}}if(b-a>bestC){bestC=b-a;ccy=(a+b)/2;}}}
    const S=side*.94,sx=ccx,sy=ccy;
    const OUT=160,out=document.createElement('canvas');out.width=out.height=OUT;const o=out.getContext('2d');o.fillStyle='#fff';o.fillRect(0,0,OUT,OUT);o.imageSmoothingQuality='high';
    o.drawImage(img,sx-S/2,sy-S/2,S,S,0,0,OUT,OUT);
    // Lingkaran foto Satu Kemenkeu dikelilingi cincin putih: cari lingkaran berlatar merah/biru (piksel sangat jenuh)
    // lalu potong pas ke lingkaran itu — hasilnya kepala & bahu seperti foto aslinya. Sumber disimpan untuk atur manual.
    let C={x:sx,y:sy,d:S};
    try{const N=200,m=document.createElement('canvas');m.width=m.height=N;const g=m.getContext('2d',{willReadFrequently:true});g.drawImage(img,sx-S/2,sy-S/2,S,S,0,0,N,N);const q=g.getImageData(0,0,N,N).data;
      const isBg=(i)=>{const r=q[i]/255,gg=q[i+1]/255,b=q[i+2]/255,mx=Math.max(r,gg,b),mn=Math.min(r,gg,b);if(mx<.45||(mx-mn)/mx<.65)return false;let h;if(mx===r)h=((gg-b)/(mx-mn)+6)%6;else if(mx===gg)h=(b-r)/(mx-mn)+2;else h=(r-gg)/(mx-mn)+4;h*=60;return h<18||h>330||(h>185&&h<255)};
      let l=N,r=-1,t=N;for(let y=0;y<N;y++){let a=-1,z=-1,n=0;for(let x=0;x<N;x++)if(isBg((y*N+x)*4)){n++;if(a<0)a=x;z=x}if(n>=3){if(a<l)l=a;if(z>r)r=z;if(y<t)t=y}}
      const D=r-l+1;if(r>0&&D>N*.3){const k=S/N;C={x:sx-S/2+((l+r)/2)*k,y:sy-S/2+(t+D/2)*k,d:D*.98*k}}}catch(e){}
    window.kqAvatarSrc={img,x:C.x,y:C.y,d:C.d};
    return kqAvatarRender(1,0,0);
  }catch(e){console.warn('Avatar crop failed',e);return '';}
}

/* kqAvatarRender */
function kqAvatarRender(z,dx,dy){const A=window.kqAvatarSrc;if(!A)return '';const OUT=200,d=A.d/(z||1),o=document.createElement('canvas');o.width=o.height=OUT;const c=o.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,OUT,OUT);c.imageSmoothingQuality='high';
 c.drawImage(A.img,A.x+(dx||0)*A.d-d/2,A.y+(dy||0)*A.d-d/2,d,d,0,0,OUT,OUT);return o.toDataURL('image/jpeg',0.88)}

/* KP_OFF_ALASAN */
const KP_OFF_ALASAN=['Pindah unit / mutasi','Diganti PIC lain','Tidak lagi menjabat','Pensiun','Meninggal dunia','Lainnya'];

/* kpOn */
function kpOn(c){return !c||c.aktif!==false}

/* kpTgl */
function kpTgl(d){try{return d?new Date(d+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):''}catch(e){return d||''}}

/* kpOffTxt */
function kpOffTxt(c){return 'TIDAK AKTIF'+(c.offAlasan?' · '+c.offAlasan:'')+(c.offSejak?' · sejak '+kpTgl(c.offSejak):'')}

/* kpOffLbl */
function kpOffLbl(c){if(kpOn(c))return '';const r=[c.offAlasan,c.offSejak?'sejak '+kpTgl(c.offSejak):'',c.offCatatan].filter(Boolean).join(' · ');return '<span class="kp-offl">TIDAK AKTIF</span>'+(r?'<span class="kp-offr">'+esc(r)+'</span>':'')}

/* kpHistBtn */
function kpHistBtn(u,n){if(!n)return '';const on=!!(S.ui.kpH||{})[u];return '<button type="button" class="kp-hbtn" data-act="kpHist" data-v="'+esc(u)+'" aria-pressed="'+on+'" title="Kontak yang sudah tidak aktif tetap disimpan sebagai riwayat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg><span>'+(on?'Sembunyikan':'Lihat')+' riwayat ('+n+')</span></button>'}

/* kpHistCls */
function kpHistCls(u){return (S.ui.kpH||{})[u]?' kph-open':''}

/* kpHistSep */
function kpHistSep(n){return n?'<div class="kp-hsep">Riwayat · tidak aktif ('+n+')</div>':''}

/* ACT.kpHist */
ACT.kpHist=el=>{const u=el.dataset.v;S.ui.kpH=Object.assign({},S.ui.kpH);S.ui.kpH[u]=!S.ui.kpH[u];if(!S.ui.kpH[u])delete S.ui.kpH[u];try{localStorage.setItem(KEY+'_ui',JSON.stringify(S.ui))}catch(e){}
 const on=!!S.ui.kpH[u];document.querySelectorAll('[data-kph]').forEach(w=>{if(w.dataset.kph===u)w.classList.toggle('kph-open',on)});document.querySelectorAll('[data-act=kpHist]').forEach(b=>{if(b.dataset.v===u){b.setAttribute('aria-pressed',on);const t=b.querySelector('span');t.textContent=t.textContent.replace(/^(Lihat|Sembunyikan)/,on?'Sembunyikan':'Lihat')}})};

/* kqAdjUI */
function kqAdjUI(){return '<div class="tm-adj kq-adj" hidden><label>Zoom <input type="range" data-adj="z" min="0.8" max="2.2" step="0.02" value="1"></label><label>Naik/turun <input type="range" data-adj="y" min="-0.3" max="0.3" step="0.01" value="0"></label><label>Kiri/kanan <input type="range" data-adj="x" min="-0.3" max="0.3" step="0.01" value="0"></label></div>'}

/* kqAdjBind */
function kqAdjBind(el,onFoto){const reset=()=>el.querySelectorAll('[data-adj]').forEach(i=>i.value=i.dataset.adj==='z'?1:0),show=()=>{reset();el.hidden=false},hide=()=>{el.hidden=true};
 el.addEventListener('input',()=>{const g=k=>+el.querySelector('[data-adj='+k+']').value;let u='';try{u=kqAvatarRender(g('z'),-g('x'),-g('y'))}catch(e){u=''}if(u)onFoto(u)});
 const from=src=>{if(!src)return hide();const im=new Image();if(!/^data:/.test(src))im.crossOrigin='anonymous';im.onload=()=>{window.kqAvatarSrc={img:im,x:im.naturalWidth/2,y:im.naturalHeight/2,d:Math.min(im.naturalWidth,im.naturalHeight)};try{kqAvatarRender(1,0,0);show()}catch(e){hide()}};im.onerror=hide;im.src=src};
 return {show,hide,from}}

/* KQ_SRC */
const KQ_SRC='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

/* kqProgress,kqWorker */
let kqProgress=null,kqWorker=null;

/* kqLoadImage */
function kqLoadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Gambar tidak dapat dibaca'));i.src=src})}

/* kqDataUrl */
function kqDataUrl(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(f)})}

/* kqWorkerGet */
function kqWorkerGet(){if(kqWorker)return kqWorker;kqWorker=chLib(KQ_SRC,()=>window.Tesseract).then(()=>window.Tesseract.createWorker('ind+eng',1,{logger:m=>{try{kqProgress&&kqProgress(m)}catch(e){}}})).catch(e=>{kqWorker=null;throw new Error('Mesin OCR tidak dapat dimuat (perlu koneksi internet).')});return kqWorker}

/* kqRunOcr */
async function kqRunOcr(img){const sc=Math.max(1,Math.min(3,1800/Math.max(img.naturalWidth,1))),cv=document.createElement('canvas');cv.width=Math.round(img.naturalWidth*sc);cv.height=Math.round(img.naturalHeight*sc);const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,cv.width,cv.height);c.imageSmoothingQuality='high';c.drawImage(img,0,0,cv.width,cv.height);
 const w=await kqWorkerGet(),{data}=await w.recognize(cv),sb=b=>({x0:b.x0/sc,y0:b.y0/sc,x1:b.x1/sc,y1:b.y1/sc});
 let lines=(data.lines||[]).map(l=>({text:String(l.text||'').replace(/\s+/g,' ').trim(),bbox:sb(l.bbox),words:(l.words||[]).map(w=>({text:String(w.text||'').trim(),bbox:sb(w.bbox)})).filter(w=>w.text)})).filter(l=>l.text);
 if(!lines.length&&data.text)lines=String(data.text).split(/\n/).map(t=>({text:t.replace(/\s+/g,' ').trim(),bbox:null})).filter(l=>l.text);return lines}

/* ACT.kuDel */
ACT.kuDel=el=>{const p=kpPeople().find(x=>x._id===el.dataset.id);if(!p)return;confirmDel(p.nama,()=>{S.oneonone=S.oneonone.filter(x=>x.id!==p._id);log&&log('Hapus kontak PMO/CMO Unit',p.nama);save();render()})};

/* ACT.kuEdit */
ACT.kuEdit=el=>kuForm(kpPeople().find(x=>x._id===el.dataset.id));

/* ACT.kuAdd */
ACT.kuAdd=el=>kuForm(null,!!(el&&el.dataset&&el.dataset.shot));

/* kuResize */
function kuResize(file,size){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=()=>rej(new Error('Gagal membaca gambar'));r.onload=()=>{const i=new Image();i.onerror=()=>rej(new Error('Gambar tidak dapat dibaca'));i.onload=()=>{const s=Math.min(i.naturalWidth,i.naturalHeight),c=document.createElement('canvas');c.width=c.height=size||128;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.imageSmoothingQuality='high';x.drawImage(i,(i.naturalWidth-s)/2,(i.naturalHeight-s)/2,s,s,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',0.82))};i.src=r.result};r.readAsDataURL(file)})}

/* kuForm */
function kuForm(p,shot){const isNew=!p||!p._id;p=Object.assign({peran:['pmo']},p||{});let foto=p.foto||'';const units=kpUnitList();
 const f=(k,l,ph,w)=>'<div class="fld'+(w?' wide':'')+'"><label>'+l+'</label><input class="inp" data-kf="'+k+'" value="'+esc(p[k]||'')+'" placeholder="'+(ph||'')+'"></div>';
 const body='<div class="kp-imp" id="kp-drop" tabindex="0"><div class="kp-imp-t"><b>Import dari skrinsyut profil Satu Kemenkeu</b><span>Tarik gambar ke sini, tempel (Ctrl+V), atau <label class="kp-lnk" for="kp-shot">pilih file</label>. Dibaca lokal di browser; gambar tidak diunggah.</span><div class="kp-prog" hidden><div><i></i></div><em></em></div></div><input type="file" id="kp-shot" accept="image/*" hidden></div>'+
 '<div class="fgrid" style="margin-top:10px"><div class="fld wide"><label>Peran *</label><div class="kp-roles">'+KP_PERAN.map(r=>'<label style="--c:'+r[2]+'"><input type="checkbox" data-role="'+r[0]+'"'+((p.peran||[]).includes(r[0])?' checked':'')+'><span>'+r[1]+'</span></label>').join('')+'</div></div>'+
 '<div class="fld"><label>Unit *</label><input class="inp" data-kf="unit" list="kp-ul" value="'+esc(p.unit||'')+'" placeholder="Pilih / ketik unit"><datalist id="kp-ul">'+units.map(u=>'<option value="'+esc(u)+'">').join('')+'</datalist></div>'+f('nama','Nama lengkap *','Nama sesuai Satu Kemenkeu')+f('nip','NIP','18 digit')+f('pangkat','Pangkat / Gol.','Penata Tk.I - III/d')+f('jabatan','Jabatan','',1)+f('hp','No. HP / WhatsApp','08xxxxxxxxxx')+f('email','Email','nama@kemenkeu.go.id')+f('ket','Keterangan','Catatan singkat',1)+
 '<div class="fld"><label>Status</label><select class="inp" data-kf="_st"><option value="on"'+(kpOn(p)?' selected':'')+'>Aktif</option><option value="off"'+(kpOn(p)?'':' selected')+'>Tidak aktif (simpan sebagai riwayat)</option></select></div>'+
 '<div class="fld" data-kpoff><label>Tidak aktif sejak</label><input class="inp" type="date" data-kf="offSejak" value="'+esc(p.offSejak||'')+'"></div>'+
 '<div class="fld" data-kpoff><label>Alasan</label><select class="inp" data-kf="offAlasan">'+['',...KP_OFF_ALASAN].map(a=>'<option value="'+esc(a)+'"'+((p.offAlasan||'')===a?' selected':'')+'>'+(a||'— pilih —')+'</option>').join('')+'</select></div>'+
 '<div class="fld" data-kpoff><label>Diganti oleh / catatan</label><input class="inp" data-kf="offCatatan" value="'+esc(p.offCatatan||'')+'" placeholder="mis. digantikan Budi S."></div>'+
 '<div class="fld wide"><label>Foto</label><div class="kp-fr"><span id="kp-pv"></span><label class="btn sm" for="kp-ph">Pilih foto</label><input type="file" id="kp-ph" accept="image/*" hidden><button type="button" class="btn sm" id="kp-pc">Hapus foto</button></div>'+kqAdjUI()+'</div></div>';
 const ov=modal(isNew?'Tambah kontak PMO / CMO Unit':'Ubah kontak PMO / CMO Unit',body,'Simpan',ov=>{const o=Object.assign({},p);ov.querySelectorAll('[data-kf]').forEach(i=>o[i.dataset.kf]=i.value.trim());o.peran=[...ov.querySelectorAll('[data-role]:checked')].map(i=>i.dataset.role);o.foto=foto;const st=o._st;delete o._st;if(st==='off'){o.aktif=false;if(!o.offSejak)o.offSejak=new Date().toISOString().slice(0,10)}else{delete o.aktif;delete o.offSejak;delete o.offAlasan;delete o.offCatatan}
  if(!o.nama||!o.unit||!o.peran.length){toast('Peran, unit, dan nama wajib diisi.');return false}
  const dup=kpOn(o)&&kpPeople().find(x=>x._id!==o._id&&kpOn(x)&&((o.nip&&x.nip===o.nip)||(String(x.nama).toLowerCase()===o.nama.toLowerCase()&&x.unit===o.unit)));if(dup){toast('Kontak yang sama sudah ada ('+dup.nama+' · '+dup.unit+').');return false}
  kpPersonSave(o);log&&log((isNew?'Tambah':'Ubah')+' kontak PMO/CMO Unit',o.nama);save();render()},{size:'lg'});
 const pv=()=>{ov.querySelector('#kp-pv').innerHTML=kpAv({nama:ov.querySelector('[data-kf=nama]').value,foto},'lg')};pv();
 const adj=kqAdjBind(ov.querySelector('.kq-adj'),u=>{foto=u;pv()});adj.from(foto);
 const stSel=ov.querySelector('[data-kf=_st]'),stSync=()=>ov.querySelectorAll('[data-kpoff]').forEach(x=>x.hidden=stSel.value!=='off');stSel.addEventListener('change',stSync);stSync();
 ov.querySelector('#kp-ph').onchange=async e=>{const fl=e.target.files[0];if(!fl)return;try{foto=await kuResize(fl,160);pv();adj.from(foto)}catch(er){toast(er.message)}};ov.querySelector('#kp-pc').onclick=()=>{foto='';adj.hide();pv()};
 const prog=ov.querySelector('.kp-prog'),setP=(t,pc)=>{prog.hidden=false;prog.querySelector('em').textContent=t;prog.querySelector('i').style.width=(pc||0)+'%'};
 const run=async file=>{if(!file||!/^image\//.test(file.type)){toast('Pilih berkas gambar (PNG/JPG).');return}try{setP('Memuat mesin OCR…',5);const img=await kqLoadImage(await kqDataUrl(file));kqProgress=m=>{if(m&&m.status==='recognizing text')setP('Membaca teks… '+Math.round((m.progress||0)*100)+'%',10+(m.progress||0)*85)};const lines=await kqRunOcr(img),r=kqParseProfile(lines);
   const set=(k,v)=>{const i=ov.querySelector('[data-kf='+k+']');if(i&&v)i.value=v};['nama','nip','jabatan','pangkat','email'].forEach(k=>set(k,r[k]));set('hp',r.hp);
   const abbr=kqSuggestUnit(r.unitKerja);if(abbr){const uk=units.find(u=>u.toLowerCase()===abbr.toLowerCase());set('unit',uk||abbr)}
   const av=kqCropAvatar(img,r);if(av){foto=av;adj.show()}pv();setP(r.nama?'Selesai. Periksa hasil lalu klik Simpan.':'Teks terbaca tetapi nama tidak ditemukan — isi manual.',100);if(r.unitKerja&&!abbr)toast('Unit kerja terbaca: '+r.unitKerja+'. Pilih unit Eselon I secara manual.')}catch(er){setP('Gagal: '+er.message,0)}};
 const dr=ov.querySelector('#kp-drop');ov.querySelector('#kp-shot').onchange=e=>run(e.target.files[0]);dr.ondragover=e=>{e.preventDefault();dr.classList.add('on')};dr.ondragleave=()=>dr.classList.remove('on');dr.ondrop=e=>{e.preventDefault();dr.classList.remove('on');run(e.dataTransfer.files[0])};
 const onPaste=e=>{const it=[...(e.clipboardData&&e.clipboardData.items||[])].find(i=>/^image\//.test(i.type));if(it){run(it.getAsFile());e.preventDefault()}};document.addEventListener('paste',onPaste);new MutationObserver((m,ob)=>{if(!document.body.contains(ov)){document.removeEventListener('paste',onPaste);ob.disconnect()}}).observe(document.body,{childList:true});
 if(shot)setTimeout(()=>ov.querySelector('#kp-shot').click(),50)}
