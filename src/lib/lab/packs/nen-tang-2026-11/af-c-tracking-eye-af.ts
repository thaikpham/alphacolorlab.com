import type { Article } from '../../types'

export const page: Article = {
  id: 'af-c-tracking-eye-af',
  kind: 'article',
  topic: 'af',
  level: 'newbie',
  archetype: 'setup-guide',
  read: '6 phút đọc',
  title: 'Ba cài đặt để máy tự bám mắt người',
  dek: 'AF-C, Focus Area Tracking và Face/Eye Prior. in AF — ba dòng trong menu là công thức để máy tự khóa vào mắt chủ thể khi bạn chỉ cần bấm chụp.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Focus Mode: AF-C (bám liên tục), Focus Area: Tracking (vùng nét bám theo chuyển động).',
        'Face/Eye Prior. in AF: tích Eye AF để máy ưu tiên mắt người trong khung.',
        'Một buổi tập: đưa vùng nét lên mắt trái của chủ thể, giữ nút cho máy bám, rồi tự do bố cục lại.',
      ],
    },
    {
      t: 'p',
      text: '[[Lấy nét]] bằng nửa cò ở cách bấm mặc định là một công việc đôi. Máy lấy nét rồi bạn phải chọn: bấm hết cò ngay, hay nhả ra lấy nét lại khi chủ thể vừa di chuyển. Ba cài đặt này tách công việc thành hai: máy tự bám mắt, bạn chỉ bấm chụp.',
    },
    {
      t: 'figure',
      caption:
        'Chân dung ở điểm snaps không hoàn hảo: mắt người vẫn nét vì máy bám theo AF-C + Tracking + Eye AF. Ảnh: example Wikimedia Commons',
    },
    { t: 'h', text: 'AF-C: bám liên tục' },
    {
      t: 'p',
      text: 'Chế độ này tên là Continuous AF — lấy nét mà không bao giờ ngừng, chỉ khi nào bạn nhả nút. Trong khi chủ thể đi lại, máy liên tục chỉnh lại khoảng nét. Điểm yếu: nếu có người đi ngang qua hay vật cản bất ngờ, máy có thể nhảy nét sang vật đó. Đó là lý do cần Focus Area Tracking để dễ nắm bắt hơn.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Focus Mode → AF-C',
      new: 'MENU → Focus → AF/MF → Focus Mode → AF-C',
    },
    { t: 'h', text: 'Focus Area: Tracking, không Wide' },
    {
      t: 'p',
      text: 'Vùng nét Wide lấy nét toàn cảnh nhưng không biết đặc biệt ưu tiên cái gì. Tracking là khung nét bạn đặt lên chủ thể lần đầu, rồi máy bám theo chuyển động của chủ thể khi bạn giữ nút. Nếu chủ thể quay đi, vùng nét vẫn theo nó; nếu ai khác bước vào, vùng nét không tự đổi sang người đó — nó chỉ bám người mà bạn chỉ định lúc đầu. Đó là sức mạnh của Tracking: bạn có quyền kiểm soát, không phải máy quyết định.',
    },
    {
      t: 'table',
      head: ['Vùng nét', 'Chủ thể ở đâu', 'Khi nào dùng'],
      caption: 'Tracking phù hợp nhất cho chân dung. Để chọn Focus Area, vào MENU → Camera Settings1 → Focus Area (cũ) hoặc MENU → Focus → Focus Area → Focus Area (mới).',
      rows: [
        ['Tracking', 'Bạn chỉ định, máy bám', 'Chân dung, chân dung gia đình, chụp sự kiện'],
        ['Wide', 'Toàn cảnh, máy chọn', 'Không rõ chủ thể nào là chính, phong cảnh có người'],
        ['Zone', 'Một khu vực mà máy tự chọn', 'Thể thao nhanh, vật chuyển động ngoài dự kiến'],
      ],
    },
    { t: 'h', text: 'Face/Eye Prior. in AF: bật Eye AF' },
    {
      t: 'p',
      text: 'Bật Face/Eye Prior. in AF là máy tự tìm mặt và mắt bên trong hoặc quanh vùng nét bạn đã đặt, rồi ưu tiên [[lấy nét]] vào mắt. Không thấy mắt thì nó nét vào chủ thể khác trong vùng. Sony ghi rõ: kết hợp mục này với Focus Area Tracking để giữ nét trên một đôi mắt đang di chuyển.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Face/Eye AF Set. → Face/Eye Priority in AF → On',
      new: 'MENU → Focus → Face/Eye AF → Face/Eye Prior. in AF → On',
    },
    {
      t: 'callout',
      label: 'Tắt nhanh khi cần',
      text: 'Gán Face/Eye Priority Select vào một nút trong Custom Key/Dial Set.: bấm một lần là bật hoặc tắt ưu tiên mắt, không phải vào menu.',
    },
    {
      t: 'p',
      text: 'Đặt máy ở chế độ A, ISO Auto, shutter không chậm hơn 1/125. Đưa vùng nét lên mắt người, giữ nút để máy bắt nét. Giữ nút, khung nét bám theo mắt. Bây giờ tự do [[bố cục]] và bấm chụp — máy bám mắt khi chủ thể không di chuyển quá nhanh.',
    },
    {
      t: 'checklist',
      label: 'Ba dòng phải đúng',
      items: [
        'Focus Mode: AF-C, Focus Area: Tracking: Zone',
        'Eye AF hoặc Face/Eye Prior. in AF: On',
        'Ánh sáng từ trước để máy dễ phát hiện khuôn mặt',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'lay-net' },
      { kind: 'knowledge', id: 'bo-cuc' },
      { kind: 'knowledge', id: 'do-sau-truong-anh-va-xoa-phong' },
    ],
    prerequisites: ['lay-net'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000649113.html',
        title: 'Selecting the focus method (Focus Mode)',
        publisher: 'Sony',
        checkedAt: '2026-11-06',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640179.html',
        title: 'Selecting the focus area (Focus Area)',
        publisher: 'Sony',
        checkedAt: '2026-11-06',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000657951.html',
        title: 'Face/Eye Prior. in AF (still image/movie)',
        publisher: 'Sony',
        checkedAt: '2026-11-06',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000657934.html',
        title: 'Face/Eye Subject (still image/movie)',
        publisher: 'Sony',
        checkedAt: '2026-11-06',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
