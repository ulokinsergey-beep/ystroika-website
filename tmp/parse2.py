# -*- coding: utf-8 -*-
import openpyxl, io, sys
from collections import OrderedDict, Counter
path = r"C:/Users/User/YandexDisk/Рабочие ФАЙЛЫ/Отдел МАРКЕТИНГА/Проект УСТРОЙКА.РУ Новый/___ У-Стройка_ Структура Каталога (категории и товары) ___.xlsx"
wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(values_only=True))
# Columns: 1=Категория text, 3=Подкатегория text, 5=Производитель, 7=Вид/Тип, 8=Тип покрытия
tree = OrderedDict()   # cat -> OrderedDict(subcat -> {brands:set, types:list})
cur_cat=None; cur_sub=None; cur_brand=None
brand_counter=Counter()
for r in rows[1:]:
    cat = r[1]; sub = r[3]; brand=r[5]; typ=r[7]; coat=r[8]
    if cat and isinstance(cat,str) and cat.strip():
        cur_cat=cat.strip(); cur_sub=None; cur_brand=None
        tree.setdefault(cur_cat, OrderedDict())
    if sub and isinstance(sub,str) and sub.strip():
        cur_sub=sub.strip(); cur_brand=None
        if cur_cat: tree[cur_cat].setdefault(cur_sub, {"brands":[], "types":[]})
    if brand and isinstance(brand,str) and brand.strip():
        cur_brand=brand.strip()
        brand_counter[cur_brand]+=1
        if cur_cat and cur_sub and cur_brand not in tree[cur_cat][cur_sub]["brands"]:
            tree[cur_cat][cur_sub]["brands"].append(cur_brand)
    if typ and isinstance(typ,str) and typ.strip():
        if cur_cat and cur_sub:
            tree[cur_cat][cur_sub]["types"].append((cur_brand, typ.strip(), coat))

out=io.StringIO()
ncat=len(tree); nsub=sum(len(v) for v in tree.values())
out.write("=== CATEGORY TREE ===\n\n")
for cat, subs in tree.items():
    out.write(f"# {cat}  ({len(subs)} подкат.)\n")
    for sub, d in subs.items():
        b = ", ".join(d["brands"][:12])
        out.write(f"  - {sub}  [бренды: {b}]  (видов: {len(d['types'])})\n")
    out.write("\n")
out.write(f"\nИТОГО категорий: {ncat}, подкатегорий: {nsub}\n\n")
out.write("=== БРЕНДЫ (частота) ===\n")
for b,c in brand_counter.most_common(40):
    out.write(f"  {b}: {c}\n")
data=out.getvalue()
with open(r"C:/Projects/ystroika-website/tmp/tree.txt","w",encoding="utf-8") as f:
    f.write(data)
sys.stdout.buffer.write(data.encode("utf-8"))
