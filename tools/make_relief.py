#!/usr/bin/env python3
"""Builds data/relief.jpg (Mercator-projected shaded relief of Iran) from Natural Earth I (public domain).
Uses HTTP range requests, so only the needed ~65 MB of the 700 MB TIFF is downloaded. Author: Hamid Yarali"""
import math, urllib.request, numpy as np
from PIL import Image, ImageEnhance
from scipy.ndimage import map_coordinates
U = 'https://raw.githubusercontent.com/nvkelso/natural-earth-raster/master/10m_rasters/NE1_HR_LC_SR_W_DR/NE1_HR_LC_SR_W_DR.tif'
PPD, W0, ROW, BASE = 60, 21600, 21600 * 3, 21652  # BASE = offset of first strip (uncompressed, 1 row per strip)
LON0, LON1, LAT0, LAT1 = 43.5, 64, 24, 40.5
r0, r1 = int((90 - LAT1) * PPD) - 3, int((90 - LAT0) * PPD) + 3
c0, c1 = int((LON0 + 180) * PPD) - 3, int((LON1 + 180) * PPD) + 3
req = urllib.request.Request(U, headers={'Range': f'bytes={BASE + r0 * ROW}-{BASE + r1 * ROW - 1}'})
src = np.frombuffer(urllib.request.urlopen(req).read(), np.uint8).reshape(r1 - r0, W0, 3)[:, c0:c1].astype(np.float32)
OW = 2400; S = OW / math.radians(LON1 - LON0); M = lambda a: math.log(math.tan(math.pi / 4 + math.radians(a) / 2))
OH = round((M(LAT1) - M(LAT0)) * S)
lon = LON0 + np.degrees(np.arange(OW) / S)
lat = np.degrees(2 * np.arctan(np.exp(M(LAT1) - np.arange(OH) / S)) - math.pi / 2)
cc = np.tile(((lon + 180) * PPD - c0 - .5)[None, :], (OH, 1)); rr = np.tile(((90 - lat) * PPD - r0 - .5)[:, None], (1, OW))
out = np.dstack([map_coordinates(src[..., i], [rr, cc], order=3, mode='nearest') for i in range(3)])
im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
im = ImageEnhance.Sharpness(ImageEnhance.Color(ImageEnhance.Contrast(im).enhance(1.15)).enhance(1.2)).enhance(1.5)
im.save('../data/relief.jpg', quality=82, optimize=True)
print(im.size, OH, 'ratio', round(OH / OW * 1000))
