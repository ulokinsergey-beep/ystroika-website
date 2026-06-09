# -*- coding: utf-8 -*-
import openpyxl, io
path = r"C:/Users/User/YandexDisk/Рабочие ФАЙЛЫ/Отдел МАРКЕТИНГА/Проект УСТРОЙКА.РУ Новый/___ У-Стройка_ Структура Каталога (категории и товары) ___.xlsx"
out = io.open(r"C:/Projects/ystroika-website/tmp/tree.txt", "w", encoding="utf-8")
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
ws = wb["Лист 1"]

from collections import OrderedDict
tree = OrderedDict()  # cat -> OrderedDict(subcat -> {mans:set, types:count})
cur_cat = None
cur_sub = None
cur_man = None
cat_status = {}

for i, r in enumerate(ws.iter_rows(min_row=2, values_only=True), 2):
    f_cat, cat = r[0], r[1]
    f_sub, sub = r[2], r[3]
    f_man, man = r[4], r[5]
    f_type, typ = r[6], r[7]
    coating = r[8]
    if f_cat and cat:
        cur_cat = str(cat).strip()
        cur_sub = None; cur_man=None
        tree.setdefault(cur_cat, OrderedDict())
    if f_sub and sub:
        cur_sub = str(sub).strip()
        cur_man=None
        if cur_cat:
            tree[cur_cat].setdefault(cur_sub, {"mans":[], "types":0})
        # capture status from col7 when subcat row
        st = r[7]
        if st: cat_status[(cur_cat,cur_sub)] = str(st).strip()
    if f_man and man and cur_cat and cur_sub:
        m=str(man).strip()
        if m not in tree[cur_cat][cur_sub]["mans"]:
            tree[cur_cat][cur_sub]["mans"].append(m)
    if f_type and typ and cur_cat and cur_sub:
        tree[cur_cat][cur_sub]["types"] += 1

# Output
out.write("=== CATEGORY TREE ===\n\n")
total_cat=0; total_sub=0
for cat, subs in tree.items():
    total_cat+=1
    out.write("# %s  (подкатегорий: %d)\n" % (cat, len(subs)))
    for sub, d in subs.items():
        total_sub+=1
        mans = ", ".join(d["mans"][:12])
        more = "" if len(d["mans"])<=12 else " +%d"%(len(d["mans"])-12)
        out.write("   - %s | бренды: %s%s | типов-строк: %d\n" % (sub, mans if mans else "—", more, d["types"]))
    out.write("\n")
out.write("\nИТОГО категорий: %d, подкатегорий: %d\n" % (total_cat, total_sub))

# all manufacturers global
allman={}
for cat,subs in tree.items():
    for sub,d in subs.items():
        for m in d["mans"]:
            allman[m]=allman.get(m,0)+1
out.write("\n=== БРЕНДЫ (частота по подкатегориям) ===\n")
for m,c in sorted(allman.items(), key=lambda x:-x[1]):
    out.write("  %s: %d\n" % (m,c))
out.close()
print("done cat=%d sub=%d" % (total_cat,total_sub))
