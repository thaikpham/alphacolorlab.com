import type { Article } from '../../types'

export const page: Article = {
  id: 'back-button-af',
  kind: 'article',
  topic: 'af',
  level: 'mid',
  archetype: 'technique',
  read: '7 phút đọc',
  title: 'Lấy nét bằng ngón tay cái: bỏ nửa cò, dùng AF-ON',
  dek: 'Tách việc lấy nét ra khỏi nút chụp. Ba thay đổi trong menu, và một buổi tập để tay quen.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Gán AF On cho nút AEL (hoặc C1), rồi tắt AF w/ Shutter.',
        'Ngón cái giữ nút là bám nét, nhả ra là khoá nét — ngón trỏ chỉ còn việc bấm chụp.',
        'Đi cùng AF-C và Tracking: Zone thì mới phát huy hết.',
      ],
    },
    {
      t: 'p',
      text: 'Ở cách bấm mặc định, nửa cò làm hai việc cùng lúc: lấy nét và chờ chụp. Hệ quả là bạn luôn phải chọn giữa giữ nét và bấm chụp — và trong lúc do dự thì khoảnh khắc đã qua. Chuyển nét sang một nút riêng cho ngón tay cái là cách gỡ đúng cái xung đột đó.',
    },
    { t: 'h', text: 'Ba thay đổi trong menu' },
    {
      t: 'menu',
      old: 'MENU → Camera Settings2 → Custom Key (Shoot) → AEL Button → AF ON',
      new: 'MENU → Setup → Operation Customize → Custom Key/Dial Set. → AEL Button → AF On',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → AF w/ shutter → Off',
      new: 'MENU → Focus → AF/MF → AF w/ Shutter → Off',
    },
    {
      t: 'callout',
      label: 'Vì sao phải tắt AF w/ Shutter',
      text: 'Nếu để On, nửa cò vẫn lấy nét và bạn có hai nút làm cùng một việc — tay sẽ quay về thói quen cũ trong lúc gấp. Tắt nó là cách buộc thói quen mới hình thành.',
    },
    { t: 'h', text: 'Tập trong một buổi' },
    {
      t: 'p',
      text: 'Đặt AF-C và Focus Area là Tracking: Zone. Đưa vùng nét lên chủ thể, giữ ngón cái để máy bắt và bám, rồi bố cục lại thoải mái — nét vẫn dính vào chủ thể. Muốn khoá nét tại một điểm để bố cục kiểu khác: nhả ngón cái ra, nét đứng lại ngay đó cho tới khi bạn bấm lại.',
    },
    {
      t: 'table',
      head: ['Tình huống', 'Ngón cái', 'Ngón trỏ'],
      caption: 'Cùng một cách bấm cho cả ba tình huống — đó là điểm mạnh của nó.',
      rows: [
        ['Chủ thể đứng yên', 'Bấm rồi nhả (khoá nét)', 'Bấm chụp'],
        ['Chủ thể di chuyển', 'Giữ liên tục', 'Bấm chụp nhiều lần'],
        ['Chụp qua vật cản', 'Nhả trước khi vật cản đi ngang', 'Bấm chụp'],
      ],
    },
    {
      t: 'compare',
      beforeLabel: 'Nửa cò',
      afterLabel: 'AF-ON',
      caption:
        'Cùng một cảnh có người bước qua trước ống kính: nửa cò dễ chuyển nét sang vật cản, AF-ON giữ nét ở chủ thể vì bạn chủ động nhả nút.',
    },
    {
      t: 'checklist',
      label: 'Sau khi đổi, kiểm tra lại',
      items: [
        'Nửa cò không còn lấy nét nữa',
        'Nút AEL (hoặc C1) lấy nét khi giữ',
        'Focus Mode đang là AF-C',
        'Focus Area đang là Tracking: Zone',
      ],
    },
  ],
  meta: {
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
    concepts: [],
    related: [
      { kind: 'knowledge', id: 'picture-profile-va-creative-look' },
      { kind: 'knowledge', id: 'white-balance-shift' },
      { kind: 'knowledge', id: 'chon-cong-thuc-theo-may' },
    ],
    prerequisites: [],
    sources: [
      { url: 'https://helpguide.sony.net/ilc/2110/v1/en/index.html', title: 'ILCE-7M4 Help Guide', publisher: 'Sony', checkedAt: '2026-11-05' },
    ],
  },
}
