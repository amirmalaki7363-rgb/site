#!/usr/bin/env python3
"""Create a small test flower photo (PNG) for upload testing."""
import struct, zlib, os

W = H = 64
# Simple pink flower-ish gradient with a golden center circle
rows = []
for y in range(H):
    row = bytearray()
    for x in range(W):
        cx, cy = W / 2, H / 2
        d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
        if d < 10:
            r, g, b = 212, 165, 116      # gold center
        elif d < 24:
            r, g, b = 232, 180, 184      # soft pink petals
        else:
            r, g, b = 168, 197, 160      # sage background
        row += bytes([r, g, b])
    rows.append(bytes(row))

raw = b"".join(b"\x00" + r for r in rows)

def chunk(tag, data):
    c = struct.pack(">I", len(data)) + tag + data
    return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

png = (b"\x89PNG\r\n\x1a\n"
       + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
       + chunk(b"IDAT", zlib.compress(raw))
       + chunk(b"IEND", b""))

out = "/home/z/my-project/tool-results/test-flower-upload.png"
with open(out, "wb") as f:
    f.write(png)
print(f"saved {out} ({os.path.getsize(out)} bytes)")
