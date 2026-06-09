"""Universal Bitrix iblock -> Astro content collection converter.

Reads surviving parsed dump JSON from C:/temp/iblock_<N>/{elements,properties,element_properties}.json
Writes Markdown files into src/content/<collection>/ with frontmatter matching src/content/config.ts.

Collections handled:
  iblock_11 -> articles   (blog, 92 elements)
  iblock_12 -> faq        (6)
  iblock_13 -> reviews    (ACTIVE only, ~107)
  iblock_10 -> projects   (6)
  iblock_07 -> brands     (1)
  iblock_09 -> vacancies  (2)

Non-collection (written to src/data as JSON, already may exist):
  iblock_25 -> about-company.json
  iblock_14 -> offices.json
  iblock_19 -> seo-landings.json  (all inactive SEO landing pages, reference only)

IMAGES: file-ids (PREVIEW_PICTURE/DETAIL_PICTURE/F-props) cannot be resolved to
upload/iblock/<hash> paths because the b_file table was not parsed (dump deleted).
Inline <img> tags in bodies point to an external dev domain, not the local tar.
So image fields are left empty / recorded as raw bitrix file-ids in `_bitrixImageIds`.

Run: python scripts/convert_bitrix_content.py
"""
import json
import re
import sys
import html as htmllib
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

PROJECT = Path('C:/Projects/ystroika-website')
TEMP = Path('C:/temp')
CONTENT = PROJECT / 'src' / 'content'
DATA = PROJECT / 'src' / 'data'

CYRMAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
}


def slugify(s, fallback='item'):
    s = (s or '').strip().lower()
    out = []
    for ch in s:
        if ch in CYRMAP:
            out.append(CYRMAP[ch])
        elif ch.isalnum() or ch in '-_':
            out.append(ch)
        elif ch.isspace() or ch in '.,;:/«»"\'':
            out.append('-')
    slug = re.sub(r'-+', '-', ''.join(out)).strip('-')
    return slug[:80] or fallback


def yaml_str(s):
    if s is None:
        return "''"
    s = str(s).replace('\\', '\\\\').replace("'", "''")
    return f"'{s}'"


def yaml_list(items):
    if not items:
        return '[]'
    return '[' + ', '.join(yaml_str(i) for i in items) + ']'


def parse_date(*candidates):
    for c in candidates:
        if not c:
            continue
        try:
            dt = datetime.fromisoformat(str(c).split('.')[0])
            return dt.strftime('%Y-%m-%d')
        except Exception:
            continue
    return None


# ---------------------------------------------------------------------------
# HTML -> clean Markdown (keep semantics: headings, lists, links, paragraphs)
# Strip inline styles, scripts, classes, external dev-domain images.
# ---------------------------------------------------------------------------

def html_to_markdown(raw):
    if not raw:
        return ''
    s = raw
    # drop scripts/styles entirely
    s = re.sub(r'<script[^>]*>.*?</script>', '', s, flags=re.I | re.S)
    s = re.sub(r'<style[^>]*>.*?</style>', '', s, flags=re.I | re.S)
    # headings
    for n in range(1, 7):
        s = re.sub(rf'<h{n}[^>]*>(.*?)</h{n}>', lambda m, n=n: '\n\n' + '#' * n + ' ' + m.group(1).strip() + '\n\n', s, flags=re.I | re.S)
    # links -> [text](href)
    def link_sub(m):
        href = m.group(1).strip()
        text = re.sub(r'<[^>]+>', '', m.group(2)).strip()
        if not href or href.startswith('#'):
            return text
        return f'[{text}]({href})' if text else ''
    s = re.sub(r'<a\b[^>]*href=["\']([^"\']*)["\'][^>]*>(.*?)</a>', link_sub, s, flags=re.I | re.S)
    # images: keep only local /upload images (resolvable); drop external dev-domain ones
    def img_sub(m):
        src = m.group(1).strip()
        if src.startswith('/upload/'):
            return f'\n\n![]({src})\n\n'
        return ''  # external/dead image
    s = re.sub(r'<img\b[^>]*src=["\']([^"\']*)["\'][^>]*/?>', img_sub, s, flags=re.I)
    # list items
    s = re.sub(r'<li[^>]*>(.*?)</li>', lambda m: '\n- ' + re.sub(r'\s+', ' ', m.group(1)).strip(), s, flags=re.I | re.S)
    s = re.sub(r'</?(ul|ol)[^>]*>', '\n', s, flags=re.I)
    # bold / italic
    s = re.sub(r'<\s*(b|strong)\b[^>]*>(.*?)</\s*(b|strong)\s*>', lambda m: '**' + m.group(2).strip() + '**', s, flags=re.I | re.S)
    s = re.sub(r'<\s*(i|em)\b[^>]*>(.*?)</\s*(i|em)\s*>', lambda m: '*' + m.group(2).strip() + '*', s, flags=re.I | re.S)
    # paragraphs / breaks
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'</p>', '\n\n', s, flags=re.I)
    s = re.sub(r'<p[^>]*>', '', s, flags=re.I)
    # strip any remaining tags
    s = re.sub(r'<[^>]+>', '', s)
    # entities
    s = htmllib.unescape(s)
    s = s.replace('\xa0', ' ')
    # whitespace cleanup
    s = re.sub(r'[ \t]+\n', '\n', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    s = re.sub(r'[ \t]{2,}', ' ', s)
    return s.strip()


def plain_excerpt(raw, limit=300):
    txt = html_to_markdown(raw)
    txt = re.sub(r'[#*\[\]()!]', '', txt)
    txt = re.sub(r'\s+', ' ', txt).strip()
    return txt[:limit]


def load(num):
    d = TEMP / f'iblock_{num:02d}'
    elements = json.loads((d / 'elements.json').read_text(encoding='utf-8'))
    if isinstance(elements, dict):
        elements = list(elements.values())
    props = json.loads((d / 'properties.json').read_text(encoding='utf-8'))
    eprops = json.loads((d / 'element_properties.json').read_text(encoding='utf-8'))
    return elements, props, eprops


def eprop_values(eprops, eid, prop_id):
    bucket = eprops.get(str(eid)) or eprops.get(eid) or {}
    vals = bucket.get(str(prop_id)) or bucket.get(prop_id) or []
    return [v.get('value') for v in vals if v.get('value') not in (None, '', '#')]


def first_eprop(eprops, eid, prop_id):
    v = eprop_values(eprops, eid, prop_id)
    return v[0] if v else None


def image_ids(e):
    ids = []
    for k in ('PREVIEW_PICTURE', 'DETAIL_PICTURE'):
        if e.get(k):
            ids.append(e[k])
    return ids


def write_md(coll, slug, frontmatter_lines, body):
    out_dir = CONTENT / coll
    out_dir.mkdir(parents=True, exist_ok=True)
    fm = ['---'] + frontmatter_lines + ['---', '']
    content = '\n'.join(fm) + (body or '') + '\n'
    (out_dir / f'{slug}.md').write_text(content, encoding='utf-8')


# ---------------------------------------------------------------------------
# Per-collection converters
# ---------------------------------------------------------------------------

def conv_articles():
    elements, props, eprops = load(11)
    PROP_TAGS = 140
    written = 0
    used = set()
    blog_terms = []
    for e in elements:
        if e.get('ACTIVE') != 'Y':
            continue
        body_html = (e.get('DETAIL_TEXT') or '').strip()
        if len(body_html) < 200:
            continue
        eid = e['ID']
        title = (e.get('NAME') or '').strip()
        excerpt = plain_excerpt(e.get('PREVIEW_TEXT') or '')
        tags_raw = first_eprop(eprops, eid, PROP_TAGS) or ''
        tags = [t.strip() for t in re.split(r'[,;]', tags_raw) if t.strip()]
        date_iso = parse_date(e.get('ACTIVE_FROM'), e.get('DATE_CREATE')) or '2024-01-01'
        updated_iso = parse_date(e.get('TIMESTAMP_X'))
        base = slugify(e.get('CODE') or title, 'article')
        slug = base
        i = 2
        while slug in used:
            slug = f'{base}-{i}'; i += 1
        used.add(slug)
        body_md = html_to_markdown(body_html)
        reading = max(1, len(re.sub(r'\s+', ' ', body_md)) // 1500)
        imgs = image_ids(e)
        fm = [f'bitrixId: {eid}', f'title: {yaml_str(title)}', f'slug: {yaml_str(slug)}']
        if excerpt:
            fm.append(f'excerpt: {yaml_str(excerpt)}')
        fm.append(f'publishDate: {date_iso}')
        if updated_iso and updated_iso != date_iso:
            fm.append(f'updatedDate: {updated_iso}')
        fm.append("author: 'У-Стройка'")
        if tags:
            fm.append(f'tags: {yaml_list(tags[:6])}')
        fm.append(f'readingTime: {reading}')
        if imgs:
            fm.append(f'bitrixImageIds: {yaml_list([str(x) for x in imgs])}')
        fm.append('published: true')
        write_md('articles', slug, fm, body_md)
        written += 1
    return written


def conv_faq():
    elements, props, eprops = load(12)
    written = 0
    used = set()
    for idx, e in enumerate(sorted(elements, key=lambda x: x.get('SORT', 500))):
        if e.get('ACTIVE') != 'Y':
            continue
        eid = e['ID']
        question = (e.get('NAME') or '').strip()
        answer = html_to_markdown(e.get('DETAIL_TEXT') or e.get('PREVIEW_TEXT') or '')
        base = slugify(e.get('CODE') or question, 'faq')
        slug = base
        i = 2
        while slug in used:
            slug = f'{base}-{i}'; i += 1
        used.add(slug)
        fm = [f'bitrixId: {eid}', f'question: {yaml_str(question)}',
              f'order: {e.get("SORT", 500)}', 'published: true']
        write_md('faq', slug, fm, answer)
        written += 1
    return written


def conv_reviews():
    elements, props, eprops = load(13)
    PROP_RATING, PROP_NAME, PROP_CITY, PROP_WORKS = 38, 39, 110, 113
    WORK_CAT = {
        'компани': 'kompaniya', 'обслуж': 'obsluzhivanie', 'продукц': 'produktsiya',
        'товар': 'produktsiya', 'монтаж': 'obsluzhivanie',
    }
    written = 0
    used = set()
    for e in elements:
        if e.get('ACTIVE') != 'Y':
            continue
        eid = e['ID']
        name = first_eprop(eprops, eid, PROP_NAME) or (e.get('NAME') or '').strip()
        city = first_eprop(eprops, eid, PROP_CITY)
        rating_raw = first_eprop(eprops, eid, PROP_RATING)
        try:
            rating = max(1, min(5, int(float(rating_raw))))
        except Exception:
            rating = 5
        works = ' '.join((eprop_values(eprops, eid, PROP_WORKS) or [])).lower()
        category = 'obsluzhivanie'
        for term, cat in WORK_CAT.items():
            if term in works:
                category = cat
                break
        date_iso = parse_date(e.get('DATE_CREATE'), e.get('ACTIVE_FROM')) or '2024-01-01'
        body = html_to_markdown(e.get('PREVIEW_TEXT') or e.get('DETAIL_TEXT') or '')
        base = slugify(f'{name}-{eid}', f'review-{eid}')
        slug = base
        i = 2
        while slug in used:
            slug = f'{base}-{i}'; i += 1
        used.add(slug)
        fm = [f'bitrixId: {eid}', f'name: {yaml_str(name)}']
        if city:
            fm.append(f'city: {yaml_str(city)}')
        fm.append(f'rating: {rating}')
        fm.append(f'date: {date_iso}')
        fm.append(f'category: {category}')
        fm.append('published: true')
        write_md('reviews', slug, fm, body)
        written += 1
    return written


def conv_projects():
    elements, props, eprops = load(10)
    written = 0
    used = set()
    for e in elements:
        if e.get('ACTIVE') != 'Y':
            continue
        eid = e['ID']
        title = (e.get('NAME') or '').strip()
        desc = plain_excerpt(e.get('PREVIEW_TEXT') or e.get('DETAIL_TEXT') or '', 400)
        body = html_to_markdown(e.get('DETAIL_TEXT') or '')
        date_iso = parse_date(e.get('ACTIVE_FROM'), e.get('DATE_CREATE'))
        base = slugify(e.get('CODE') or title, 'project')
        slug = base
        i = 2
        while slug in used:
            slug = f'{base}-{i}'; i += 1
        used.add(slug)
        imgs = image_ids(e)
        fm = [f'bitrixId: {eid}', f'title: {yaml_str(title)}', f'slug: {yaml_str(slug)}']
        if date_iso:
            fm.append(f'completionDate: {yaml_str(date_iso)}')
        if desc:
            fm.append(f'description: {yaml_str(desc)}')
        fm.append(f'order: {e.get("SORT", 500)}')
        if imgs:
            fm.append(f'bitrixImageIds: {yaml_list([str(x) for x in imgs])}')
        fm.append('published: true')
        write_md('projects', slug, fm, body)
        written += 1
    return written


def conv_brands():
    elements, props, eprops = load(7)
    written = 0
    used = set()
    for e in elements:
        if e.get('ACTIVE') != 'Y':
            continue
        eid = e['ID']
        name = (e.get('NAME') or '').strip()
        desc = plain_excerpt(e.get('PREVIEW_TEXT') or e.get('DETAIL_TEXT') or '', 500)
        body = html_to_markdown(e.get('DETAIL_TEXT') or '')
        base = slugify(e.get('CODE') or name, 'brand')
        slug = base
        i = 2
        while slug in used:
            slug = f'{base}-{i}'; i += 1
        used.add(slug)
        imgs = image_ids(e)
        fm = [f'bitrixId: {eid}', f'name: {yaml_str(name)}', f'slug: {yaml_str(slug)}']
        if desc:
            fm.append(f'description: {yaml_str(desc)}')
        fm.append(f'order: {e.get("SORT", 500)}')
        if imgs:
            fm.append(f'bitrixImageIds: {yaml_list([str(x) for x in imgs])}')
        fm.append('published: true')
        write_md('brands', slug, fm, body)
        written += 1
    return written


def conv_vacancies():
    elements, props, eprops = load(9)
    PROP_SKILLS, PROP_SALARY = 31, 32
    written = 0
    used = set()
    for e in elements:
        if e.get('ACTIVE') != 'Y':
            continue
        eid = e['ID']
        title = (e.get('NAME') or '').strip()
        skills = eprop_values(eprops, eid, PROP_SKILLS)
        salary = first_eprop(eprops, eid, PROP_SALARY)
        body = html_to_markdown(e.get('DETAIL_TEXT') or '')
        base = slugify(e.get('CODE') or title, 'vacancy')
        slug = base
        i = 2
        while slug in used:
            slug = f'{base}-{i}'; i += 1
        used.add(slug)
        fm = [f'bitrixId: {eid}', f'title: {yaml_str(title)}', f'slug: {yaml_str(slug)}']
        if salary:
            fm.append(f'salary: {yaml_str(salary)}')
        fm.append("location: 'Москва'")
        fm.append("employmentType: 'full-time'")
        if skills:
            fm.append(f'requirements: {yaml_list(skills)}')
        fm.append('published: true')
        write_md('vacancies', slug, fm, body)
        written += 1
    return written


def export_articles_inventory():
    """Full inventory of all 92 iblock_11 elements so nothing is silently dropped.

    Only 2 elements have real bodies; 45 active ones contain lorem-ipsum stub text,
    45 are inactive. Real ones are published as .md; the rest are recorded here.
    """
    elements, props, eprops = load(11)
    SECTION_NAMES = {39: 'section_39', 40: 'section_40', 41: 'section_41'}
    out = []
    for e in elements:
        body = (e.get('DETAIL_TEXT') or '').strip()
        out.append({
            'bitrixId': e['ID'],
            'title': (e.get('NAME') or '').strip(),
            'active': e.get('ACTIVE') == 'Y',
            'sectionId': e.get('IBLOCK_SECTION_ID'),
            'bodyLength': len(body),
            'hasRealBody': len(body) >= 200,
            'date': parse_date(e.get('ACTIVE_FROM'), e.get('DATE_CREATE')),
            'bitrixImageIds': [str(x) for x in image_ids(e)],
        })
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / 'articles-inventory.json').write_text(
        json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    real = sum(1 for x in out if x['hasRealBody'])
    return len(out), real


def conv_seo_landings():
    """iblock_19: inactive SEO landing pages. Reference only -> src/data/seo-landings.json."""
    elements, props, eprops = load(19)
    PROP_PRICE = 68
    out = []
    for e in elements:
        eid = e['ID']
        out.append({
            'bitrixId': eid,
            'title': (e.get('NAME') or '').strip(),
            'slug': slugify(e.get('CODE') or e.get('NAME'), f'landing-{eid}'),
            'active': e.get('ACTIVE') == 'Y',
            'price': first_eprop(eprops, eid, PROP_PRICE),
            'body': html_to_markdown(e.get('DETAIL_TEXT') or ''),
            'previewText': plain_excerpt(e.get('PREVIEW_TEXT') or '', 400),
            'bitrixImageIds': [str(x) for x in image_ids(e)],
        })
    DATA.mkdir(parents=True, exist_ok=True)
    (DATA / 'seo-landings.json').write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding='utf-8')
    return len(out)


def main():
    results = {}
    results['articles'] = conv_articles()
    inv_total, inv_real = export_articles_inventory()
    results['articles-inventory (data)'] = f'{inv_total} total / {inv_real} real-body'
    results['faq'] = conv_faq()
    results['reviews'] = conv_reviews()
    results['projects'] = conv_projects()
    results['brands'] = conv_brands()
    results['vacancies'] = conv_vacancies()
    results['seo-landings (data)'] = conv_seo_landings()
    print('\n=== Conversion summary ===', file=sys.stderr)
    for k, v in results.items():
        print(f'  {k}: {v}', file=sys.stderr)


if __name__ == '__main__':
    main()
