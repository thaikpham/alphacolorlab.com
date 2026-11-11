export const adminCopy = {
  title: "Quản lý bộ preset",
  lead: "Chỉ trên dev: lưu dữ liệu vào data/preset-sets.json, sau đó build/deploy để đưa lên production.",

  // Left sidebar
  addSet: "Thêm bộ",
  defaultChip: "Mặc định",

  // Right panel - Set info
  setInfo: "Thông tin bộ",
  setName: "Tên bộ",
  setDescription: "Mô tả",
  setId: "ID (URL slug)",
  authorName: "Tên tác giả (để trống nếu không ghi tác giả)",
  authorHandle: "Handle (chữ thường, số, gạch ngang)",
  authorAvatar: "Ảnh đại diện (https://…, tùy chọn)",
  authorLink: "Liên kết tác giả (http:// hoặc https://, tùy chọn)",
  makeDefault: "Bộ mặc định cho người mới",
  unlisted: "Ẩn khỏi danh sách bộ chia sẻ",

  // Slots
  slots: "Bốn ô nhớ",
  slotLabel: "Tên ô nhớ",
  slotNote: "Ghi chú (tùy chọn)",

  // Slot actions
  copyFromM1: "Sao chép từ M1",

  // Set actions
  duplicateSet: "Nhân bản bộ",
  deleteSet: "Xóa bộ",

  // Save bar
  unsavedChanges: "Chưa lưu thay đổi",
  savedAt: "Đã lưu lúc",
  undo: "Hoàn tác",
  downloadJson: "Tải JSON",
  save: "Lưu",

  // Messages
  deleteConfirm: "Bạn chắc chắn muốn xóa bộ này?",
  cantDeleteLast: "Không thể xóa bộ cuối cùng",
  beforeUnload: "Bạn có chứng chỉ thay đổi chưa lưu. Bạn có muốn rời đi?",

  // Default new set
  newSetName: "Bộ mới",
  newSetDesc: "",
  slotName: (num: number) => `Ô ${num}`,

  // Error message prefix
  errorPrefix: "Lỗi:",
} as const;
