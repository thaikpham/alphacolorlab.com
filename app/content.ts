export type ModelId = "zve10" | "a6400" | "a7c2";

// menu: "legacy" = Legacy Menu (tab Cài đặt máy ảnh1/2), "new" = menu mới (tab Chụp, Phơi sáng/màu, Lấy nét, Cài đặt)
export const cameraModels = [
  { id: "zve10" as const, name: "ZV-E10", menu: "legacy" as const, helpGuide: "https://helpguide.sony.net/ilc/2070/v1/en/index.html" },
  { id: "a6400" as const, name: "A6400", menu: "legacy" as const, helpGuide: "https://helpguide.sony.net/ilc/1810/v1/en/index.html" },
  { id: "a7c2" as const, name: "A7C II", menu: "new" as const, helpGuide: "https://helpguide.sony.net/ilc/2360/v1/en/index.html" },
] as const;

// Mọi máy Sony ngàm E chụp ảnh (Alpha ILCE và ZV-E), nhóm theo hệ menu. id: máy có hướng dẫn (chọn được).
// decoded: trang tạo được file Memory Recall M1–M4 cho máy này.
export const sonyBodies: { name: string; code: string; menu: "legacy" | "new"; id?: ModelId; decoded?: true }[] = [
  { name: "ZV-E10", code: "ZV-E10", menu: "legacy", id: "zve10", decoded: true },
  { name: "A6400", code: "ILCE-6400", menu: "legacy", id: "a6400" },
  { name: "A5000", code: "ILCE-5000", menu: "legacy" },
  { name: "A5100", code: "ILCE-5100", menu: "legacy" },
  { name: "A6000", code: "ILCE-6000", menu: "legacy" },
  { name: "A6100", code: "ILCE-6100", menu: "legacy" },
  { name: "A6300", code: "ILCE-6300", menu: "legacy" },
  { name: "A6500", code: "ILCE-6500", menu: "legacy" },
  { name: "A6600", code: "ILCE-6600", menu: "legacy" },
  { name: "A7", code: "ILCE-7", menu: "legacy" },
  { name: "A7 II", code: "ILCE-7M2", menu: "legacy" },
  { name: "A7 III", code: "ILCE-7M3", menu: "legacy" },
  { name: "A7C", code: "ILCE-7C", menu: "legacy" },
  { name: "A7R", code: "ILCE-7R", menu: "legacy" },
  { name: "A7R II", code: "ILCE-7RM2", menu: "legacy" },
  { name: "A7R III, A7R IIIA", code: "ILCE-7RM3, ILCE-7RM3A", menu: "legacy" },
  { name: "A7R IV, A7R IVA", code: "ILCE-7RM4, ILCE-7RM4A", menu: "legacy" },
  { name: "A7S", code: "ILCE-7S", menu: "legacy" },
  { name: "A7S II", code: "ILCE-7SM2", menu: "legacy" },
  { name: "A9", code: "ILCE-9", menu: "legacy" },
  { name: "A9 II", code: "ILCE-9M2", menu: "legacy" },
  { name: "A7C II", code: "ILCE-7CM2", menu: "new", id: "a7c2" },
  { name: "ZV-E10 II", code: "ZV-E10M2", menu: "new" },
  { name: "ZV-E1", code: "ZV-E1", menu: "new" },
  { name: "A6700", code: "ILCE-6700", menu: "new" },
  { name: "A7 IV", code: "ILCE-7M4", menu: "new" },
  { name: "A7 V", code: "ILCE-7M5", menu: "new" },
  { name: "A7CR", code: "ILCE-7CR", menu: "new" },
  { name: "A7R V", code: "ILCE-7RM5", menu: "new" },
  { name: "A7R VI", code: "ILCE-7RM6", menu: "new" },
  { name: "A7S III", code: "ILCE-7SM3", menu: "new" },
  { name: "A9 III", code: "ILCE-9M3", menu: "new" },
  { name: "A1", code: "ILCE-1", menu: "new" },
  { name: "A1 II", code: "ILCE-1M2", menu: "new" },
];

export type Step = {
  n: number;
  title: string;
  en: string;
  value: string;
  path: string[]; // Legacy Menu breadcrumb: tab → mục (tên theo bộ nhớ dịch ILDC)
  note?: string;
  noteTone?: "warning"; // cảnh báo: bước không làm được trên một model, hoặc cài đặt âm thầu không có tác dụng
  optional?: boolean; // hiện nhãn "(tùy chọn)" màu xám sau tiêu đề
  memory?: "ready" | "absent" | "notStored"; // ready: đã ghi được vào file; absent: ZV-E10 không có mục này; notStored: máy không lưu mục này vào ô nhớ
  only?: ModelId[]; // bước chỉ có trên những model này
  skipNote?: Partial<Record<ModelId, string>>; // ghi chú khi bước bị bỏ qua trên model này
  noteBy?: Partial<Record<ModelId, string>>; // dòng ghi chú thêm cho từng model
  pathBy?: Partial<Record<ModelId, string[]>>; // đường dẫn menu khác theo model; [] = không có đường dẫn menu (dùng nút, vòng xoay)
  enBy?: Partial<Record<ModelId, string>>; // tên tiếng Anh khác theo model
  valueBy?: Partial<Record<ModelId, string>>; // giá trị khác theo model
  noteFor?: ModelId[]; // note chung chỉ hiện cho các model này; model khác dùng noteBy riêng
};

export type Section = {
  id: string;
  title: string;
  lead: string;
  images: { src: string; alt: string; caption: string; w: number; h: number }[];
  steps: Step[];
};

export const hero = {
  title: "Tối ưu cài đặt và màu sắc trên menu máy ảnh",
};

// Alpha Console dạng split view: cột trái (ConsoleIndex) là máy + danh sách việc, cột phải là một việc, mỗi việc một URL
export const alphaConsole = {
  makeSet: "Tạo bộ M1–M4",
  guideGroup: (n: number) => `Cài tay ${n} bước`,
  summary: "Tóm tắt",
  summaryTitle: "Tóm tắt cài đặt",
  skipped: "Bỏ qua",
  tools: "Công cụ",
  decode: "Giải mã",
  cartCount: (k: number) => `${k} công thức`,
  onlyZve10: "Chỉ ZV-E10",
  back: "Alpha Console",
  prev: "Chương trước",
  next: "Chương tiếp",
  chapterNav: "Chuyển chương",
  sources: "Nguồn",
  sourcesTail: "tên menu theo bộ nhớ dịch ILDC · bộ slide \"10 bước\"",
  preset: {
    title: "Tạo bộ 4 Memory Recall",
    lead: "Không cần nhập tay từng mục. Chọn cài đặt cho M1–M4, tải file, chép vào thẻ nhớ, rồi gọi lại trên máy.",
  },
  notDecoded: {
    title: "Bộ M1–M4 hiện tạo được cho ZV-E10",
    text: (name: string) => `${name} chưa tạo được file M1–M4 trên trang này. Bạn vẫn cài tay được theo 4 chương bên cạnh.`,
    useZve10: "Tôi dùng ZV-E10",
    contribute: "Góp file cho máy này",
  },
  decodePage: { title: "Giải mã ô nhớ M1–M4", all: "Tiến độ các máy", game: "Mini game giải mã" },
  // Nút trên trang sản phẩm Product Wiki (máy có hướng dẫn) → /?model=<id>
  productCta: "Cài máy này trong Alpha Console",
};

// Bộ M1–M4 chia sẻ (/bo-m1-m4, /bo-m1-m4/[id]): bộ lấy từ data/preset-sets.json. Chỉ hiện tên tác giả khi bộ có ghi tên.
export const kolSets = {
  title: "Bộ M1–M4 chia sẻ",
  authorLink: "Mở liên kết tác giả",
  system: "Hệ của máy",
  download: "Tải ZIP 4 file",
  downloadError: "Không tải được file mẫu. Kiểm tra mạng rồi thử lại.",
  use: "Dùng bộ này",
  save: "Sưu tầm",
  saved: "Đã sưu tầm",
  remove: "Bỏ sưu tầm",
  viewSet: "Xem bộ",
  slots: "Cài đặt từng ô",
  slotName: (n: number) => `M${n}`,
  savedTitle: "Bộ đã sưu tầm",
  savedEmpty: "Chưa có bộ nào được sưu tầm. Bấm Sưu tầm ở một bộ chia sẻ.",
  onlyZve10: "Bộ này gồm file cho ZV-E10. Máy khác chưa có file để tải.",
  description: (name: string) => `${name}: bộ Memory Recall M1–M4 cho ZV-E10, tải về rồi chép vào thẻ nhớ.`,
  loading: "Đang tải bộ…",
  notFound: "Không tìm thấy bộ này. Bộ có thể đã được gỡ hoặc chưa công khai.",
  empty: "Chưa có bộ nào được chia sẻ.",
  fromKol: "Bộ từ KOL",
  fromSite: "Bộ có sẵn",
};

// Trang KOL công khai /kol/[handle]: KOL có trong repo lấy từ bộ preset; KOL khác lấy từ AUTH Supabase
export const kol = {
  loading: "Đang tải trang…",
  notFound: "Không tìm thấy trang KOL này. Trang có thể đã bị gỡ hoặc chưa công khai.",
  sets: "Bộ M1–M4",
  noSets: "Chưa có bộ nào công khai.",
  photos: "Ảnh mẫu",
  photoAlt: (n: number, name: string) => `Ảnh mẫu ${n} của ${name}`,
  prev: "Trước",
  next: "Sau",
  close: "Đóng",
  description: (name: string) => `Trang KOL của ${name}: bộ Memory Recall M1–M4 và ảnh mẫu.`,
  title: (name: string) => `${name} · ${seo.siteName}`,
  stats: (sets: number, photos: number) => [`${sets} bộ`, `${photos} ảnh mẫu`],
  info: "Thông tin ảnh",
  noteEmpty: "Ảnh này chưa có ghi chú.",
  noteBadge: "Có ghi chú",
  aperture: "Khẩu độ",
  shutter: "Tốc độ màn trập",
  iso: "ISO",
  lens: "Ống kính",
  slot: "Ô M1–M4",
  recipe: "Công thức Color Bank",
  mod: "Mod PP",
  modFrom: (v: string) => `gốc ${v}`,
  text: "Lời ghi",
};

// Khối KOL trong /tai-khoan: hồ sơ (mục Giới thiệu), ảnh mẫu, bộ M1–M4. Tài khoản chưa được duyệt không thấy các mục này.
export const kolStudio = {
  loadFailed: "Chưa tải được dữ liệu.",
  retry: "Thử lại",
  handle: "Tên đường dẫn",
  handleTaken: "Tên đường dẫn này đã có người dùng.",
  handleReserved: "Tên đường dẫn này đã được dành riêng.",
  name: "Tên hiển thị",
  avatar: "Ảnh đại diện",
  coverChange: "Đổi ảnh bìa",
  photoList: "Ảnh mẫu",
  photosNoProfile: "Tạo hồ sơ KOL ở mục Giới thiệu trước khi thêm ảnh mẫu.",
  photoLimit: "Tối đa 12 ảnh mẫu.",
  photoCount: (n: number, max: number) => `${n}/${max}`,
  imageType: "Chỉ nhận ảnh JPEG, PNG hoặc WebP.",
  imageSize: "Ảnh tối đa 5 MB.",
  uploadFailed: "Không tải ảnh lên được. Thử lại.",
  saved: "Đã lưu hồ sơ",
  saving: "Đang lưu…",
  saveFailed: "Chưa lưu được. Kiểm tra mạng rồi thử lại.",
  mySets: "Bộ M1–M4 của tôi",
  newSet: "Tạo bộ M1–M4",
  emptySets: "Mỗi tài khoản KOL có một bộ M1–M4. Bộ của bạn chưa được tạo.",
  wallNoProfile: "Tạo hồ sơ KOL ở mục Giới thiệu trước khi đăng bộ M1–M4.",
  viewSet: "Xem bộ",
  viewPublic: "Xem trang công khai",
  draft: "Nháp",
  public: "Công khai",
  edit: "Sửa",
  remove: "Xóa",
  removeTitle: (name: string) => `Xóa bộ "${name}"?`,
  removeBody: "Bộ sẽ biến mất khỏi trang của bạn và khỏi danh sách bộ chia sẻ.",
  removeConfirm: "Xóa bộ",
  keep: "Giữ lại",
  removeFailed: "Chưa xóa được bộ. Thử lại.",
  cancel: "Hủy",
  pickImage: "Chọn ảnh",
  removeImage: "Bỏ ảnh",
  uploading: "Đang tải ảnh…",
  removePhoto: (n: number) => `Xóa ảnh ${n}`,
  photoLink: "Link ảnh",
  addPhoto: "Thêm ảnh",
  photoNeedsHttps: "Link phải bắt đầu bằng https:// và trỏ thẳng tới file ảnh.",
  photoDuplicate: "Ảnh này đã có trong danh sách.",
  photoNotImage: "Không mở được link này như ảnh. Kiểm tra lại link.",
  photoChecking: "Đang kiểm tra ảnh…",
  photosSaved: "Đã lưu",
  note: "Ghi chú",
  noteOf: (n: number) => `Ghi chú ảnh ${n}`,
  noteClear: "Xóa ghi chú",
  noteSave: "Lưu ghi chú",
  noteNone: "Không",
  noteNoRecipe: "Không chọn",
  noteNoMod: "Không dùng",
  noteSavedMod: (name: string) => `${name} (đã lưu)`,
  noteCount: (n: number, max: number) => `${n}/${max}`,
  noteTooLong: "Ghi chú làm danh sách ảnh quá dài. Rút ngắn lời ghi rồi thử lại.",
  noteModTip: { term: "Mod PP", lines: [{ t: "Mod được chụp lại lúc bấm Lưu ghi chú. Sửa mod trong máy sau đó không đổi ghi chú của ảnh này." }] },
  editorNew: "Bộ mới",
  editorEdit: "Sửa bộ",
  setName: "Tên bộ",
  setDescription: "Mô tả",
  setId: "Đường dẫn bộ",
  setIdTaken: "Đường dẫn này trùng bộ có sẵn trong repo. Chọn đường dẫn khác.",
  setPublish: "Trạng thái",
  slotsTitle: "Cài đặt 4 ô",
  slotLabel: "Tên ô",
  slotNote: "Ghi chú",
  setSave: "Lưu bộ",
  setSaveFailed: "Chưa lưu được bộ. Kiểm tra mạng rồi thử lại.",
  setLimit: "Mỗi tài khoản chỉ có một bộ. Hãy sửa bộ hiện có.",
  handleTip: { term: "Tên đường dẫn", lines: [{ t: "Dùng trong địa chỉ trang KOL của bạn. Chỉ chữ thường không dấu, số và dấu gạch ngang, tối đa 30 ký tự." }] },
  photoTip: { term: "Ảnh mẫu", lines: [{ t: "Tối đa 12 ảnh, JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MB." }, { t: "Link phải là https và trỏ thẳng tới file ảnh. Ảnh vẫn nằm trên máy chủ của link đó." }] },
  setIdTip: { term: "Đường dẫn bộ", lines: [{ t: "Dùng trong địa chỉ /bo-m1-m4/<đường dẫn>. Không trùng bộ có sẵn trong repo. Sau khi tạo thì không đổi được." }] },
  setPublishTip: { term: "Nháp và công khai", lines: [{ t: "Nháp chỉ bạn thấy. Công khai thì bộ hiện ở /bo-m1-m4 và trên trang KOL của bạn." }] },
};

// Đường dẫn cũ của trang chủ một trang (/#…) → route mới; may-cua-ban ở lại "/"
export const consoleHashRoutes: Record<string, string> = {
  "phoi-sang": "/cai-tay/phoi-sang",
  "lay-net": "/cai-tay/lay-net",
  "mau-da": "/cai-tay/mau-da",
  "man-hinh": "/cai-tay/man-hinh",
  "tom-tat": "/cai-tay/tom-tat",
  "huong-dan": "/cai-tay/phoi-sang",
  "tao-preset": "/tao-m1-m4",
  "choi-game": "/giai-ma",
};

export const guide = {
  modelPicker: {
    label: "Máy của bạn",
    groups: [
      { menu: "legacy" as const, title: "Legacy Menu", footer: "Menu theo tab Cài đặt máy ảnh1, Cài đặt máy ảnh2 như ZV-E10, A6400; máy đời trước có menu cũ hơn nữa." },
      { menu: "new" as const, title: "New-gen Menu", footer: "Bắt đầu từ A7S III (2020): tab Chụp, Phơi sáng/màu, Lấy nét, Cài đặt." },
    ],
    infoTerm: "Hệ menu và trạng thái giải mã",
    infoTermMenu: "Hệ menu",
    decoded: "Đã giải mã",
    decoding: "Đang giải mã",
    notDecoded: "Chưa giải mã",
    hasGuide: "Có hướng dẫn",
    legend: "Đã giải mã: trang tạo được file M1–M4 cho máy đó. Đang giải mã: đã có file mẫu, còn thiếu dữ liệu. Máy có hướng dẫn chọn được; máy khác liệt kê để bạn biết tiến độ.",
  },
  // Khối theo từng máy trên /giai-ma: tiến độ (lib/decodeProgress.ts) chỉ khi showDecodeStatus (npm run dev), và mini game để góp file mẫu
  contribute: {
    title: (name: string) => `Giải mã ${name}`,
    progressLabel: (name: string) => `Tiến độ giải mã ${name}`,
    basis: {
      decoded: (done: number, total: number) => `${done}/${total} giá trị menu đã thấy trong file máy lưu. Trang tạo được file M1–M4 cho máy này.`,
      decoding: (done: number, total: number) => `${done}/${total} giá trị menu đã thấy trong file máy lưu. Bộ tạo file đã gọi lại đúng trên máy thật, trang chưa mở công cụ cho máy này.`,
      experimental: (done: number, total: number) => `${done}/${total} trường đã có giá trị từ file α6400 máy thật. Chỉ đọc thử nghiệm, chưa tạo được file M1–M4 cho máy này.`,
      none: "Chưa có file mẫu của máy này.",
    },
    lead: "Mini game giao vài giá trị cần đặt vào M1–M4. Bạn cài trên máy, lưu vào thẻ, rồi cho trang đọc thẻ. File bạn gửi giúp giải mã thêm.",
  },
};

// Số bước của một máy (bỏ các bước máy đó không có); không truyền model thì đếm mọi bước
export function getStepCount(model?: ModelId) {
  return sections.reduce((sum, s) => sum + s.steps.filter((st) => !model || !st.only || st.only.includes(model)).length, 0);
}

export type PresetSupport = { item: string; status: 'co' | 'chua' | 'khong'; note?: string };

export const presetSupport: PresetSupport[] = [
  { item: "Chế độ chụp", status: "co" },
  { item: "ISO AUTO", status: "co", note: "giới hạn Min/Max chưa xác nhận" },
  { item: "Tốc độ tối thiểu ISO AUTO", status: "khong", note: "ZV-E10 không có mục này" },
  { item: "Tự động xem lại", status: "co", note: "Tắt, 2, 5, 10 giây" },
  { item: "Chế độ lấy nét AF-C", status: "co" },
  { item: "Vùng lấy nét (5 chế độ)", status: "co" },
  { item: "Tách lấy nét khỏi nút chụp / Nút tùy chỉnh", status: "khong", note: "máy không lưu mục này vào ô nhớ, cài tay một lần" },
  { item: "Chế độ đo sáng + Ưu tiên mặt", status: "co", note: "6 chế độ, kèm Ưu tiên mặt" },
  { item: "Làm mịn da", status: "co", note: "Tắt, Thấp, Trung bình, Cao" },
  { item: "Chế độ flash", status: "co", note: "Đèn flash cưỡng bức, Đồng bộ chậm, Đồng bộ sau" },
  { item: "Cài đặt bù sáng", status: "co", note: "Môi trường & flash, Chỉ môi trường" },
  { item: "Màn trập trước điện tử", status: "co", note: "Bật, Tắt" },
  { item: "Pre-AF", status: "co", note: "Bật, Tắt" },
  { item: "SteadyShot", status: "co", note: "Bật, Tắt (chỉ với ống kính OSS)" },
  { item: "Ưu tiên trong AWB", status: "co", note: "Chuẩn, Môi trường, Trắng" },
  { item: "Hiển thị Live View", status: "co", note: "Bật hiệu ứng, Tắt hiệu ứng" },
  { item: "Vòng xoay/bánh xe bù sáng", status: "khong", note: "máy không lưu mục này vào ô nhớ, cài tay một lần" },
  { item: "Độ sáng màn hình", status: "khong", note: "máy không lưu mục này vào ô nhớ, cài tay một lần" },
  { item: "Chất lượng hiển thị", status: "khong", note: "máy không lưu mục này vào ô nhớ, cài tay một lần" },
  { item: "Cân bằng trắng AWB / Nhiệt độ màu + Shift A-B, G-M", status: "co", note: "WB đặt sẵn Daylight/Cloudy chưa xác nhận" },
  { item: "Picture Profile PP1 25 mục, hoặc Tắt PP", status: "co", note: "PP2–PP10 nạp từ giỏ Color Bank; chưa thử gọi lại trên máy thật" },
  { item: "Khẩu / Tốc / ISO cố định", status: "co" },
];

export const sections: Section[] = [
  {
    id: "phoi-sang",
    title: "Phơi sáng",
    lead: "Chế độ A, ISO AUTO, giữ tốc độ 1/125 s",
    images: [
      {
        src: "/img/01-aperture.jpg",
        alt: "Ảnh chân dung xóa phông chụp ở chế độ ưu tiên khẩu độ",
        caption: "Chế độ A: bạn chọn khẩu độ để xóa phông, máy lo tốc độ và ISO.",
        w: 667,
        h: 1000,
      },
    ],
    steps: [
      {
        n: 1,
        title: "Chế độ chụp",
        en: "Shoot Mode: Aperture Priority",
        value: "A",
        path: ["Cài đặt máy ảnh1", "Chế độ chụp"],
        pathBy: { a7c2: [] },
        enBy: { a7c2: "Mode Dial: A (Aperture Priority)" },
        note: "Xoay vòng chế độ sang A hoặc chọn trong menu.",
        noteFor: ["zve10", "a6400"],
        noteBy: {
          a7c2: "A7C II: gạt vòng Ảnh tĩnh/Phim/S&Q về ảnh tĩnh, rồi xoay vòng chế độ sang A.",
          zve10: "ZV-E10 không có vòng chế độ: nhấn nút Ảnh tĩnh/Phim/S&Q để về chế độ ảnh tĩnh, rồi chọn Ưu tiên khẩu độ trong menu.",
          a6400: "A6400: xoay vòng chế độ sang A.",
        },
        memory: "ready",
      },
      {
        n: 2,
        title: "Tắt tự động xem lại ảnh vừa chụp",
        en: "Auto Review: Off",
        value: "Tắt",
        path: ["Cài đặt máy ảnh2", "Tự động xem lại"],
        pathBy: { a7c2: ["Cài đặt", "Tùy chọn hiển thị", "Tự động xem lại"] },
        note: "Màn hình không dừng lại để hiện ảnh vừa chụp, bạn bám chủ thể liên tục và đỡ tốn pin.",
        memory: "ready",
      },
      {
        n: 3,
        title: "Tốc độ tối thiểu cho ISO AUTO",
        optional: true,
        en: "ISO AUTO Min. SS",
        value: "1/125",
        path: ["Cài đặt máy ảnh1", "Cài đặt ISO", "ISO AUTO tốc độ tối thiểu"],
        pathBy: { a7c2: ["Phơi sáng/màu", "Phơi sáng", "ISO AUTO tốc độ tối thiểu"] },
        only: ["a6400", "a7c2"],
        skipNote: {
          zve10: "Máy này không có mục này. Khi cần giữ tốc độ, dùng chế độ S ở 1/125 s, hoặc chế độ M kèm ISO AUTO.",
        },
        memory: "absent",
      },
      {
        n: 4,
        title: "Chế độ flash",
        en: "Flash Mode: Rear Sync.",
        value: "Đồng bộ sau",
        path: ["Cài đặt máy ảnh1", "Chế độ flash"],
        pathBy: { a7c2: ["Phơi sáng/màu", "Đèn flash", "Chế độ flash"] },
        noteFor: ["zve10", "a6400"],
        note: "Ở chế độ P/A/S/M có ba lựa chọn: Đèn flash cưỡng bức, Đồng bộ chậm, Đồng bộ sau. Đồng bộ sau: flash nháy ngay trước khi kết thúc phơi sáng, nên vệt chuyển động của xe chạy hay người đi trông tự nhiên.",
        noteBy: {
          zve10: "ZV-E10 không có flash tích hợp. Cài đặt này hoạt động với flash ngoài gắn trên giày Multi Interface.",
          a6400: "A6400 có flash tích hợp.",
          a7c2: "Đồng bộ sau: flash nháy ngay trước khi kết thúc phơi sáng, nên vệt chuyển động trông tự nhiên. A7C II không có flash tích hợp: cài đặt này dùng với flash ngoài gắn trên giày Multi Interface.",
        },
        memory: "ready",
      },
      {
        n: 5,
        title: "Cài đặt bù sáng",
        en: "Exp.comp.set: Ambient&flash",
        value: "Môi trường & flash",
        path: ["Cài đặt máy ảnh1", "Cài đặt bù sáng"],
        pathBy: { a7c2: ["Phơi sáng/màu", "Đèn flash", "Cài đặt bù sáng"] },
        note: "Bù sáng điều chỉnh cả ánh sáng xung quanh lẫn công suất flash. Chọn Chỉ môi trường nếu muốn flash giữ nguyên.",
        memory: "ready",
      },
      {
        n: 6,
        title: "Màn trập trước điện tử",
        en: "e-Front Curtain Shutter: On",
        value: "Bật",
        path: ["Cài đặt máy ảnh2", "Màn trập trước điện tử"],
        only: ["zve10", "a6400"],
        skipNote: { a7c2: "A7C II không có mục này: Loại màn trập chỉ có Màn trập cơ và Màn trập điện tử." },
        note: "Rút ngắn độ trễ từ lúc nhấn nút chụp đến lúc màn trập mở. Đặt Tắt khi dùng ống kính hãng khác, ống kính qua ngàm chuyển, hoặc khi vùng bokeh bị cắt ở tốc độ cao với ống kính khẩu lớn.",
        memory: "ready",
      },
      {
        n: 7,
        title: "Vòng xoay/bánh xe bù sáng",
        en: "Dial/Wheel Ev Comp: Dial",
        value: "Vòng xoay",
        path: ["Cài đặt máy ảnh2", "Vòng xoay/bánh xe bù sáng"],
        only: ["zve10", "a6400"],
        skipNote: { a7c2: "A7C II đã gán bù sáng cho vòng xoay sau R từ đầu, không cần cài." },
        note: "Xoay vòng xoay điều khiển để bù sáng, không cần vào menu. Chức năng gốc của vòng xoay chuyển sang bánh xe. Không dùng được ở chế độ M khi ISO là ISO AUTO.",
        memory: "notStored",
      },
    ],
  },
  {
    id: "lay-net",
    title: "Lấy nét",
    lead: "AF-C và Theo dõi: Vùng",
    images: [
      {
        src: "/img/02-eye-af.jpg",
        alt: "Khung lấy nét mắt màu xanh bám theo mắt người mẫu đang đi bộ",
        caption: "Máy nhận dạng chủ thể và bám mắt khi người di chuyển.",
        w: 1600,
        h: 745,
      },
      {
        src: "/img/03-afc.jpg",
        alt: "Chủ thể chuyển động được AF liên tục bám nét",
        caption: "AF-C bám nét liên tục với chủ thể chuyển động.",
        w: 1000,
        h: 667,
      },
    ],
    steps: [
      {
        n: 8,
        title: "Pre-AF",
        en: "Pre-AF (still image): On",
        value: "Bật",
        path: ["Cài đặt máy ảnh1", "Pre-AF"],
        pathBy: { a7c2: ["Lấy nét", "AF/MF", "Pre-AF"] },
        note: "Máy lấy nét sẵn trước khi bạn nhấn nửa nút chụp, nên bắt nét nhanh hơn. Chỉ có khi gắn ống kính ngàm E.",
        memory: "ready",
      },
      {
        n: 9,
        title: "Chế độ lấy nét",
        en: "Focus Mode: Continuous AF",
        value: "AF-C",
        path: ["Cài đặt máy ảnh1", "Chế độ lấy nét"],
        pathBy: { a7c2: ["Lấy nét", "AF/MF", "Chế độ lấy nét"] },
        note: "Chọn AF liên tục: máy bám nét liên tục khi chủ thể hoặc người chụp di chuyển.",
        memory: "ready",
      },
      {
        n: 10,
        title: "Vùng lấy nét",
        en: "Focus Area: Tracking: Zone",
        value: "Theo dõi: Vùng",
        path: ["Cài đặt máy ảnh1", "Vùng lấy nét"],
        pathBy: { a7c2: ["Lấy nét", "Vùng lấy nét", "Vùng lấy nét"] },
        note: "Các mục Theo dõi chỉ chọn được khi Chế độ lấy nét đang là AF-C.",
        memory: "ready",
      },
      {
        n: 11,
        title: "Tách lấy nét khỏi nút chụp",
        optional: true,
        en: "Custom Key → AEL Button: AF On · AF w/ shutter: Off",
        value: "Bật AF",
        path: ["Cài đặt máy ảnh2", "Nút tùy chỉnh", "Nút AEL"],
        pathBy: {
          zve10: ["Cài đặt máy ảnh2", "Nút tùy chỉnh", "Nút giữa"],
          a7c2: ["Lấy nét", "AF/MF", "AF khi chụp"],
        },
        enBy: { a7c2: "AF w/ Shutter: Off" },
        valueBy: { a7c2: "Tắt" },
        note: "Sau đó đặt Cài đặt máy ảnh1 → AF khi chụp: Tắt.",
        noteFor: ["zve10", "a6400"],
        noteBy: {
          a7c2: "A7C II có sẵn nút AF-ON: chỉ cần tắt AF khi chụp, rồi giữ AF-ON bằng ngón cái để lấy nét.",
          zve10: "ZV-E10 không có nút AEL: gán Bật AF cho nút giữa bánh xe điều khiển (Center Button). Ngón cái giữ nút giữa để lấy nét, ngón trỏ bấm nút chụp. Bấm thẳng xuống để không xoay bánh xe. Nút C1 cũng dùng được. Người mới có thể giữ mặc định.",
        },
        memory: "notStored",
      },
      {
        n: 12,
        title: "SteadyShot",
        en: "SteadyShot (still image): Off",
        value: "Tắt",
        path: ["Cài đặt máy ảnh2", "SteadyShot"],
        pathBy: { a7c2: ["Chụp", "Ổn định ảnh", "SteadyShot"] },
        note: "ZV-E10 và A6400 không có chống rung trên thân, nên mục này bật hoặc tắt chống rung của ống kính. Chỉ chọn được khi tên ống kính có chữ OSS. Sony khuyên tắt khi dùng chân máy.",
        noteFor: ["zve10", "a6400"],
        noteBy: { a7c2: "A7C II có chống rung trên thân. Gắn ống có công tắc SteadyShot thì chỉ đổi được bằng công tắc trên ống. Sony khuyên tắt khi dùng chân máy." },
        memory: "ready",
      },
    ],
  },
  {
    id: "mau-da",
    title: "Màu và da",
    lead: "Màu trung tính, da mịn tự nhiên",
    images: [
      {
        src: "/img/04-soft-skin.jpg",
        alt: "So sánh các mức làm mịn da trên cùng một khuôn mặt",
        caption: "Các mức làm mịn da trên cùng một khuôn mặt.",
        w: 1600,
        h: 745,
      },
    ],
    steps: [
      {
        n: 13,
        title: "Chế độ đo sáng",
        en: "Metering Mode: Multi · Face Priority in Multi Metering: On",
        value: "Đa điểm + mặt",
        path: ["Cài đặt máy ảnh1", "Chế độ đo sáng"],
        pathBy: { a7c2: ["Phơi sáng/màu", "Đo sáng", "Chế độ đo sáng"] },
        note: "Chọn Đa điểm, rồi bật thêm Cài đặt máy ảnh1 → Ưu tiên mặt (đa điểm): Bật để máy đo sáng theo khuôn mặt.",
        noteFor: ["zve10", "a6400"],
        noteBy: { a7c2: "Chọn Đa điểm, rồi bật thêm Phơi sáng/màu → Đo sáng → Ưu tiên mặt (đa điểm): Bật để máy đo sáng theo khuôn mặt." },
        memory: "ready",
      },
      {
        n: 14,
        title: "Màu bằng Picture Profile",
        en: "Picture Profile: PP1",
        value: "PP1",
        path: ["Cài đặt máy ảnh1", "Picture Profile"],
        pathBy: { a7c2: ["Phơi sáng/màu", "Màu/tông màu", "Picture Profile"] },
        noteFor: ["zve10", "a6400"],
        noteBy: { a7c2: "Trang này chỉnh màu hoàn toàn bằng Picture Profile. A7C II áp Picture Profile cho cả ảnh tĩnh và phim: chọn PP1, nhấn cạnh phải bánh xe điều khiển để vào từng mục." },
        note: "Trang này chỉnh màu hoàn toàn bằng Picture Profile. Bạn có thể giữ màu hiện tại hoặc chỉnh tay PP1: chọn PP1, nhấn cạnh phải bánh xe điều khiển để vào từng mục. Thư viện màu đang được cập nhật. ZV-E10 và A6400 cùng đường dẫn này.",
        memory: "ready",
      },
      {
        n: 15,
        title: "Làm mịn da",
        en: "Soft Skin Effect: On: Mid",
        value: "Bật: Trung bình",
        path: ["Cài đặt máy ảnh1", "Làm mịn da"],
        pathBy: { a7c2: ["Phơi sáng/màu", "Màu/tông màu", "Làm mịn da"] },
        note: "Không áp dụng cho file RAW, không hoạt động khi dùng Zoom số.",
        noteBy: {
          a6400: "A6400: chỉ áp dụng ảnh tĩnh.",
          zve10: "ZV-E10: áp dụng cả khi quay phim.",
          a7c2: "A7C II: áp dụng cả khi quay phim.",
        },
        memory: "ready",
      },
      {
        n: 16,
        title: "Ưu tiên trong AWB",
        en: "Priority Set in AWB: White",
        value: "Trắng",
        path: ["Cài đặt máy ảnh1", "Ưu tiên trong AWB"],
        pathBy: { a7c2: ["Phơi sáng/màu", "Cân bằng trắng", "Ưu tiên trong AWB"] },
        note: "Chỉ có tác dụng khi cân bằng trắng là Tự động. Trắng: giữ màu trắng trung tính khi nguồn sáng có nhiệt độ màu thấp, như đèn sợi đốt.",
        memory: "ready",
      },
    ],
  },
  {
    id: "man-hinh",
    title: "Màn hình",
    lead: "Nhìn rõ khi ra nắng",
    images: [
      {
        src: "/img/05-monitor.jpg",
        alt: "Mặt sau máy ZV-E10 với màn hình lật và các nút MENU, Fn",
        caption: "Màn hình sáng hơn khi ra nắng, hình xem lại mịn hơn để kiểm tra nét.",
        w: 500,
        h: 500,
      },
    ],
    steps: [
      {
        n: 17,
        title: "Độ sáng màn hình",
        en: "Monitor Brightness: Sunny Weather",
        value: "Thời tiết nắng",
        path: ["Cài đặt", "Độ sáng màn hình"],
        pathBy: { a7c2: ["Cài đặt", "Ống ngắm/màn hình", "Độ sáng màn hình"] },
        note: "Vào trong nhà: trả về Thủ công để đánh giá phơi sáng đúng và đỡ tốn pin.",
        memory: "notStored",
      },
      {
        n: 18,
        title: "Chất lượng hiển thị",
        en: "Display Quality: High",
        value: "Cao",
        path: ["Cài đặt", "Chất lượng hiển thị"],
        pathBy: { a7c2: ["Cài đặt", "Ống ngắm/màn hình", "Chất lượng hiển thị"] },
        note: "Tốn pin hơn mức Tiêu chuẩn. Khi máy nóng, máy có thể tự khóa về Tiêu chuẩn.",
        memory: "notStored",
      },
      {
        n: 19,
        title: "Hiển thị Live View",
        en: "Live View Display: Setting Effect ON",
        value: "Bật hiệu ứng cài đặt",
        path: ["Cài đặt máy ảnh2", "Hiển thị Live View"],
        pathBy: { a7c2: ["Chụp", "Hiển thị khi chụp", "Cài đặt hiển thị Live View", "Hiển thị Live View"] },
        note: "Màn hình hiện ảnh gần giống kết quả cuối, theo bù sáng và cân bằng trắng đang đặt. Chế độ tự động và chế độ cảnh không cho chọn Tắt hiệu ứng cài đặt.",
        memory: "ready",
      },
    ],
  },
];

// Hướng dẫn chép file và gọi lại M1–M4; dùng chung cho thẻ hướng dẫn trên trang và HUONG_DAN.txt trong ZIP
export type GuideStep = { title: string; path?: string[]; note?: string };

export const recallGuide: { title: string; lead: string; steps: GuideStep[] }[] = [
  {
    title: "Chép file vào thẻ nhớ",
    lead: "Làm trên máy tính. Ubuntu, Windows hay macOS đều được.",
    steps: [
      {
        title: "Tải ZIP và giải nén",
        note: "Trong ZIP có thư mục PRIVATE chứa 4 file CAMPR01P–CAMPR04P.DAT (đuôi N nếu bạn chọn NTSC) và file HUONG_DAN.txt.",
      },
      {
        title: "Nối thẻ với máy tính",
        path: ["MENU", "Setup", "USB Connection", "Mass Storage"],
        note: "Đặt kết nối USB như trên rồi cắm cáp USB dữ liệu vào máy ảnh. Hoặc tháo thẻ, cắm vào đầu đọc thẻ.",
      },
      {
        title: "Chép thư mục PRIVATE vào gốc thẻ",
        note: "Chọn gộp thư mục và ghi đè khi máy tính hỏi. Muốn giữ bộ M1–M4 cũ thì sao lưu thư mục PRIVATE/SONY/SETTING/E10 trước.",
      },
      {
        title: "Tháo thẻ an toàn",
        note: "Ubuntu, Windows: bấm Eject (Safely Remove) rồi mới rút cáp. macOS: chạy dot_clean -m /Volumes/<tên thẻ> trước khi Eject để xoá file ._ mà máy ảnh không đọc được.",
      },
      {
        title: "Khởi động lại máy ảnh",
        note: "Tắt máy, tháo thẻ ra lắp lại, rồi bật máy. Máy chỉ đọc bộ M1–M4 mới sau bước này.",
      },
    ],
  },
  {
    title: "Gọi lại trên máy ảnh",
    lead: "Làm lại các bước này mỗi khi muốn đổi sang ô khác.",
    steps: [
      {
        title: "Về chế độ chụp ảnh tĩnh",
        note: "Nhấn nút Still/Movie/S&Q trên đỉnh máy đến khi góc trái màn hình hiện biểu tượng máy ảnh. Ở chế độ quay phim, máy dùng bộ M1–M4 khác.",
      },
      {
        title: "Mở Shoot Mode",
        path: ["MENU", "Camera Settings1", "Shoot Mode"],
        note: "Menu tiếng Việt: Cài đặt máy ảnh1 › Chế độ chụp.",
      },
      {
        title: "Chọn MR · Recall Camera Set.",
        note: "Trong dãy biểu tượng iAuto, P, A, S, M…, chọn MR (Gọi lại cài đặt). Màn hình hiện các ô 1, M1, M2, M3, M4.",
      },
      {
        title: "Chọn ô và nhấn nút giữa",
        note: "Xoay vòng xoay để chọn M1–M4, rồi nhấn nút giữa để áp dụng.",
      },
      {
        title: "Kiểm tra màn hình chụp",
        note: "Chế độ, tốc, ISO và cân bằng trắng đổi theo ô vừa gọi. Chưa gắn lens thì khẩu độ hiện F--.",
      },
    ],
  },
];

export const recallWarning = {
  title: "Đừng nhầm MR Memory với MR Recall",
  text: "Hai mục dùng chung biểu tượng MR. Mục Memory (Bộ nhớ cài đặt) dùng để lưu: bản xem trước giống nhau ở mọi ô, và nhấn nút giữa sẽ ghi đè file bạn vừa chép (máy báo Registered). Muốn áp dụng, luôn đi từ Shoot Mode.",
};

export const recallStatus =
  "Đã thử trên ZV-E10 bán tại Việt Nam (PAL) ngày 06/11/2026: máy gọi lại được bộ file tạo từ trang này. Cân bằng trắng, Picture Profile và lấy nét chưa được kiểm tra riêng từng mục trên máy, hãy xem lại sau lần gọi đầu tiên. Luôn sao lưu thư mục SETTING cũ trước khi ghi đè.";

export function recallGuideText(opts?: { setName: string; labels: string[] }): string {
  const lines = ["HƯỚNG DẪN NẠP BỘ M1–M4 CHO ZV-E10", ""];
  if (opts) {
    lines.push(opts.setName, "");
    opts.labels.forEach((label, i) => {
      lines.push(`M${i + 1} · ${label}`);
    });
    lines.push("");
  }
  for (const g of recallGuide) {
    lines.push(g.title.toUpperCase(), g.lead);
    g.steps.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.title}${s.path ? ": " + s.path.join(" > ") : ""}`);
      if (s.note) lines.push(`   ${s.note}`);
    });
    lines.push("");
  }
  lines.push(`LƯU Ý: ${recallWarning.title}. ${recallWarning.text}`, "", recallStatus);
  return lines.join("\n");
}

// Console tạo preset: 4 bước, chữ hiển thị trên thanh bước và nút điều hướng
export const presetConsole = {
  steps: [
    { title: "Máy ảnh", short: "Máy ảnh" },
    { title: "Bốn ô nhớ", short: "Ô nhớ" },
    { title: "Kiểm tra và tải về", short: "Tải về" },
    { title: "Nạp vào máy", short: "Nạp máy" },
  ],
  back: "Quay lại",
  next: "Tiếp tục",
  toPreview: "Kiểm tra bốn ô",
  toInstall: "Nạp vào máy",
  setPicker: "Chọn bộ cài đặt",
  setPickerHint: "Người mới nên dùng bộ cơ bản theo các bước. Bộ nào có đánh dấu Khuyên dùng sẽ mở mặc định.",
  recommended: "Khuyên dùng",
  resetSlot: "Về mặc định của bộ",
  copySlot: "Chép từ ô khác",
  copyFrom: (n: number) => `M${n}`,
  slotEditor: "Nhóm cài đặt của ô",
  groups: [
    { id: "exposure", label: "Phơi sáng" },
    { id: "focus", label: "Lấy nét" },
    { id: "color", label: "Màu" },
    { id: "camera", label: "Máy" },
  ] as const,
  summary: {
    mode: "Chế độ chụp",
    aperture: "Khẩu độ",
    shutter: "Tốc độ màn trập",
    iso: "ISO",
    focus: "Chế độ lấy nét",
    focusArea: "Vùng lấy nét",
    metering: "Chế độ đo sáng",
    facePriority: "Ưu tiên mặt",
    softSkin: "Làm mịn da",
    autoReview: "Tự động xem lại",
    flashMode: "Chế độ flash",
    expCompSet: "Cài đặt bù sáng",
    awbPriority: "Ưu tiên trong AWB",
    preAF: "Pre-AF",
    steadyShot: "SteadyShot",
    eFrontCurtain: "Màn trập trước điện tử",
    liveView: "Hiển thị Live View",
    wb: "Cân bằng trắng",
    color: "Màu",
    keep: "Giữ nguyên",
    custom: "Tùy chỉnh",
  },
  status: {
    loadingBase: "Đang tải file mẫu…",
    template: (system: "pal" | "ntsc") => `${system === "pal" ? "PAL" : "NTSC"} · file mẫu`,
    downloaded: "Đã tải ZIP",
    notDownloaded: "Chưa tải",
    checklist: (done: number, total: number) => `${done}/${total} việc`,
    allDone: "Hoàn tất",
  },
  slotEdited: "Đã chỉnh",
  supportTitle: "Mục nào ghi được vào file?",
  noBase: "Chưa tải được file mẫu. Kiểm tra kết nối mạng rồi quay lại bước Hệ máy.",
  downloadZip: "Tải ZIP (4 file)",
  downloadOne: (n: number) => `Tải M${n}`,
  // Ghi thẳng vào thẻ (File System Access, Chrome/Edge trên máy tính)
  card: {
    write: "Ghi vào thẻ",
    rewrite: "Ghi lại vào thẻ",
    writing: "Đang ghi…",
    hintPath: ["MENU", "Setup", "USB Connection", "Mass Storage"],
    hint: "Đặt máy ảnh ở chế độ trên, cắm cáp USB vào máy tính, bấm nút rồi chọn thư mục gốc của thẻ hoặc thư mục PRIVATE.",
    orZip: "Hoặc tải ZIP và chép tay:",
    unsupported: "Ghi thẳng vào thẻ cần Chrome hoặc Edge trên máy tính. Trình duyệt này dùng cách tải ZIP.",
    doneTitle: "Đã ghi vào thẻ",
    done: (n: number) => `${n} file đã ghi vào PRIVATE/SONY/SETTING/E10 và đọc lại khớp từng byte. Tiếp theo: tháo thẻ an toàn rồi khởi động lại máy ảnh.`,
    backup: (n: number) => `Đã tải về máy tính ${n} file M1–M4 cũ trên thẻ để sao lưu.`,
    errorTitle: "Chưa ghi được",
    errors: {
      notCard: "Thư mục này không giống thẻ nhớ máy ảnh (không có PRIVATE hay DCIM). Chọn thư mục gốc của thẻ hoặc thư mục PRIVATE.",
      blocked: "Trình duyệt không cho chọn thư mục gốc này. Mở thẻ và chọn thư mục PRIVATE bên trong.",
      denied: "Chưa có quyền ghi. Bấm lại và chọn Cho phép khi trình duyệt hỏi.",
      readOnly: "Thẻ đang ở chế độ chỉ đọc. Kiểm tra lẫy LOCK trên thẻ SD, hoặc đổi kết nối USB của máy ảnh sang Mass Storage.",
      verify: "File đọc lại không khớp với file vừa tạo. Đừng dùng thẻ này cho tới khi ghi lại thành công.",
      generic: (msg: string) => `Lỗi khi ghi: ${msg}`,
    },
    statusWritten: "Đã ghi vào thẻ",
  },
  modelLine: (name: string) => `Máy: ${name}.`,
  changeModel: "Đổi máy",
  unsupported: {
    title: "Tạo file Memory Recall hiện chỉ dành cho ZV-E10.",
    hint: (model: string) => `Với ${model}, cài tay theo hướng dẫn các bước rồi quay lại bước Hệ máy.`,
  },
};

// PP2–PP10 banks (Color Bank recipes for M1–M4; max 9 per slot)
export const ppBanksUI = {
  removeBank: (k: number) => `Xóa PP${k}`,
  bankLabel: (k: number, name: string) => `PP${k} · ${name}`,
  note: "Máy ảnh giữ một cân bằng trắng cho cả ô nhớ; file lưu WB của PP1. Khi bật PP2–PP10 trên máy, bạn cần chỉnh WB tay theo danh sách dưới.",
};

// Thanh tab trên cùng. match: các đường dẫn làm tab sáng lên ("/" chỉ khớp đúng trang chủ)
// Thanh điều hướng: logo, 4 tab app (điện thoại: thanh tab ở đáy), tìm kiếm, túi đồ, tài khoản.
export const nav = {
  siteName: "alphacolorlab.com",
  tabBarLabel: "Ứng dụng",
  skipLink: "Bỏ qua đến nội dung",
  apps: [
    { href: "/console", label: "Alpha Console", match: ["/console", "/cai-tay", "/tao-m1-m4", "/bo-m1-m4", "/giai-ma", "/kol", "/do-thi/console"] },
    { href: "/colors", label: "Color Bank", match: ["/colors", "/do-thi/colors"] },
    { href: "/wiki", label: "Product Wiki", match: ["/wiki", "/do-thi/wiki"] },
    { href: "/blog", label: "Blog", match: ["/blog", "/do-thi/blog"] },
  ] as { href: string; label: string; match: string[] }[],
};

// Trang tài khoản /tai-khoan: mở từ avatar trên thanh điều hướng, chứa túi đồ
export const account = {
  guest: "Khách",
  // Menu thả xuống của nút avatar trên thanh điều hướng
  menu: "Menu người dùng",
  bag: "Hồ sơ và túi đồ",
  graph: (app: string) => `Xem đồ thị ${app}`,
  graphHere: "Xem trang này trên đồ thị",
  help: "Hướng dẫn",
};

// Trang hướng dẫn /huong-dan: câu hỏi thường gặp dạng disclosure list
export const help = {
  title: "Hướng dẫn",
  description: "Câu hỏi thường gặp: máy được hỗ trợ, đăng nhập Google, cách dùng đồ thị, Memory Recall M1–M4, túi đồ và hồ sơ.",
  sections: [
    {
      title: "Bắt đầu",
      items: [
        {
          q: "Máy ảnh nào được hỗ trợ?",
          link: { href: "/console", label: "Mở Alpha Console" },
          a: "Cài tay hỗ trợ ZV-E10, A6400 và A7C II, đường dẫn menu theo đúng từng máy. Tạo file Memory Recall M1–M4 hiện chỉ dành cho ZV-E10.",
        },
        {
          q: "Có cần đăng nhập Google không?",
          a: "Không. Cài tay, Color Bank, Product Wiki, Blog, đồ thị và Tạo bộ M1–M4 đều mở khi chưa đăng nhập. Đăng nhập Google chỉ để đồng bộ túi đồ, giỏ M1–M4, danh sách so sánh, hồ sơ và máy đang chọn sang máy khác.",
        },
      ],
    },
    {
      title: "Đồ thị",
      items: [
        {
          q: "Cách chọn và mở một nút trên đồ thị?",
          a: "Bấm (hoặc chạm) một nút để chọn, các nút nối với nó xếp thành vòng. Bấm lần nữa vào nút đó để mở trang. Gõ tên vào ô tìm kiếm trên thanh điều hướng để bay thẳng tới nút.",
        },
        {
          q: "Cách điều khiển đồ thị?",
          link: { href: "/do-thi/console", label: "Mở đồ thị Alpha Console" },
          a: "Kéo nền để xoay, kéo một nút để dời nó, chụm hai ngón hoặc lăn chuột để zoom (ở trang chủ dùng Ctrl/⌘ + lăn). Bấm nền hoặc Esc để về toàn cảnh. Phím mũi tên đi qua các nút kề, Enter để chọn rồi mở.",
        },
      ],
    },
    {
      title: "Memory Recall M1–M4",
      items: [
        {
          q: "Máy bán ở Việt Nam dùng file nào?",
          a: "Máy bán ở Việt Nam là hệ PAL: file DAT có tên CAMPR0xP.DAT (chữ P cuối cùng, ví dụ CAMPR01P.DAT). Nếu máy bạn là NTSC (bán ở Mỹ, Nhật…) thì tên file là CAMPR0xN.DAT.",
        },
        {
          q: "Cách gọi lại Memory Recall trên máy?",
          a: "MENU › Cài đặt máy ảnh1 › Chế độ chụp › MR, rồi chọn ô M1–M4. Đừng chọn mục Memory: đó là mục lưu, nhấn nút giữa sẽ ghi đè file bạn vừa chép.",
        },
        {
          q: "Cách chép file vào thẻ?",
          link: { href: "/tao-m1-m4", label: "Tạo bộ M1–M4" },
          a: "Trên Chrome hoặc Edge máy tính, bấm Ghi vào thẻ rồi chọn thư mục gốc của thẻ hoặc thư mục PRIVATE; trang tự sao lưu bộ cũ và đọc lại so từng byte. Trình duyệt khác thì tải ZIP, chép thư mục PRIVATE vào gốc thẻ và chọn gộp khi máy tính hỏi.",
        },
        {
          q: "Nạp file máy đã lưu vào công cụ thế nào?",
          link: { href: "/tao-m1-m4", label: "Tạo bộ M1–M4" },
          a: "Mục Đọc file đã lưu trên máy (ở Giải mã và Tạo bộ M1–M4) đọc file CAMPR0xP.DAT mà máy đã lưu. File ZV-E10 ảnh nạp được vào ô M1–M4 đang sửa; mục không nạp được hiện ở dòng Không nạp được. File phim (CAMPR05–08) chỉ đọc để xem. α6400 chỉ đọc thử nghiệm, chưa tạo được file M1–M4 cho máy này.",
        },
        {
          q: "Bộ M1–M4 chia sẻ là gì và lấy ở đâu?",
          link: { href: "/bo-m1-m4", label: "Mở Bộ M1–M4 chia sẻ" },
          a: "Các bộ cài sẵn do người khác chia sẻ và đang hiện, mở ở Alpha Console hoặc đường dẫn /bo-m1-m4. Bộ bị ẩn khỏi danh sách thì không hiện ở đó. Mỗi bộ ghi tên người tạo. Bấm Tải ZIP 4 file để lấy bộ đó, hoặc Dùng bộ này để chỉnh từng ô trong Tạo bộ M1–M4 trước khi tải.",
        },
        {
          q: "Sưu tầm bộ để làm gì?",
          link: { href: "/tai-khoan", label: "Mở hồ sơ" },
          a: "Bấm Sưu tầm ở trang một bộ để bộ đó hiện trong mục Bộ đã sưu tầm của hồ sơ. Đăng nhập Google thì danh sách này đồng bộ sang máy khác, như túi đồ.",
        },
        {
          q: "Ai được đăng bộ M1–M4 và trang KOL?",
          a: "Chỉ người được duyệt mới đăng được trang KOL và bộ M1–M4 của riêng mình. Ai cũng tải và sưu tầm được các bộ đã công khai ở Bộ M1–M4 chia sẻ.",
        },
        {
          q: "Giải mã hoạt động thế nào?",
          link: { href: "/giai-ma", label: "Mở Giải mã" },
          a: "Mỗi lượt là một đề bài trong mini game: làm theo các bước để máy ảnh lưu file, rồi trang đọc file và báo kết quả ngay dưới lượt. Xác nhận: giá trị đọc đúng từ file máy lưu. Học được: mã mới chưa có trong dự án. Định vị: biết cài đặt nằm ở ô nào. Cần làm lại: ô máy lưu không khớp hoặc chưa phân biệt được các mục. Kết quả lưu trong trình duyệt này, lượt sau ưu tiên mục còn thiếu nhiều nhất.",
        },
      ],
    },
    {
      title: "Túi đồ và hồ sơ",
      items: [
        {
          q: "Cách thêm máy, ống kính hay phụ kiện vào túi đồ?",
          a: "Nhập tên hoặc mã Sony (ví dụ A6400, FE 50mm F1.8) vào ô Túi đồ và bấm Thêm. Gõ sai có gợi ý các sản phẩm gần giống. Bỏ một món có nút Hoàn tác 5 giây để phục hồi.",
        },
        {
          q: "Cách chia sẻ hồ sơ và túi đồ?",
          link: { href: "/tai-khoan", label: "Mở hồ sơ" },
          a: "Mở menu avatar › Hồ sơ và túi đồ, bấm Chia sẻ hồ sơ. Link chứa tên, ảnh đại diện, giới thiệu, liên kết và túi đồ của bạn tại lúc bấm; người nhận chỉ xem được.",
        },
      ],
    },
  ],
};

// Landing "/": lớp giới thiệu trên đồ thị tổng hợp, đồ thị tổng hợp toàn màn hình, rồi một màn gộp túi đồ, đăng nhập và danh sách 4 app kèm nút vào dự án
export const landing = {
  graphLabel: "Đồ thị tổng hợp: máy, ống kính, bước cài đặt, công thức màu, bài viết và kiến thức, nối với nhau",
  aboutTitle: "Một bản đồ, bốn ứng dụng",
  scrollHint: "Cuộn xuống để xem đồ thị",
  // Tiêu đề lớp giới thiệu: "color" tô dải màu đổi sắc
  intro: {
    title: ["alpha", "color", "lab.app"] as const,
    // Mỗi đoạn 2 dòng, xuống hàng đúng chỗ ngắt ý (từ md); điện thoại thì chảy tự nhiên
    lines: [
      ["Cài máy ảnh Sony Alpha đúng theo menu trên máy, nhanh và chính xác,", "kèm bộ cài đặt tạo sẵn để nạp thẳng vào máy."],
      ["Kiến thức về sản phẩm, ánh sáng và màu sắc được nối với nhau bằng từ khóa,", "thành một hệ thống liền mạch thay vì những mảnh rời rạc."],
    ],
  },
  // Màn cuối: thêm máy vào túi đồ ngay ở landing, đăng nhập Google để đồng bộ
  start: {
    title: "Bắt đầu với bộ máy của bạn",
    signedIn: (name: string) => `Đã đăng nhập: ${name}`,
    onGraph: "Xem túi đồ trên đồ thị",
    syncTip: {
      term: "Đăng nhập Google",
      lines: [
        { t: "Không bắt buộc. Chưa đăng nhập thì túi đồ chỉ lưu trên máy này." },
        { t: "Đăng nhập để túi đồ, giỏ M1–M4, danh sách so sánh, hồ sơ và máy đang chọn mở trên máy khác vẫn còn." },
        { t: "Món trong túi đồ có vòng chấm trên đồ thị." },
      ],
    },
  },
  apps: {
    console: "Cài tay từng bước theo đúng menu trên máy Sony Alpha của bạn, kèm công cụ tạo file Memory Recall M1–M4.",
    colors: "Công thức màu Picture Profile kèm cân bằng trắng. Chọn vào giỏ M1–M4 để nạp thẳng vào máy.",
    wiki: "Thông số máy ảnh, ống kính và phụ kiện Sony, so sánh tối đa 4 món.",
    blog: "Bài viết và ghi chú kiến thức chụp ảnh: phơi sáng, lấy nét, màu, ống kính.",
  },
};

// Landing: nút vào dự án (Alpha Console) và h1 cho trình đọc màn hình
export const access = {
  enter: "Mở Alpha Console",
  // Túi đồ có máy được hướng dẫn: vào thẳng máy đó. Người quay lại (đã chọn máy từ trước): tiếp tục với máy đó.
  setup: (camera: string) => `Cài ${camera}`,
  resume: (camera: string) => `Tiếp tục với ${camera}`,
  pageTitle: "Bản đồ kiến thức máy ảnh Sony",
};

// Module túi đồ: một ô nhập và nút Thêm, không giới hạn số món
export const gearManager = {
  title: "Túi đồ",
  inputLabel: "Tên hoặc mã sản phẩm",
  placeholder: "Ví dụ: A6400, ILCE-7CM2, FE 50mm F1.8",
  add: "Thêm",
  inBag: (names: string) => `Trong túi: ${names}`,
  unsupportedTitle: "Sản phẩm này chưa được hỗ trợ",
  unsupported: (q: string) => `"${q}" chưa có trong dự án. Thử gõ đúng tên hoặc mã Sony, ví dụ A7 IV hoặc ILCE-7M4.`,
  close: "Đóng",
  added: (name: string) => `Đã thêm ${name}`,
  already: (name: string) => `${name} đã có trong túi`,
  groups: { body: "Máy ảnh", lens: "Ống kính", acc: "Phụ kiện" },
  suggest: "Gợi ý gần nhất:",
  productWiki: "Duyệt Product Wiki",
};

// Trang hồ sơ /tai-khoan (chủ hồ sơ) và /ho-so#… (link chia sẻ, chỉ xem)
export const profile = {
  title: "Hồ sơ",
  sharedTitle: (name: string) => `Túi đồ của ${name}`,
  edit: "Sửa hồ sơ",
  save: "Lưu",
  cancel: "Hủy",
  share: "Chia sẻ hồ sơ",
  shareText: (name: string) => `Túi đồ Sony của ${name}`,
  username: "Tên người dùng",
  bio: "Giới thiệu",
  bioPlaceholder: "Bạn chụp gì, quay gì với bộ máy này?",
  noIntro: "Chưa có giới thiệu hoặc liên kết.",
  links: "Liên kết",
  linkPlaceholder: "instagram.com/ten-ban",
  addLink: "Thêm liên kết",
  removeLink: "Bỏ liên kết",
  badLink: "Liên kết phải bắt đầu bằng http:// hoặc https://, ví dụ instagram.com/ten-ban.",
  stats: (body: number, lens: number, acc: number) => [`${body} máy ảnh`, `${lens} ống kính`, `${acc} phụ kiện`],
  addTitle: "Thêm đồ",
  empty: "Túi đồ đang trống",
  remove: (name: string) => `Bỏ ${name} khỏi túi`,
  removed: (name: string) => `Đã bỏ ${name}`,
  undo: "Hoàn tác",
  view: (name: string) => `Xem ${name} trong Product Wiki`,
  badShare: "Liên kết hồ sơ không đọc được. Nhờ người gửi chia sẻ lại.",
  makeYours: "Tạo túi đồ của bạn",
  shareInfo: "Liên kết chia sẻ chứa sẵn tên, ảnh đại diện, giới thiệu, liên kết và túi đồ của bạn lúc bấm chia sẻ. Sửa hồ sơ sau đó thì chia sẻ lại để có liên kết mới.",
  shared: "Đã chép hồ sơ",
  syncTerm: "Đồng bộ tài khoản",
};

// PWA: tên và mô tả khi cài trang thành ứng dụng
export const appInfo = {
  name: "alphacolorlab.com",
  shortName: "alphacolorlab.com",
  description: "Cài máy ảnh Sony Alpha đúng theo menu trên máy, kèm bộ cài đặt tạo sẵn và hệ thống kiến thức sản phẩm, ánh sáng, màu sắc nối với nhau bằng từ khóa. Chạy cả khi không có mạng.",
};

// Giải thích thuật ngữ cho người mới, hiện trong nút "i" (InfoTip). Tên chế độ theo bộ nhớ dịch ILDC; tốc độ khung hình theo Help Guide ZV-E10.
export type GlossaryEntry = { term: string; lines: { k?: string; t: string }[] };

// Trang /giai-ma (công khai): lượt tiếp theo, kết quả sau mỗi lượt (tiến độ chỉ khi showDecodeStatus). Bảng tham số chỉ ở /admin/decode (chỉ dev). (app/components/decode/*, app/admin/decode/*, app/components/game/GameDialog.tsx)
export const decodeConsole = {
  round: {
    title: "Kết quả giải mã",
    empty: "Lượt này chưa đọc được giá trị nào từ file máy lưu.",
    confirmed: (n: number, fresh: number) =>
      fresh > 0 ? `Xác nhận ${n} giá trị, trong đó ${fresh} giá trị mới` : `Xác nhận ${n} giá trị`,
    newMark: "mới",
    codeOf: "mã",
    learned: (n: number) => `Học được ${n} mã mới`,
    located: (n: number) => `Định vị ${n} cài đặt`,
    locatedLine: (name: string, slot: number, wheres: string, total: number) =>
      `${name}, M${slot}: ${wheres}${total > 4 ? ` và ${total - 4} vị trí khác` : ""}`,
    problems: (n: number) => `${n} mục cần làm lại`,
    mismatch: (slot: number, name: string, expected: string, actual: string | null) =>
      `M${slot} · ${name}: cài ${expected}, máy lưu ${actual ?? "không đọc được"}`,
    ambiguous: (slot: number, names: string) => `M${slot}: chưa phân biệt được ${names}`,
    devSave: "Lưu lượt này vào dự án",
    devSaved: (dir: string) => `Đã lưu vào ${dir}`,
    devFailed: (err: string) => `Chưa lưu được: ${err}`,
    devNetwork: "không kết nối được máy chủ dev",
  },
  table: {
    title: "Bảng tham số",
    setting: "Mục",
    all: "Tất cả",
    missing: "Còn thiếu",
    noMissing: "Không còn mục nào thiếu.",
    cell: (name: string, camera: string, confirmed: number, total: number) =>
      `${name} trên ${camera}: ${confirmed}/${total} giá trị đã xác nhận`,
    absent: "Không có trên máy này",
    detailsOf: (name: string) => `Chi tiết ${name}`,
    legend: {
      confirmed: "Đã xác nhận",
      predicted: "Có mã, chưa thấy",
      pending: "Đã định vị, chưa có mã",
      unknown: "Chưa định vị",
    },
    where: "Vị trí",
    notLocated: "Chưa định vị",
    evidence: "File máy thật",
    noEvidence: "Chưa có file máy thật",
    codecOnly: "Chỉ có trong codec",
    priority: "Ưu tiên ở lượt tới",
    priorityOn: "Đang ưu tiên",
    numeric: "Cài đặt số: không đếm theo giá trị",
    scale: "Thang số",
    candidates: {
      title: "Mã và vị trí ứng viên từ các lượt đã lưu",
      none: "Chưa có ứng viên nào. Lưu một lượt có mục chưa có mã hoặc chưa định vị để thấy ở đây.",
      code: (value: string, raw: string, where: string) => `${value}: mã ${raw} tại ${where}`,
      locate: (value: string, changes: string) => `${value}: đổi ở ${changes}`,
      ambiguous: (changes: string) => `Chưa tách được, nhiều mục cùng đổi: ${changes}`,
      mismatch: (value: string, actual: string) => `Đề yêu cầu ${value}, file ghi ${actual}`,
      round: "Lượt",
    },
    cellLegend: { done: "Đủ giá trị", partial: "Còn thiếu giá trị", none: "Chưa định vị", scale: "Thang số: đã định vị" },
    observed: (n: number) => `Đã thấy ${n} giá trị khác nhau`,
  },
  strip: {
    located: (n: number, total: number) => `Định vị ${n}/${total} cài đặt`,
    confirmed: (n: number, total: number) => `Xác nhận ${n}/${total} giá trị`,
    roundsLeft: (n: number) => `Còn khoảng ${n} lượt`,
    roundsDone: "Đã đủ, không cần thêm lượt",
    roundsUnknown: "Chưa đủ dữ liệu để ước lượng số lượt",
  },
  next: {
    title: "Lượt giải mã tiếp theo",
    need: "Cần giải mã",
    keep: "Giữ để kiểm tra",
    emptySlot: "Ô này không có mục để giải mã.",
    yield: (confirm: number, learn: number, locate: number, steps: number) =>
      `Dự kiến xác nhận ${confirm} giá trị, học ${learn} mã mới ở ${locate} cài đặt, trong ${steps} bước.`,
    another: "Lập lượt khác",
  },
  admin: {
    title: "Bảng tham số giải mã",
    lead: "Chỉ chạy trên npm run dev: bảng tham số theo từng máy và lưu lượt vào dự án. Trang này không có trên bản phát hành.",
    camera: "Máy",
    toPresets: "Quản lý bộ preset",
    toDecode: "Bảng tham số giải mã",
  },
};

// Mini game: góp mẫu máy, chơi và học menu
export const game = {
  vi: {
    button: "Chơi: Hiểu về menu máy ảnh Sony",
    intro: {
      title: "Hiểu về menu máy ảnh Sony",
      what: "Chơi game học menu và góp mẫu",
      lead: "Bạn sẽ được giao 4 nhiệm vụ: mỗi ô M1–M4 có danh sách giá trị cần đặt. Hãy cài đặt trên máy, lưu từng ô, rồi chọn thẻ nhớ để máy kiểm tra.",
      dataUsed: "Dữ liệu được gửi đi:",
      dataItems: [
        "Model máy (ZV-E10, A6400 hay A7C II)",
        "Phiên bản firmware (đọc tự động từ EXIF của ảnh mới nhất)",
        "Hệ PAL hay NTSC",
        "4 file .DAT từ thẻ nhớ (ZV-E10 ≈18 KB, A7C II ≈56 KB)",
        "Thời gian chơi, số lần làm lại (nếu có)",
        "Biệt danh (tùy chọn, ≤32 ký tự)",
      ],
      notSent: "Không gửi: email, ảnh chụp, video, hay thông tin cá nhân nào khác.",
      agree: "Tôi đồng ý gửi dữ liệu này",
      model: "Máy của bạn",
      firmware: "Phiên bản firmware",
      firmwareHint: "Ví dụ: 2.01",
      region: "Hệ máy",
      nickname: "Biệt danh (tùy chọn)",
      nicknameHint: "Tối đa 32 ký tự",
      lang: "Ngôn ngữ",
      unsupported: "Chơi game cần Chrome hoặc Edge trên máy tính. Trình duyệt này chưa hỗ trợ.",
      start: "Bắt đầu chơi",
    },
    backup: {
      title: "Sao lưu M1–M4 cũ",
      lead: "Trò chơi sẽ ghi đè M1–M4 hiện tại trên thẻ. Hãy sao lưu bọn nó trước.",
      warning: "Tất cả 4 ô M1–M4 sẽ bị thay thế khi bạn hoàn tất trò chơi.",
      selectCardBtn: "Chọn thẻ nhớ",
      selectCardErr: "Chọn thẻ không được. Hãy kiểm tra lại.",
      downloadBtn: "Tải bản sao lưu (ZIP)",
      found: "Đã tìm được {0} file M1–M4",
      next: "Tiếp tục",
      selecting: "Đang chọn...",
      back: "Quay lại",
      close: "Đóng",
      firmwareLabel: "Phiên bản firmware",
      firmwareSource: "Đọc từ ảnh mới nhất trên thẻ",
      firmwareHint: "Chọn thư mục gốc của thẻ, hoặc chụp một ảnh rồi chọn lại, hoặc nhập tay",
      firmwareMenu: { zve10: "MENU › Cài đặt › Phiên bản", a6400: "MENU › Cài đặt › Phiên bản", a7c2: "MENU › Cài đặt › Tùy chọn cài đặt › Phiên bản" },
      firmwareModelMismatch: "Phiên bản này từ máy {0}, nhưng bạn chọn {1}. Hãy kiểm tra lại.",
    },
    mission: {
      title: "Cài đặt 4 ô nhớ",
      lead: "Làm theo danh sách dưới đây. Mỗi ô M1–M4 có những giá trị cần đặt trước khi bạn lưu.",
      slotLabel: (n: number) => `M${n} · Cài đặt máy ảnh1 › Camera Set. Memory › M${n}`,
      slotLabelA6400: (n: number) => `M${n} · MENU › Camera Settings1 › Memory › M${n}`,
      saved: "Đã lưu",
      note: "Lưu vào thứ tự: M1 → M2 → M3 → M4.",
      timer: "Thời gian: {0}",
      done: "Đã lưu xong, đọc thẻ",
      generatingMission: "Đang tạo nhiệm vụ...",
      back: "Quay lại",
    },
    verify: {
      title: "Kiểm tra kết quả",
      checks: "Kiểm tra",
      checkingMsg: "Đang kiểm tra...",
      scoreBreakdown: "Kết quả",
      accuracy: "Độ chính xác",
      speed: "Tốc độ",
      total: "Tổng điểm",
      maxPoints: (max: number) => `/ ${max}`,
      submit: "Gửi kết quả",
      restoreOld: "Khôi phục M1–M4 cũ",
      playAgain: "Chơi lượt mới",
      retryMsg: "Làm lại các ô: {0}",
      checkLine: (slot: number, setting: string, expected: string, actual: string | null) => `M${slot} · ${setting}: cần ${expected}, file đang là ${actual ?? "không đọc được"}`,
      readAgain: "Đọc lại thẻ",
      errorMsg: "Chưa thể xử lý kết quả:",
      downloadLog: "Tải log (JSON)",
      restoring: "Đang khôi phục...",
      restoredNote: "Gọi lại M1–M4 trên máy theo hướng dẫn trên trang.",
      restoredStatus: "Đã khôi phục M1–M4 cũ thành công.",
      restoreError: "Lỗi khôi phục. Hãy kiểm tra kết nối.",
      submitting: "Đang gửi...",
      back: "Quay lại",
      errors: {
        notCard: "Thẻ không hợp lệ. Chọn thẻ máy ảnh.",
        noFiles: "Không tìm được file M1–M4 trên thẻ.",
        mismatch: "File không khớp. Hãy lưu lại các ô.",
        generic: "Lỗi đọc thẻ. Hãy kiểm tra kết nối.",
      },
    },
  },
  en: {
    button: "Play: Understand your Sony camera menu",
    intro: {
      title: "Understand your Sony camera menu",
      what: "Play a game and contribute data",
      lead: "You will be given 4 tasks: each slot M1–M4 has a list of settings to configure. Set them on your camera, save each slot, then select your memory card so the game can verify.",
      dataUsed: "Data that will be sent:",
      dataItems: [
        "Camera model (ZV-E10, A6400 or A7C II)",
        "Firmware version (read automatically from newest photo EXIF)",
        "PAL or NTSC region",
        "4 .DAT files from memory card (ZV-E10 ≈18 KB, A7C II ≈56 KB)",
        "Game duration, number of retries",
        "Nickname (optional, ≤32 characters)",
      ],
      notSent: "Not sent: email, photos, videos, or any personal information.",
      agree: "I agree to send this data",
      model: "Your camera",
      firmware: "Firmware version",
      firmwareHint: "e.g., 2.01",
      region: "Region",
      nickname: "Nickname (optional)",
      nicknameHint: "Up to 32 characters",
      lang: "Language",
      unsupported: "This game requires Chrome or Edge on desktop. Your browser is not supported.",
      start: "Start game",
    },
    backup: {
      title: "Back up your current M1–M4",
      lead: "The game will overwrite your current M1–M4 on the card. Please back them up first.",
      warning: "All 4 slots M1–M4 will be replaced when you finish the game.",
      selectCardBtn: "Select card",
      selectCardErr: "Failed to select card. Please try again.",
      downloadBtn: "Download backup (ZIP)",
      found: "Found {0} M1–M4 files",
      next: "Next",
      selecting: "Selecting...",
      back: "Back",
      close: "Close",
      firmwareLabel: "Firmware version",
      firmwareSource: "Read from newest photo on card",
      firmwareHint: "Select card root folder, or take a photo and select again, or type it in",
      firmwareMenu: { zve10: "MENU › Setup › Version", a6400: "MENU › Setup › Version", a7c2: "MENU › Setup › Setup Option › Version" },
      firmwareModelMismatch: "This version is from {0}, but you selected {1}. Please check.",
    },
    mission: {
      title: "Configure 4 memory slots",
      lead: "Follow the checklist below. Each slot M1–M4 has specific settings you need to configure before saving.",
      slotLabel: (n: number) => `M${n} · Camera Settings1 › Camera Set. Memory › M${n}`,
      slotLabelA6400: (n: number) => `M${n} · MENU › Camera Settings1 › Memory › M${n}`,
      saved: "Saved",
      note: "Save in order: M1 → M2 → M3 → M4.",
      timer: "Time: {0}",
      done: "All saved, read card",
      generatingMission: "Generating mission...",
      back: "Back",
    },
    verify: {
      title: "Review results",
      checks: "Checks",
      checkingMsg: "Checking...",
      scoreBreakdown: "Score",
      accuracy: "Accuracy",
      speed: "Speed",
      total: "Total",
      maxPoints: (max: number) => `/ ${max}`,
      submit: "Submit",
      restoreOld: "Restore old M1–M4",
      playAgain: "Play again",
      retryMsg: "Redo slots: {0}",
      checkLine: (slot: number, setting: string, expected: string, actual: string | null) => `M${slot} · ${setting}: expected ${expected}, file has ${actual ?? "unreadable"}`,
      readAgain: "Read card again",
      errorMsg: "Could not process your result:",
      downloadLog: "Download log (JSON)",
      restoring: "Restoring...",
      restoredStatus: "Old M1–M4 restored successfully.",
      restoreError: "Restore error. Please check your connection.",
      submitting: "Submitting...",
      back: "Back",
      restoredNote: "Recall M1–M4 on your camera following the guide on the main page.",
      errors: {
        notCard: "Card is not valid. Select your camera's memory card.",
        noFiles: "No M1–M4 files found on card.",
        mismatch: "Files do not match. Please save the slots again.",
        generic: "Error reading card. Please check your connection.",
      },
    },
  },
};

export const glossary: Record<"system" | "shootMode" | "aperture" | "shutter" | "iso" | "focus" | "focusArea" | "metering" | "facePriority" | "softSkin" | "autoReview" | "preAF" | "flashMode" | "expCompSet" | "awbPriority" | "steadyShot" | "eFrontCurtain" | "liveViewDisplay", GlossaryEntry> = {
  system: {
    term: "PAL và NTSC",
    lines: [
      { t: "Hai chuẩn video, quyết định tốc độ khung hình khi quay phim." },
      { k: "PAL:", t: "25p, 50p, 100p. Mặc định trên máy bán tại Việt Nam và châu Âu." },
      { k: "NTSC:", t: "24p, 30p, 60p, 120p. Mặc định trên máy bán tại Mỹ và Nhật." },
      { t: "Máy chỉ đọc file M1–M4 đúng hệ đang đặt, nên hãy chọn giống máy của bạn." },
      { k: "Kiểm tra:", t: "MENU, Setup, NTSC/PAL Selector." },
    ],
  },
  shootMode: {
    term: "Chế độ chụp",
    lines: [
      { k: "P · Tự động chương trình:", t: "máy tự chọn khẩu độ và tốc độ. Dễ nhất cho người mới." },
      { k: "A · Ưu tiên khẩu độ:", t: "bạn chọn khẩu độ để phông nền mờ nhiều hay ít, máy lo tốc độ." },
      { k: "S · Ưu tiên tốc độ màn trập:", t: "bạn chọn tốc độ để đóng băng hay làm nhòe chuyển động, máy lo khẩu độ." },
      { k: "M · Phơi sáng thủ công:", t: "bạn tự chọn cả khẩu độ và tốc độ." },
      { k: "Giữ:", t: "không đổi chế độ đang lưu trong ô nhớ." },
    ],
  },
  aperture: {
    term: "Khẩu độ",
    lines: [
      { t: "Độ mở của ống kính, ghi bằng số F như F1.8, F4, F8." },
      { k: "Số F nhỏ:", t: "mở to, vào nhiều sáng, phông nền mờ mạnh." },
      { k: "Số F lớn:", t: "mở hẹp, ít sáng hơn, cảnh rõ từ trước ra sau." },
      { t: "Có tác dụng ở chế độ A và M. Chưa gắn ống kính thì máy hiện F--." },
    ],
  },
  shutter: {
    term: "Tốc độ màn trập",
    lines: [
      { t: "Thời gian màn trập mở cho cảm biến nhận sáng, ví dụ 1/125 giây." },
      { k: "Nhanh (1/500 trở lên):", t: "đóng băng chuyển động, ảnh tối hơn." },
      { k: "Chậm (1/30 trở xuống):", t: "ảnh sáng hơn, nhưng dễ nhòe nếu tay rung hay chủ thể di chuyển." },
      { t: "Có tác dụng ở chế độ S và M." },
    ],
  },
  iso: {
    term: "ISO",
    lines: [
      { t: "Độ nhạy sáng của cảm biến." },
      { k: "ISO thấp (100–400):", t: "ảnh sạch, cần đủ sáng." },
      { k: "ISO cao (3200 trở lên):", t: "chụp được chỗ tối, nhưng ảnh nhiễu hạt hơn." },
      { k: "AUTO:", t: "máy tự chọn theo ánh sáng. Hợp với người mới." },
    ],
  },
  focus: {
    term: "Chế độ lấy nét",
    lines: [
      { k: "AF-C · AF liên tục:", t: "máy bám nét liên tục khi bạn nhấn nửa nút chụp. Hợp chủ thể di chuyển. Chuyên gia Sony khuyên dùng mặc định." },
      { k: "AF-S · AF một lần:", t: "khóa nét một lần khi nhấn nửa nút. Hợp chủ thể đứng yên." },
      { k: "MF · Lấy nét tay:", t: "xoay vòng lấy nét trên ống kính." },
      { k: "Giữ gốc:", t: "không đổi chế độ đang lưu trong ô nhớ." },
    ],
  },
  focusArea: {
    term: "Vùng lấy nét",
    lines: [
      { k: "Rộng:", t: "máy tự chọn điểm nét trên toàn khung." },
      { k: "Vùng:", t: "bạn chọn một vùng, máy lấy nét trong vùng đó." },
      { k: "Điểm linh hoạt: L:", t: "máy lấy nét từ một điểm lớn mà bạn chọn." },
      { k: "Theo dõi: Vùng:", t: "bám chủ thể khi nhấn nửa nút chụp, bắt đầu từ vùng đã chọn. Chuyên gia Sony khuyên dùng." },
      { k: "Theo dõi: Điểm linh hoạt L:", t: "bám chủ thể từ một điểm lớn." },
      { t: "ZV-E10 mặc định chỉ hiện 5 kiểu này (Giới hạn vùng lấy nét / Focus Area Limit)." },
      { k: "Giữ gốc:", t: "không đổi vùng lấy nét đang lưu trong ô nhớ." },
    ],
  },
  metering: {
    term: "Chế độ đo sáng",
    lines: [
      { k: "Đa điểm:", t: "Đo cả khung, hợp đa số cảnh, khuyên dùng." },
      { k: "Trung tâm:", t: "Ưu tiên giữa khung." },
      { k: "Điểm: Tiêu chuẩn:", t: "Đo vùng nhỏ ở giữa." },
      { k: "Điểm: Lớn:", t: "Đo vùng lớn hơn ở giữa." },
      { k: "Trung bình toàn khung:", t: "Trung bình cộng cả khung." },
      { k: "Vùng sáng:", t: "Ưu tiên vùng sáng nhất để tránh cát cứng." },
      { k: "Giữ gốc:", t: "Không đổi chế độ đang lưu trong ô nhớ." },
    ],
  },
  facePriority: {
    term: "Ưu tiên mặt (đa điểm)",
    lines: [
      { t: "Khi đo Đa điểm, máy đo sáng theo khuôn mặt nhận diện được, khuyên dùng Bật." },
      { t: "Chỉ có tác dụng khi đo Đa điểm." },
    ],
  },
  softSkin: {
    term: "Làm mịn da",
    lines: [
      { k: "Tắt:", t: "Không làm mịn." },
      { k: "Bật: Thấp:", t: "Làm mịn da nhẹ." },
      { k: "Bật: Trung bình:", t: "Làm mịn da vừa phải, khuyên dùng." },
      { k: "Bật: Cao:", t: "Làm mịn da mạnh." },
      { t: "Không áp dụng cho file RAW." },
    ],
  },
  autoReview: {
    term: "Tự động xem lại",
    lines: [
      { k: "Tắt:", t: "Chụp xong máy sẵn sàng chụp tiếp ngay, khuyên dùng." },
      { k: "2 giây:", t: "Hiện ảnh vừa chụp 2 giây rồi quay lại ngóm chụp." },
      { k: "5 giây:", t: "Hiện ảnh vừa chụp 5 giây rồi quay lại ngóm chụp." },
      { k: "10 giây:", t: "Hiện ảnh vừa chụp 10 giây rồi quay lại ngóm chụp." },
      { k: "Giữ gốc:", t: "Không đổi chế độ đang lưu trong ô nhớ." },
    ],
  },
  preAF: {
    term: "Pre-AF",
    lines: [
      { t: "Máy tự lấy nét liên tục trước khi bạn nhấn nửa nút chụp." },
      { t: "Khi nhấn nửa nút, nét đã gần đúng nên bắt nét nhanh hơn." },
      { t: "Chỉ có khi gắn ống kính ngàm E." },
    ],
  },
  flashMode: {
    term: "Chế độ flash",
    lines: [
      { k: "Đèn flash cưỡng bức:", t: "Flash nháy mỗi lần chụp." },
      { k: "Đồng bộ chậm:", t: "Flash nháy mỗi lần chụp, tốc độ màn trập chậm lại để nền tối vẫn lên sáng." },
      { k: "Đồng bộ sau:", t: "Flash nháy ngay trước khi kết thúc phơi sáng, vệt chuyển động nằm phía sau chủ thể nên trông tự nhiên." },
      { t: "ZV-E10 không có flash tích hợp, cần flash ngoài. A6400 có flash tích hợp." },
    ],
  },
  expCompSet: {
    term: "Cài đặt bù sáng",
    lines: [
      { k: "Môi trường & flash:", t: "Bù sáng điều chỉnh cả ánh sáng xung quanh lẫn công suất flash." },
      { k: "Chỉ môi trường:", t: "Bù sáng chỉ điều chỉnh ánh sáng xung quanh. Flash chỉnh riêng bằng Bù flash." },
    ],
  },
  awbPriority: {
    term: "Ưu tiên trong AWB",
    lines: [
      { k: "Chuẩn:", t: "Cân bằng trắng tự động thông thường." },
      { k: "Môi trường:", t: "Giữ tông màu của nguồn sáng, ảnh ấm hơn." },
      { k: "Trắng:", t: "Giữ màu trắng trung tính khi nguồn sáng có nhiệt độ màu thấp, như đèn sợi đốt." },
      { t: "Chỉ có tác dụng khi cân bằng trắng là Tự động." },
    ],
  },
  steadyShot: {
    term: "SteadyShot",
    lines: [
      { t: "Chống rung bằng ống kính có chữ OSS. ZV-E10 và A6400 không có chống rung trên thân." },
      { t: "Không chọn được khi ống kính không có OSS." },
      { t: "Sony khuyên tắt khi dùng chân máy." },
    ],
  },
  eFrontCurtain: {
    term: "Màn trập trước điện tử",
    lines: [
      { t: "Màn trập trước được thay bằng mạch điện tử trên cảm biến, rút ngắn độ trễ khi nhấn nút chụp." },
      { t: "Đặt Tắt thì chụp liên tục chậm hơn." },
      { t: "Đặt Tắt khi dùng ống kính hãng khác, ống kính qua ngàm chuyển, hoặc khi vùng bokeh bị cắt ở tốc độ cao với ống kính khẩu lớn." },
    ],
  },
  liveViewDisplay: {
    term: "Hiển thị Live View",
    lines: [
      { k: "Bật hiệu ứng cài đặt:", t: "Màn hình hiện ảnh gần giống kết quả cuối, theo mọi cài đặt đang dùng." },
      { k: "Tắt hiệu ứng cài đặt:", t: "Màn hình bỏ qua bù sáng và cân bằng trắng để dễ xem bố cục, kể cả ở chế độ M." },
      { t: "Khi dùng flash studio, chọn Tắt để màn hình không bị tối." },
    ],
  },
};

// Nhãn tiếng Việt cho cài đặt chỉ có trong codec (bảng tham số ở /admin/decode). Id không có trong map: dùng nhãn gốc của hàng.
export const codecSettingLabels: Record<string, string> = {
  shootMode: glossary.shootMode.term,
  aperture: glossary.aperture.term,
  shutter: glossary.shutter.term,
  iso: glossary.iso.term,
  wbKelvin: "Nhiệt độ màu (K)",
  pictureProfile: "Picture Profile",
  ppGamma: "Gamma (Picture Profile)",
  ppColorMode: "Chế độ màu (Picture Profile)",
  ppLevels: "Mức đen (Picture Profile)",
  isoAutoMinSS: "ISO tự động: tốc độ tối thiểu",
  isoAutoMinSSSpeed: "ISO tự động: mức tốc độ",
  meteringSpotSize: "Kích thước vùng đo điểm",
  softSkinLevel: `Mức ${glossary.softSkin.term.toLowerCase()}`,
};

// Đọc file .DAT đã lưu trên máy (app/components/DatImport.tsx, lib/datImport.ts). Chỉ đọc; ảnh ZV-E10 mới nạp được vào ô M1–M4.
export const datImport = {
  title: "Đọc file đã lưu trên máy",
  info: {
    term: "Đọc file đã lưu trên máy",
    lines: [
      { t: "Trên máy, lưu bằng mục Memory trong MENU › Cài đặt máy ảnh1 › Chế độ chụp (MR là mục gọi lại). File trên thẻ có tên CAMPR0xP.DAT; chọn file đó ở đây." },
      { k: "ZV-E10 ảnh:", t: "nạp được vào ô M1–M4 đang sửa. Mục không nạp được hiện ở dòng Không nạp được." },
      { k: "ZV-E10 phim:", t: "chỉ đọc để xem." },
      { k: "α6400:", t: "đọc thử nghiệm, chưa tạo được file M1–M4." },
      { k: "A7C II:", t: "hiện các cài đặt đã xác nhận, chưa nạp vào công cụ tạo bộ." },
    ],
  },
  pick: "Chọn file .DAT",
  reading: "Đang đọc…",
  readError: "không đọc được file trên trình duyệt này.",
  useSlot: "Nạp vào ô đang sửa",
  none: "không đọc được",
  skipped: "Không nạp được",
  unsupported: "Phim này không đọc được vì phần kiểm tra cuối file bị sai. Hãy lưu lại trên máy rồi chọn file vừa lưu.",
  movieNote: "Phim (CAMPR05–08) chỉ đọc để xem, không nạp vào M1–M4.",
  a6400Note: "α6400 đang đọc thử nghiệm. Giá trị dưới đây chưa kiểm chứng đủ, và chưa tạo được file M1–M4 cho máy này.",
  a7c2Note: "A7C II: chỉ hiện các cài đặt đã xác nhận. Trang chưa tạo file M1–M4 cho máy này.",
  unconfirmed: "Chưa xác nhận",
  off: "Tắt",
  badge: {
    zve10: "ZV-E10",
    a6400: "α6400",
    a7c2: "A7C II",
    photo: "Ảnh",
    movie: "Phim",
    readOnly: "Chỉ đọc",
    experimental: "Thử nghiệm",
    slot: (n: number, family: string) => `Ô M${n} · ${family}`,
  },
  label: {
    mode: glossary.shootMode.term,
    aperture: glossary.aperture.term,
    shutter: glossary.shutter.term,
    iso: glossary.iso.term,
    wb: "Cân bằng trắng",
    "wb.priority": glossary.awbPriority.term,
    focus: glossary.focus.term,
    focusArea: glossary.focusArea.term,
    metering: glossary.metering.term,
    facePriority: glossary.facePriority.term,
    softSkin: glossary.softSkin.term,
    autoReview: glossary.autoReview.term,
    flashMode: glossary.flashMode.term,
    expCompSet: glossary.expCompSet.term,
    awbPriority: glossary.awbPriority.term,
    preAF: glossary.preAF.term,
    steadyShot: glossary.steadyShot.term,
    eFrontCurtain: glossary.eFrontCurtain.term,
    liveView: glossary.liveViewDisplay.term,
    ppOn: "Picture Profile",
    pp: "Thông số PP1",
    ppBanks: "Bank PP2–PP10",
    wbMode: "Cân bằng trắng",
    kelvin: "Nhiệt độ màu",
    ppGamma: "PP Gamma",
    ppColorMode: "PP chế độ màu",
    ppBlackLevel: "PP mức đen",
    focusMode: glossary.focus.term,
    shootMode: glossary.shootMode.term,
    liveViewDisplay: glossary.liveViewDisplay.term,
    pictureProfile: "Picture Profile",
    dro: "DRO",
    meteringSpotSize: "Cỡ vòng đo điểm",
    isoAutoMinSS: "ISO AUTO tốc độ tối thiểu",
    isoAutoMinSSSpeed: "ISO AUTO tốc độ cụ thể",
    softSkinLevel: "Mức làm mịn da",
  },
};

// Trang đồ thị /do-thi/[app] (mở từ menu người dùng): tên app, nút về danh sách, tên đồ thị cho trình đọc màn hình
export const appHome = {
  views: { graph: "Đồ thị", list: "Danh sách" },
  console: { title: "Alpha Console", graph: "Đồ thị Alpha Console: máy, chương cài tay, bước và công cụ" },
  colors: { title: "Color Bank", graph: "Đồ thị Color Bank: công thức màu, Gamma và Chế độ màu" },
  wiki: { title: "Product Wiki", graph: "Đồ thị Product Wiki: máy ảnh, ống kính, phụ kiện" },
  blog: { title: "Blog", graph: "Đồ thị Blog: bài viết, kiến thức và sản phẩm" },
};

export const constellation = {
  zoomIn: "Phóng to",
  zoomOut: "Thu nhỏ",
  legend: "Làm nổi nút của một ứng dụng",
  focusHint: "Chạm lần nữa để mở",
  focusHintMouse: "Bấm lần nữa để mở",
  firstInteractionHint: "Chạm một nút để chọn, chạm lần nữa để mở",
  firstInteractionHintMouse: "Bấm một nút để chọn, bấm lần nữa để mở",
  instructions: "Kéo để xoay, kéo một nút để dời nó, lăn chuột hoặc chụm hai ngón để phóng to. Bàn phím: mũi tên đi qua các nút kề, Enter chọn rồi mở, Escape về toàn cảnh.",
  announce: (label: string, links: number, canOpen: boolean) => `${label}, ${links} liên kết.${canOpen ? " Nhấn Enter lần nữa để mở." : ""}`,
  cursor: (label: string) => `${label}. Nhấn Enter để chọn.`,
};

export const colorBank = {
  list: {
    title: "Color Bank",
    lead: (n: number) => `${n} công thức Picture Profile kèm cân bằng trắng. ZV-E10 nạp thẳng vào M1–M4. A6400 cài tay theo giá trị của từng công thức.`,
    blocked: "Chỉ cài tay",
  },
  recipe: {
    backLink: "Quay lại",
    whiteBalance: "Cân bằng trắng",
    awb: "Tự động",
    colorTemp: "Nhiệt độ màu",
    kelvin: (k: number) => `${k}K`,
    shift: (type: "A" | "B" | "G" | "M", value: number) => `${type}${Math.abs(value)}`,
    pictureProfile: "Picture Profile (PP1)",
    menuPath: "MENU › Cài đặt máy ảnh1 › Picture Profile",
    useForSlots: "Dùng cho M1–M4",
    blocked: (reason: string) => `Chưa tạo được file Memory Recall cho công thức này. ${reason} Cài tay theo các giá trị ở trên.`,
  },
  graph: {
    title: "Đồ thị công thức",
    lead: "Mỗi công thức nối với Gamma, Chế độ màu và bài kiến thức về cân bằng trắng. Chọn một nút để xem các liên kết.",
    backLink: "Quay lại",
    kind: { recipe: "Công thức", gamma: "Gamma", mode: "Chế độ màu", note: "Kiến thức", article: "Bài viết", product: "Sản phẩm" },
    pick: "Chọn một nút trong đồ thị để xem nó nối với những gì.",
    open: "Xem công thức",
    usedBy: (n: number) => `${n} công thức dùng giá trị này.`,
    neighbors: "Liên kết",
  },
  cart: {
    addButton: (name: string, slot: number) => `Thêm ${name} vào M${slot}`,
    removeButton: (name: string, slot: number) => `Bỏ ${name} khỏi M${slot}`,
    slotLabel: (slot: number, count: number) => `M${slot} · ${count}/10`,
    createFile: "Tạo file M1–M4",
    clearCart: "Xóa giỏ",
    noteTerm: "Giỏ M1–M4",
    note: "Mỗi ô M1–M4 nhận tối đa 10 công thức, xếp lần lượt vào PP1–PP10. Máy chỉ lưu một cân bằng trắng cho mỗi ô: của công thức PP1.",
  },
  // Bản mod PP: chỉnh một công thức, lưu riêng trên máy và đồng bộ tài khoản
  mod: {
    create: "Tạo bản mod",
    editNew: "Bản mod mới",
    editOld: "Sửa bản mod",
    nameLabel: "Tên bản mod",
    nameRequired: "Đặt tên cho bản mod trước khi lưu.",
    noChange: "Chưa đổi giá trị nào so với công thức gốc.",
    invalid: "Có giá trị không hợp lệ. Sửa lại rồi lưu.",
    mine: "Bản mod của tôi",
    useForSlots: "Dùng cho M1–M4",
    edit: "Sửa",
    remove: "Xóa",
    removeAsk: "Xóa bản mod này?",
    removeConfirm: "Xóa",
    keep: "Giữ lại",
    baseValue: (v: string | number) => `gốc ${v}`,
    limit: {
      term: "Giới hạn bản mod",
      lines: [{ t: "Tối đa 20 bản mod. Xóa bớt một bản để tạo bản mới." }],
    },
  },
  ppForm: { save: "Lưu", cancel: "Hủy" },
};

// Danh sách / Lưới: kiểu hiển thị của Blog và Product Wiki. Núm nằm trong thẻ Cài đặt của /tai-khoan; mặc định là lưới.
export const indexView = {
  settings: "Cài đặt",
  label: "Kiểu hiển thị",
  list: "Danh sách",
  grid: "Lưới",
  info: "Chọn cách Blog và Product Wiki hiện bài viết, sản phẩm: danh sách hoặc lưới ảnh. Lựa chọn lưu trên máy này, không đồng bộ theo tài khoản.",
};

// Blog: chữ của trang /blog và /blog/[id]
export const blog = {
  // Page index /blog
  list: {
    title: "Blog",
    lead: "Bài viết chụp ảnh và kiến thức máy ảnh từ lấy nét đến bù sáng, bố cục đến kỹ thuật sáng tạo.",
  },
  // Topic labels (6 chủ đề)
  topics: {
    af: "Lấy nét",
    exposure: "Phơi sáng",
    composition: "Bố cục",
    gear: "Thiết bị",
    color: "Màu sắc",
    video: "Quay phim",
  },
  // Ba cấp độ, cũng là ba nhóm trong danh sách bài viết
  levels: {
    newbie: "Căn bản",
    mid: "Nâng cao",
    pro: "Chuyên nghiệp",
  },
  // Ba mục của blog
  categories: {
    "ky-thuat": "Kỹ thuật chụp",
    "ky-nang": "Kỹ năng",
    "lo-trinh": "Lộ trình học",
  },
  // Segmented control labels for blog index
  parts: {
    articles: "Bài viết",
    knowledge: "Kiến thức máy ảnh",
  },
  // Detail page /blog/[id]
  detail: {
    back: "Bài viết",
    relatedKnowledge: "Kiến thức liên quan",
    relatedArticles: "Bài liên quan",
    toc: "Trong bài",
    sources: "Nguồn",
    updatedLabel: "Cập nhật",
    menuOld: "ZV-E10, A6400",
    menuNew: "Máy menu mới",
    tldrLabel: "Tóm tắt",
  },
  // Split view hints (md+)
  split: {
    steps: (n: number) => `${n} bước`,
  },
};

// Wiki: chữ của trang /wiki (sản phẩm và kiến thức)
export type SummaryFacts = {
  name: string; code: string; mount?: string; processor?: string; sensor?: string; megapixels?: string; video4k?: string; stabilization?: string; weight?: string;
  format?: string; focal?: string; apertureMax?: string; series?: string; oss: boolean; role?: string;
};

export const wiki = {
  // Page index /wiki
  list: {
    title: "Product Wiki",
    lead: "Thông số máy ảnh Sony Alpha, ống kính và phụ kiện.",
  },
  // Knowledge group headings
  knowledge: {
    title: "Kiến thức",
    lead: "Thuật ngữ trong menu máy ảnh và giải thích thông số của máy ảnh, ống kính.",
    groups: [
      { id: "menu-terms", label: "Thuật ngữ menu" },
      { id: "concepts", label: "Khái niệm" },
      { id: "specs", label: "Thông số sản phẩm" },
    ],
  },
  // Spec rows on /wiki/san-pham/[slug]: label, and the Knowledge note the label links to
  specRows: {
    code: { label: "Mã sản phẩm" },
    processor: { label: "Bộ xử lý", note: "Bộ xử lý hình ảnh" },
    sensor: { label: "Cảm biến", note: "Cảm biến hình ảnh" },
    megapixels: { label: "Độ phân giải ảnh", note: "Độ phân giải ảnh tĩnh" },
    video4k: { label: "Video 4K", note: "Độ phân giải và tốc độ khung hình video" },
    video1080: { label: "Video Full HD", note: "Độ phân giải và tốc độ khung hình video" },
    battery: { label: "Pin", note: "Pin máy ảnh Sony" },
    batteryLife: { label: "Thời lượng pin", note: "Pin máy ảnh Sony" },
    stabilization: { label: "Chống rung" },
    weight: { label: "Trọng lượng" },
    dimensions: { label: "Kích thước" },
    format: { label: "Khổ cảm biến", note: "Cảm biến hình ảnh" },
    focal: { label: "Tiêu cự", note: "Tiêu cự" },
    type: { label: "Loại", note: "Ống kính zoom và ống kính fix" },
    apertureMax: { label: "Khẩu độ lớn nhất", note: "Khẩu độ" },
    apertureMin: { label: "Khẩu độ nhỏ nhất", note: "Khẩu độ" },
    oss: { label: "Chống rung OSS", note: "OSS" },
    powerZoom: { label: "Power Zoom", note: "Power Zoom" },
    series: { label: "Dòng", note: "Dòng ống kính G và G Master" },
    filter: { label: "Filter", note: "Kích thước filter" },
    rearFilter: { label: "Filter sau", note: "Kích thước filter" },
    mount: { label: "Ngàm" },
    micType: { label: "Loại micro" },
    micPattern: { label: "Hướng thu" },
    hpType: { label: "Kiểu tai nghe" },
    driverMm: { label: "Đường kính driver" },
    impedance: { label: "Trở kháng" },
    sensitivity: { label: "Độ nhạy" },
    guideNumber: { label: "Số chỉ đạo (GN)" },
    screenInch: { label: "Kích thước màn hình" },
    capacity: { label: "Dung lượng pin", note: "Pin máy ảnh Sony" },
    voltage: { label: "Điện áp pin", note: "Pin máy ảnh Sony" },
    chargeTime: { label: "Thời gian sạc" },
    inputVoltage: { label: "Điện áp đầu vào" },
    slots: { label: "Số khe thẻ" },
    interface: { label: "Giao diện" },
    compatibleBodies: { label: "Máy tương thích" },
    capacities: { label: "Dung lượng" },
    cardType: { label: "Loại thẻ" },
    uhsBus: { label: "Chuẩn UHS" },
    uhsSpeedClass: { label: "UHS Speed Class" },
    speedClass: { label: "Speed Class" },
    readSpeed: { label: "Tốc độ đọc" },
    writeSpeed: { label: "Tốc độ ghi" },
  } as Record<string, { label: string; note?: string }>,
  specWords: {
    yes: "Có",
    no: "Không",
    none: "Không có",
    zoom: "Zoom",
    prime: "Fix",
    formats: { "full-frame": "Full-frame", "aps-c": "APS-C", "super-35": "Super 35" } as Record<string, string>,
    mounts: { "e-mount": "Ngàm E" } as Record<string, string>,
    micTypes: { "2-way": "2 chiều (2-way)", "electret-condenser": "Condenser electret", condenser: "Condenser", dynamic: "Động (dynamic)" } as Record<string, string>,
    micPatterns: { switchable: "Chuyển được nhiều hướng", omni: "Đa hướng (omni)", uni: "Một hướng (uni)", super: "Siêu định hướng", bi: "Hai hướng (bi)" } as Record<string, string>,
    hpTypes: { "closed-dynamic": "Động, kín", "open-back-dynamic": "Động, hở sau", open: "Hở", closed: "Kín" } as Record<string, string>,
    lensFormats: { "full-frame": "Full-frame (FE)", "aps-c": "APS-C (E)" } as Record<string, string>,
    series: { GM: "G Master", G: "G", ZEISS: "ZEISS", standard: "Tiêu chuẩn" } as Record<string, string>,
    // value, and the Knowledge note the "Chống rung" label links to
    stabilization: {
      ibis: ["Trong thân máy (IBIS)", "Chống rung IBIS"],
      electronic: ["Điện tử", "Chống rung điện tử"],
      optical: ["Quang học trong ống kính", "OSS"],
      none: ["Không có, dùng OSS của ống kính", "OSS"],
    } as Record<string, [string, string]>,
    ossModes: (n: number) => `Có, ${n} chế độ`,
    batteryLife: (shots: string | null, minutes: string | null) =>
      shots || minutes ? [shots && `Khoảng ${shots} ảnh`, minutes && `${minutes} phút quay`].filter(Boolean).join(" · ") + " (CIPA)" : null,
    weight: (body: string | null, total: string | null) =>
      [body && `${body} g thân máy`, total && `${total} g kèm pin và thẻ`].filter(Boolean).join(" · ") || null,
    noFilterThread: "Không có ren filter",
    dropIn: (mm: string) => `${mm} mm (drop-in)`,
  },

  // Level labels
  levels: {
    "cơ bản": "Căn bản",
    "nâng cao": "Nâng cao",
  },
  // Product page sections
  product: {
    title: "Sản phẩm",
    lead: "Thông số máy ảnh, ống kính và phụ kiện Sony theo trang Sony Nhật Bản. Mở một sản phẩm rồi bấm So sánh để đặt tối đa 4 sản phẩm cùng loại cạnh nhau.",
    intro: (cameras: number, lenses: number, accessories: number) => `${cameras} máy ảnh · ${lenses} ống kính · ${accessories} phụ kiện`,
    specs: "Thông số",
    source: "Thông số theo trang Sony Nhật Bản",
    mentions: "Nhắc đến trong Kiến thức",
    review: "Bài đánh giá",
    cameras: {
      fullframe: "Máy ảnh full-frame",
      apsc: "Máy ảnh APS-C",
      compact: "Máy ảnh compact",
      cinema: "Cinema Line",
    },
    // Đoạn mở đầu trang sản phẩm, ghép từ các dòng thông số (lib/productSpecs.ts productSummary)
    summary: {
      camera: (s: SummaryFacts) =>
        `${s.name}${s.code ? ` (${s.code})` : ""} là máy ảnh Sony cảm biến ${s.sensor}, ${s.megapixels}${s.processor ? `, bộ xử lý ${s.processor}` : ""}.` +
        `${s.video4k && s.video4k !== "Không có" ? ` Máy quay video 4K ${s.video4k}.` : ""}` +
        `${s.stabilization ? ` Chống rung: ${s.stabilization[0].toLowerCase()}${s.stabilization.slice(1)}.` : ""}${s.weight ? ` Thân máy nặng ${s.weight}.` : ""}`,
      lens: (s: SummaryFacts) =>
        `${s.name}${s.code ? ` (${s.code})` : ""} là ống kính Sony ${s.series === "Tiêu chuẩn" ? "dòng tiêu chuẩn" : `dòng ${s.series}`} cho máy ${s.format}, tiêu cự ${s.focal}, khẩu độ lớn nhất ${s.apertureMax}.` +
        `${s.oss ? " Ống có chống rung quang học OSS." : ""}${s.weight ? ` Ống nặng ${s.weight}.` : ""}`,
      cinema: (s: SummaryFacts) =>
        `${s.name}${s.code ? ` (${s.code})` : ""} là máy quay Cinema Line của Sony${s.sensor ? `, cảm biến ${s.sensor}` : ""}${s.megapixels ? `, ${s.megapixels}` : ""}${s.mount ? `, ${s.mount}` : ""}.` +
        `${s.weight ? ` Thân máy nặng ${s.weight}.` : ""}`,
      accessory: (s: SummaryFacts) => `${s.name}${s.code ? ` (${s.code})` : ""} là ${s.role ?? "phụ kiện Sony"}${s.weight ? `, nặng ${s.weight}` : ""}.`,
    },
    // Bộ lọc ống kính (lib/lensTags.ts). match "any": khớp một chip bất kỳ trong nhóm; "all": khớp mọi chip đã chọn.
    lensFilter: {
      label: "Lọc ống kính",
      groups: [
        { id: "format", label: "Khổ cảm biến", match: "any", chips: [["ff", "Full-frame (FE)"], ["apsc", "APS-C (E)"]] },
        { id: "type", label: "Loại ống", match: "any", chips: [["zoom", "Zoom"], ["prime", "Một tiêu cự"]] },
        { id: "series", label: "Dòng", match: "any", chips: [["standard", "Tiêu chuẩn"], ["G", "G"], ["GM", "G Master"], ["ZEISS", "ZEISS"]] },
        {
          id: "focal", label: "Nhu cầu theo tiêu cự", match: "any",
          chips: [
            ["wide", "Phong cảnh, hành động"], ["street", "Đường phố, phóng sự"], ["daily", "Đời thường"],
            ["portrait-half", "Chân dung nửa người"], ["portrait-close", "Chân dung cận mặt"], ["tele", "Thể thao, động vật hoang dã"],
          ],
        },
        {
          id: "use", label: "Nhu cầu khác", match: "all",
          chips: [
            ["low-light", "Thiếu sáng, xóa phông"], ["astro", "Chụp sao"], ["macro", "Macro"], ["vlog", "Vlog cầm tay"],
            ["travel", "Du lịch một ống"], ["light", "Gọn nhẹ"], ["video", "Quay video (Power Zoom)"], ["oss", "Chống rung OSS"],
          ],
        },
      ] as { id: string; label: string; match: "any" | "all"; chips: [string, string][] }[],
      focalHint: "Tính theo tiêu cự quy đổi full-frame (ống APS-C nhân 1,5): dưới 24mm phong cảnh và hành động, 24–35mm đường phố, 35–50mm đời thường, 50–85mm chân dung nửa người, 85–135mm chân dung cận mặt, từ 135mm thể thao và động vật hoang dã.",
      useHint: "Thiếu sáng: khẩu F2 trở xuống. Chụp sao: góc dưới 24mm, khẩu F2.8 trở xuống. Vlog: góc từ 24mm trở xuống, nặng tối đa 400 g. Du lịch: zoom từ 4 lần. Gọn nhẹ: tối đa 300 g.",
      count: (n: number) => `${n} ống kính`,
      clear: "Bỏ lọc",
      empty: "Không có ống kính nào khớp. Bỏ bớt một lựa chọn.",
    },
    // Lens tab: one section per series (in this order), then per sensor format
    lenses: {
      series: [
        { id: "standard", label: "Ống kính tiêu chuẩn" },
        { id: "G", label: "Ống kính G" },
        { id: "GM", label: "Ống kính G Master" },
        { id: "ZEISS", label: "Ống kính ZEISS" },
      ],
      formats: [
        { id: "full-frame", label: "full-frame (FE)" },
        { id: "aps-c", label: "APS-C (E)" },
      ],
    },
    // Nhóm phụ kiện theo thứ tự hiển thị. role: cụm sau "là" trong đoạn mở đầu trang sản phẩm
    accessoryGroups: {
      mic: { title: "Micro", role: "micro Sony" },
      headphone: { title: "Tai nghe", role: "tai nghe Sony" },
      flash: { title: "Đèn flash", role: "đèn flash Sony" },
      monitor: { title: "Màn hình ngoài", role: "màn hình ngoài Sony" },
      battery: { title: "Pin", role: "pin Sony" },
      charger: { title: "Bộ sạc pin", role: "bộ sạc Sony" },
      "dc-coupler": { title: "Bộ nối nguồn DC", role: "bộ nối nguồn DC Sony" },
      "card-reader": { title: "Đầu đọc thẻ", role: "đầu đọc thẻ Sony" },
      "memory-card": { title: "Thẻ nhớ", role: "thẻ nhớ Sony" },
      storage: { title: "SSD di động", role: "SSD di động Sony" },
      remote: { title: "Điều khiển từ xa", role: "điều khiển từ xa Sony" },
      grip: { title: "Tay cầm", role: "tay cầm Sony" },
      viewfinder: { title: "Kính ngắm", role: "kính ngắm Sony" },
      adapter: { title: "Bộ chuyển ngàm", role: "bộ chuyển ngàm Sony" },
      case: { title: "Túi và hộp đựng", role: "túi, hộp đựng Sony" },
      tripod: { title: "Chân máy", role: "chân máy Sony" },
      xlr: { title: "Bộ chuyển XLR", role: "bộ chuyển XLR Sony" },
      wireless: { title: "Thiết bị không dây", role: "phụ kiện không dây Sony" },
      "lens-converter": { title: "Bộ chuyển đổi ống kính", role: "phụ kiện ống kính Sony" },
      other: { title: "Phụ kiện khác", role: "phụ kiện Sony" },
    } as Record<string, { title: string; role: string }>,
    tabs: { camera: "Máy ảnh", lens: "Ống kính", accessory: "Phụ kiện" },
    photo: (name: string, code: string) => `${name} (${code}), ảnh của Sony Nhật Bản`,
    // Chọn và so sánh tối đa 4 sản phẩm cùng loại
    compare: {
      add: "So sánh",
      added: "Đã chọn",
      full: "Đủ 4 sản phẩm",
      otherKind: "Khác loại",
      count: (n: number) => `Đã chọn ${n}/4`,
      clear: "Bỏ chọn",
      open: "So sánh",
      title: "So sánh sản phẩm",
      description: "So sánh thông số tối đa 4 máy ảnh hoặc 4 ống kính Sony.",
      remove: "Bỏ khỏi so sánh",
      empty: "Chưa có sản phẩm để so sánh. Mở một máy ảnh hoặc ống kính rồi bấm So sánh, tối đa 4 sản phẩm cùng loại.",
      missing: "—",
    },
  },
  // Knowledge page sections
  note: {
    backlinks: "Liên kết đến trang này",
  },
  // Back button
  graphHubs: { accessory: "Phụ kiện" },
};

// Tìm kiếm /search
export const search = {
  title: "Tìm kiếm",
  // Thanh tìm kiếm duy nhất trên thanh điều hướng: trang đồ thị thêm nút trên đồ thị vào gợi ý
  graphGroup: "Trên đồ thị",
  graphPlaceholder: "Tìm nút hoặc trang",
  lead: "Tìm kiếm bài viết, sản phẩm, kiến thức và công thức màu.",
  placeholder: "Nhập từ khóa, ví dụ: lấy nét, Picture Profile, A7C",
  empty: "Không tìm thấy kết quả.",
  didYouMean: "Có phải bạn muốn tìm",
  hint: "Nhập từ khóa ở trên để tìm kiếm.",
  resultCount: (count: number) => `${count} kết quả`,
  kindLabels: {
    note: "Kiến thức",
    article: "Bài viết",
    product: "Sản phẩm",
    recipe: "Công thức",
    guide: "Alpha Console",
  },
};

// Chia sẻ + bình luận dưới mỗi sản phẩm, công thức, bài blog, lộ trình và ghi chú kiến thức
export const community = {
  account: {
    signIn: "Đăng nhập bằng Google",
    menu: "Tài khoản",
    synced: "Túi đồ, giỏ M1–M4, danh sách so sánh và máy đang chọn được lưu theo tài khoản này, mở trên máy khác vẫn còn.",
    signOut: "Đăng xuất",
  },
  share: {
    title: "Chia sẻ",
    facebook: "Facebook",
    threads: "Threads",
    native: "Chia sẻ…",
    copy: "Chép liên kết",
    copied: "Đã chép",
    hint: "Gửi qua Zalo, Messenger, Instagram hay TikTok: bấm Chia sẻ… trên điện thoại, hoặc chép liên kết rồi dán vào tin nhắn.",
  },
  comments: {
    title: "Bình luận",
    count: (n: number) => (n ? `Bình luận (${n})` : "Bình luận"),
    signIn: "Đăng nhập bằng Google để bình luận",
    signInFailed: "Chưa đăng nhập được. Thử lại.",
    signedInAs: (name: string) => `Đang bình luận với tên ${name}`,
    signOut: "Đăng xuất",
    placeholder: "Viết bình luận…",
    replyPlaceholder: (name: string) => `Trả lời ${name}…`,
    send: "Gửi",
    cancel: "Hủy",
    reply: "Trả lời",
    delete: "Xóa",
    confirmDelete: "Xóa bình luận này? Các trả lời bên dưới cũng bị xóa.",
    like: (n: number) => (n ? `Thích, ${n}` : "Thích"),
    unlike: (n: number) => `Bỏ thích, ${n}`,
    empty: "Chưa có bình luận. Hãy là người đầu tiên.",
    loading: "Đang tải bình luận…",
    loadFailed: "Không tải được bình luận.",
    retry: "Thử lại",
    sendFailed: "Chưa gửi được. Thử lại.",
    deleteFailed: "Chưa xóa được. Thử lại.",
    anonymous: "Người dùng Google",
    tooLong: (max: number) => `Tối đa ${max} ký tự.`,
  },
};

export const seo = {
  siteName: "alphacolorlab.com",
  homeTitle: "Cài đặt và kiến thức máy ảnh Sony Alpha",
  blogTitle: "Blog · Bài viết và kiến thức chụp ảnh",
  searchTitle: "Tìm kiếm",
  blogSuffix: " · Blog",
  wikiSuffix: " · Product Wiki",
  ogImageSubtitle: "Tối ưu cài đặt máy ảnh Sony · Thư viện công thức màu",
  faqLabel: "Câu hỏi thường gặp",
};

// Alphaskill: Dịch menu + viết blog Sony
export const skill = {
  title: "Alphaskill",
  description:
    "Bộ kỹ năng tiếng Việt cho máy ảnh Sony Alpha: dịch menu và tài liệu, viết bài chuẩn SEO và AIO, dữ liệu sản phẩm lấy từ sony.jp. Dùng với Claude, ChatGPT, Gemini hay bất kỳ AI agent nào.",
  lead: "Gửi một link cho đồng nghiệp hay AI agent là đủ. Agent đọc mục lục rồi tự tải phần cần dùng.",
  use: {
    title: "Dùng ngay",
    rows: [
      { href: "/skill/llms.txt", title: "Mục lục cho AI agent", detail: "Dán link này vào ChatGPT, Gemini, Claude hay agent bất kỳ." },
      { href: "/skill/all.md", title: "Toàn bộ trong một file", detail: "Tải lên làm kiến thức cho GPT tùy chỉnh, Gem hay Project." },
      {
        href: "/skill/sony-alpha-viet.zip",
        title: "Gói skill cho Claude",
        detail: "Claude.ai: vào Settings, mục Skills, tải file zip lên. Claude Code: giải nén vào ~/.claude/skills/.",
      },
      { href: "/skill/portable/system-prompt.md", title: "System prompt", detail: "Dán vào phần hướng dẫn của GPT tùy chỉnh hay Gem." },
      { href: "https://github.com/thaikpham/alphaskill", title: "Máy chủ MCP", detail: "Đủ công cụ kiểm tra bản dịch và chấm bài viết. Cách cài nằm trong repo." },
    ],
  },
  files: "Tất cả file",
  llms: {
    intro: (all: string) => `Đọc system prompt trước, sau đó tải file tham chiếu khi cần. Bản gộp một file: ${all}`,
    start: "Bắt đầu",
    reference: "Tham chiếu",
  },
};
