#!/usr/bin/env python3
"""Discover + verify Wikimedia Commons images for the Patagonia site.
For each scene query, search the File namespace, then resolve imageinfo
(url at a fixed width, mime, dimensions, author, license) so we can embed
stable upload.wikimedia.org thumbnail URLs and credit them properly.
"""
import json, urllib.parse, urllib.request, sys, re

API = "https://commons.wikimedia.org/w/api.php"
UA = "PatagoniaTripSite/1.0 (educational personal travel page; contact: traveler@example.com)"
WIDTH = 1800

SCENES = {
    "hero_fitzroy":      "Monte Fitz Roy Laguna de los Tres sunrise",
    "fitzroy_massif":    "Cerro Fitz Roy Chalten panorama",
    "perito_moreno":     "Perito Moreno Glacier front",
    "perito_moreno_ice": "Perito Moreno Glacier blue ice detail",
    "ushuaia_town":      "Ushuaia city Beagle Channel aerial",
    "lighthouse":        "Les Eclaireurs Lighthouse Beagle Channel",
    "beagle_channel":    "Beagle Channel Tierra del Fuego",
    "tdf_park":          "Tierra del Fuego National Park Lapataia Bay",
    "eotw_train":        "Tren del Fin del Mundo End of World Train",
    "guanaco":           "Guanaco Patagonia steppe",
    "penguin":           "Magellanic penguin colony Argentina",
    "sea_lions":         "South American sea lion colony Beagle Channel",
    "cormorant":         "Imperial cormorant colony Beagle",
    "condor":            "Andean condor flying Patagonia",
    "steppe":            "Patagonian steppe Santa Cruz Argentina",
    "lago_argentino":    "Lago Argentino El Calafate turquoise",
    "lenga_forest":      "Lenga forest Tierra del Fuego autumn",
    "el_chalten":        "El Chalten village Fitz Roy",
    "laguna_torre":      "Laguna Torre Cerro Torre Chalten",
    "buenos_aires":      "Obelisco Buenos Aires avenue",
    "lamb_asado":        "Cordero al palo Patagonian lamb asado",
    "centolla":          "Centolla king crab dish",
    "milky_way":         "Milky Way night sky Patagonia",
    "flamingo":          "Chilean flamingo Patagonia lagoon",
}

def api(params):
    params = {**params, "format": "json"}
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def search_files(query, limit=6):
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
            v = em.get(k, {}).get("value", "")
            return re.sub("<[^>]+>", "", v).strip()
        out[page["title"]] = {
            "thumb": info.get("thumburl"),
            "w": info.get("width"), "h": info.get("height"),
            "mime": info.get("mime"),
            "artist": g("Artist")[:80],
            "license": g("LicenseShortName")[:40],
            "desc_url": info.get("descriptionurl"),
        }
    return out

results = {}
for key, q in SCENES.items():
    try:
        titles = search_files(q)
        info = imageinfo(titles)
        # rank: prefer jpeg, landscape, large width
        cands = []
        for t in titles:
            i = info.get(t)
            if not i or not i.get("thumb"):
                continue
            if i["mime"] not in ("image/jpeg", "image/png"):
                continue
            if (i["w"] or 0) < 1200:
                continue
            landscape = (i["w"] or 1) >= (i["h"] or 1)
            score = (1 if landscape else 0, i["w"] or 0)
            cands.append((score, t, i))
        cands.sort(reverse=True)
        results[key] = [{"title": t, **i} for _, t, i in cands[:3]]
        print(f"\n### {key}  ({q})")
        for c in results[key]:
            print(f"  - {c['title']}")
            print(f"      {c['w']}x{c['h']} {c['mime']} | {c['license']} | {c['artist']}")
            print(f"      {c['thumb']}")
    except Exception as e:
        print(f"\n### {key}  ERROR: {e}")
        results[key] = []

with open("/Users/liao/Projects/travel/scripts/images.json", "w") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("\n\nwrote scripts/images.json")
