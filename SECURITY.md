# Static-site security maintenance

All root HTML documents include a hash-based script CSP and a referrer policy.
After editing inline JavaScript, run:

```sh
python scripts/security_policy.py
python scripts/security_policy.py --check
python scripts/test_security_policy.py
```

The security workflow checks the policies and JavaScript syntax without write permissions.
MIRAI renders visitor messages as text, limits input to 1200 UTF-16 code units and retains at most 60 displayed messages. Conversation content is not persisted or sent to an AI service. Mail inquiries open the visitor's mail application.

## Deployment requirements still pending

Meta CSP cannot enforce `frame-ancestors`. Configure HTTP response headers at the hosting/CDN layer before treating clickjacking protection as complete. GitHub Pages does not consume an arbitrary `_headers` file; no such file is supplied as a purported fix.

Recommended deployment configuration to validate separately:

- CSP HTTP header with the same policy plus `frame-ancestors 'none'`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY` as legacy defense.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- HSTS after confirming HTTPS and certificate operation for every applicable host; do not enable subdomain coverage/preload without that review.

Existing inline styles remain allowed for layout compatibility. Google Fonts and Cloudflare analytics remain allowed third-party resources. The CSP is defense in depth, not a substitute for safe DOM rendering or repository access controls.

Reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
