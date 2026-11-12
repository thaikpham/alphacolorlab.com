export const adminCopy = {
  title: "Quản lý bộ preset",
  lead: "Chỉ trên dev: lưu dữ liệu vào data/preset-sets.json, sau đó build/deploy để đưa lên production.",

  // Thanh chọn bộ
  setList: "Danh sách bộ",
  addSet: "Thêm bộ",
  duplicateSet: "Nhân bản bộ",
  deleteSet: "Xóa bộ",
  defaultChip: "Mặc định",
  unlistedChip: "Ẩn",

  // Thông tin bộ
  setInfo: "Thông tin bộ",
  setName: "Tên bộ",
  setDescription: "Mô tả",
  setId: "ID",
  setIdTip: "Đường dẫn của bộ: /bo-m1-m4/<id>. Chữ thường, số, gạch ngang. Đổi ID thì link cũ và bộ đã sưu tầm không còn trỏ tới bộ này.",
  authorName: "Tên tác giả",
  authorNameTip: "Để trống cả bốn ô tác giả nếu không ghi tác giả.",
  authorHandle: "Handle",
  authorHandleTip: "Chữ thường, số, gạch ngang.",
  authorAvatar: "Ảnh đại diện",
  authorAvatarTip: "Link https://, tùy chọn.",
  authorLink: "Liên kết tác giả",
  authorLinkTip: "Link http:// hoặc https://, tùy chọn.",
  makeDefault: "Bộ mặc định cho người mới",
  unlisted: "Ẩn khỏi danh sách bộ chia sẻ",

  // Bốn ô nhớ
  slots: "Bốn ô nhớ",

  // Thanh lưu
  unsavedChanges: "Chưa lưu thay đổi",
  savedAt: "Đã lưu lúc",
  undo: "Hoàn tác",
  downloadJson: "Tải JSON",
  save: "Lưu",

  // Thông báo
  deleteConfirm: "Bạn chắc chắn muốn xóa bộ này?",
  beforeUnload: "Bạn có thay đổi chưa lưu. Bạn có muốn rời đi?",

  // Bộ mới
  newSetName: "Bộ mới",
  newSetDesc: "",
  slotName: (num: number) => `Ô ${num}`,

  // Tiền tố thông báo lỗi
  errorPrefix: "Lỗi:",
} as const;
