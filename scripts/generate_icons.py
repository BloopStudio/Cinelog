"""One-off script to generate CinéLog's app icon / splash assets.
Not part of the build — run manually, commit the resulting PNGs, then delete
or ignore this script. Requires Pillow (pip install Pillow).
"""

import math
import os

from PIL import Image, ImageDraw, ImageFont

BG = (11, 15, 20, 255)  # #0B0F14
PRIMARY = (230, 57, 70, 255)  # #E63946
ACCENT = (244, 163, 64, 255)  # #F4A340
WHITE = (255, 255, 255, 255)
TEXT_SECONDARY = (154, 165, 177, 255)  # #9AA5B1

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
STORE_OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "store")
FONT_PATH = os.path.join(os.path.dirname(__file__), "fonts", "Outfit-Bold.ttf")
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


def draw_feature_graphic(width: int, height: int):
    """Play Store 'feature graphic' banner: mark + wordmark on dark bg."""
    big_w, big_h = width * SS, height * SS
    img = Image.new("RGBA", (big_w, big_h), BG)
    draw = ImageDraw.Draw(img)

    # Mark on the left
    mark_size = int(big_h * 0.72)
    mark = draw_mark(mark_size // SS, ACCENT, PRIMARY, transparent=True).resize(
        (mark_size, mark_size), Image.LANCZOS
    )
    mark_x = int(big_w * 0.08)
    mark_y = (big_h - mark_size) // 2
    img.paste(mark, (mark_x, mark_y), mark)

    # Wordmark to the right of the mark, sized to fit the remaining width
    text_x = mark_x + mark_size + int(big_w * 0.05)
    right_margin = int(big_w * 0.06)
    max_title_width = big_w - text_x - right_margin

    title = "CinéLog"
    title_font_size = int(big_h * 0.32)
    title_font = ImageFont.truetype(FONT_PATH, title_font_size)
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    while title_bbox[2] - title_bbox[0] > max_title_width and title_font_size > 10:
        title_font_size -= 4
        title_font = ImageFont.truetype(FONT_PATH, title_font_size)
        title_bbox = draw.textbbox((0, 0), title, font=title_font)

    subtitle_font = ImageFont.truetype(FONT_PATH, int(title_font_size * 0.28))
    title_h = title_bbox[3] - title_bbox[1]
    subtitle = "Films & séries, ta liste"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)

    gap = int(big_h * 0.04)
    block_h = title_h + gap + (subtitle_bbox[3] - subtitle_bbox[1])
    title_y = (big_h - block_h) // 2 - title_bbox[1]
    subtitle_y = title_y + title_h + gap - subtitle_bbox[1]

    draw.text((text_x, title_y), title, font=title_font, fill=WHITE)
    draw.text((text_x, subtitle_y), subtitle, font=subtitle_font, fill=TEXT_SECONDARY)

    return img.resize((width, height), Image.LANCZOS)


def draw_splash_with_text(mark_size: int, label: str):
    """Mark on top, a small text label centered below it, transparent bg.
    Used for the native splash screen (expo-splash-screen only takes a
    single image, so the label has to be baked in)."""
    big_mark = mark_size * SS
    label_h = int(big_mark * 0.16)
    big_w, big_h = big_mark, big_mark + label_h

    img = Image.new("RGBA", (big_w, big_h), (0, 0, 0, 0))
    mark = draw_mark(mark_size, ACCENT, PRIMARY, transparent=True).resize(
        (big_mark, big_mark), Image.LANCZOS
    )
    img.paste(mark, (0, 0), mark)

    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_PATH, int(label_h * 0.55))
    bbox = draw.textbbox((0, 0), label, font=font)
    text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    text_x = (big_w - text_w) // 2 - bbox[0]
    text_y = big_mark + (label_h - text_h) // 2 - bbox[1]
    draw.text((text_x, text_y), label, font=font, fill=TEXT_SECONDARY)

    return img.resize((mark_size, mark_size + label_h // SS), Image.LANCZOS)


def save(img: Image.Image, name: str, out_dir: str = OUT_DIR):
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, name)
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

    # Splash icon: mark + "BloopStudio" label below, transparent
    splash = draw_splash_with_text(800, "BloopStudio")
    save(splash, "splash-icon.png")

    # Favicon (on dark background, small)
    favicon = draw_mark(196, ACCENT, PRIMARY, transparent=False)
    save(favicon, "favicon.png")

    # --- Play Store listing assets (not used by the app itself) ---

    # App icon: 512x512, on dark background
    store_icon = draw_mark(512, ACCENT, PRIMARY, transparent=False)
    save(store_icon, "icon-512.png", STORE_OUT_DIR)

    # Feature graphic: 1024x500
    feature_graphic = draw_feature_graphic(1024, 500)
    save(feature_graphic.convert("RGB"), "feature-graphic-1024x500.png", STORE_OUT_DIR)


if __name__ == "__main__":
    main()
