/**
 * "SCL-PP-001: Mojave Sun" → "Mojave Sun".
 *
 * The stored name carries the catalogue code because the code is what the
 * legacy site, the search index and the admin editor key on. A reader browsing
 * the grid does not (Q4): the card shows the name alone, and the recipe page
 * keeps the code in its own chip beside the heading.
 */
export const recipeTitle = (name: string): string =>
  name.includes(': ') ? name.split(': ').slice(1).join(': ') : name;

/**
 * The name's mood words: "CL-013-Airy Warm Pastel" → "Airy Warm Pastel",
 * "SCL-PP-001: Mojave Sun" → "Mojave Sun". The browse card sets these as its
 * title and the code beside the situations (owner, 2026-10-29), so the code is
 * printed once rather than in the title and again under it.
 */
export const recipeMood = (name: string): string => {
  const title = recipeTitle(name);
  return title.replace(/^(?:SCL-)?(?:PP|CL)-\d{3}-/, '') || title;
};
