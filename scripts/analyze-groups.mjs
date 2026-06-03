import { readFileSync, writeFileSync } from 'fs';
const raw = readFileSync('C:/Projects/ystroika-website/src/data/kroval-catalog-full.json');
const data = JSON.parse(raw);
const items = data['КаталогНоменклатуры'];
const groups = items.filter(x => x.ЭтоГруппа === true);
const prods = items.filter(x => x.ЭтоГруппа !== true);
const allUids = new Set(groups.map(g => g.UID));
const roots = groups.filter(g => !allUids.has(g.UID_Roditel));
console.log(`Groups: ${groups.length} | Products: ${prods.length} | Roots: ${roots.length}\n`);
roots.sort((a,b) => (a.Наименование||'').localeCompare(b.Наименование||'', 'ru'));
for (const g of roots) {
  const ch = groups.filter(c => c.UID_Roditel === g.UID);
  const preview = ch.slice(0,4).map(c=>c.Наименование).join(' | ');
  console.log(`[${g.UID.slice(0,8)}] ${g.Наименование} — ${ch.length} подгрупп  « ${preview}${ch.length>4?' …':''}»`);
}
// Save groups tree
const groupMap = {};
for (const g of groups) groupMap[g.UID] = { uid: g.UID, parent: g.UID_Roditel, name: g.Наименование, children: [], productCount: 0 };
for (const g of groups) {
  if (g.UID_Roditel && groupMap[g.UID_Roditel]) groupMap[g.UID_Roditel].children.push(g.UID);
}
for (const p of prods) {
  // products reference КодРодителя which is Код of parent group
  // but we need to find by UID_Roditel from product
  if (p.UID_Roditel && groupMap[p.UID_Roditel]) groupMap[p.UID_Roditel].productCount++;
}
writeFileSync('C:/Projects/ystroika-website/src/data/kroval-groups-tree.json', JSON.stringify({ roots: roots.map(r=>r.UID), groups: groupMap }, null, 2));
console.log('\nSaved groups tree to src/data/kroval-groups-tree.json');
