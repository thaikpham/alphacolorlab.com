// Words a reader may type for the same thing: abbreviations, English menu names, Vietnamese terms (folded, no diacritics).
// A query containing one phrase of a group is also searched with each other phrase. test/search.test.ts checks
// that every group has at least one phrase that really occurs in the index.
export const synonymGroups: string[][] = [
  ['wb', 'awb', 'can bang trang', 'white balance'],
  ['ss', 'toc do man trap', 'shutter speed'],
  ['ev', 'bu sang', 'exposure compensation'],
  ['af', 'lay net', 'autofocus'],
  ['afc', 'af c', 'continuous af'],
  ['afs', 'af s', 'single shot af'],
  ['mf', 'manual focus', 'lay net tay'],
  ['eye af', 'bam mat', 'lay net mat'],
  ['chong rung', 'ibis', 'oss', 'steadyshot'],
  ['xoa phong', 'bokeh', 'do sau truong anh'],
  ['pp', 'picture profile'],
  ['mr', 'memory recall'],
  ['raw', 'arw', 'anh tho'],
  ['jpg', 'jpeg'],
  ['gm', 'g master'],
  ['apsc', 'aps c', 'crop'],
  ['iso', 'do nhay sang'],
  ['khau do', 'aperture', 'so f'],
  ['tieu cu', 'focal length'],
  ['do sang', 'metering'],
  ['phoi sang', 'exposure'],
  ['quay phim', 'video', 'quay video'],
]

/** Sony writes generations both ways: A7 IV = ILCE-7M4, ZV-E10 II = ZV-E10M2. */
export const ROMAN: Record<string, string> = { '2': 'ii', '3': 'iii', '4': 'iv', '5': 'v', '6': 'vi' }
