# Existing website changes

- Preserve the approved Mirai character, voice, video, project photographs, credits, colors and typography unless the user requests those changes.
- Read the current branch and live page before changing a customer route. Do not replace newer content from an old local copy.
- Product facts must come from the exact existing product page. Keep its listing ID and purchase URL; do not invent price, dimensions, licenses, compatibility or purchase results. Do not claim Universal Cart integration without an implemented and verified connection.
- Mirai prepares inquiries locally. Opening a mail application is neither sending nor confirmed receipt. Never add background sending, personal-data storage, or new paid APIs for this flow.
- When changing inquiry handling, run `node --test tests/mirai-handoff.test.cjs`. Verify review, edited-draft invalidation, Japanese encoding and clipboard failure. Browser/phone visual review and actual delivery verification are separate checks.
- For external synchronization, retain the source revision, write result and a readback of that same content. A local copy is not a shared save; a matching shared save is not proof that another person read it. Do not repeat a rejected write through a different route to bypass a safety check.
