// Old www.sonycolorlab.app (ColorLab 2.0) URLs → this app, so shared and indexed links keep working after the domain moves.
// The old app had English without a prefix and Vietnamese under /vi (/en also worked). Tables were generated once from the
// 2026-11-08 Supabase backup and data/*.json; test/legacyRedirects.test.ts checks every destination exists.
// No imports on purpose: next.config.ts loads this file.

// old /cameras/<id> (store SKU) → product slug; unmatched ids (FX line, ZV-1, mics) fall back to the index
const CAMERAS: Record<string, string> = {
  "sony-dsc-rx100m7-e32": "rx100-vii",
  "sony-dsc-rx10m5bcap2": "rx10-v",
  "sony-dsc-rx1rm3-ap2": "rx1r-iii",
  "sony-ilce-1-bq-ap2": "a1",
  "sony-ilce-1m2-bq-ap2": "a1-ii",
  "sony-ilce-6400-b-ap2": "a6400",
  "sony-ilce-6700-bqap2": "a6700",
  "sony-ilce-7c-sq-ap2": "a7c",
  "sony-ilce-7cm2-sqap2": "a7c-ii",
  "sony-ilce-7cr-bq-ap2": "a7cr",
  "sony-ilce-7m3-bq-ap2": "a7-iii",
  "sony-ilce-7m4-bq-ap2": "a7-iv",
  "sony-ilce-7m5-bq-fs1": "a7-v",
  "sony-ilce-7rm3a-cap2": "a7r-iiia",
  "sony-ilce-7rm4a-qap2": "a7r-iva",
  "sony-ilce-7rm5-bqap2": "a7r-v",
  "sony-ilce-7rm6-bqfs1": "a7r-vi",
  "sony-ilce-7sm3-bqap2": "a7s-iii",
  "sony-ilce-9m3-bq-ap2": "a9-iii",
  "sony-sel100400-zsyx": "fe-100-400mm-f5-6-8-oss",
  "sony-sel100400gm-syx": "fe-100-400mm-f4-5-5-6-gm-oss",
  "sony-sel100400mcqsyx": "fe-100-400mm-f4-5-gm-oss",
  "sony-sel100f28gm-syx": "fe-100mm-f2-8-stf-gm-oss",
  "sony-sel100m28gmqsyx": "fe-100mm-f2-8-macro-gm-oss",
  "sony-sel1018-c-ae": "e-10-18mm-f4-oss",
  "sony-sel11f18-c-syx": "e-11mm-f1-8",
  "sony-sel1224g-syx": "fe-12-24mm-f4-g",
  "sony-sel1224gm-jsyx": "fe-12-24mm-f2-8-gm",
  "sony-sel135f18gm-syx": "fe-135mm-f1-8-gm",
  "sony-sel14f18gm-jsyx": "fe-14mm-f1-8-gm",
  "sony-sel14tc-q-syx": "1-4x-teleconverter",
  "sony-sel15f14g-csyx": "e-15mm-f1-4-g",
  "sony-sel1625g-z-syx": "fe-16-25mm-f2-8-g",
  "sony-sel1635gm2-qsyx": "fe-16-35mm-f2-8-gm-ii",
  "sony-sel1655g-c-syx": "e-16-55mm-f2-8-g",
  "sony-sel16f18g-qsyx": "fe-16mm-f1-8-g",
  "sony-sel18200le-syx": "e-18-200mm-f3-5-6-3-oss-le",
  "sony-sel200600g-csyx": "fe-200-600mm-f5-6-6-3-g-oss",
  "sony-sel2070g-q-syx": "fe-20-70mm-f4-g",
  "sony-sel20f18g-qsyx": "fe-20mm-f1-8-g",
  "sony-sel20tc-q-syx": "2x-teleconverter",
  "sony-sel24105g-qsyx": "fe-24-105mm-f4-g-oss",
  "sony-sel24240-c-syx": "fe-24-240mm-f3-5-6-3-oss",
  "sony-sel2450g-z-syx": "fe-24-50mm-f2-8-g",
  "sony-sel2470gm-qsyx": "fe-24-70mm-f2-8-gm",
  "sony-sel2470gm2-qsyx": "fe-24-70mm-f2-8-gm-ii",
  "sony-sel24f14gm-syx": "fe-24mm-f1-4-gm",
  "sony-sel24f28g-csyx": "fe-24mm-f2-8-g",
  "sony-sel2870gm-qsyx": "fe-28-70mm-f2-gm",
  "sony-sel28f20-q-syx": "fe-28mm-f2",
  "sony-sel300f28gm-syx": "fe-300mm-f2-8-gm-oss",
  "sony-sel30m35-c-syx": "e-30mm-f3-5-macro",
  "sony-sel35f14gm-qsyx": "fe-35mm-f1-4-gm",
  "sony-sel35f18-c-syx": "e-35mm-f1-8-oss",
  "sony-sel35f18f-csyx": "fe-35mm-f1-8",
  "sony-sel400800g-csyx": "fe-400-800mm-f6-3-8-g-oss",
  "sony-sel40f25g-csyx": "fe-40mm-f2-5-g",
  "sony-sel50150gm-qsyx": "fe-50-150mm-f2-gm",
  "sony-sel50f12gm-qsyx": "fe-50mm-f1-2-gm",
  "sony-sel50f14gm-jsyx": "fe-50mm-f1-4-gm",
  "sony-sel50f18-bc-syx": "e-50mm-f1-8-oss",
  "sony-sel50f18f-csyx": "fe-50mm-f1-8",
  "sony-sel50f25g-csyx": "fe-50mm-f2-5-g",
  "sony-sel50m28-c-syx": "fe-50mm-f2-8-macro",
  "sony-sel600f40gmjsyx": "fe-600mm-f4-gm-oss",
  "sony-sel70200g2-csyx": "fe-70-200mm-f4-macro-g-oss-ii",
  "sony-sel70200gm2qsyx": "fe-70-200mm-f2-8-gm-oss-ii",
  "sony-sel70350g-csyx": "e-70-350mm-f4-5-6-3-g-oss",
  "sony-sel85f14gm-qsyx": "fe-85mm-f1-4-gm",
  "sony-sel85f14gm-qsyx-mysonycarelens6mpackb": "fe-85mm-f1-4-gm",
  "sony-sel85f18-syx": "fe-85mm-f1-8",
  "sony-sel90m28g-qsyx": "fe-90mm-f2-8-macro-g-oss",
  "sony-selp1020g-csyx": "e-pz-10-20mm-f4-g",
  "sony-selp1635g-qsyx": "fe-pz-16-35mm-f4-g",
  "sony-selp18105g-ae": "e-pz-18-105mm-f4-g-oss",
  "sony-selp28135g-csyx": "fe-pz-28-135mm-f4-g-oss",
  "sony-zv-1f-wq-e32": "zv-1f",
  "sony-zv-1m2-wq-e32": "zv-1-ii",
  "sony-zv-e1-bq-ap2": "zv-e1",
  "sony-zv-e10-bq-ap2": "zv-e10",
  "sony-zv-e10m2-bq-ap2": "zv-e10-ii",
};

// old /learn/<id> → note, product note or the article a note was merged into
const NOTES: Record<string, string> = {
  "bo-cuc": "/blog/bat-luoi-1-3-va-bon-bo-cuc",
  "bo-nho-cai-dat-va-memory-recall": "/blog/kien-thuc/bo-nho-cai-dat-va-memory-recall",
  "bo-xu-ly-hinh-anh": "/blog/kien-thuc/bo-xu-ly-hinh-anh",
  "bu-sang": "/blog/kien-thuc/bu-sang",
  "cam-bien-hinh-anh": "/blog/kien-thuc/cam-bien-hinh-anh",
  "can-bang-trang-va-nhiet-do-mau": "/blog/kien-thuc/can-bang-trang-va-nhiet-do-mau",
  "che-do-chup-p-a-s-m": "/blog/kien-thuc/che-do-chup-p-a-s-m",
  "chong-anh": "/blog/chong-anh",
  "chong-rung-dien-tu": "/blog/kien-thuc/chong-rung-dien-tu",
  "chong-rung-ibis": "/blog/kien-thuc/chong-rung-ibis",
  "chu-the-chinh": "/blog/chu-the-chinh",
  "dat-ten-va-loc-anh": "/blog/loc-anh-sau-buoi-chup",
  "do-phan-giai-anh-tinh": "/blog/kien-thuc/do-phan-giai-anh-tinh",
  "do-phan-giai-va-toc-do-khung-hinh-video": "/blog/kien-thuc/do-phan-giai-va-toc-do-khung-hinh-video",
  "do-sang": "/blog/kien-thuc/do-sang",
  "do-sau-truong-anh-va-xoa-phong": "/blog/kien-thuc/do-sau-truong-anh-va-xoa-phong",
  "dong-bo-man-sau": "/blog/kien-thuc/dong-bo-man-sau",
  "dong-ong-kinh-g-va-g-master": "/blog/kien-thuc/dong-ong-kinh-g-va-g-master",
  "goc-may-va-khung-hinh": "/blog/mot-chu-the-ba-goc-may",
  "he-menu-legacy-va-new-gen": "/blog/kien-thuc/he-menu-legacy-va-new-gen",
  "iso": "/blog/kien-thuc/iso",
  "khau-do": "/blog/kien-thuc/khau-do",
  "khung-trong-khung": "/blog/khung-trong-khung-tien-canh",
  "kich-thuoc-filter": "/blog/kien-thuc/kich-thuoc-filter",
  "lay-net": "/blog/kien-thuc/lay-net",
  "ong-kinh-zoom-va-ong-kinh-fix": "/blog/kien-thuc/ong-kinh-zoom-va-ong-kinh-fix",
  "oss": "/blog/kien-thuc/oss",
  "panning": "/blog/panning-tren-sony",
  "phoi-sang-dai": "/blog/phoi-sang-dai-tren-sony",
  "picture-profile": "/blog/kien-thuc/picture-profile",
  "pin-may-anh-sony": "/blog/kien-thuc/pin-may-anh-sony",
  "power-zoom": "/blog/kien-thuc/power-zoom",
  "raw-jpeg-va-heif": "/blog/kien-thuc/raw-jpeg-va-heif",
  "san-mau-phoi-mau-va-lop-canh": "/blog/san-mau-va-lop-canh-30-phut",
  "silhouette": "/blog/chup-silhouette-tren-sony",
  "stop-va-ev": "/blog/kien-thuc/stop-va-ev",
  "tam-giac-phoi-sang": "/blog/kien-thuc/tam-giac-phoi-sang",
  "tieu-cu": "/blog/kien-thuc/tieu-cu",
  "toc-do-man-trap": "/blog/kien-thuc/toc-do-man-trap",
};

// old /?id=<legacy id> links → recipe id
const RECIPE_IDS: Record<string, string> = {
  "PROCOLOR-001": "pp-045",
  "PROCOLOR-002": "pp-046",
  "PROCOLOR-003": "pp-047",
  "scl-001": "pp-001",
  "scl-002": "pp-002",
  "scl-009": "pp-009",
  "scl-015": "pp-015",
  "scl-025": "pp-025",
  "scl-027": "pp-027",
  "scl-044": "pp-044",
};

/** Blog articles removed in the move (Creative Look is not used anywhere on this site). */
const REMOVED_ARTICLES = ["chup-dem-cam-tay-iso-cao", "creative-look-cho-ngay-dau"];

type Redirect = { source: string; destination: string; permanent: boolean; has?: { type: "query"; key: string; value: string }[] };

/** The same rule without a locale and under /vi or /en. */
const anyLocale = (path: string, destination: string, permanent = true): Redirect[] =>
  [path, `/:locale(vi|en)${path === "/" ? "" : path}`].map((source) => ({ source, destination, permanent }));

export function legacyRedirects(): Redirect[] {
  return [
    // Exact ids first: Next uses the first rule that matches.
    ...REMOVED_ARTICLES.flatMap((id) => anyLocale(`/blog/${id}`, "/blog")),
    ...Object.entries(CAMERAS).flatMap(([id, slug]) => anyLocale(`/cameras/${id}`, `/wiki/san-pham/${slug}`)),
    ...Object.entries(NOTES).flatMap(([id, path]) => anyLocale(`/learn/${id}`, path)),
    ...Object.entries(RECIPE_IDS).map(([id, slug]): Redirect => ({ source: "/", has: [{ type: "query", key: "id", value: id }], destination: `/colors/${slug}`, permanent: true })),
    // Same ids, new place
    ...anyLocale("/recipe/:slug(pp-\\d+)", "/colors/:slug"),
    ...anyLocale("/cameras/compare", "/wiki/san-pham/so-sanh"),
    // Old graph routes → graph pages (opened from the user menu)
    ...anyLocale("/graph", "/do-thi/blog"),
    ...anyLocale("/colors/graph", "/do-thi/colors"),
    // Wiki restructuring: /wiki/san-pham → /wiki, /wiki/kien-thuc → /blog/kien-thuc
    ...anyLocale("/wiki/san-pham", "/wiki"),
    ...anyLocale("/wiki/kien-thuc", "/blog/kien-thuc"),
    ...anyLocale("/wiki/kien-thuc/:path*", "/blog/kien-thuc/:path*"),
    // Locale prefix dropped where the path still exists here
    { source: "/:locale(vi|en)/blog/:id", destination: "/blog/:id", permanent: true },
    { source: "/:locale(vi|en)/:section(blog|search)", destination: "/:section", permanent: true },
    { source: "/:locale(vi|en)", destination: "/", permanent: true },
    // Anything else in an old section → that section's index here (temporary: content may come back)
    ...anyLocale("/recipe/:path*", "/colors", false),
    ...anyLocale("/colorlab/:path*", "/colors", false),
    ...anyLocale("/cameras/:path*", "/wiki", false),
    ...anyLocale("/learn/:path*", "/blog/kien-thuc", false),
  ];
}
