#!/usr/bin/env python3
"""DCM 261114-42: implement selected Filter Peringkat Opsi 1 and substantive manual.
Constrained to Priority snapshot UI, two missing primary-menu manual mappings,
five Priority sub-guides, and accurate limits across the existing articles.
"""
from pathlib import Path
import re
p=Path("index.html")
old=p.read_text("utf8")
s=old

# 1. Snapshot is a historical ranking comparison, NOT a backup or restore.
a=s.index("function prioSnapBarHtml(can){")
b=s.index("function prioSnapDelta(",a)
part=s[a:b]
before="""<button type="button" class="btn btn-outline btn-sm" id="prioSnapSave">📸 ${uiText('Save snapshot','Simpan snapshot')}</button>"""
after='''<button type="button" class="btn btn-outline btn-sm" id="prioSnapSave" title="${uiText('Record scores and ranking at this moment for future comparison; this is not a backup or a change to project records.','Rekam skor dan peringkat saat ini untuk dibandingkan kelak; bukan backup dan tidak mengubah proyek.')}">📸 ${uiText('Save snapshot','Simpan snapshot')}</button><details class="prio-snapshot-help"><summary aria-label="${uiText('What does Save Snapshot do?','Apa fungsi Simpan Snapshot?')}" title="${uiText('Explanation of snapshot','Penjelasan fungsi snapshot')}">ⓘ</summary><div class="prio-snapshot-popover" role="note"><strong>${uiText('What is a ranking snapshot?','Apa itu snapshot peringkat?')}</strong><p>${uiText('It records each ranked project’s score, rank, priority category and Ministry status at the time of saving. Choose it in Compare with to see changes in position later.','Merekam skor, peringkat, kategori prioritas, dan status tingkat Kementerian tiap proyek saat disimpan. Pilih pada Bandingkan dengan untuk melihat perubahan posisi di waktu berikutnya.')}</p><small>${uiText('Not an application backup. Does not change project data. Only authorized editors can save; the latest 40 snapshots are retained.','Bukan backup aplikasi dan tidak mengubah proyek. Hanya pengguna berhak edit yang dapat menyimpan; maksimal 40 snapshot terbaru dipertahankan.')}</small></div></details>'''
assert part.count(before)==1,("Original Snapshot button changed",part.count(before))
part=part.replace(before,after,1)
s=s[:a]+part+s[b:]

# 2. Add focused, discoverable guides for missing primary menus and all
# Priority subtabs, based on the exact existing data paths.
anchor="CM_USER_MANUAL_ARTICLES.forEach(a=>{if(CM_MANUAL_FUNCTIONS[a.id])a.functions=CM_MANUAL_FUNCTIONS[a.id];});"
assert s.count(anchor)==1
articles=r"""
/* DCM-42: documented functions, limitations and real workflow for previously
   unmapped Priority and Pusmantap menus, including each Priority subtab. */
CM_USER_MANUAL_ARTICLES.push(
 {id:'priority-projects',category:{en:'Prioritization',id:'Prioritas'},
  title:{en:'Ranking Transformation Projects',id:'Pemeringkatan Proyek Transformasi'},
  summary:{en:'Rank active transformation projects using weighted criteria, scope, thresholds, and details.',id:'Membandingkan proyek transformasi aktif dengan kriteria berbobot, lingkup, ambang batas dan rincian.'},
  keywords:['priority','prioritas','score','kriteria','proyek','scope','peringkat'],
  functions:{en:['Ranking scores compare active Proposed/Ongoing projects using weighted project criteria; status and readiness evidence affect interpretation.','Scope selects the comparison population without editing the underlying project records.','KPI cards filter the detail list by priority level or open the top-ranked project.'],
   id:['Skor prioritas membandingkan proyek berstatus Usulan/Berjalan dengan kriteria proyek berbobot; bukti kesiapan dan manfaat memengaruhi interpretasi.','Lingkup Peringkat menentukan kelompok proyek yang dibandingkan tanpa mengubah record sumber.','Kartu KPI memfilter rincian berdasarkan tingkat prioritas atau membuka proyek peringkat teratas.']},
  steps:{en:['Open Prioritas > Proyek and read the five project KPI cards.','Choose All, an Echelon I unit, a continuing program, a theme, or Ministry level in Ranking Scope.','Use search, status chips, sorting and List/Quadrant to inspect projects.','Open project Details to check missing CRA, POSTER or user-count data before deciding on Ministry-level eligibility.'],
   id:['Buka Prioritas > Proyek dan lihat lima KPI proyek.','Pilih Semua, UE I, program berkelanjutan, tema, atau Tingkat Kementerian pada Lingkup Peringkat.','Gunakan pencarian, chip status, urutan Skor/Go-live/Nama dan Daftar/Kuadran untuk meninjau proyek.','Buka Rincian untuk memeriksa CRA, POSTER atau jumlah pengguna yang belum lengkap sebelum mempertimbangkan kelayakan tingkat Kementerian.']},
  note:{en:'Ranking is decision support, not approval. Completed/On-Hold projects are outside the active ranking; incomplete evidence may use a neutral value of 3.',id:'Ranking adalah alat bantu keputusan, bukan persetujuan. Proyek Selesai/Ditunda di luar peringkat aktif; bukti yang kosong dapat menggunakan nilai netral 3.'}},
 {id:'priority-criteria',category:{en:'Prioritization',id:'Prioritas'},
  title:{en:'Criteria, Weights and Scoring',id:'Kriteria, Bobot, dan Perhitungan Skor'},
  summary:{en:'Review weighted scoring rules and the effect of changes on project ranking.',id:'Memahami kriteria berbobot dan dampak perubahan bobot terhadap skor proyek.'},
  keywords:['C1','criteria','bobot','rubrik','normalisasi','skor'],
  functions:{en:['Criteria and rubrics convert project responses into comparable scores; weights determine each criterion’s contribution.','The weight history shows prior adjustments.'],
   id:['Kriteria dan rubrik mengubah penilaian proyek menjadi skor yang dapat dibandingkan; bobot menentukan kontribusi setiap kriteria.','Riwayat bobot menunjukkan perubahan pengaturan terdahulu.']},
  steps:{en:['Open Prioritas > Criteria & Weights.','Review each scoring criterion, weight and rubric before editing.','Authorized users may save reasoned weight changes and then recheck rankings.'],
   id:['Buka Prioritas > Kriteria & Bobot.','Tinjau kriteria, bobot dan rubrik sebelum mengubah pengaturan.','Pengguna berwenang dapat menyimpan perubahan bobot beserta alasan dan memeriksa dampak pada peringkat.']},
  note:{en:'Changing weights can change all project scores; prior snapshots are historical records rather than recalculated results.',id:'Perubahan bobot dapat mengubah skor seluruh proyek; snapshot lama adalah rekaman historis, bukan hasil yang dihitung ulang.'}},
 {id:'priority-monev',category:{en:'Prioritization',id:'Prioritas'},
  title:{en:'Monitoring Benefit Indicators',id:'Monitoring Indikator dan Manfaat'},
  summary:{en:'Track target-versus-actual project benefit indicators over the recorded periods.',id:'Memantau target dan realisasi indikator manfaat proyek menurut periode yang dicatat.'},
  keywords:['monev','indikator','manfaat','target','realisasi'],
  functions:{en:['Benefit indicators track project outcomes in the Monitoring & Evaluation workspace.','Reported progress comes from stored target and actual values.'],
   id:['Indikator manfaat menelusuri capaian hasil proyek melalui ruang Monitoring & Evaluasi.','Progres ditampilkan dari target dan realisasi yang tercatat.']},
  steps:{en:['Open Prioritas > Monitoring Indicators & Benefits.','Select a project, period or indicator and review target versus actual.','Complete/update evidence and generate the available M&E report if needed.'],
   id:['Buka Prioritas > Monev Indikator & Manfaat.','Pilih proyek, periode atau indikator lalu bandingkan target dengan realisasi.','Lengkapi data pendukung dan buat laporan Monev jika diperlukan.']},
  note:{en:'Missing or unverified outcomes must not be interpreted as achieved benefits.',id:'Indikator tanpa bukti atau realisasi tervalidasi tidak boleh dianggap sebagai manfaat yang telah tercapai.'}},
 {id:'priority-references',category:{en:'Prioritization',id:'Prioritas'},
  title:{en:'Understanding Reference Formulas',id:'Memahami Referensi dan Rumus'},
  summary:{en:'Read the scoring rubric, POSTER and risk references used to interpret priority results.',id:'Membaca rubrik skor, POSTER, dan referensi risiko yang mendasari hasil prioritas.'},
  keywords:['referensi','formula','rumus','POSTER','risk','risiko'],
  functions:{en:['Scoring references explain how criterion, benefit and risk assessments are interpreted.','Authorized editors can maintain textual reference descriptions and rubrics.'],
   id:['Referensi menjelaskan cara kriteria, manfaat dan risiko diterjemahkan dalam penilaian.','Editor berwenang dapat memperbarui penjelasan dan rubrik referensi.']},
  steps:{en:['Open Prioritas > References & Formulas.','Review criteria, POSTER and risk descriptions alongside project details.','If authorized, revise reference text carefully and verify its effect before reuse.'],
   id:['Buka Prioritas > Referensi & Formula.','Baca penjelasan kriteria, POSTER dan risiko berdampingan dengan Rincian Proyek.','Jika berwenang, revisi referensi dengan cermat dan validasi sebelum digunakan lagi.']},
  note:{en:'Reference text alone is not formal regulatory approval; verify the current official basis.',id:'Teks referensi di aplikasi bukan pengesahan regulasi; periksa dasar resmi yang berlaku.'}},
 {id:'priority-snapshot',category:{en:'Prioritization',id:'Prioritas'},
  title:{en:'Saving and Comparing Ranking Snapshots',id:'Menyimpan dan Membandingkan Snapshot Peringkat'},
  summary:{en:'Capture a point-in-time score/rank baseline and compare future changes without altering projects.',id:'Menyimpan kondisi skor/peringkat pada satu waktu untuk dibandingkan dengan perubahan berikutnya tanpa mengubah proyek.'},
  keywords:['snapshot','bandingkan','riwayat','peringkat','baseline','baseline ranking'],
  functions:{en:['Save Snapshot records each ranked project’s score, absolute rank, priority category and Ministry status, with a label, timestamp and author.','Compare with displays movement against the chosen historical ranking snapshot.'],
   id:['Simpan Snapshot merekam skor, peringkat absolut, kategori prioritas dan status tingkat Kementerian setiap proyek, beserta label, waktu dan pembuat.','Bandingkan dengan menampilkan perubahan posisi relatif terhadap snapshot historis terpilih.']},
  steps:{en:['Open Prioritas > Proyek and choose Save Snapshot.','Enter a meaningful label such as a date or change-control milestone.','After project values change, choose the saved entry in Compare with to review movements in rank.','Use rename/delete only if your account has edit rights.'],
   id:['Buka Prioritas > Proyek lalu klik Simpan Snapshot.','Isi label yang mudah dikenali, misalnya tanggal atau momen change request.','Setelah data proyek berubah, pilih snapshot lama pada Bandingkan dengan untuk melihat pergeseran peringkat.','Ubah label atau hapus hanya jika akun memiliki hak edit.']},
  note:{en:'Snapshots are not backups and do not restore data. At most 40 recent snapshots are kept; an automatic snapshot may also be captured once per quarter.',id:'Snapshot bukan backup dan tidak memulihkan data. Maksimal 40 snapshot terbaru disimpan; snapshot otomatis juga dapat dibuat sekali per kuartal.'}},
 {id:'tim-pusmantap',category:{en:'Personnel',id:'Tim Pusmantap'},
  title:{en:'Pusmantap Staff and Team Directory',id:'Direktori Pegawai dan Tim Pusmantap'},
  summary:{en:'Identify Pusmantap staff, structural roles and team assignments for coordination.',id:'Menemukan pegawai Pusmantap, jabatan struktural dan penempatan tim untuk kebutuhan koordinasi.'},
  keywords:['pusmantap','pegawai','staf','struktural','tim','PIC'],
  functions:{en:['The directory groups people and internal team assignments for contact lookup and operational coordination.'],
   id:['Direktori mengelompokkan personel dan penempatan tim internal untuk pencarian kontak serta koordinasi pekerjaan.']},
  steps:{en:['Open Tim Pusmantap from the main navigation.','Review structural positions and staff/team assignments.','Use search or available editing controls according to your access rights.'],
   id:['Buka Tim Pusmantap dari navigasi utama.','Tinjau jabatan struktural dan penempatan pegawai dalam tim.','Gunakan pencarian atau kontrol pengelolaan sesuai hak akses akun.']},
  note:{en:'The application roster is a working reference; it does not amend official organizational or assignment decrees.',id:'Daftar aplikasi adalah referensi kerja dan tidak mengubah keputusan organisasi atau penugasan resmi.'}}
);
"""
s=s.replace(anchor,articles+"\n"+anchor,1)

# 3. Complete the header manual's mapping for EVERY primary menu.
map_anchor="  overview:'overview',table:'activities',tasks:'cm-team-tasks',calendar:'today-calendar',kanban:'workboard',matrix:'matrix',knowledge:'knowledge',contact:'squad',resource:'resource',"
mapped="  overview:'overview',table:'activities',tasks:'cm-team-tasks',calendar:'today-calendar',kanban:'workboard',matrix:'matrix',knowledge:'knowledge',contact:'squad',resource:'resource',priority:'priority-projects',pusmantap:'tim-pusmantap',"
assert s.count(map_anchor)==1,("Manual primary menu map changed",s.count(map_anchor))
s=s.replace(map_anchor,mapped,1)
old_context="function cmManualArticleForContext(tab=state.activeTab){if(tab==='survey')return CM_MANUAL_FEATURE_MAP[`survey:${cmSurveyState.subtab||'create'}`]||'cra-create';return CM_MANUAL_FEATURE_MAP[tab]||'getting-started';}"
new_context="function cmManualArticleForContext(tab=state.activeTab){if(tab==='survey')return CM_MANUAL_FEATURE_MAP[`survey:${cmSurveyState.subtab||'create'}`]||'cra-create';if(tab==='priority'){const key=typeof prioUi!=='undefined'&&prioUi?prioUi.tab:'projects';return ({projects:'priority-projects',criteria:'priority-criteria',monev:'priority-monev',reference:'priority-references'})[key]||'priority-projects';}return CM_MANUAL_FEATURE_MAP[tab]||'getting-started';}"
assert s.count(old_context)==1,("Manual context route changed",s.count(old_context))
s=s.replace(old_context,new_context,1)
required_old="concat(['getting-started','cra-answer','backup','ai-assistant','reminders','whats-new','crud-guide','ai-reference-library'])"
required_new="concat(['getting-started','cra-answer','backup','ai-assistant','reminders','whats-new','crud-guide','ai-reference-library','priority-criteria','priority-monev','priority-references','priority-snapshot'])"
assert s.count(required_old)==1
s=s.replace(required_old,required_new,1)

# 4. Audit/append concrete limitations to every pre-existing manual article;
# use the existing detailed steps/functions rather than replacing them.
limits={
 'getting-started':'Guest access is limited by menu/role; entering through Google does not by itself grant editing rights.',
 'overview':'Figures and charts reflect the filtered Activity records, not forecasts or formal performance verification.',
 'activities':'Editing or deleting requires a permitted account; audit history records changes but does not validate submitted documents.',
 'today-calendar':'Dates and times are taken from Activity data; the calendar does not confirm actual attendance.',
 'workboard':'Board cards share the Activity dataset; status changes should reflect actual progress.',
 'matrix':'Color intensity measures activity counts, not effectiveness or strategic importance.',
 'knowledge':'AI/reference search quality depends on indexed extractable text and document version/access.',
 'cra-create':'Once respondents submit, question structure is locked; create a new version for an altered instrument.',
 'cra-share-qr':'One public URL/QR serves the chosen roles; dashboard login rights are separate from public response access.',
 'cra-answer':'Low Likert values 1–2 require explanations; self-reported answers are perceptions, not independent operational proof.',
 'cra-analytics':'Small role samples should be flagged as insufficient; CRA does not automatically prove actual user adoption.',
 'cra-action-plan':'An action remains the master monitoring record even if linked to Activity; closing has workflow conditions.',
 'cra-rounds-version':'Compare consistent measurement series and versions; avoid interpreting noncomparable samples as trends.',
 'cra-question-bank':'Changes apply to future survey creation; existing surveys retain their saved instrument snapshot.',
 'squad':'Profile-completeness feedback is operational, not official HR verification or appointment.',
 'resource':'WFH/leave/assignment status is calculated from stored schedules and dates, not official HR approval.',
 'backup':'Restore can affect current records; Backup All is distinct from a point-in-time Prioritas ranking snapshot.',
 'ai-assistant':'Responses should be checked against cited records; model output is not independent official guidance.',
 'activity-auto-status':'Status follows stored schedule and exception flags, not independent verification of completed work.',
 'crud-guide':'Validate duplicates, permissions and file contents before changing persisted data.',
 'ai-reference-library':'Search extraction may miss embedded scans; do not treat incomplete indexed text as full document review.',
 'reminders':'Notifications follow stored due dates and rules; they do not guarantee external delivery or formal receipt.',
 'whats-new':'The change log is historical and may not reflect every latest feature; use the feature-specific guide.',
 'reports-export':'Reports are generated from active records/filters and represent a point-in-time extract.',
 'report-compilation':'Compiled reports combine specified sections, not a reconciliation of divergent underlying records.',
 'chart-explanations':'Explanations follow chart data and filter context; they are interpretive aids rather than validation.',
 'guest-access':'Guest viewing does not confer write privileges; sensitive records remain restricted.',
 'user-access-admin':'Access changes require authorization; guest statistics are not a substitute for official attendance logs.',
 'schedule-request':'Submitted requests must follow the approval rules; a dashboard request alone is not a confirmed assignment.',
 'cm-team-tasks':'Task tracking reflects entered owners, dates and progress; it does not itself create a formal service order.'
}
indonesian={
 'getting-started':'Akses tamu dibatasi menu/peran; login Google tidak otomatis memberikan hak edit.',
 'overview':'Angka dan grafik berasal dari Activity yang lolos filter, bukan proyeksi atau verifikasi kinerja resmi.',
 'activities':'Edit/hapus memerlukan hak akses; log audit mencatat perubahan tetapi tidak mengesahkan dokumen.',
 'today-calendar':'Tanggal/jam mengikuti data Activity; kalender tidak memastikan kehadiran aktual.',
 'workboard':'Kartu Workboard memakai data Activity yang sama; status harus sesuai realisasi pekerjaan.',
 'matrix':'Intensitas warna menunjukkan jumlah kegiatan, bukan efektivitas atau kepentingan strategis.',
 'knowledge':'Mutu pencarian AI/referensi bergantung pada teks yang berhasil diindeks, versi dokumen dan akses.',
 'cra-create':'Setelah respons masuk, struktur pertanyaan terkunci; gunakan versi baru untuk instrumen berbeda.',
 'cra-share-qr':'Satu tautan/QR publik melayani peran terpilih; hak login dashboard terpisah dari akses responden.',
 'cra-answer':'Nilai Likert 1–2 memerlukan alasan; jawaban adalah persepsi, bukan bukti operasional independen.',
 'cra-analytics':'Sampel role yang terlalu kecil harus dianggap belum cukup; CRA tidak otomatis membuktikan adopsi nyata.',
 'cra-action-plan':'Action Plan tetap record pemantauan utama meski ditautkan ke Activity; penutupan mengikuti syarat workflow.',
 'cra-rounds-version':'Bandingkan series dan versi yang sebanding; perubahan sampel tidak otomatis berarti tren.',
 'cra-question-bank':'Perubahan bank dipakai untuk survei baru; survei lama mempertahankan snapshot instrumennya.',
 'squad':'Feedback kelengkapan profil bersifat operasional, bukan verifikasi kepegawaian atau pengangkatan resmi.',
 'resource':'Status WFH/cuti/penugasan dihitung dari jadwal dan tanggal yang tersimpan, bukan persetujuan HR resmi.',
 'backup':'Restore dapat memengaruhi record saat ini; Backup All berbeda dari snapshot pemeringkatan Prioritas.',
 'ai-assistant':'Periksa jawaban AI terhadap sumber/record; respons model bukan petunjuk kedinasan yang disahkan.',
 'activity-auto-status':'Status mengikuti jadwal/pengecualian tersimpan, bukan verifikasi independen pekerjaan selesai.',
 'crud-guide':'Validasi duplikasi, hak akses serta isi file sebelum mengubah data yang tersimpan.',
 'ai-reference-library':'Ekstraksi bisa melewatkan hasil scan; teks indeks yang belum lengkap bukan telaah dokumen utuh.',
 'reminders':'Notifikasi mengikuti tenggat dan aturan tersimpan; tidak menjamin pengiriman atau penerimaan resmi.',
 'whats-new':'Riwayat perubahan bersifat historis; fitur terbaru perlu dilihat pada artikel sesuai menunya.',
 'reports-export':'Laporan dihasilkan dari data/filter saat itu dan merupakan salinan pada waktu tertentu.',
 'report-compilation':'Kompilasi menggabungkan bagian laporan yang dipilih, bukan otomatis merekonsiliasi perbedaan data.',
 'chart-explanations':'Penjelasan mengikuti grafik dan konteks filter; itu alat interpretasi, bukan validasi bukti.',
 'guest-access':'Akses tamu bukan hak tulis; data sensitif tetap mengikuti pembatasan.',
 'user-access-admin':'Pengubahan hak akses memerlukan kewenangan; statistik tamu bukan absensi resmi.',
 'schedule-request':'Permintaan jadwal mengikuti aturan persetujuan; pengajuan belum berarti penugasan dikonfirmasi.',
 'cm-team-tasks':'Pemantauan tugas mengikuti pemilik, tanggal dan progres tercatat; bukan otomatis surat tugas resmi.'
}
assert set(limits)==set(indonesian)
limits_js="\n/* DCM-42: one practical limitation per documented feature, bilingual. */\nconst CM_MANUAL_OPERATIONAL_LIMITS={\n"
for key in limits:
    en=limits[key].replace("\\","\\\\").replace("'","\\'")
    id=indonesian[key].replace("\\","\\\\").replace("'","\\'")
    limits_js+=" '"+key+"':{en:'"+en+"',id:'"+id+"'},\n"
limits_js+="};\nCM_USER_MANUAL_ARTICLES.forEach(article=>{const limit=CM_MANUAL_OPERATIONAL_LIMITS[article.id];if(!limit)return;const oldNote=article.note;const get=(v,lang)=>v&&typeof v==='object'?String(v[lang]||''):String(v||'');article.note={en:[get(oldNote,'en'),limit.en].filter(Boolean).join(' '),id:[get(oldNote,'id'),limit.id].filter(Boolean).join(' ')};});\n"
map_marker="const CM_MANUAL_FEATURE_MAP={"
assert s.count(map_marker)==1
s=s.replace(map_marker,limits_js+"\n"+map_marker,1)

# 5. CSS for exactly the selected Opsi 1, + deliberate cache bump for Guide.
stylesheet='<link rel="stylesheet" href="dcm-priority-filter-option1-42.css?v=261114-42">'
assert stylesheet not in s
head=s.lower().find('</head>')
assert 0<head<s.lower().find('<body')
s=s[:head]+stylesheet+"\n"+s[head:]
guide_old="dcm-guide-header.js"
assert guide_old in s
s,n=re.subn(r'dcm-guide-header\.js(?:\?v=[^" ]+)?','dcm-guide-header.js?v=261114-42',s,count=1)
assert n==1
assert s.count("id=\"prioSnapSave\"")==1
assert s.count('class="prio-snapshot-help"')==1
assert s.count('CM_MANUAL_OPERATIONAL_LIMITS')==2
assert all("'"+key+"'" in s for key in ('priority-projects','priority-criteria','priority-monev','priority-references','priority-snapshot','tim-pusmantap'))
p.write_text(s,encoding="utf8")
print("PASS: Filter Opsi 1 CSS linked; snapshot function accurately documented; 6 detailed new manuals; primary menu routes and 30 limits.")
