/* ===== Hari libur nasional & cuti bersama Indonesia — Modul Transformasi =====
   Urutan sumber per tahun: (1) impor dokumen resmi (SKB/SE) yang disimpan Superadmin, (2) data resmi bawaan
   (SKB 3 Menteri 2026 & 2027), (3) proyeksi otomatis. Proyeksi libur nasional = hitungan astronomis & kriteria MABIMS
   (port dari Dashboard CM); proyeksi cuti bersama = pola SKB 2026–2027 (jembatan akhir pekan, rangkaian Idulfitri,
   Iduladha, Natal). Semua proyeksi ditandai "proyeksi" dan diganti otomatis begitu dokumen resmi diimpor. */
(function(){
'use strict';
const OFFICIAL={
2026:{
  '2026-01-01':{type:'national',id:'Tahun Baru 2026 Masehi',en:'New Year 2026'},
  '2026-01-16':{type:'national',id:'Isra Mikraj Nabi Muhammad saw.',en:"Prophet Muhammad's Isra Mi'raj"},
  '2026-02-16':{type:'collective',id:'Cuti Bersama Tahun Baru Imlek 2577 Kongzili',en:'Collective Leave — Chinese New Year 2577 Kongzili'},
  '2026-02-17':{type:'national',id:'Tahun Baru Imlek 2577 Kongzili',en:'Chinese New Year 2577 Kongzili'},
  '2026-03-18':{type:'collective',id:'Cuti Bersama Hari Suci Nyepi Tahun Baru Saka 1948',en:'Collective Leave — Nyepi, Saka New Year 1948'},
  '2026-03-19':{type:'national',id:'Hari Suci Nyepi (Tahun Baru Saka 1948)',en:'Nyepi (Saka New Year 1948)'},
  '2026-03-20':{type:'collective',id:'Cuti Bersama Idulfitri 1447 H',en:'Collective Leave — Eid al-Fitr 1447 H'},
  '2026-03-21':{type:'national',id:'Idulfitri 1447 H',en:'Eid al-Fitr 1447 H'},
  '2026-03-22':{type:'national',id:'Idulfitri 1447 H',en:'Eid al-Fitr 1447 H'},
  '2026-03-23':{type:'collective',id:'Cuti Bersama Idulfitri 1447 H',en:'Collective Leave — Eid al-Fitr 1447 H'},
  '2026-03-24':{type:'collective',id:'Cuti Bersama Idulfitri 1447 H',en:'Collective Leave — Eid al-Fitr 1447 H'},
  '2026-04-03':{type:'national',id:'Wafat Yesus Kristus',en:'Good Friday'},
  '2026-04-05':{type:'national',id:'Kebangkitan Yesus Kristus (Paskah)',en:'Easter Sunday'},
  '2026-05-01':{type:'national',id:'Hari Buruh Internasional',en:'International Labour Day'},
  '2026-05-14':{type:'national',id:'Kenaikan Yesus Kristus',en:'Ascension of Jesus Christ'},
  '2026-05-15':{type:'collective',id:'Cuti Bersama Kenaikan Yesus Kristus',en:'Collective Leave — Ascension of Jesus Christ'},
  '2026-05-27':{type:'national',id:'Iduladha 1447 H',en:'Eid al-Adha 1447 H'},
  '2026-05-28':{type:'collective',id:'Cuti Bersama Iduladha 1447 H',en:'Collective Leave — Eid al-Adha 1447 H'},
  '2026-05-31':{type:'national',id:'Hari Raya Waisak 2570 BE',en:'Vesak Day 2570 BE'},
  '2026-06-01':{type:'national',id:'Hari Lahir Pancasila',en:'Pancasila Day'},
  '2026-06-16':{type:'national',id:'1 Muharam Tahun Baru Islam 1448 H',en:'Islamic New Year 1448 H'},
  '2026-08-17':{type:'national',id:'Proklamasi Kemerdekaan',en:'Independence Day'},
  '2026-08-25':{type:'national',id:'Maulid Nabi Muhammad saw.',en:"Prophet Muhammad's Birthday"},
  '2026-12-24':{type:'collective',id:'Cuti Bersama Kelahiran Yesus Kristus',en:'Collective Leave — Christmas'},
  '2026-12-25':{type:'national',id:'Kelahiran Yesus Kristus',en:'Christmas Day'}
},
2027:{
  '2027-01-01':{type:'national',id:'Tahun Baru 2027 Masehi',en:'New Year 2027'},
  '2027-01-05':{type:'national',id:'Isra Mikraj Nabi Muhammad S.A.W. 1448 Hijriah',en:"Prophet Muhammad's Isra Mi'raj 1448 H"},
  '2027-02-05':{type:'collective',id:'Cuti Bersama Tahun Baru Imlek 2578 Kongzili',en:'Collective Leave — Chinese New Year 2578 Kongzili'},
  '2027-02-06':{type:'national',id:'Tahun Baru Imlek 2578 Kongzili',en:'Chinese New Year 2578 Kongzili'},
  '2027-03-08':{type:'national',id:'Hari Suci Nyepi (Tahun Baru Saka 1949)',en:'Nyepi (Saka New Year 1949)'},
  '2027-03-09':{type:'collective',id:'Cuti Bersama Idul Fitri 1448 Hijriah',en:'Collective Leave — Eid al-Fitr 1448 H'},
  '2027-03-10':{type:'national',id:'Idul Fitri 1448 Hijriah',en:'Eid al-Fitr 1448 H'},
  '2027-03-11':{type:'national',id:'Idul Fitri 1448 Hijriah',en:'Eid al-Fitr 1448 H'},
  '2027-03-12':{type:'collective',id:'Cuti Bersama Idul Fitri 1448 Hijriah',en:'Collective Leave — Eid al-Fitr 1448 H'},
  '2027-03-15':{type:'collective',id:'Cuti Bersama Idul Fitri 1448 Hijriah',en:'Collective Leave — Eid al-Fitr 1448 H'},
  '2027-03-25':{type:'collective',id:'Cuti Bersama Wafat Yesus Kristus',en:'Collective Leave — Good Friday'},
  '2027-03-26':{type:'national',id:'Wafat Yesus Kristus',en:'Good Friday'},
  '2027-03-28':{type:'national',id:'Kebangkitan Yesus Kristus (Paskah)',en:'Easter Sunday'},
  '2027-05-01':{type:'national',id:'Hari Buruh Internasional',en:'International Labour Day'},
  '2027-05-06':{type:'national',id:'Kenaikan Yesus Kristus',en:'Ascension of Jesus Christ'},
  '2027-05-17':{type:'national',id:'Iduladha 1448 Hijriah',en:'Eid al-Adha 1448 H'},
  '2027-05-18':{type:'collective',id:'Cuti Bersama Iduladha 1448 Hijriah',en:'Collective Leave — Eid al-Adha 1448 H'},
  '2027-05-19':{type:'collective',id:'Cuti Bersama Hari Raya Waisak 2571 BE',en:'Collective Leave — Vesak Day 2571 BE'},
  '2027-05-20':{type:'national',id:'Hari Raya Waisak 2571 BE',en:'Vesak Day 2571 BE'},
  '2027-06-01':{type:'national',id:'Hari Lahir Pancasila',en:'Pancasila Day'},
  '2027-06-06':{type:'national',id:'1 Muharam Tahun Baru Islam 1449 Hijriah',en:'Islamic New Year 1449 H'},
  '2027-08-15':{type:'national',id:'Maulid Nabi Muhammad S.A.W.',en:"Prophet Muhammad's Birthday"},
  '2027-08-17':{type:'national',id:'Proklamasi Kemerdekaan',en:'Independence Day'},
  '2027-12-24':{type:'collective',id:'Cuti Bersama Kelahiran Yesus Kristus',en:'Collective Leave — Christmas'},
  '2027-12-25':{type:'national',id:'Kelahiran Yesus Kristus',en:'Christmas Day'},
  '2027-12-26':{type:'national',id:'Isra Mikraj Nabi Muhammad S.A.W. 1449 Hijriah',en:"Prophet Muhammad's Isra Mi'raj 1449 H"}
}
};
OFFICIAL.label={2026:'SKB 3 Menteri — Hari Libur Nasional dan Cuti Bersama Tahun 2026',2027:'SKB 3 Menteri Nomor 1205/2026, 3/2026, 2/2026 — Hari Libur Nasional dan Cuti Bersama Tahun 2027'};
function holEaster(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(Date.UTC(y,mo-1,da));}
/* Fase bulan (Meeus, Astronomical Algorithms bab 49) → waktu UTC (ms). phase: 0 baru, 0.5 purnama */
function holMoonPhase(k,phase){
 k=Math.floor(k)+phase;const T=k/1236.85,R=Math.PI/180;
 let JDE=2451550.09766+29.530588861*k+0.00015437*T*T-0.00000015*T*T*T+0.00000000073*T*T*T*T;
 const E=1-0.002516*T-0.0000074*T*T,M=(2.5534+29.1053567*k-0.0000014*T*T)*R,Mp=(201.5643+385.81693528*k+0.0107582*T*T+0.00001238*T*T*T)*R,F=(160.7108+390.67050284*k-0.0016118*T*T)*R,Om=(124.7746-1.56375588*k+0.0020672*T*T)*R;
 const s=Math.sin;
 if(phase===0)JDE+=-0.40720*s(Mp)+0.17241*E*s(M)+0.01608*s(2*Mp)+0.01039*s(2*F)+0.00739*E*s(Mp-M)-0.00514*E*s(Mp+M)+0.00208*E*E*s(2*M)-0.00111*s(Mp-2*F)-0.00057*s(Mp+2*F)+0.00056*E*s(2*Mp+M)-0.00042*s(3*Mp)+0.00042*E*s(M+2*F)+0.00038*E*s(M-2*F)-0.00024*E*s(2*Mp-M)-0.00017*s(Om);
 else JDE+=-0.40614*s(Mp)+0.17302*E*s(M)+0.01614*s(2*Mp)+0.01043*s(2*F)+0.00734*E*s(Mp-M)-0.00515*E*s(Mp+M)+0.00209*E*E*s(2*M)-0.00111*s(Mp-2*F)-0.00057*s(Mp+2*F)+0.00056*E*s(2*Mp+M)-0.00042*s(3*Mp)+0.00042*E*s(M+2*F)+0.00038*E*s(M-2*F)-0.00024*E*s(2*Mp-M)-0.00017*s(Om);
 return (JDE-2440587.5)*86400000-69000; /* TT→UTC ≈ 69 detik */
}
function holLocalDate(ms,tzHours){const d=new Date(ms+tzHours*3600000);return d.toISOString().slice(0,10);}
/* Semua fase dalam rentang tahun (tanggal lokal) */
function holPhases(year,phase,tz){const out=[];const k0=Math.floor((year-2000)*12.3685)-2;for(let k=k0;k<k0+16;k++){const ms=holMoonPhase(k,phase),d=holLocalDate(ms,tz);if(d.slice(0,4)==String(year))out.push(d);}return out;}
function holAddDays(iso,n){const d=new Date(iso+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
/* Kalender Hijriah via Intl (Umm al-Qura) */
function holHijriFmt(){for(const cal of ['islamic-umalqura','islamic-civil','islamic']){try{const f=new Intl.DateTimeFormat('en-u-ca-'+cal+'-nu-latn',{day:'numeric',month:'numeric',year:'numeric',timeZone:'UTC'});const p=f.formatToParts(new Date(Date.UTC(2026,2,20)));if(p.some(x=>x.type==='month'))return f;}catch(e){}}return null;}
function holHijriDays(year){const f=holHijriFmt();if(!f)return [];const out=[];for(let t=Date.UTC(year,0,1);t<Date.UTC(year+1,0,1);t+=86400000){const p=f.formatToParts(new Date(t)),g=k=>Number((p.find(x=>x.type===k)||{}).value);out.push({iso:new Date(t).toISOString().slice(0,10),d:g('day'),m:g('month'),y:Number(String((p.find(x=>x.type==='relatedYear'||x.type==='year')||{}).value).replace(/\D/g,''))});}return out;}

/* Posisi matahari & bulan presisi rendah (Meeus) → awal bulan Hijriah kriteria MABIMS
   (tinggi hilal ≥ 3°, elongasi ≥ 6,4° saat matahari terbenam; titik uji Aceh, wilayah paling barat). */
const H_R=Math.PI/180;
function holJd(ms){return ms/86400000+2440587.5;}
function holEq(l,b,e){return {ra:Math.atan2(Math.sin(l)*Math.cos(e)-Math.tan(b)*Math.sin(e),Math.cos(l)),dec:Math.asin(Math.sin(b)*Math.cos(e)+Math.cos(b)*Math.sin(e)*Math.sin(l))};}
function holSun(J){const R=H_R,T=(J-2451545)/36525,L0=280.46646+36000.76983*T,M=(357.52911+35999.05029*T)*R,C=(1.914602-0.004817*T)*Math.sin(M)+0.019993*Math.sin(2*M)+0.000289*Math.sin(3*M);return holEq(((L0+C)%360)*R,0,(23.439291-0.0130042*T)*R);}
function holMoon(J){const R=H_R,T=(J-2451545)/36525,Lp=218.3164477+481267.88123421*T,D=(297.8501921+445267.1114034*T)*R,M=(357.5291092+35999.0502909*T)*R,Mp=(134.9633964+477198.8675055*T)*R,F=(93.272095+483202.0175233*T)*R,s=Math.sin;
 const lon=Lp+6.288774*s(Mp)+1.274027*s(2*D-Mp)+0.658314*s(2*D)+0.213618*s(2*Mp)-0.185116*s(M)-0.114332*s(2*F)+0.058793*s(2*D-2*Mp)+0.057066*s(2*D-M-Mp)+0.053322*s(2*D+Mp)+0.045758*s(2*D-M)-0.040923*s(M-Mp)-0.034720*s(D)-0.030383*s(M+Mp);
 const lat=5.128122*s(F)+0.280602*s(Mp+F)+0.277693*s(Mp-F)+0.173237*s(2*D-F)+0.055413*s(2*D-Mp+F)+0.046271*s(2*D-Mp-F);
 return holEq(lon*R,lat*R,(23.439291-0.0130042*T)*R);}
function holAlt(p,J,latD,lonD){const R=H_R,T=(J-2451545)/36525,gmst=280.46061837+360.98564736629*(J-2451545)+0.000387933*T*T,H=(gmst+lonD)*R-p.ra,la=latD*R;return Math.asin(Math.sin(la)*Math.sin(p.dec)+Math.cos(la)*Math.cos(p.dec)*Math.cos(H))/R;}
function holElong(a,b){return Math.acos(Math.sin(a.dec)*Math.sin(b.dec)+Math.cos(a.dec)*Math.cos(b.dec)*Math.cos(a.ra-b.ra))/H_R;}
const H_OBS={lat:5.55,lon:95.32};
function holSunset(iso){let t=Date.parse(iso+'T09:30:00Z');for(let i=0;i<240;i++){const J=holJd(t);if(holAlt(holSun(J),J,H_OBS.lat,H_OBS.lon)<-0.83)return t;t+=60000;}return t;}
function holMabimsStart(conjMs){const wib=holLocalDate(conjMs,7);let d=wib;for(let i=0;i<3;i++){const ss=holSunset(d);if(ss>conjMs){const J=holJd(ss),sn=holSun(J),mn=holMoon(J);if(holAlt(mn,J,H_OBS.lat,H_OBS.lon)>=3&&holElong(sn,mn)>=6.4)return holAddDays(d,1);}d=holAddDays(d,1);}return holAddDays(wib,2);}
/* Hari besar Islam tahun tertentu: [{iso,m,d,y}] — awal bulan MABIMS, nomor bulan dari kalender Hijriah browser. */
function holIslamicDays(year){const f=holHijriFmt();if(!f)return [];const lab=iso=>{const p=f.formatToParts(new Date(iso+'T00:00:00Z')),g=k=>Number(String((p.find(x=>x.type===k)||{}).value||'').replace(/\D/g,''));return {m:g('month'),y:g('relatedYear')||g('year')};};
 const out=[],k0=Math.floor((year-2000)*12.3685)-2;for(let k=k0;k<k0+16;k++){const st=holMabimsStart(holMoonPhase(k,0)),h=lab(holAddDays(st,14));[[7,27],[10,1],[10,2],[12,10],[1,1],[3,12]].forEach(([m,dd])=>{if(h.m!==m)return;const iso=holAddDays(st,dd-1);if(iso.slice(0,4)===String(year))out.push({iso,m,d:dd,y:h.y});});}return out;}

const DOW=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const dowOf=iso=>new Date(iso+'T00:00:00Z').getUTCDay();
const addDays=holAddDays;
function nationalEstimate(year){
 const items={};const add=(iso,id,approx)=>{if(!iso||iso.slice(0,4)!==String(year)||items[iso])return;items[iso]={type:'national',id:id+(approx?' (proyeksi)':''),key:''};return items[iso]};
 const k=(o,key)=>{if(o)o.key=key};
 add(year+'-01-01','Tahun Baru '+year+' Masehi');
 add(year+'-05-01','Hari Buruh Internasional');
 add(year+'-06-01','Hari Lahir Pancasila');
 add(year+'-08-17','Proklamasi Kemerdekaan');
 k(add(year+'-12-25','Kelahiran Yesus Kristus'),'natal');
 const easter=holEaster(year).toISOString().slice(0,10);
 k(add(addDays(easter,-2),'Wafat Yesus Kristus'),'wafat');
 add(easter,'Kebangkitan Yesus Kristus (Paskah)');
 k(add(addDays(easter,39),'Kenaikan Yesus Kristus'),'kenaikan');
 const nmCN=holPhases(year,0,8).find(d=>d>=year+'-01-21');if(nmCN)k(add(nmCN,'Tahun Baru Imlek '+(year+551)+' Kongzili',true),'imlek');
 const nmBali=holPhases(year,0,8).find(d=>d>=year+'-03-01'&&d<=year+'-04-05');if(nmBali)k(add(nmBali,'Hari Suci Nyepi (Tahun Baru Saka '+(year-78)+')',true),'nyepi');
 const fm=holPhases(year,0.5,7).find(d=>d>=year+'-05-06');if(fm)k(add(fm,'Hari Raya Waisak '+(year+544)+' BE',true),'waisak');
 holIslamicDays(year).forEach(h=>{
  if(h.m===7&&h.d===27)add(h.iso,'Isra Mikraj Nabi Muhammad saw. '+h.y+' H',true);
  if(h.m===10&&h.d===1)k(add(h.iso,'Idulfitri '+h.y+' H',true),'fitri1');
  if(h.m===10&&h.d===2)k(add(h.iso,'Idulfitri '+h.y+' H (hari kedua)',true),'fitri2');
  if(h.m===12&&h.d===10)k(add(h.iso,'Iduladha '+h.y+' H',true),'adha');
  if(h.m===1&&h.d===1)add(h.iso,'1 Muharam Tahun Baru Islam '+h.y+' H',true);
  if(h.m===3&&h.d===12)add(h.iso,'Maulid Nabi Muhammad saw.',true);
 });
 return items;
}
/* Proyeksi cuti bersama mengikuti pola SKB 2026–2027. */
function collectiveEstimate(year,nat){
 const out={},isOff=iso=>{const d=dowOf(iso);return d===0||d===6||!!nat[iso]};
 const put=(iso,lab)=>{if(!iso||iso.slice(0,4)!==String(year)||isOff(iso)||out[iso])return;out[iso]={type:'collective',id:'Cuti Bersama '+lab.replace(/ \(proyeksi\)|\s*\(hari kedua\)/g,'')+' (proyeksi)'}};
 const byKey=key=>Object.keys(nat).find(d=>nat[d].key===key);
 const nameOf=iso=>nat[iso].id;
 // Idulfitri: sehari sebelum + dua hari kerja setelah hari kedua
 const f1=byKey('fitri1'),f2=byKey('fitri2')||(f1&&addDays(f1,1));
 if(f1){put(addDays(f1,-1),nameOf(f1));let d=f2,n=0,g=0;while(n<2&&g<10){d=addDays(d,1);g++;if(!isOff(d)){put(d,nameOf(f1));n++}}}
 // Iduladha: hari kerja sesudahnya (Senin–Kamis)
 const ad=byKey('adha');if(ad){const w=dowOf(ad);if(w>=1&&w<=3)put(addDays(ad,1),nameOf(ad));else if(w===4)put(addDays(ad,1),nameOf(ad));else if(w===6)put(addDays(ad,-1),nameOf(ad))}
 // Natal: 24 Desember bila hari kerja; bila Natal hari Kamis → 26 Desember
 const nt=byKey('natal');if(nt){const w=dowOf(nt);if(w===4)put(addDays(nt,1),nameOf(nt));else put(addDays(nt,-1),nameOf(nt))}
 // Jembatan akhir pekan: Selasa → Senin, Kamis → Jumat, Sabtu → Jumat (Imlek)
 ['imlek','nyepi','kenaikan','waisak'].forEach(key=>{const d=byKey(key);if(!d)return;const w=dowOf(d);
  if(w===2)put(addDays(d,-1),nameOf(d));else if(w===4)put(addDays(d,1),nameOf(d));else if(w===6&&key==='imlek')put(addDays(d,-1),nameOf(d))});
 return out;
}
const CACHE={};
function estimate(year){year=Number(year);if(!CACHE[year]){const nat=nationalEstimate(year),col=collectiveEstimate(year,nat),items={};
  Object.keys(Object.assign({},nat,col)).sort().forEach(d=>{const v=nat[d]||col[d];items[d]={type:v.type,id:v.id}});CACHE[year]=items}return CACHE[year]}
/* ---- Pembaca dokumen SKB / daftar libur (teks hasil PDF, Word, Excel, atau OCR gambar) ---- */
const MONTHS={januari:1,februari:2,pebruari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,nopember:11,desember:12};
const MONTH_RE='(januari|februari|pebruari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)';
const DAY_RE=/\b(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|ahad)\b/gi;
function fixOcr(t){return String(t||'').replace(/\b([0-9OIlo]{1,2})(?=\s*[-–]?\s*(?:\d{1,2}\s+)?(januari|februari|pebruari|maret|april|mei|juni|juli|agustus|september|oktober|november|nopember|desember)\b)/gi,m=>m.replace(/[Oo]/g,'0').replace(/[Il]/g,'1')).replace(/\bJanuar[il1]\b/gi,'Januari').replace(/\bFebruar[il1]\b/gi,'Februari').replace(/\bJun[il1]\b/gi,'Juni').replace(/\bJul[il1]\b/gi,'Juli')}
function guessYear(lines){const c={};lines.join(' ').replace(/tahun\s+(20\d\d)/gi,(m,y)=>{c[y]=(c[y]||0)+3;return m}).replace(new RegExp(MONTH_RE+'\\s+(20\\d\\d)','gi'),(m,mo,y)=>{c[y]=(c[y]||0)+1;return m}).replace(/(?:nasional|bersama)\s+(20\d\d)/gi,(m,y)=>{c[y]=(c[y]||0)+3;return m});const best=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return best?Number(best[0]):new Date().getFullYear()+1}
const validIso=iso=>{const d=new Date(iso+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===iso};
function parse(lines,year){
 lines=lines.map(fixOcr);const out=[];let mode='national',last=null;
 const dateRe=new RegExp('((?:\\d{1,2}\\s*(?:,|-|–|—|s\\.?\\s*d\\.?|sampai(?:\\s+dengan)?|dan|&)\\s*)*\\d{1,2})\\s+'+MONTH_RE+'(?:\\s+(20\\d\\d))?','gi');
 const monTest=new RegExp('\\d{1,2}\\s+'+MONTH_RE,'i');
 lines.forEach(raw=>{
  const line=String(raw||'').replace(/\s+/g,' ').trim().replace(/^[•\-–*]?\s*\d{1,3}\s*[a-z]{0,2}\s*[.)]\s+(?=\D)/i,'').replace(/[,;:.]+$/,'');if(!line)return;
  const low=line.toLowerCase();
  if(!monTest.test(line)){
   if(/cuti\s+bersama/i.test(line)&&!/libur\s+nasional/i.test(line))mode='collective';
   else if(/libur\s+nasional/i.test(line)&&!/cuti\s+bersama/i.test(line))mode='national';
   if(last&&!/^(no\.?|nomor|tanggal|hari|keterangan|lampiran|menteri|ttd|ditetapkan|salinan|berikut|sementara)\b/i.test(low)&&line.length<90&&!/libur\s+nasional|cuti\s+bersama/i.test(line)&&/^[a-z(]/i.test(line))last.forEach(it=>{if(it.name.length<140)it.name=(it.name+' '+line).trim()});
   return}
  let m,found=[];dateRe.lastIndex=0;
  while((m=dateRe.exec(line))){const mo=MONTHS[m[2].toLowerCase()],y=Number(m[3]||year),days=(m[1].match(/\d{1,2}/g)||[]).map(Number);
   let list=days;if(days.length===2&&/-|–|—|s\.?\s*d|sampai/i.test(m[1])&&days[1]>days[0])list=Array.from({length:days[1]-days[0]+1},(_,i)=>days[0]+i);
   list.forEach(d=>{if(d>=1&&d<=31)found.push(y+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0'))})}
  if(!found.length)return;
  let name=line.replace(dateRe,' ').replace(DAY_RE,' ').replace(/^\s*\d{1,2}\s*[.)]?\s+/,' ').replace(/\b(s\.?\s*d\.?|sampai dengan|dan)\b/gi,' ').replace(/\s*[-–—,;:|]\s*(?=[-–—,;:|]|$)/g,' ').replace(/\s+/g,' ').replace(/^[\s\-–—,.;:|]+|[\s\-–—,;:|]+$/g,'').trim();
  const type=/cuti\s+bersama/i.test(name)?'collective':mode;
  if(type==='collective'&&name&&!/cuti\s+bersama/i.test(name))name='Cuti Bersama '+name;
  const dows=(line.match(DAY_RE)||[]).map(w=>w.toLowerCase().replace("'",'').replace('ahad','minggu'));
  last=found.filter(validIso).map((date,i)=>({date,type,name,dow:found.length===1?dows[0]||'':(dows.length===found.length?dows[i]:'')}));
  out.push(...last);
 });
 const seen=new Map();out.forEach(it=>{const k=it.date+'|'+it.type,cur=seen.get(k);if(!cur)seen.set(k,it);else if(it.name&&cur.name!==it.name)cur.name=cur.name?cur.name+' / '+it.name:it.name});
 return [...seen.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
const dowName=iso=>DOW[dowOf(iso)];
function cleanTableImage(cv){
 const ctx=cv.getContext('2d'),W=cv.width,H=cv.height,img=ctx.getImageData(0,0,W,H),d=img.data,dark=new Uint8Array(W*H),kill=new Uint8Array(W*H);
 for(let i=0;i<W*H;i++)dark[i]=(.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2])<150?1:0;
 for(let y=0;y<H;y++){let run=0;for(let x=0;x<=W;x++){if(x<W&&dark[y*W+x])run++;else{if(run>W*.12)for(let k=x-run;k<x;k++)kill[y*W+k]=1;run=0;}}}
 for(let x=0;x<W;x++){let run=0;for(let y=0;y<=H;y++){if(y<H&&dark[y*W+x])run++;else{if(run>H*.03)for(let k=y-run;k<y;k++)kill[k*W+x]=1;run=0;}}}
 for(let i=0;i<W*H;i++){const v=dark[i]&&!kill[i]?0:255;d[i*4]=d[i*4+1]=d[i*4+2]=v;d[i*4+3]=255;}
 ctx.putImageData(img,0,0);
}

window.MT_LIBUR={OFFICIAL,estimate,parse,guessYear,dowName,dowOf,cleanTableImage};
})();
