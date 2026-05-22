# 巴塔哥尼亚 · 世界尽头 — Patagonia · Fin del Mundo

夫妻二人 2026/09/26–10/07 阿根廷南境（布宜诺斯艾利斯 · 乌斯怀亚 · 埃尔卡拉法特 · 埃尔查尔滕）初春纪行。
单页、电影感、深度行程网站 → **patagonia.icoco.uk**

## 特性
- 逐日行程（12 天）含天气 / 日照 / 季节性提醒
- Leaflet 卫星地图：深圳 → 圣保罗 → 布宜诺斯艾利斯 → 巴塔哥尼亚航线 + 陆路
- 气候与日照可视化、招牌体验 / 野生动物 / 风味 / 住宿
- 行前必读（货币 2026 / 网络 / 电源 / 签证 / 西语）
- 可持久化（localStorage）的装备清单、预算、倒计时
- 影像来自 Wikimedia Commons（CC / 公有领域，已在页脚署名）

## 结构
```
index.html            # 内容与结构
assets/styles.css     # 设计系统（granite night · glacial · steppe · alpenglow）
assets/app.js         # 交互（地图 / 滚动 / 图表 / 清单 / 灯箱 / 倒计时）
assets/images.css     # 自动生成：背景图工具类
assets/images.js      # 自动生成：图片 URL + 署名
scripts/*.py          # 从 Wikimedia Commons 抓取并校验配图
```

## 重新生成配图
```bash
python3 scripts/fetch_images.py        # 抓候选
python3 scripts/generate_assets.py     # 校验 + 生成 assets/images.{css,js}
```

部署：推送到 `chocolatemale/patagonia`，Cloudflare Pages 自动构建（静态，无构建步骤）。
