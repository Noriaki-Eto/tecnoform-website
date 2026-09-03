# atelier TECNOFORM autonomous maintenance charter

## Mission

Maintain `https://atelier-tecnoform.com/` without redesigning it. The current public site and the `Noriaki-Eto/tecnoform-website` main branch are the design baseline.

## Design freeze

- Preserve the black, warm ivory and gold palette: `#0b0a09`, `#14110e`, `#ece5d5`, `#b8a78a`, `#c9a875`.
- Preserve Cormorant Garamond, Noto Serif JP and Inter.
- Preserve the hero, section order, works grid, photography, spacing rhythm, animations, Japanese/English switch and Lotus page.
- Do not redesign, rebrand, reorder works, replace photographs or rewrite artistic statements automatically.

## Automatic low-risk work

Only one evidence-backed improvement per run:

- broken-link repair using an authoritative replacement;
- accessibility semantics that do not alter appearance;
- mobile overflow or tap-target correction that preserves composition;
- image performance attributes that do not change cropping or visual order;
- metadata, sitemap or copyright-year maintenance;
- typo correction when the intended wording is unambiguous.

## Human approval required

Do not automatically change works, client names, credits, artist biographies, company identity, address, telephone, email, prices, product terms, legal pages, contracts, domain or DNS settings, analytics, advertisements, purchases, banking, payment settings, access permissions, or delete content.

## Publication gate

Before publication, verify that only the intended files changed, design tokens and section order are intact, the site loads on desktop and smartphone widths, Japanese/English switching remains available, and all checks pass. Record every action in `runtime/STATE.json`, `runtime/BACKLOG.json` and `UPDATES.md`.
