import type { Article } from '../../types'

export const page: Article = {
  id: 'iso-auto-min-ss',
  kind: 'article',
  topic: 'exposure',
  level: 'newbie',
  archetype: 'setup-guide',
  read: '5 phút đọc',
  title: 'ISO Auto và Min. SS: mục bị bỏ qua nhiều nhất trong menu Sony',
  dek: 'Vì sao ảnh trong nhà của bạn nhoè dù ISO chỉ có 400 — và một dòng cài đặt sửa được nó.',
  blocks: [
    {
      t: 'tldr',
      items: [
        'Đặt ISO AUTO 100–6400, rồi đặt ISO AUTO Min. SS là 1/125.',
        'Không có Min. SS, máy ưu tiên ISO thấp và hạ tốc xuống 1/30 — ảnh sạch nhiễu nhưng nhoè.',
        'Ảnh nhiễu còn cứu được ở hậu kỳ, ảnh nhoè thì không.',
      ],
    },
    {
      t: 'p',
      text: 'Khi để ISO Auto, máy phải chọn giữa hai cái xấu: nâng ISO cho nhiễu lên, hay hạ tốc màn trập cho ảnh có nguy cơ nhoè. Mặc định máy nghiêng về ISO thấp — nghe hợp lý, nhưng đó là lý do rất nhiều ảnh trong nhà của người mới bị nhoè ở ISO chỉ 400.',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → ISO → ISO AUTO (Min 100 / Max 6400)',
      new: 'MENU → Exposure/Color → Exposure → ISO → ISO AUTO (Min 100 / Max 6400)',
    },
    {
      t: 'menu',
      old: 'MENU → Camera Settings1 → ISO AUTO Min. SS → 1/125',
      new: 'MENU → Exposure/Color → Exposure → ISO AUTO Min. SS → 1/125',
    },
    { t: 'h', text: 'Chọn con số nào' },
    {
      t: 'p',
      text: 'Min. SS là sàn tốc độ màn trập: máy sẽ nâng ISO trước và chỉ đi chậm hơn con số này khi ISO đã chạm trần. Chọn nó theo chủ thể bạn chụp, không theo tiêu cự ống kính — người cử động nhanh hơn tay bạn rung.',
    },
    {
      t: 'table',
      head: ['Bạn chụp gì', 'Min. SS', 'Vì sao'],
      caption: 'Chọn theo chủ thể, không theo tiêu cự — người cử động nhanh hơn máy rung.',
      rows: [
        ['Chân dung đứng yên', '1/125', 'Đủ cho hơi thở và dịch chuyển nhẹ'],
        ['Trẻ con, tiệc, đường phố', '1/250', 'Người bước và tay vung nhanh hơn nhiều'],
        ['Phong cảnh có chân máy', '1/30 hoặc thấp hơn', 'Không có gì chuyển động, ưu tiên ISO thấp'],
      ],
    },
    {
      t: 'callout',
      label: 'Min. SS là mức ưu tiên, không phải giới hạn cứng',
      text: 'Khi ánh sáng tụt quá thấp, máy đã ở trần ISO 6400 và vẫn thiếu sáng thì nó sẽ hạ tốc xuống dưới Min. SS. Lúc đó ảnh tối đi hoặc nhoè là dấu hiệu bạn cần ống kính khẩu lớn hơn, không phải cần sửa cài đặt.',
    },
    {
      t: 'compare',
      beforeLabel: '1/30, ISO 400',
      afterLabel: '1/125, ISO 1600',
      caption:
        'Cùng một khung trong nhà: bản ISO cao có nhiễu nhưng nét, bản ISO thấp sạch hơn mà mất chi tiết vì nhoè.',
    },
    {
      t: 'checklist',
      label: 'Ba dòng cần đúng',
      items: [
        'ISO: AUTO',
        'ISO AUTO Minimum 100 · Maximum 6400',
        'ISO AUTO Min. SS: 1/125',
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
      { kind: 'knowledge', id: 'white-balance-shift' },
      { kind: 'knowledge', id: 'picture-profile-va-creative-look' },
      { kind: 'knowledge', id: 'chon-cong-thuc-theo-may' },
    ],
    prerequisites: [],
    sources: [
      { url: 'https://helpguide.sony.net/ilc/2110/v1/en/index.html', title: 'ILCE-7M4 Help Guide', publisher: 'Sony', checkedAt: '2026-11-05' },
    ],
  },
}
