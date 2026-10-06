# מכין את התמונות למשחק: מחלץ מהקובץ המכווץ, מקטין ומסובב לפי הטלפון
import sys, zipfile, io, os, glob
from PIL import Image, ImageOps
zp = sys.argv[1]
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'photos')
os.makedirs(out, exist_ok=True)
n = 0
with zipfile.ZipFile(zp) as z:
    names = sorted(x for x in z.namelist() if x.lower().endswith(('.jpg', '.jpeg', '.png', '.heic', '.webp')))
    for name in names:
        try:
            im = ImageOps.exif_transpose(Image.open(io.BytesIO(z.read(name)))).convert('RGB')
            im.thumbnail((1200, 1200))
            n += 1
            im.save(os.path.join(out, '%03d.jpg' % n), 'JPEG', quality=72, optimize=True, progressive=True)
        except Exception as e:
            print('skip', name, e)
print('photos', n, 'MB', round(sum(os.path.getsize(f) for f in glob.glob(out + '/*.jpg')) / 1e6, 1))
