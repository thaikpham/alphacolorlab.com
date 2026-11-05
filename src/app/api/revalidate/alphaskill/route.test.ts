import { describe, expect, it } from 'vitest'
import { POST } from './route'

/**
 * The alphaskill webhook: unconfigured → 503, wrong secret → 401, right secret → 200.
 */

const mockRequest = (secret?: string): Request => {
  const headers = new Headers()
  if (secret !== undefined) {
    headers.set('x-alphaskill-secret', secret)
  }
  return new Request('http://localhost:3000/api/revalidate/alphaskill', {
    method: 'POST',
    headers,
  })
}

describe('POST /api/revalidate/alphaskill', () => {
  it('returns 503 when ALPHASKILL_REVALIDATE_SECRET is unset', async () => {
    const prevSecret = process.env.ALPHASKILL_REVALIDATE_SECRET
    delete process.env.ALPHASKILL_REVALIDATE_SECRET

    const res = await POST(mockRequest())
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'notConfigured' })

    if (prevSecret) process.env.ALPHASKILL_REVALIDATE_SECRET = prevSecret
  })

  it('returns 401 when header is missing', async () => {
    const prevSecret = process.env.ALPHASKILL_REVALIDATE_SECRET
    process.env.ALPHASKILL_REVALIDATE_SECRET = 'test-secret'

    const res = await POST(mockRequest())
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })

    if (prevSecret) process.env.ALPHASKILL_REVALIDATE_SECRET = prevSecret
  })

  it('returns 401 when header does not match', async () => {
    const prevSecret = process.env.ALPHASKILL_REVALIDATE_SECRET
    process.env.ALPHASKILL_REVALIDATE_SECRET = 'test-secret'

    const res = await POST(mockRequest('wrong-secret'))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'unauthorized' })

    if (prevSecret) process.env.ALPHASKILL_REVALIDATE_SECRET = prevSecret
  })

  it('returns 200 when secret matches', async () => {
    const prevSecret = process.env.ALPHASKILL_REVALIDATE_SECRET
    process.env.ALPHASKILL_REVALIDATE_SECRET = 'test-secret'

    const res = await POST(mockRequest('test-secret'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    if (prevSecret) process.env.ALPHASKILL_REVALIDATE_SECRET = prevSecret
  })
})
