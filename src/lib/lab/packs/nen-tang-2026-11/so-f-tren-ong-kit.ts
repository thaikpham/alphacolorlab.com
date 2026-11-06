import type { Article } from '../../types'

export const page: Article = {
  id: 'so-f-tren-ong-kit',
  kind: 'article',
  topic: 'exposure',
  level: 'newbie',
  archetype: 'explainer',
  read: '6 phút đọc',
  title: 'f/3.5–5.6 trên ống kit: tại sao khẩu hẹp, có được mở hết không',
  dek: 'Ống kit Sony ghi "f/3.5–5.6 E PZ 18–55mm": ba con số này có nghĩa gì, và tại sao bạn không thể mở khẩu lớn hơn.',
  updatedAt: '2026-11-06',
  blocks: [
    {
      t: 'tldr',
      items: [
        'f/3.5–5.6 = khẩu thay đổi theo tiêu cự: 18mm mở được f/3.5, 55mm mở được f/5.6.',
        'Khẩu hẹp (số f lớn) = ít sáng vào cảm biến → ảnh tối ở nhà, buộc phải nâng ISO.',
        'Ống ngàm E (E PZ) không thể đổi khẩu bằng vòng trên ống; máy quản lý tất cả qua menu.',
      ],
    },
    {
      t: 'p',
      text: 'Ống kit của Sony ghi "f/3.5–5.6", nhưng bạn không biết nó có "tốt" không. Trước khi mua ống mới, hiểu rõ số này và tại sao nó ảnh hưởng tới ảnh bạn là bước đầu. [[Khẩu độ]] không chỉ về độ sâu trường ảnh — nó là về **sáng**.',
    },
    {
      t: 'figure',
      caption: 'Sony FE 28-70mm F3.5-5.6 OSS kit lens — f-number changes as you zoom. Ảnh: Roman Eisele · CC BY-SA 4.0 · Wikimedia Commons',
    },
    { t: 'h', text: 'f/3.5–5.6: khẩu thay đổi theo zoom' },
    {
      t: 'p',
      text: '**f/3.5** là khẩu mở được ở **18mm** (góc rộng). **f/5.6** là khẩu mở được ở **55mm** (tele). Khi zoom từ 18 tới 55mm, khẩu độ sẽ **co lại từ f/3.5 thành f/5.6** liên tục. Con số giữa (chẳng hạn 24mm) sẽ là f/4.5 khoảng đó. Đó là hạn chế của thiết kế quang học này.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → Aperture (chế độ A hoặc M)',
      new: 'MENU → Exposure/Color → Exposure → Aperture (chế độ A hoặc M)',
    },
    {
      t: 'h',
      text: 'Ống kit có khẩu hẹp (số f lớn) = ảnh tối ở trong nhà',
    },
    {
      t: 'p',
      text: 'Khẩu độ f/3.5 so với ống chuyên dụng f/2.8 thì kém **1 nấc sáng** (gọi là 1 [[Stop và EV|Stop]]). Ngoài trời ban ngày không sao, nhưng **ở trong nhà bằng đèn điện** (2.700K, tương đương 300 lux), khẩu f/3.5 mở hết và đo sáng đầy thì máy sẽ:\n\n- Chế độ A (máy chọn tốc độ): tốc độ xuống 1/5s → cần chân máy, rung ảnh.\n- Chế độ S (bạn chọn tốc độ 1/125s để giữ nét cầm tay): máy buộc nâng ISO từ 100 lên 1.600–3.200 → ảnh nhiễu.\n\nBa yếu tố này tạo thành [[Tam giác phơi sáng|tam giác phơi sáng]]—thay đổi khẩu không chỉ ảnh hưởng độ sáng mà còn [[Độ sâu trường ảnh và xóa phông|độ sâu trường ảnh]].',
    },
    {
      t: 'table',
      head: ['Tình huống ánh sáng', 'f/2.8', 'f/3.5–5.6'],
      caption: 'Cùng một cảnh, khẩu hẹp = ít sáng vào = tốc độ chậm hoặc ISO cao.',
      rows: [
        ['Nắng ban ngày 5.000 lux', '1/2.500 ISO 100', '1/1.000 ISO 100'],
        ['Nhà bằng đèn điện 300 lux', '1/60 ISO 100', '1/25 ISO 100 (f/3.5 phải dùng 1/15s → rung; hoặc ISO 400)'],
        ['Đêm phố 50 lux', '1/8 ISO 1.600', '1/3 ISO 1.600 (f/3.5 thành 1/1 → cần chân máy hoặc ISO 6.400)'],
      ],
    },
    { t: 'h', text: 'Mở khẩu bằng cách nào?' },
    {
      t: 'p',
      text: 'Ống kit **E PZ** (E Power Zoom) không có vòng khẩu trên ống—**máy quản lý khẩu số**. Bạn dùng nút cộng/trừ hoặc quay nút quay để điều chỉnh, hoặc chế độ A (máy quản lý tự động). Không có nút riêng để "mở khẩu hết".',
    },
    {
      t: 'callout',
      label: 'Tại sao Sony không làm ống f/2.8 mọi tiêu cự?',
      text: 'Ống f/2.8 hằng định (constant aperture) sẽ dày, nặng, đắt gấp 3–5 lần. Sony bán riêng **FE 24-70mm f/2.8 GM II** (~$1.500) cho ai cần. Ống kit ~$500 phục vụ người mới muốn rẻ và nhẹ.',
    },
    {
      t: 'checklist',
      label: 'Trước khi mua ống mới: kiểm tra nhu cầu',
      items: [
        'Ảnh ở nhà thường bị ISO cao/tốc độ chậm? → Nâng cấp ống f/2.8.',
        'Xóa phông không được mạnh? → Giảm tiêu cự (gần chủ thể) hoặc mở khẩu (tìm ống f/1.8).',
        'Nắng ngoài trời bình thường? → Ống kit đủ sáng, hiện tại không cần đổi.',
        'Quay phim? → Kiểm tra ống có chống rung không; ống kit có, nhưng ống tele hẹp có thể không.',
      ],
    },
  ],
  meta: {
    related: [
      { kind: 'knowledge', id: 'khau-do' },
      { kind: 'knowledge', id: 'do-sau-truong-anh-va-xoa-phong' },
      { kind: 'knowledge', id: 'tam-giac-phoi-sang' },
      { kind: 'knowledge', id: 'stop-va-ev' },
    ],
    prerequisites: ['khau-do'],
    concepts: [],
    sources: [
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640847.html',
        title: 'ILCE-7M4 Help Guide — Exposure Mode',
        checkedAt: '2026-11-05',
      },
      {
        url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640842.html',
        title: 'ILCE-7M4 Help Guide — Aperture',
        checkedAt: '2026-11-05',
      },
    ],
    authorName: null,
    reviewedAt: null,
    section: null,
    order: null,
  },
}
