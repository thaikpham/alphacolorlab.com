# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally (owner, 2026-10-30):

- **Sony Alpha shooters** — hobbyists and semi-professionals who want good colour
  straight out of the camera, without editing. They pick a recipe by shooting
  situation and dial it into their camera.
- **Sony customers in Vietnam** — people who have just bought, or are weighing, a
  Sony body or lens. ColorLab, Sony Wiki and the blog support the sale and the
  time after it.

Both read in English or Vietnamese; Vietnamese is the community's home language.

## Product Purpose

Alpha ColorLab shares colour recipes for Sony Alpha cameras. White Balance Shift is
the core; each recipe pairs it with either a Picture Profile or a Creative Look,
never both, because the camera allows only one. Success is a reader who finds a
recipe for what they are about to shoot, sets it on their own camera, and gets the
colour the recipe promised.

It is the rebuild of sonycolorlab.app, which reached thousands of users in 2025.
The same site also hosts Sony Wiki (camera and audio catalogue) and Alpha Tech
Blogs (articles and the `/learn` knowledge pages).

## Positioning

What a neighbouring recipe site cannot truthfully claim:

- **Every value is checked against Sony's Help Guide.** Ranges and enums live in one
  file, each cited to its source, so a recipe always installs on a real camera.
- **It filters by your camera.** Name your body once and the catalogue hides what it
  cannot install, from checked evidence, never from a typed table.
- **It explains each setting.** Every parameter says what it is and what this
  recipe's value is doing to the picture.
- **It is written for Vietnamese shooters.** Bilingual EN/VI, with situations such as
  áo dài, Lunar New Year and café.
- **Its community contributes.** Readers add sample photos and comment on recipes.

## Operating Context

- Built inside Sony Vietnam by an employee; it serves internal and sales work but
  is **not an official Sony product**. Never present it as one, and never claim
  Sony endorsement.
- Readers often arrive from links shared in Facebook groups; old `?id=` links
  must keep resolving.
- A reader sets a recipe on the camera in hand, often on a phone beside the body.
- Administrators publish recipes in `/admin/colorlab` after shooting each one on
  an a7 IV.

## Capabilities and Constraints

- Browse by colour system, situation, style and tone; search; per-recipe page with
  settings as cards, sample photos and comments; "My camera" filter.
- Readers sign in with Google to contribute photos and comments. Administrators sign
  in with email, password and TOTP.
- Removed on 2026-10-28 and not to be revived without the owner: proposing and
  voting on recipe versions, and "Tweak with AI".
- **Open:** the owner named community-contributed *recipes* as a strength. Today
  only photos and comments are contributed; new recipes come from the editors. How
  readers submit recipes is undecided.
- Technical terms (parameter labels, Look codes, gamma names, WB values) are never
  translated.
- No recipe carries an official photograph. The thumbnail is a reading of the
  settings and must never be presented as a camera preview.

## Brand Commitments

- Name: **Alpha ColorLab** (launcher label "ColorLab 2.0"), within the Sony Alpha
  ecosystem with Sony Wiki, Alpha Tech Blogs, CheeseBooth and Sony Live SOP.
- The design system in `DESIGN.md` and the six rules in `CLAUDE.md` are binding.
- No explanatory microcopy; safety and accuracy disclaimers stay.

## Evidence on Hand

- 47 published recipes (10 Picture Profile, 37 Creative Look) in
  `data/recipes.seed.json`; 94 cameras in `data/sony-cameras.seed.json`.
- Reader sample photos in `community_photos` on the control plane. Most recipes
  have none yet; do not fabricate any.
- No testimonials, usage figures beyond "thousands of users" for the old site, or
  press. Do not invent them.

## Product Principles

1. A recipe that cannot be set on a real camera is a bug, not content.
2. Evidence over plausibility: no value, capability or claim without a source.
3. Show what fits the reader's camera and situation; hide the rest.
4. Explain the setting, never sell the look.
5. Contribution is open; moderation hides, never deletes.

## Accessibility & Inclusion

Bilingual EN/VI with full Vietnamese diacritics; a 13px type floor; touch targets of
at least 44px; axe checks run in the browser gates.
