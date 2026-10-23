import unittest
from security_policy import secured


class SecurityPolicyTest(unittest.TestCase):
    def test_idempotence(self):
        source = '<head><meta charset="utf-8">\n<script>const x = 1;</script></head>'
        result = secured(source)
        self.assertEqual(result, secured(result))
        self.assertEqual(result.count('http-equiv="Content-Security-Policy"'), 1)

    def test_script_edit_requires_new_policy(self):
        result = secured('<head><meta charset="utf-8"><script>const x = 1;</script></head>')
        changed = result.replace('const x = 1;', 'const x = 2;')
        self.assertNotEqual(changed, secured(changed))


if __name__ == '__main__':
    unittest.main()
