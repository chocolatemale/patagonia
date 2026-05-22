#!/usr/bin/env python3
"""Final gentle pass with delays + simpler queries for remaining/weak scenes."""
import json, urllib.parse, urllib.request, re, time

API = "https://commons.wikimedia.org/w/api.php"
UA = "PatagoniaTripSite/1.0 (personal travel page)"
WIDTH = 1800
SCENES = {  # key -> (query, allow_portrait, min_w)
    "hero_fitzroy": ("Fitz Roy sunrise", False, 1600),
    "ushuaia_town": ("Ushuaia city", False, 1400),
    "lamb_asado":   ("Cordero al palo asado", True, 1000),
    "centolla":     ("Centolla", True, 1000),
    "flamingo":     ("Flamingo Argentina", True, 1100),
    "lenga_forest": ("Tierra del Fuego forest autumn", False, 1300),
    "steppe":       ("Patagonia steppe Argentina landscape", False, 1300),
    "milky_way":    ("Milky Way Patagonia", False, 1400),
}

def api(params, tries=4):
    p = {**params, "format": "json"}
    url = API + "?" + urllib.parse.urlencode(p)
    for t in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception:
            if t == tries - 1:
                raise
            time.sleep(3)

data = json.load(open("/Users/liao/Projects/travel/scripts/images.json"))
for key, (q, allow_p, minw) in SCENES.items():
    time.sleep(2.5)
    d = api({"action": "query", "list": "search", "srsearch": q,
             "srnamespace": 6, "srlimit": 8})
    titles = [m["title"] for m in d.get("query", {}).get("search", [])]
    time.sleep(2.5)
    d2 = api({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
              "iiprop": "url|size|mime|extmetadata", "iiurlwidth": WIDTH})
    info = {}
    for page in d2.get("query", {}).get("pages", {}).values():
        ii = page.get("imageinfo")
        if not ii:
            continue
        i = ii[0]
        em = i.get("extmetadata", {})
        gg = lambda k: re.sub("<[^>]+>", "", em.get(k, {}).get("value", "")).strip()
        info[page["title"]] = {"thumb": i.get("thumburl"), "w": i.get("width"),
            "h": i.get("height"), "mime": i.get("mime"), "artist": gg("Artist")[:80],
            "license": gg("LicenseShortName")[:40], "desc_url": i.get("descriptionurl")}
    cands = []
    for t in titles:
        i = info.get(t)
        if not i or not i.get("thumb") or i["mime"] not in ("image/jpeg", "image/png"):
            continue
        if (i["w"] or 0) < minw:
            continue
        land = (i["w"] or 1) >= (i["h"] or 1)
        if not allow_p and not land:
            continue
        cands.append(((1 if land else 0, i["w"] or 0), t, i))
    cands.sort(reverse=True)
    picks = [{"title": t, **i} for _, t, i in cands[:3]]
    if picks:
        data[key] = picks
    print(f"### {key} ({q}) -> {len(picks)}")
    for c in picks:
        print(f"   {c['title'][:58]} {c['w']}x{c['h']} {c['license']}")

json.dump(data, open("/Users/liao/Projects/travel/scripts/images.json", "w"),
          ensure_ascii=False, indent=2)
print("empties:", [k for k, v in data.items() if not v])
