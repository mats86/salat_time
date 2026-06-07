"""Generate PWA icon PNGs for Salat Zeit."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess
    import sys

    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw

BG = "#061f1a"
GOLD = "#c9a84c"
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"


def draw_icon(size: int) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    draw = ImageDraw.Draw(img)
    margin = size // 8
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        outline=GOLD,
        width=max(2, size // 64),
    )
    star_size = size // 5
    cx, cy = size // 2, size // 2
    points = []
    for i in range(8):
        angle = i * 3.14159265 / 4 - 3.14159265 / 2
        r = star_size if i % 2 == 0 else star_size // 2
        points.append((cx + r * __import__("math").cos(angle), cy + r * __import__("math").sin(angle)))
    draw.polygon(points, fill=GOLD)
    return img


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    draw_icon(192).save(OUT / "icon-192.png")
    draw_icon(512).save(OUT / "icon-512.png")
    print(f"Created icons in {OUT}")


if __name__ == "__main__":
    main()
