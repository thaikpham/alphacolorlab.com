import type { Article } from '../types'
import { page as chupSilhouette } from './nen-tang-2026-11/chup-silhouette-tren-sony'
import { page as panning } from './nen-tang-2026-11/panning-tren-sony'
import { page as phoiSangDai } from './nen-tang-2026-11/phoi-sang-dai-tren-sony'
import { page as dongBoManSau } from './nen-tang-2026-11/dong-bo-man-sau-voi-flash'

/**
 * Nền tảng 2026-11: 4 bài kỹ thuật sáng tạo cơ bản cho người mới cầm Sony Alpha.
 */
export const ARTICLES: readonly Article[] = [
  chupSilhouette,
  panning,
  phoiSangDai,
  dongBoManSau,
]
