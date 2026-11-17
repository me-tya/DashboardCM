from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf8')
old="F('programTerkait'),cmAfEl(ActivityWBS.formHTML(a))]);ActivityWBS.wire(form);"
new="F('programTerkait'),cmAfEl(ActivityWBS.formHTML(a))]);"
assert s.count(old)==1,'Missing current form WBS position'
s=s.replace(old,new,1)
old2="grid.replaceWith(panels);"
new2="grid.replaceWith(panels);ActivityWBS.wire(form);"
assert s.count(old2)==1,'Missing form panel mounting anchor'
s=s.replace(old2,new2,1)
a=s.index('cmAfEl(ActivityWBS.formHTML(a))')
b=s.index('ActivityWBS.wire(form)')
assert b>a
p.write_text(s,encoding='utf8')
print('Dashboard CM WBS form dropdowns now initialize after form panel is mounted')
