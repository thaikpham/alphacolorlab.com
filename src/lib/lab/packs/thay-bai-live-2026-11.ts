import type { Article } from '../types'
import { page as backButtonAf } from './thay-bai-live-2026-11/back-button-af'
import { page as isoAutoMinSs } from './thay-bai-live-2026-11/iso-auto-min-ss'
import { page as bodyEvVsFlashEv } from './thay-bai-live-2026-11/body-ev-vs-flash-ev-sony-flash-ttl'

/** Ba bài đang live viết lại vào cây alphaskill; `push:lab --replace <id>` chỉ ghi đè dòng chưa ai sửa. */
export const pages: readonly Article[] = [backButtonAf, isoAutoMinSs, bodyEvVsFlashEv]
