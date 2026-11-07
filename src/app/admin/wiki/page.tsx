import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ADMIN_LOCALE } from '@/lib/admin/locale';
import { getSonyCameras } from '@/lib/cameras/data';
import { AdminEditor } from '@/components/admin/admin-editor';

/**
 * The Wiki product editor.
 *
 * Every write is gated server-side by `canManageCategory()` in
 * `products/route.ts`.
 *
 * Reading the catalogue here is not a leak. It is what `/cameras` serves to
 * anyone; the gate is on the write routes, where it belongs.
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: 'adminUi' });
  return { title: t('metaProducts') };
}

export default async function AdminWikiPage() {
  const products = await getSonyCameras();

  return <AdminEditor products={products} />;
}
