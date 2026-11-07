"""Generate a realistic square flower-like test JPEG (~800x800) for upload E2E tests."""
from PIL import Image, ImageDraw
import math, random

W = H = 800
img = Image.new("RGB", (W, H), (249, 245, 240))  # warm cream background
d = ImageDraw.Draw(img)

random.seed(7)
cx, cy = W // 2, H // 2

# soft green leaves
for ang in (200, 230, 310, 340, 150, 30):
    r = random.randint(180, 260)
    x = cx + int(r * math.cos(math.radians(ang)))
    y = cy + int(r * math.sin(math.radians(ang)))
    d.ellipse([x - 70, y - 38, x + 70, y + 38], fill=(168, 197, 160))

# layered rose-like petals
petals = [
    (330, (232, 180, 184)),  # blush outer
    (260, (226, 160, 168)),
    (195, (216, 138, 150)),
    (135, (200, 112, 128)),
    (82, (178, 90, 108)),
    (40, (150, 70, 90)),
]
for r, col in petals:
    for ang in range(0, 360, 24):
        jitter = random.randint(-8, 8)
        x = cx + int((r * 0.35) * math.cos(math.radians(ang + jitter)))
        y = cy + int((r * 0.35) * math.sin(math.radians(ang + jitter)))
        d.ellipse([x - r // 2, y - r // 3, x + r // 2, y + r // 3], outline=col, width=10)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=6)

# center
d.ellipse([cx - 28, cy - 28, cx + 28, cy + 28], fill=(212, 165, 116))  # soft gold

img.save("/home/z/my-project/scripts/test-flower.jpg", "JPEG", quality=88)
import os
print("saved:", os.path.getsize("/home/z/my-project/scripts/test-flower.jpg"), "bytes")
