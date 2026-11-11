# Fixture ZV-E10 (file máy thật)

Bốn file `CAMPR0x.DAT` do máy ZV-E10 lưu, copy nguyên byte. Không sửa.

| File | Chế độ | Ngày lưu trong file | Nguồn |
|---|---|---|---|
| CAMPR01P.DAT | Ảnh, PAL | 20261027_182702 | bộ mẫu E10 (ngoài repo) |
| CAMPR04P.DAT | Ảnh, PAL | 20261027_183134 | bộ mẫu E10 (ngoài repo) |
| CAMPR05N.DAT | Phim, NTSC | 20261029_034418 | bộ mẫu E10 Movie1 (ngoài repo) |
| CAMPR06N.DAT | Phim, NTSC | 20261029_034806 | bộ mẫu E10 Movie1 (ngoài repo) |

Lưu ý:

- Chưa có file phim PAL. CAMPR05N/06N là phim NTSC, dùng thay cho PAL. Phim PAL cần kiểm chứng riêng.
- `parseDat` từ chối tên CAMPR05N–08N (chỉ nhận CAMPR01–04). Hai file phim chỉ dùng cho `readRecordMode` (`test/recordMode.test.ts`).
- Byte 0x17E: 0 = ảnh, 1 = phim. Chỉ đọc, không ghi.
