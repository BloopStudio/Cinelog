"""Post-process the raw Playwright screenshots: react-native-web doesn't
stretch the root view to the viewport height, leaving a big dead gap
between the content and the bottom tab bar. This detects that gap and
removes it, splicing the tab bar directly under the content.
"""
import os
import sys

from PIL import Image

BG = (11, 15, 20)  # #0B0F14 page background
TABBAR_BG = (21, 27, 35)  # #151B23 surface color used by the tab bar
TOLERANCE = 6

DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "store", "screenshots")


def close(c1, c2, tol=TOLERANCE):
    return all(abs(a - b) <= tol for a, b in zip(c1, c2))


def row_is_background(img, y, w):
    # Sample several x positions across the row; a *true* empty row (not
    # just page padding/card margins) must be background at all of them.
    xs = [int(w * f) for f in (0.15, 0.35, 0.5, 0.65, 0.85)]
    return all(close(img.getpixel((x, y))[:3], BG) for x in xs)


def row_color_at(img, y, x):
    return img.getpixel((x, y))[:3]


def find_tabbar_top(img, w, h, search_last_px=220):
    # Only look near the very bottom of the frame: the tab bar (when
    # present) is always pinned there. Searching further up risks matching
    # unrelated same-colored surfaces (e.g. a button uses the same bg).
    x = int(w * 0.5)
    for y in range(h - 1, max(0, h - search_last_px), -1):
        if close(row_color_at(img, y, x), TABBAR_BG):
            top = y
            while top > 0 and close(row_color_at(img, top - 1, x), TABBAR_BG):
                top -= 1
            return top
    return h


def find_content_bottom(img, w, h, header_skip=260, run_len=150):
    run_start = None
    for y in range(header_skip, h):
        if row_is_background(img, y, w):
            if run_start is None:
                run_start = y
            if y - run_start >= run_len:
                return run_start
        else:
            run_start = None
    return h


def process(path):
    img = Image.open(path).convert("RGB")
    w, h = img.size

    tabbar_top = find_tabbar_top(img, w, h)
    content_bottom = find_content_bottom(img, w, h)

    if tabbar_top >= h:
        # No tab bar on this screen (e.g. the details stack screen):
        # just trim the trailing empty space, with a small bottom margin.
        margin = 48
        new_h = min(h, content_bottom + margin)
        if new_h >= h - 20:
            print(f"{os.path.basename(path)}: no significant gap, skipping")
            return
        img.crop((0, 0, w, new_h)).save(path)
        print(f"{os.path.basename(path)}: {h} -> {new_h} (trimmed trailing gap)")
        return

    if content_bottom >= tabbar_top - 40:
        print(f"{os.path.basename(path)}: no significant gap, skipping")
        return

    gap = 28
    top_part = img.crop((0, 0, w, content_bottom))
    bottom_part = img.crop((0, tabbar_top, w, h))

    new_h = content_bottom + gap + (h - tabbar_top)
    new_img = Image.new("RGB", (w, new_h), BG)
    new_img.paste(top_part, (0, 0))
    new_img.paste(bottom_part, (0, content_bottom + gap))

    new_img.save(path)
    print(f"{os.path.basename(path)}: {h} -> {new_h} (removed {h - new_h}px gap)")


TARGET_SIZE = (1080, 1920)  # strict 9:16, required by the Play Console uploader


def pad_to_target(path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    tw, th = TARGET_SIZE
    if w != tw:
        return  # unexpected width, leave alone
    if h >= th:
        img.crop((0, 0, tw, th)).save(path)
    else:
        canvas = Image.new("RGB", (tw, th), BG)
        canvas.paste(img, (0, 0))
        canvas.save(path)
    print(f"{os.path.basename(path)}: padded/cropped to {tw}x{th}")


def main():
    for name in sorted(os.listdir(DIR)):
        if name.endswith(".png"):
            process(os.path.join(DIR, name))
    for name in sorted(os.listdir(DIR)):
        if name.endswith(".png"):
            pad_to_target(os.path.join(DIR, name))


if __name__ == "__main__":
    main()
