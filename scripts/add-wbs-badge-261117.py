from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf8')
old='''${cmInvitationBadge(a)}<div class="table-title">${escapeHtml(a.namaKegiatan)}${cmEoMiniBadge(a)}</div>'''
new='''${cmInvitationBadge(a)}<div class="table-title">${escapeHtml(a.namaKegiatan)}${cmEoMiniBadge(a)}</div>${a.wbsGroup?`<div class="wbs-mini-tag">${ActivityWBS.badge(a)}</div>`:''}'''
assert s.count(old)==1,'Missing activity title row'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf8')
print('Added compact PM CM WBS badge below activity title')
