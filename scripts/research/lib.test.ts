import { describe, expect, it } from 'vitest'
import { isSonyHost, parseOembed, pickCommons, readUrls, sourceFromHtml, todayUtc } from './lib'
import { PACK_LICENCES } from '../../src/lib/lab/packs/check'

describe('readUrls', () => {
  it('takes one URL per line or space, skips blanks and comments, keeps order, drops repeats', () => {
    expect(readUrls('https://a.test/x\n\n# note\nhttps://b.test https://a.test/x\n')).toEqual([
      'https://a.test/x',
      'https://b.test',
    ])
  })
})

describe('parseOembed', () => {
  it('keeps title and channel from an oEmbed answer', () => {
    expect(
      parseOembed('abc', { title: 'Alpha Universe', author_name: 'Sony | Alpha Universe', author_url: 'https://www.youtube.com/@AlphaUniverse' }),
    ).toEqual({ id: 'abc', title: 'Alpha Universe', channel: 'Sony | Alpha Universe', channelUrl: 'https://www.youtube.com/@AlphaUniverse' })
  })
  it('is null for anything that is not an oEmbed answer', () => {
    expect(parseOembed('abc', 'Not Found')).toBeNull()
    expect(parseOembed('abc', { error: 'x' })).toBeNull()
  })
})

describe('sourceFromHtml', () => {
  it('titles a Help Guide page by its h1, dated today', () => {
    const html = '<html><head><title>Picture Profile | Help Guide | ILCE-7M4</title></head><body><h1 class="t"> Picture Profile </h1></body></html>'
    expect(sourceFromHtml('https://helpguide.sony.net/ilc/2110/v1/en/contents/0405.html', html, '2026-10-28')).toEqual({
      url: 'https://helpguide.sony.net/ilc/2110/v1/en/contents/0405.html',
      title: 'Picture Profile',
      publisher: 'Sony',
      checkedAt: '2026-10-28',
    })
  })
  it('takes the topic heading of a live Help Guide page, whose h1 is the product banner', () => {
    /* The shape helpguide.sony.net serves (TP1000640837, read 2026-10-28):
       the h1 names the camera, the topic is h2#id_title, and <title> puts the
       topic last. */
    const html =
      '<title>ILCE-7M4 | Help Guide |  Creative Look (still image/movie)</title>' +
      '<h1><span class="category-name">Interchangeable Lens Digital Camera</span><span class="model-name">ILCE-7M4<span class="model-number">α7IV</span></span></h1>' +
      '<h2 id="id_title"> <span class="uicontrol">Creative Look</span> (still image/movie)</h2>'
    expect(sourceFromHtml('https://helpguide.sony.net/ilc/2110/v1/en/contents/TP1000640837.html', html, '2026-10-28').title).toBe(
      'Creative Look (still image/movie)',
    )
  })
  it('falls back to the <title> without its site suffix, and decodes entities', () => {
    const html = '<title>AF w/ Shutter &amp; AF-ON | Help Guide</title>'
    expect(sourceFromHtml('https://helpguide.sony.net/x', html, '2026-10-28').title).toBe('AF w/ Shutter & AF-ON')
  })
})

describe('isSonyHost', () => {
  it('accepts Sony hosts only', () => {
    expect(isSonyHost('https://helpguide.sony.net/ilc/x')).toBe(true)
    expect(isSonyHost('https://www.sony.com/electronics')).toBe(true)
    expect(isSonyHost('https://alphauniverse.com/x')).toBe(false)
    expect(isSonyHost('https://sony.net.evil.test/')).toBe(false)
  })
})

describe('todayUtc', () => {
  it('is the UTC calendar day', () => {
    expect(todayUtc(new Date('2026-10-28T23:30:00-05:00'))).toBe('2026-10-29')
  })
})

describe('pickCommons', () => {
  it('pickCommons đọc extmetadata và đánh dấu giấy phép được phép', () => {
    const json = { query: { pages: { 1: { title: 'File:A.jpg', imageinfo: [{ width: 2000, height: 1500, thumburl: 'https://t/a.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg', extmetadata: { LicenseShortName: { value: 'CC BY-SA 4.0' }, Artist: { value: '<a href="x">Ng. A</a>' } } }] },
      2: { title: 'File:B.jpg', imageinfo: [{ width: 800, height: 600, thumburl: 'https://t/b.jpg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:B.jpg', extmetadata: { LicenseShortName: { value: 'Fair use' }, Artist: { value: 'B' } } }] } } } }
    const hits = pickCommons(json, PACK_LICENCES)
    expect(hits).toEqual([
      { file: 'File:A.jpg', width: 2000, height: 1500, thumb: 'https://t/a.jpg', page: 'https://commons.wikimedia.org/wiki/File:A.jpg', licence: 'CC BY-SA 4.0', artist: 'Ng. A', allowed: true },
      { file: 'File:B.jpg', width: 800, height: 600, thumb: 'https://t/b.jpg', page: 'https://commons.wikimedia.org/wiki/File:B.jpg', licence: 'Fair use', artist: 'B', allowed: false },
    ])
  })
})
