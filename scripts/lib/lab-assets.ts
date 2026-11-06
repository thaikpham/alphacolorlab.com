import type { SupabaseClient } from '@supabase/supabase-js'

import { DEFAULT_RUNG, DRAFT_BUCKET, assetVariantPath } from '../../src/lib/lab/assets'
import type { ProcessedLabImage } from '../../src/lib/lab/image-process.core'

/**
 * `uploadDraftAsset` from `src/lib/lab/asset-store` with the script's own
 * client. The app module carries `import 'server-only'` and reads the content
 * credentials through `contentAdmin()`, both of which throw under tsx — the
 * same reason `scripts/supabase/clients.ts` builds its own client. Same row
 * shape, same bucket, same cleanup: an insert as `orphaned`, every variant
 * uploaded without upsert, then `draft`; a failed variant removes what landed.
 */
export async function uploadDraftAssetWith(
  db: SupabaseClient,
  articleId: string,
  image: ProcessedLabImage,
  editorEmail: string,
): Promise<{ ok: true; assetId: string } | { ok: false; error: string }> {
  const assetId = crypto.randomUUID()
  const { error: insertError } = await db.from('lab_assets').insert({
    id: assetId,
    article_id: articleId,
    storage_path: assetVariantPath(articleId, assetId, DEFAULT_RUNG),
    mime_type: 'image/webp',
    width: image.width,
    height: image.height,
    byte_size: image.byteSize,
    animated: false,
    state: 'orphaned',
    updated_by: editorEmail,
  })
  if (insertError) return { ok: false, error: `lab_assets insert: ${insertError.message}` }

  const written: string[] = []
  for (const variant of image.variants) {
    const path = assetVariantPath(articleId, assetId, variant.rung)
    const { error } = await db.storage
      .from(DRAFT_BUCKET)
      .upload(path, variant.bytes, { contentType: 'image/webp', upsert: false, cacheControl: '31536000' })
    if (error) {
      const cleaned = written.length === 0 || !(await db.storage.from(DRAFT_BUCKET).remove(written)).error
      await db.from('lab_assets').update({ state: cleaned ? 'orphaned' : 'cleanup_failed' }).eq('id', assetId)
      return { ok: false, error: `upload ${path}: ${error.message}` }
    }
    written.push(path)
  }

  const { error: stateError } = await db
    .from('lab_assets')
    .update({ state: 'draft', updated_by: editorEmail })
    .eq('id', assetId)
  if (stateError) return { ok: false, error: `lab_assets draft: ${stateError.message}` }
  return { ok: true, assetId }
}
