# Fixture α6400 (file máy thật, chỉ đọc)

Năm file `CAMPR01P.DAT`–`CAMPR04P.DAT` do α6400 (ILCE-6400, Legacy Menu) lưu. Copy nguyên byte, không sửa.

| Thư mục | File | Ngày lưu trong file | Ghi chú |
|---|---|---|---|
| dot1/ | CAMPR01P–04P.DAT | 20200522_010553 – 20200522_012117 | Bộ H1 (PAL), khớp bảng H1 của trainer |
| sample/ | CAMPR01P.DAT | 20200521_124213 | Cài đặt khác: F2.8, 1/60, ISO AUTO, AWB |

Lưu ý:

- Checksum byte 0x38 khớp quy tắc trong `lib/a6400/dat.ts` trên cả 5 file. Quy tắc chỉ kiểm chứng trên 5 file này.
- Checksum vùng đuôi 0x1000+ chưa kiểm chứng cho α6400.
- Trường focus (0x2DB, 0x2D5) chưa giải: file sample có mã phụ 4, ngoài bảng ZV-E10.
- Nhóm dot1/ là thư mục con nên trình duyệt `test/ppBanks.test.ts` (chỉ đọc file con trực tiếp) bỏ qua.
