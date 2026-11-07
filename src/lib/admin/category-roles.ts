/**
 * Which product categories each admin role may write.
 *
 * Pure and client-safe on purpose. The routes enforce it — `canManageCategory()`
 * runs against the stored row before any write — and the product editor reads
 * the same function to offer only the categories a save could succeed with.
 */

export type AdminRole = 'super' | 'di';

export const PRODUCT_CATEGORIES = ['camera', 'lens', 'accessory'] as const;
export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number];

/** Both roles manage the whole catalogue since PE was removed (2026-11-07); an unknown category is refused. */
export function canManageCategory(role: AdminRole, category: string): boolean {
  return (role === 'super' || role === 'di') && (PRODUCT_CATEGORIES as readonly string[]).includes(category);
}

/** The categories `role` may create, in the order the form lists them. */
export const categoriesFor = (role: AdminRole): ProductCategoryId[] =>
  PRODUCT_CATEGORIES.filter((c) => canManageCategory(role, c));
