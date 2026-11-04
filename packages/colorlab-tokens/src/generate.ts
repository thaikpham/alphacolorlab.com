/**
 * Pure generation of the shared CSS artefacts. No filesystem writes.
 *
 * Split from emit.ts so the drift test can compute what the files *should*
 * contain without running the emitter — an earlier version of that test shelled
 * out to the emitter first, which rewrote every app copy and healed the very
 * drift it was meant to catch. A test that repairs the thing it is checking
 * always passes.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  COLOR_GROUPS,
  ELEVATION,
  NAMESPACED_GROUPS,
  PAPER,
  PAPER_SELECTOR,
  VOID_SELECTOR,
  type TokenGroup,
} from './tokens'

const HERE = dirname(fileURLToPath(import.meta.url))

export const BANNER = [
  '/* GENERATED FILE — DO NOT EDIT.',
  ' *',
  ' * Source: packages/colorlab-tokens/src/tokens.ts',
  ' * Regenerate: npm run tokens:emit',
  ' *',
  ' * A drift test in each app fails if this file is edited by hand or falls',
  ' * behind the source, so an edit here is reverted by the next CI run at best',
  ' * and silently diverges the ecosystem at worst.',
  ' */',
  '',
].join('\n')

function block(group: TokenGroup, prefix: string, indent: string): string {
  const comment = group.comment
    .split('\n')
    .map((line) => `${indent}/* ${line} */`)
    .join('\n')
    // Collapse the per-line comment markers into one block for readability.
    .replace(/ \*\/\n\s*\/\* /g, '\n' + indent + '   ')

  const declarations = Object.entries(group.tokens)
    .map(([name, value]) => `${indent}--${prefix}-${name}: ${value};`)
    .join('\n')

  return `${comment}\n${declarations}`
}

function sections(): string[] {
  return [
    ...COLOR_GROUPS.map((group) => block(group, 'color', '  ')),
    ...NAMESPACED_GROUPS.map(({ namespace, group }) => block(group, namespace, '  ')),
  ]
}

/**
 * The paper room, as a plain rule after the theme. Outside `@theme` on purpose:
 * it restates tokens under a selector, and `@theme` only defines them.
 */
function paper(): string {
  const body = PAPER.map(({ namespace, group }) => block(group, namespace, '  ')).join('\n\n')
  return `\n${PAPER_SELECTOR} {\n  color-scheme: light;\n\n${body}\n}\n${voidRoom()}`
}

/**
 * The dark room restated under VOID_SELECTOR, for an element portalled into a
 * paper page. Exactly the names PAPER overrides, with their `:root` values.
 */
function voidRoom(): string {
  const dark = new Map<string, string>()
  for (const group of COLOR_GROUPS) {
    for (const [name, value] of Object.entries(group.tokens)) dark.set(`--color-${name}`, value)
  }
  for (const [name, value] of Object.entries(ELEVATION.tokens)) dark.set(`--elevation-${name}`, value)
  const declarations = PAPER.flatMap(({ namespace, group }) =>
    Object.keys(group.tokens).map((name) => {
      const prop = `--${namespace}-${name}`
      const value = dark.get(prop)
      if (value === undefined) throw new Error(`PAPER restates ${prop}, which the dark room never declares`)
      return `  ${prop}: ${value};`
    }),
  )
  return `\n${VOID_SELECTOR} {\n  color-scheme: dark;\n\n${declarations.join('\n')}\n}\n`
}

/**
 * Every generated artefact, keyed by filename.
 *
 * Two flavours of the same tokens, because the consumers differ:
 *
 *   theme.css   Tailwind v4 (`@theme static`). What this app imports.
 *   tokens.css  plain `:root` custom properties, for a consumer without
 *               Tailwind. Nothing in this repo reads it; it is named in this
 *               package's `exports` and costs nothing to keep emitting.
 *
 * `@theme static`, not a bare `@theme`: Tailwind only emits a theme variable it
 * has seen a utility use, and several of these are read solely through `var()`
 * from hand-written CSS, which the scanner cannot see. Under a plain `@theme`,
 * `--color-proposal` was dropped from `:root` and ColorLab's proposal card
 * rendered with no accent at all.
 */
export function generate(): Record<string, string> {
  return {
    'theme.css': `${BANNER}\n@theme static {\n${sections().join('\n\n')}\n}\n${paper()}`,
    'tokens.css': `${BANNER}\n:root {\n${sections().join('\n\n')}\n}\n${paper()}`,
    'primitives.css': BANNER + readFileSync(join(HERE, 'primitives.css'), 'utf8'),
  }
}

/**
 * Where each artefact lands, relative to the repo root.
 *
 * In-repo copies only. Six of these used to point into `apps/live-sop` and
 * `apps/cheese-booth`; both apps moved to their own repos, and a destination
 * outside this one is not a destination — emit.ts writes with
 * `mkdirSync(…, { recursive: true })`, so a stale path does not error, it
 * *recreates* the folder. Leaving them here would have grown an untracked
 * `apps/` tree back out of the first `npm run tokens:emit` after the removal.
 *
 * `tokens.css` therefore has no in-repo destination and an empty list, which is
 * correct rather than an oversight: it is still written to `dist/`, which is
 * where an out-of-repo consumer reads it from.
 */
export const TARGETS: ReadonlyArray<{
  readonly file: string
  readonly destinations: readonly string[]
}> = [
  {
    file: 'theme.css',
    destinations: ['src/app/vendor/colorlab-tokens/theme.css'],
  },
  {
    file: 'tokens.css',
    destinations: [],
  },
  {
    file: 'primitives.css',
    destinations: ['src/app/vendor/colorlab-tokens/primitives.css'],
  },
]
