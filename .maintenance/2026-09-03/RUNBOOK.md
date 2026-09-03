# atelier TECNOFORM daily runbook

1. Read `AUTONOMY_CHARTER.md`, this file and `runtime/LOCK.json`.
2. Stop if `locked` is true or the source worktree is not clean.
3. Use the source checkout at `../atelier-tecnoform` and confirm it tracks `Noriaki-Eto/tecnoform-website` main.
4. Check the public home page, `lotus.html`, `tokushoho.html`, primary navigation, language switch, images and mobile layout.
5. Select no more than one low-risk improvement allowed by the charter.
6. Preserve the current CSS variables, fonts, section order, photography and layout.
7. Run whitespace, HTML reference, link and design-diff checks. Do not publish on failure.
8. Publish the validated text-only change to the existing GitHub Pages repository. Do not change GitHub Pages, Cloudflare or domain settings.
9. Confirm the public URL serves the intended change.
10. Update `runtime/STATE.json`, `runtime/BACKLOG.json` and `UPDATES.md`, then release the lock.

Notify the owner only for a failure, conflicting source change, broken official fact, missing asset, approval-required content or a security issue.

## Verified persistence gate

- Before making another source edit, retrieve the latest recovery ledger from the GitHub maintenance branch and the independent Drive recovery folder. Do not infer approval from a restored copy.
- Recovery records are stored outside production main on `maintenance/2026-09-03-recovery`, under `.maintenance/2026-09-03/`. This branch is not a request to merge or deploy.
- Drive folder `10fJ7ZRolJ1c8mhUj9SRJR9Pt7kerGJX_` holds the source parts, ledger and operational records. Older Drive folders remain untouched.
- The verified source archive is reconstructed from part01 then part02 with `restore-recovery.ps1`. Validate its full SHA-256 before extracting to a new empty directory.
- Record storage success separately from publication. A backup commit must not be described as a newly published page.
- Record the actual UTC and Asia/Tokyo trigger times. Do not label 07:30 UTC as 07:30 JST.
