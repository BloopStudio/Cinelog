"""One-off script to generate CinéLog's app icon / splash assets.
Not part of the build — run manually, commit the resulting PNGs, then delete
or ignore this script. Requires Pillow (pip install Pillow).
"""

import math
import os

from PIL import Image, ImageDraw

BG = (11, 15, 20, 255)  # #0B0F14
PRIMARY = (230, 57, 70, 255)  # #E63946
ACCENT = (244, 163, 64, 255)  # #F4A340
WHITE = (255, 255, 255, 255)

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
SS = 4  # supersampling factor for anti-aliasing


def draw_mark(size: int, ring_color, triangle_color, transparent: bool):
    """Draws the CinéLog mark (film-reel ring + play triangle) centered in a
    square canvas of `size` px, at `SS`x supersampling then downsampled."""
    big = size * SS
    bg = (0, 0, 0, 0) if transparent else BG
    img = Image.new("RGBA", (big, big), bg)
    draw = ImageDraw.Draw(img)

    cx = cy = big / 2
    ring_r = big * 0.34
    ring_w = big * 0.075

    # Film-reel ring
    draw.ellipse(
        [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
        outline=ring_color,
        width=int(ring_w),
    )

    # Perforation dots around the ring
    dot_r = big * 0.035
    for i in range(8):
        angle = math.pi * 2 * i / 8
        dx = cx + math.cos(angle) * ring_r
        dy = cy + math.sin(angle) * ring_r
        draw.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=ring_color)

    # Play triangle, centered, pointing right
    tri_r = big * 0.19
    offset = big * 0.02  # optical centering nudge
    p1 = (cx - tri_r * 0.7 + offset, cy - tri_r)
    p2 = (cx - tri_r * 0.7 + offset, cy + tri_r)
    p3 = (cx + tri_r * 0.9 + offset, cy)
    draw.polygon([p1, p2, p3], fill=triangle_color)

    return img.resize((size, size), Image.LANCZOS)


def save(img: Image.Image, name: str):
    path = os.path.join(OUT_DIR, name)
    img.save(path)
    print("wrote", path)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # Main icon (on dark background)
    icon = draw_mark(1024, ACCENT, PRIMARY, transparent=False)
    save(icon, "icon.png")

    # Adaptive icon foreground (mark only, transparent, safe-zone sized)
    fg = draw_mark(1024, ACCENT, PRIMARY, transparent=True)
    save(fg, "android-icon-foreground.png")

    # Adaptive icon background (flat color)
    bg = Image.new("RGBA", (1024, 1024), BG)
    save(bg, "android-icon-background.png")

    # Adaptive icon monochrome (single-color silhouette, transparent bg)
    mono = draw_mark(1024, WHITE, WHITE, transparent=True)
    save(mono, "android-icon-monochrome.png")

    # Splash icon (mark only, transparent, moderate size)
    splash = draw_mark(800, ACCENT, PRIMARY, transparent=True)
    save(splash, "splash-icon.png")

    # Favicon (on dark background, small)
    favicon = draw_mark(196, ACCENT, PRIMARY, transparent=False)
    save(favicon, "favicon.png")


if __name__ == "__main__":
    main()
