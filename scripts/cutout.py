"""Segment the drone from a photo with ISNet, then write a cutout and a drone-free plate.

python -I cutout.py <model.onnx> <input> <out_dir> [mean] [std]
"""
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

model, src, out_dir = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
mean = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
std = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGB")
W, H = img.size
x = np.asarray(img.resize((1024, 1024), Image.LANCZOS), dtype=np.float32)
x = x / max(x.max(), 1e-6)
x = (x - mean) / std
x = x.transpose(2, 0, 1)[None].astype(np.float32)

sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
pred = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-6)
mask = Image.fromarray((pred * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
mask.save(out_dir / "mask.png")

# Cutout: tighten the soft edge a little so desert haze doesn't fringe the hull.
m = np.asarray(mask, dtype=np.float32) / 255.0
m = np.clip((m - 0.12) / 0.76, 0, 1)
rgba = np.dstack([np.asarray(img), (m * 255).astype(np.uint8)])
cut = Image.fromarray(rgba, "RGBA")
bbox = cut.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
cut.save(out_dir / "cutout-full.png")
print("bbox", bbox, "size", (W, H))

# Clean plate: grow the mask, then push-pull fill the hole from the surroundings.
hole = mask.point(lambda v: 255 if v > 20 else 0).filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(6))
h = np.asarray(hole, dtype=np.float32) / 255.0
known = 1.0 - h
rgb = np.asarray(img, dtype=np.float32)

def push_pull(color, weight):
    levels = [(color * weight[..., None], weight)]
    while min(levels[-1][1].shape) > 2:
        c, w = levels[-1]
        hh, ww = (w.shape[0] // 2) * 2, (w.shape[1] // 2) * 2
        c, w = c[:hh, :ww], w[:hh, :ww]
        c2 = c.reshape(hh // 2, 2, ww // 2, 2, 3).sum((1, 3))
        w2 = w.reshape(hh // 2, 2, ww // 2, 2).sum((1, 3))
        levels.append((c2, w2))
    filled = levels[-1][0] / np.maximum(levels[-1][1], 1e-6)[..., None]
    for c, w in reversed(levels[:-1]):
        up = np.asarray(Image.fromarray(np.clip(filled, 0, 255).astype(np.uint8)).resize((w.shape[1], w.shape[0]), Image.BILINEAR), dtype=np.float32)
        a = np.clip(w, 0, 1)[..., None]
        filled = (c / np.maximum(w, 1e-6)[..., None]) * a + up * (1 - a)
    return filled

fill = push_pull(rgb, known)
plate = rgb * known[..., None] + fill * h[..., None]
Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save(out_dir / "plate.png")
print("wrote", out_dir)
