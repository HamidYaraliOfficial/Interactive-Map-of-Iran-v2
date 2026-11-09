#!/usr/bin/env python3
"""Builds data/geo.js (projected SVG paths) from Natural Earth (public domain). Author: Hamid Yarali"""
import json, math, os, urllib.request
B = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/'
def feats(n):
    f = f'cache/{n}.geojson'
    if not os.path.exists(f):
        os.makedirs('cache', exist_ok=True); urllib.request.urlretrieve(B + n + '.geojson', f)
    return json.load(open(f))['features']
LON0, S = 43.5, 1000 / math.radians(20.5)
M = lambda a: math.log(math.tan(math.pi / 4 + math.radians(a) / 2))
M0 = M(40.5); H = round((M0 - M(24)) * S)
pr = lambda c: (round(math.radians(c[0] - LON0) * S, 1), round((M0 - M(c[1])) * S, 1))
def parts(g):
    t, c = g['type'], g['coordinates']
    return {'Polygon': [c], 'MultiPolygon': c, 'LineString': [[c]], 'MultiLineString': [[l] for l in c]}.get(t, [])
def path(g, close=True):
    out = []
    for poly in parts(g):
        for ring in poly:
            p = [pr(c) for c in ring]
            out.append('M' + 'L'.join(f'{x},{y}' for x, y in p) + ('Z' if close else ''))
    return ''.join(out)
def sph(ring):  # spherical ring area, km2
    a = 0
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        a += math.radians(x2 - x1) * (2 + math.sin(math.radians(y1)) + math.sin(math.radians(y2)))
    return abs(a) * 6371.0088 ** 2 / 2
def area(g):
    return sum(sph(p[0]) - sum(sph(h) for h in p[1:]) for p in parts(g))
def km(g):
    t = 0
    for line in [l[0] for l in parts(g)]:
        for a, b in zip(line, line[1:]):
            dx = math.radians(b[0] - a[0]) * math.cos(math.radians((a[1] + b[1]) / 2)); dy = math.radians(b[1] - a[1])
            t += 6371 * math.hypot(dx, dy)
    return t
prov, verts = [], {}
for f in feats('ne_10m_admin_1_states_provinces'):
    p = f['properties']
    if p.get('admin') != 'Iran': continue
    i = 'IR-32' if p['name'] == 'Alborz' else p['iso_3166_2']
    g = f['geometry']; big = max(parts(g), key=lambda q: sph(q[0]))
    xs, ys = zip(*[pr(c) for c in big[0]])
    verts[i] = {(round(c[0], 3), round(c[1], 3)) for q in parts(g) for r in q for c in r}
    prov.append(dict(id=i, d=path(g), c=[round((min(xs) + max(xs)) / 2, 1), round((min(ys) + max(ys)) / 2, 1)], area=round(area(g))))
for q in prov: q['nb'] = sorted(k for k in verts if k != q['id'] and len(verts[k] & verts[q['id']]) >= 2)
NB = {'Iraq', 'Turkey', 'Armenia', 'Azerbaijan', 'Turkmenistan', 'Afghanistan', 'Pakistan', 'Oman', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Saudi Arabia', 'Kuwait', 'Georgia', 'Kazakhstan', 'Uzbekistan', 'Syria', 'Tajikistan'}
ctry = [path(f['geometry']) for f in feats('ne_50m_admin_0_countries') if (f['properties'].get('NAME') or f['properties'].get('name')) in NB]
seas = {{'Caspian Sea': 'caspian', 'Persian Gulf': 'gulf', 'Gulf of Oman': 'oman'}[f['properties']['name']]: path(f['geometry'])
        for f in feats('ne_10m_geography_marine_polys') if f['properties']['name'] in ('Caspian Sea', 'Persian Gulf', 'Gulf of Oman')}
lakes = {'urmia': path(f['geometry']) for f in feats('ne_10m_lakes') if f['properties']['name'] == 'Lake Urmia'}
RV = {'Sefid': 'Sefidrud', 'Sefīd': 'Sefidrud', 'Shatt al-Arab': 'Arvand', 'Atrek': 'Atrak', 'Helmand': 'Helmand', 'Karkheh': 'Karkheh', 'Talkeh': 'Talkheh', 'Harirud': 'Harirud', 'Aras': 'Aras', 'Qezel Owzan': 'Qezel Ozan', 'Shatt al Arab': 'Arvand'}
riv = {}
for f in feats('ne_10m_rivers_lake_centerlines_scale_rank'):
    n = f['properties']['name']
    if n in RV:
        r = riv.setdefault(RV[n], dict(id=RV[n], d='', km=0)); r['d'] += path(f['geometry'], False); r['km'] += km(f['geometry'])
for r in riv.values(): r['km'] = round(r['km'])
import random
random.seed(7)
def inpoly(x, y, rings):
    c = False
    for r in rings:
        for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1]):
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c
TID = {'Kavir Desert': ('kavir', 'desert'), 'LUT DESERT': ('lut', 'desert'), 'ELBURZ MTS.': ('alborz', 'mtn'), 'ZAGROS MOUNTAINS': ('zagros', 'mtn'), 'Kopet Dag Mts .': ('kopet', 'mtn'), 'KUH RUD MOUNTAINS': ('kuhrud', 'mtn'), 'Al Hajar Mts.': ('hajar', 'mtn')}
terr = []
for f in feats('ne_10m_geography_regions_polys'):
    k = TID.get(f['properties']['NAME'])
    if not k: continue
    g = f['geometry']; rings = [[pr(c) for c in r] for q in parts(g) for r in q]
    xs = [x for r in rings for x, _ in r]; ys = [y for r in rings for _, y in r]
    P, x = [], min(xs)
    while x < max(xs):
        y = min(ys)
        while y < max(ys):
            px, py = x + random.uniform(-2.5, 2.5), y + random.uniform(-2.5, 2.5)
            if inpoly(px, py, rings): P.append((px, py))
            y += 8
        x += 8
    t = dict(id=k[0], k=k[1], d=path(g), c=[round(sum(p[0] for p in P) / len(P), 1), round(sum(p[1] for p in P) / len(P), 1)])
    if k[1] == 'mtn':
        t['g1'] = t['g2'] = ''
        for px, py in P:
            s = random.uniform(2.6, 4.8)
            t['g1'] += f'M{px:.1f},{py - s:.1f}l{s:.1f},{s * 1.4:.1f}h{-2 * s:.1f}z'
            t['g2'] += f'M{px:.1f},{py - s:.1f}l{s:.1f},{s * 1.4:.1f}h{-s:.1f}z'
    terr.append(t)
peaks = []
for f in feats('ne_10m_geography_regions_elevation_points'):
    p, c = f['properties'], f['geometry']['coordinates']
    if p.get('name') and 44 < c[0] < 62 and 24 < c[1] < 40 and not any(s in p['name'] for s in ('Jabal', 'Gora', 'Cheekha', 'Jang', 'Ararat')):
        peaks.append(dict(n=p['name'], fa=p.get('name_fa'), m=p.get('elevation'), lo=round(c[0], 3), la=round(c[1], 3)))
isl = []
for f in feats('ne_10m_land'):
    for q in parts(f['geometry']):
        xs = [c[0] for c in q[0]]; ys = [c[1] for c in q[0]]
        if 48 < min(xs) and max(xs) < 58.5 and 25 < min(ys) and max(ys) < 30.5 and len(q[0]) < 4000 and sph(q[0]) < 2500:
            isl.append(dict(lo=round(sum(xs) / len(xs), 3), la=round(sum(ys) / len(ys), 3), d=path(dict(type='Polygon', coordinates=q)), a=round(sph(q[0]))))
print('terrain', [t['id'] for t in terr], 'peaks', len(peaks), 'island polys', len(isl))
geo = dict(S=S, LON0=LON0, M0=M0, W=1000, H=H, provinces=prov, countries=ctry, seas=seas, lakes=lakes, rivers=list(riv.values()), terrain=[dict(id=t['id'], k=t['k'], c=t['c']) for t in terr], peaks=peaks, isl=isl)
open('../data/geo.js', 'w').write('/* Generated by tools/build_geo.py from Natural Earth (public domain) */\nwindow.GEO=' + json.dumps(geo, separators=(',', ':')) + ';')
print(H, len(prov), len(ctry), list(seas), list(lakes), [(r['id'], r['km']) for r in riv.values()], os.path.getsize('../data/geo.js') // 1024, 'KB')
print([(q['id'], q['area'], len(q['nb'])) for q in prov][:8])
