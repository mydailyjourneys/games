# נועל את התמונות בקוד: photos/*.jpg -> photos.txt (מוצפן)
# הקוד נשמר רק במחשב, בקובץ tools/photo-code.txt (לא עולה לגיט)
import os, glob, secrets, struct, hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cf = os.path.join(R, 'tools', 'photo-code.txt')
if os.path.exists(cf):
    code = open(cf, encoding='utf-8').read().split('\n')[0].strip()
else:
    abc = 'abcdefghjkmnpqrstuvwxyz23456789'
    code = ''.join(secrets.choice(abc) for _ in range(12))
salt = secrets.token_bytes(16)
key = hashlib.pbkdf2_hmac('sha256', code.encode(), salt, 200000, 32)
aes = AESGCM(key)
files = sorted(glob.glob(os.path.join(R, 'photos', '*.jpg')))
out = bytearray(b'MDP1' + salt + struct.pack('<I', len(files)))
for f in files:
    iv = secrets.token_bytes(12)
    ct = aes.encrypt(iv, open(f, 'rb').read(), None)
    out += iv + struct.pack('<I', len(ct)) + ct
import base64
open(os.path.join(R, 'photos.txt'), 'w').write(base64.b64encode(bytes(out)).decode())
url = 'https://mydailyjourneys.github.io/games/#' + code
open(cf, 'w', encoding='utf-8').write(code + '\n\nקישור לאמא (פותח את התמונות אוטומטית):\n' + url + '\n')
print('locked', len(files), 'MB', round(len(out) / 1e6, 1))
