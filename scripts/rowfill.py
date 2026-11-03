"""Fill a masked hole in a landscape row by row, so horizons and ridgelines stay continuous.

python -I rowfill.py <image> <mask> <out>
"""
import sys

import numpy as np
from PIL import Image, ImageFilter

img = np.asarray(Image.open(sys.argv[1]).convert("RGB"), dtype=np.float32)
mask = Image.open(sys.argv[2]).convert("L")
hole_img = mask.point(lambda v: 255 if v > 4 else 0).filter(ImageFilter.MaxFilter(45))
hole = np.asarray(hole_img) > 0
H, W, _ = img.shape
xs = np.arange(W)
out = img.copy()

for y in range(H):
    h = hole[y]
    if not h.any():
        continue
    known = ~h
    if not known.any():
        continue
    # Sample a short band beside the hole on each side, not just one pixel, to avoid streaks.
    left_idx = np.where(known, xs, -1)
    left_idx = np.maximum.accumulate(left_idx)
    right_idx = np.where(known, xs, W)
    right_idx = np.minimum.accumulate(right_idx[::-1])[::-1]
    for x in np.where(h)[0]:
        l, r = left_idx[x], right_idx[x]
        lc = img[y, max(0, l - 6): l + 1].mean(0) if l >= 0 else None
        rc = img[y, r: min(W, r + 7)].mean(0) if r < W else None
        if lc is None:
            out[y, x] = rc
        elif rc is None:
            out[y, x] = lc
        else:
            t = (x - l) / max(1, r - l)
            out[y, x] = lc * (1 - t) + rc * t

# Soften row streaks inside the hole, then feather the seam.
filled = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
soft = np.asarray(filled.filter(ImageFilter.GaussianBlur(5)), dtype=np.float32)
feather = np.asarray(hole_img.filter(ImageFilter.GaussianBlur(10)), dtype=np.float32)[..., None] / 255.0
result = img * (1 - feather) + soft * feather
# Grain so the patch doesn't read as airbrushed.
rng = np.random.default_rng(7)
result += rng.normal(0, 3.2, result.shape) * feather
Image.fromarray(np.clip(result, 0, 255).astype(np.uint8)).save(sys.argv[3])
print("wrote", sys.argv[3])
