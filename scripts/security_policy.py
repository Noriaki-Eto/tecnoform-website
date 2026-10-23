"""Refresh inline-script CSP hashes after HTML edits; --check is read-only."""
import base64
import hashlib
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
BLOCK = re.compile(r'<!-- SECURITY_POLICY_START -->.*?<!-- SECURITY_POLICY_END -->\n?', re.S)

def secured(source):
    source = BLOCK.sub('', source)
    hashes = []
    for attrs, body in re.findall(r'<script\b([^>]*)>(.*?)</script>', source, re.S | re.I):
        if re.search(r'\bsrc\s*=', attrs, re.I) or not body.strip():
            continue
        digest = base64.b64encode(hashlib.sha256(body.encode('utf-8')).digest()).decode()
        hashes.append("'sha256-" + digest + "'")
    policy = "; ".join([
        "default-src 'none'",
        "script-src 'self' https://static.cloudflareinsights.com/beacon.min.js " + ' '.join(sorted(set(hashes))),
        "script-src-attr 'none'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data:",
        "media-src 'self'",
        "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com",
        "object-src 'none'", "base-uri 'none'", "form-action 'none'",
        "frame-src 'none'", "worker-src 'none'",
    ])
    block = ('<!-- SECURITY_POLICY_START -->\n'
             '<meta http-equiv="Content-Security-Policy" content="' + policy + '">\n'
             '<meta name="referrer" content="strict-origin-when-cross-origin">\n'
             '<!-- SECURITY_POLICY_END -->\n')
    return re.sub(r'(<meta\s+charset=[^>]+>\s*)', lambda m: m[0] + block, source, count=1, flags=re.I)

def main():
    check = '--check' in sys.argv
    changed = []
    for path in sorted(ROOT.glob('*.html')):
        source = path.read_text(encoding='utf-8')
        output = secured(source)
        if source != output:
            changed.append(path.name)
            if not check:
                path.write_text(output, encoding='utf-8')
    if check and changed:
        print('Stale or missing CSP: ' + ', '.join(changed))
        return 1
    print(('Verified' if check else 'Updated') + ' security policies for all root HTML pages.')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
