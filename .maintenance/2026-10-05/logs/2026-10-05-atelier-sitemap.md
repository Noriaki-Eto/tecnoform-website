# Atelier TECNOFORM audit — 2026-10-05

## Outcome

Published a one-file metadata correction to the existing public site. The home and Journal source changed on 2026-10-03, while their sitemap lastmod values still read 2026-10-02. Updated those two dates to 2026-10-03. No page copy, visual design, works, photography, credits, prices, company details, or domain settings were changed.

## Verification

- git diff --check: passed; only sitemap.xml changed.
- XML parse and four sitemap entries: passed.
- GitHub Pages workflow for commit 7e9ffe757cfdfde9d3a3588da4092bac2f35bcd7: completed successfully.
- Live sitemap served the new dates for / and /journal.html; /lotus.html and /tokushoho.html retained their existing dates.
- Home, Journal, Lotus and legal page: HTTP 200.
- Browser at 390x844: mobile menu opened and closed; language switch worked Japanese-English-Japanese; Japanese restored and viewport reset.
- Current design tokens and composition were untouched.

## Recovery

- Latest public source archive: atelier-public-7e9ffe7-source.zip; 63,146,770 bytes; SHA-256 8dc0630d4ada43c3a8d4133f1922f423e6081e6a9d1fa3491f52ce6a57639c44.
- Google Drive part 01: 33,554,432 bytes; SHA-256 044473757f5accf7d203cc2295d17a9f2581b3bc2fff6ea4054c057bfde8e18b; Drive file ID 1_GOltM2w3ldvt3dYlNuVxdpKg3VVybb8.
- Google Drive part 02: 29,592,338 bytes; SHA-256 4f50b37ee669fdbebf7571aa69d78d3a1f0b2deada0787548f9a1ffab702fc13; Drive file ID 1I9wKjCpcx5XMQAHjEHWMVABc_ycci6Le.
- Both parts were fetched again, hashes matched, and the reconstructed ZIP hash matched. ZIP readback succeeded and contained 257 tracked entries.
- The source snapshot is RECOVERED_APPROVAL_PENDING; verified storage does not independently authorize promoting a recovered copy to a release.

## Timing

- Heartbeat trigger: 2026-10-05 07:56:00.891Z / 16:56:00.891 JST.
- Resumed execution: 2026-10-05 10:57:52Z / 19:57:52 JST.
