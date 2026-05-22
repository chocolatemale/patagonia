/* =====================================================================
   PATAGONIA · FIN DEL MUNDO — interactions
   ===================================================================== */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- progress bar + nav scrolled state ---------- */
  var progress = $("#progress"), nav = $("#nav");
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = p + "%";
    nav.classList.toggle("scrolled", h.scrollTop > 30);
    if (heroBg && !reduce) heroBg.style.transform = "scale(1.06) translateY(" + (h.scrollTop * 0.18) + "px)";
  }
  var heroBg = $("#heroBg");
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var toggle = $("#navToggle"), links = $("#navlinks");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("#navlinks a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- reveal on scroll ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); revObs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$(".reveal").forEach(function (el) { revObs.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- count-up (KPI) + budget bars ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count")), t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var k = Math.min((ts - t0) / 1100, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var kObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); kObs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    $$("[data-count]").forEach(function (el) { reduce ? (el.textContent = el.getAttribute("data-count")) : kObs.observe(el); });

    var bObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.style.width = e.target.getAttribute("data-w") + "%"; bObs.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    $$(".bud-row .fill").forEach(function (el) { bObs.observe(el); });
  } else {
    $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
    $$(".bud-row .fill").forEach(function (el) { el.style.width = el.getAttribute("data-w") + "%"; });
  }

  /* ---------- scrollspy (top nav + day rail) ---------- */
  function spy(container) {
    var as = $$("a[href^='#']", container);
    var map = {};
    as.forEach(function (a) {
      var t = document.getElementById(a.getAttribute("href").slice(1));
      if (t) map[a.getAttribute("href")] = { a: a, t: t };
    });
    var keys = Object.keys(map);
    if (!keys.length || !("IntersectionObserver" in window)) return;
    var visible = {};
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var id = "#" + e.target.id;
        if (e.isIntersecting) visible[id] = e.intersectionRatio; else delete visible[id];
      });
      var best = null, br = 0;
      keys.forEach(function (k) { if (visible[k] && visible[k] > br) { br = visible[k]; best = k; } });
      if (best) { as.forEach(function (a) { a.classList.remove("active"); }); map[best].a.classList.add("active"); }
    }, { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] });
    keys.forEach(function (k) { o.observe(map[k].t); });
  }
  spy($("#nav"));
  spy($("#daynav"));

  /* ---------- countdown ---------- */
  var target = new Date("2026-09-26T00:00:00-03:00").getTime();
  var cd = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function tick() {
    if (!cd.d) return;
    var diff = target - Date.now();
    if (diff < 0) diff = 0;
    var d = Math.floor(diff / 864e5), h = Math.floor(diff % 864e5 / 36e5),
        m = Math.floor(diff % 36e5 / 6e4), s = Math.floor(diff % 6e4 / 1e3);
    cd.d.textContent = d; cd.h.textContent = pad(h); cd.m.textContent = pad(m); cd.s.textContent = pad(s);
  }
  tick(); setInterval(tick, 1000);

  /* ---------- snow / drift canvas in hero ---------- */
  (function () {
    var c = $("#snow"); if (!c || reduce) { if (c) c.style.display = "none"; return; }
    var ctx = c.getContext("2d"), W, H, flakes = [], hero = $(".hero");
    function size() { W = c.width = hero.offsetWidth; H = c.height = hero.offsetHeight; }
    function make() {
      flakes = [];
      var n = Math.min(70, Math.round(W / 22));
      for (var i = 0; i < n; i++) flakes.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.8 + 0.5, sp: Math.random() * 0.4 + 0.15,
        dr: Math.random() * 0.6 - 0.3, o: Math.random() * 0.5 + 0.2
      });
    }
    var running = true;
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fillStyle = "rgba(220,238,246," + f.o + ")"; ctx.fill();
        f.y += f.sp; f.x += f.dr + Math.sin(f.y / 60) * 0.2;
        if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
        if (f.x > W + 4) f.x = -4; if (f.x < -4) f.x = W + 4;
      }
      requestAnimationFrame(draw);
    }
    size(); make(); draw();
    window.addEventListener("resize", function () { size(); make(); });
    // pause when hero scrolled away
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        running = e[0].isIntersecting;
        if (running) requestAnimationFrame(draw);
      }, { threshold: 0 }).observe(hero);
    }
  })();

  /* ---------- Leaflet route map ---------- */
  (function () {
    var el = $("#map"); if (!el || typeof L === "undefined") return;
    var P = {
      szx: [22.64, 113.81], gru: [-23.43, -46.47], eze: [-34.61, -58.38],
      ush: [-54.80, -68.30], fte: [-50.34, -72.27], cha: [-49.33, -72.89]
    };
    var map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true, worldCopyJump: true, doubleClickZoom: false, fadeAnimation: false });
    // Esri satellite imagery — shows the real snowy Andes, glaciers & fjords (on-theme + clearly legible)
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics', maxZoom: 18
    }).addTo(map);
    // subtle place + boundary labels on top
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 18, opacity: 0.9
    }).addTo(map);

    // curved arc between two points (planar bezier approximation)
    function arc(a, b, bend) {
      var pts = [], n = 48;
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var off = (bend == null ? 0.18 : bend);
      var cx = mx - dy * off, cy = my + dx * off; // control point offset perpendicular
      for (var i = 0; i <= n; i++) {
        var t = i / n, u = 1 - t;
        pts.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0],
                  u * u * a[1] + 2 * u * t * cy + t * t * b[1]]);
      }
      return pts;
    }
    function airline(a, b, bend) {
      L.polyline(arc(a, b, bend), { color: "#ee9b79", weight: 2, opacity: 0.85, dashArray: "2 7", lineCap: "round" }).addTo(map);
    }
    // intercontinental + domestic flights
    airline(P.szx, P.gru, 0.10);
    airline(P.gru, P.eze, 0.18);
    airline(P.eze, P.ush, 0.10);
    airline(P.ush, P.fte, -0.25);
    // ground (bus) FTE -> Chaltén
    L.polyline([P.fte, P.cha], { color: "#74b6cf", weight: 3, opacity: 0.9 }).addTo(map);

    function marker(latlng, label, kind, popup) {
      var html = kind === "air"
        ? '<div class="mk air"><span>' + label + '</span></div>'
        : '<div class="mk"><span>' + label + '</span></div>';
      var icon = L.divIcon({ html: html, className: "", iconSize: [26, 26], iconAnchor: [13, 13] });
      var m = L.marker(latlng, { icon: icon }).addTo(map);
      if (popup) m.bindPopup(popup);
      return m;
    }
    marker(P.szx, "1", "air", '<b>深圳 Shenzhen</b><small>起点 · SZX → 经圣保罗</small>');
    marker(P.gru, "✈", "air", '<b>圣保罗 São Paulo</b><small>南美门户 · GRU 中转</small>');
    marker(P.eze, "2", "stop", '<b>布宜诺斯艾利斯</b><small>D2 · 缓冲一夜</small><br><a href="#d2">查看行程 →</a>');
    marker(P.ush, "3", "stop", '<b>乌斯怀亚 Ushuaia</b><small>D3–D5 · 世界尽头 54.8°S</small><br><a href="#d3">查看行程 →</a>');
    marker(P.fte, "4", "stop", '<b>埃尔卡拉法特</b><small>D6–D8 · 莫雷诺冰川</small><br><a href="#d6">查看行程 →</a>');
    marker(P.cha, "5", "stop", '<b>埃尔查尔滕</b><small>D9–D11 · 菲茨罗伊峰</small><br><a href="#d9">查看行程 →</a>');

    var saBounds = L.latLngBounds([P.eze, P.ush, P.fte, P.cha]);
    var allBounds = L.latLngBounds([P.szx, P.gru, P.eze, P.ush, P.fte, P.cha]);
    function fitSA() { map.invalidateSize(); map.fitBounds(saBounds, { padding: [54, 54], maxZoom: 6 }); }
    fitSA();
    // refit once the container is actually laid out / in view (correct sizing)
    if ("IntersectionObserver" in window) {
      var fitted = false;
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { map.invalidateSize(); if (!fitted) { fitSA(); fitted = true; } }
        });
      }, { threshold: 0.12 }).observe(el);
    }
    window.addEventListener("resize", function () { map.invalidateSize(); });
    setTimeout(function () { map.invalidateSize(); }, 400);
    setTimeout(function () { fitSA(); }, 700);

    // popup day-links: close popup on click (smooth-scroll handled by CSS)
    el.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#']");
      if (a) { map.closePopup(); }
    });
    // double-click reveals the full intercontinental journey (Shenzhen → Patagonia)
    map.on("dblclick", function () { map.fitBounds(allBounds, { padding: [30, 30] }); });
  })();

  /* ---------- daylight SVG chart ---------- */
  (function () {
    var host = $("#daylightChart"); if (!host) return;
    var days = ["9/26","9/27","9/28","9/29","9/30","10/1","10/2","10/3","10/4","10/5","10/6","10/7"];
    var hrs = [12.30,12.42,12.54,12.66,12.78,12.90,13.02,13.14,13.27,13.40,13.53,13.66];
    var W = 920, H = 300, padL = 46, padR = 20, padT = 24, padB = 46;
    var min = 12.0, max = 14.0;
    var x = function (i) { return padL + i * (W - padL - padR) / (days.length - 1); };
    var y = function (v) { return padT + (max - v) * (H - padT - padB) / (max - min); };
    var line = "", area = "M" + x(0) + "," + (H - padB);
    hrs.forEach(function (v, i) { line += (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1) + " "; area += "L" + x(i).toFixed(1) + "," + y(v).toFixed(1) + " "; });
    area += "L" + x(days.length - 1) + "," + (H - padB) + "Z";
    var grid = "";
    for (var g = 12; g <= 14; g += 0.5) grid += '<line x1="' + padL + '" y1="' + y(g) + '" x2="' + (W - padR) + '" y2="' + y(g) + '" stroke="rgba(169,214,229,.1)"/><text x="' + (padL - 8) + '" y="' + (y(g) + 4) + '" fill="#7e91a3" font-size="11" text-anchor="end" font-family="Spline Sans Mono,monospace">' + g.toFixed(1) + 'h</text>';
    var dots = "", labels = "";
    hrs.forEach(function (v, i) {
      dots += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3.4" fill="#ee9b79" stroke="#080b10" stroke-width="1.5"/>';
      if (i % 2 === 0 || i === days.length - 1)
        labels += '<text x="' + x(i).toFixed(1) + '" y="' + (H - padB + 20) + '" fill="#7e91a3" font-size="11" text-anchor="middle" font-family="Spline Sans Mono,monospace">' + days[i] + '</text>';
    });
    host.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="行程期间每日白昼时长，从约 12.3 小时增长到约 13.7 小时">' +
      '<defs><linearGradient id="dlg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ee9b79" stop-opacity=".34"/><stop offset="1" stop-color="#ee9b79" stop-opacity="0"/></linearGradient></defs>' +
      grid +
      '<path d="' + area + '" fill="url(#dlg)"/>' +
      '<path d="' + line + '" fill="none" stroke="#ee9b79" stroke-width="2.4" stroke-linejoin="round"/>' +
      dots + labels +
      '<text x="' + (W - padR) + '" y="' + (y(hrs[hrs.length-1]) - 12) + '" fill="#f4c0a6" font-size="12" text-anchor="end" font-family="Spline Sans Mono,monospace">+3~4 min / 天</text>' +
      '</svg>';
  })();

  /* ---------- packing checklist (localStorage) ---------- */
  (function () {
    var grid = $("#packGrid"); if (!grid) return;
    var boxes = $$("input[type=checkbox]", grid);
    var KEY = "patagonia_pack_v1";
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    var fill = $("#packFill"), pct = $("#packPct");
    function refresh() {
      var done = 0;
      boxes.forEach(function (b, i) {
        b.parentNode.classList.toggle("done", b.checked);
        if (b.checked) done++;
      });
      var p = Math.round(done / boxes.length * 100);
      fill.style.width = p + "%"; pct.textContent = p + "%  ·  " + done + "/" + boxes.length;
    }
    boxes.forEach(function (b, i) {
      if (saved[i]) b.checked = true;
      b.addEventListener("change", function () {
        saved[i] = b.checked;
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
        refresh();
      });
    });
    refresh();
    var reset = $("#packReset");
    if (reset) reset.addEventListener("click", function () {
      boxes.forEach(function (b) { b.checked = false; });
      saved = {}; try { localStorage.removeItem(KEY); } catch (e) {}
      refresh();
    });
  })();

  /* ---------- lightbox ---------- */
  (function () {
    var lb = $("#lightbox"), img = $("#lightboxImg"), cap = $("#lightboxCap");
    if (!lb || !window.IMG) return;
    var creditBy = {};
    (window.IMG_CREDITS || []).forEach(function (c) { creditBy[c.scene] = c; });
    $$("[data-img]").forEach(function (el) {
      var scene = el.getAttribute("data-img");
      if (!window.IMG[scene]) return;
      el.style.cursor = "zoom-in";
      el.addEventListener("click", function (e) {
        // ignore clicks that originate on links/buttons inside
        if (e.target.closest("a,button")) return;
        img.src = window.IMG[scene];
        var cr = creditBy[scene];
        cap.textContent = cr ? (cr.title + " — © " + cr.artist + " · " + cr.license + " (Wikimedia Commons)") : "";
        lb.classList.add("on"); lb.setAttribute("aria-hidden", "false");
      });
    });
    function close() { lb.classList.remove("on"); lb.setAttribute("aria-hidden", "true"); img.src = ""; }
    lb.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  })();

  /* ---------- image credits in footer ---------- */
  (function () {
    var host = $("#creditList"); if (!host || !window.IMG_CREDITS) return;
    var names = {
      hero_fitzroy: "菲茨罗伊破晓", fitzroy_massif: "菲茨罗伊山群", perito_moreno: "莫雷诺冰川",
      perito_moreno_ice: "莫雷诺蓝冰", ushuaia_town: "乌斯怀亚", lighthouse: "Les Éclaireurs 灯塔",
      beagle_channel: "比格尔海峡", tdf_park: "拉帕塔亚湾", eotw_train: "世界尽头火车",
      guanaco: "原驼", penguin: "麦哲伦企鹅", sea_lions: "南美海狮", cormorant: "帝王鸬鹚",
      condor: "安第斯神鹰", steppe: "巴塔哥尼亚草原", lago_argentino: "阿根廷湖", el_chalten: "埃尔查尔滕",
      laguna_torre: "托雷湖", buenos_aires: "布宜诺斯艾利斯", lamb_asado: "巴塔哥尼亚烤羊",
      centolla: "帝王蟹", milky_way: "巴塔哥尼亚星空", flamingo: "火烈鸟"
    };
    host.innerHTML = window.IMG_CREDITS.map(function (c) {
      var label = names[c.scene] || c.scene;
      var t = c.url ? '<a href="' + c.url + '" target="_blank" rel="noopener">' + label + '</a>' : label;
      return "<div>" + t + " — " + (c.artist || "Unknown") + " · " + (c.license || "CC") + "</div>";
    }).join("");
  })();

})();
