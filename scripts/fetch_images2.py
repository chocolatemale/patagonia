#!/usr/bin/env python3
"""Second pass: fill gaps / upgrade weak picks. Merges into images.json."""
import json, urllib.parse, urllib.request, re, time

API = "https://commons.wikimedia.org/w/api.php"
UA = "PatagoniaTripSite/1.0 (personal travel page)"
WIDTH = 1800

# key -> (query, allow_portrait)
SCENES = {
    "hero_fitzroy":   ("Fitz Roy sunrise amanecer red mountain", False),
    "perito_moreno":  ("Perito Moreno Glacier panorama", False),
    "ushuaia_town":   ("Ushuaia panorama city mountains", False),
    "condor":         ("Andean condor Vultur gryphus flight", True),
    "lenga_forest":   ("Nothofagus lenga forest Patagonia", False),
    "lamb_asado":     ("Asado cordero patagonico spit roast lamb", True),
    "centolla":       ("King crab centolla Ushuaia seafood", True),
    "flamingo":       ("Flamingo Argentina lagoon Phoenicopterus", True),
    "steppe":         ("Patagonia landscape Route 40 grassland mountains", False),
    "guanaco":        ("Lama guanicoe guanaco Argentina wild", True),
    "buenos_aires":   ("Obelisco Buenos Aires 9 de Julio", False),
    "milky_way":      ("Milky Way night sky Torres del Paine Patagonia", False),
}

def api(params, tries=3):
    params = {**params, "format": "json"}
    url = API + "?" + urllib.parse.urlencode(params)
    for t in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:
            if t == tries - 1:
                raise
            time.sleep(1.5)

def search_files(query, limit=8):
    d = api({"action": "query", "list": "search", "srsearch": query,
             "srnamespace": 6, "srlimit": limit})
    return [m["title"] for m in d.get("query", {}).get("search", [])]

def imageinfo(titles):
    if not titles:
        return {}
    d = api({"action": "query", "titles": "|".join(titles), "prop": "imageinfo",
             "iiprop": "url|size|mime|extmetadata", "iiurlwidth": WIDTH})
    out = {}
    for page in d.get("query", {}).get("pages", {}).values():
        ii = page.get("imageinfo")
        if not ii:
            continue
        info = ii[0]
        em = info.get("extmetadata", {})
        def g(k):
            return re.sub("<[^>]+>", "", em.get(k, {}).get("value", "")).strip()
        out[page["title"]] = {
            "thumb": info.get("thumburl"), "w": info.get("width"), "h": info.get("height"),
            "mime": info.get("mime"), "artist": g("Artist")[:80],
            "license": g("LicenseShortName")[:40], "desc_url": info.get("descriptionurl"),
        }
    return out

data = json.load(open("/Users/liao/Projects/travel/scripts/images.json"))
for key, (q, allow_portrait) in SCENES.items():
    try:
        titles = search_files(q)
        info = imageinfo(titles)
        cands = []
        for t in titles:
            i = info.get(t)
            if not i or not i.get("thumb") or i["mime"] not in ("image/jpeg", "image/png"):
                continue
            if (i["w"] or 0) < 1100:
                continue
            landscape = (i["w"] or 1) >= (i["h"] or 1)
            if not allow_portrait and not landscape:
                continue
            cands.append(((1 if landscape else 0, i["w"] or 0), t, i))
        cands.sort(reverse=True)
        picks = [{"title": t, **i} for _, t, i in cands[:3]]
        if picks:
            data[key] = picks
        print(f"\n### {key}  ({q})  -> {len(picks)} picks")
        for c in picks:
            print(f"  - {c['title'][:60]}  {c['w']}x{c['h']} {c['license']}")
            print(f"      {c['thumb']}")
    except Exception as e:
        print(f"### {key} ERROR {e}")

json.dump(data, open("/Users/liao/Projects/travel/scripts/images.json", "w"),
          ensure_ascii=False, indent=2)
print("\nupdated images.json; empties now:",
      [k for k, v in data.items() if not v])
