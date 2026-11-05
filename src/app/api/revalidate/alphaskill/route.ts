import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { revalidateTag, revalidatePath } from 'next/cache'
import { ALPHASKILL_TAG } from '@/lib/alphaskill/knowledge'
import { IMMEDIATE } from '@/lib/catalogue-cache'

/**
 * Webhook to revalidate alphaskill content when the vault publishes.
 * Called by the alphaskill GitHub Action after each publish.
 *
 * POST only. Requires `ALPHASKILL_REVALIDATE_SECRET` to be set (returns 503
 * otherwise). Compares the `x-alphaskill-secret` header with constant-time
 * comparison; returns 401 on mismatch. On success, revalidates the
 * alphaskill tag and the /learn paths.
 */
export async function POST(request: Request) {
  const secret = process.env.ALPHASKILL_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'notConfigured' }, { status: 503 })
  }

  const headerSecret = request.headers.get('x-alphaskill-secret')
  if (!headerSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Constant-time comparison: lengths first, then contents
  const headerBuffer = Buffer.from(headerSecret)
  const secretBuffer = Buffer.from(secret)

  if (headerBuffer.length !== secretBuffer.length) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!timingSafeEqual(headerBuffer, secretBuffer)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Revalidate alphaskill content
  revalidateTag(ALPHASKILL_TAG, IMMEDIATE)
  revalidatePath('/[locale]/learn', 'page')
  revalidatePath('/[locale]/learn/[id]', 'page')

  return NextResponse.json({ ok: true })
}

