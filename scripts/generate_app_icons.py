from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ICONS = ROOT / "public" / "icons"
CAPACITOR_ICONS = ROOT / "src-capacitor" / "www" / "icons"
PUBLIC_FAVICON = ROOT / "public" / "favicon.ico"
CAPACITOR_FAVICON = ROOT / "src-capacitor" / "www" / "favicon.ico"
ANDROID_RES = ROOT / "src-capacitor" / "android" / "app" / "src" / "main" / "res"

FONT_PATH = Path("/usr/share/fonts/truetype/msttcorefonts/Georgia.ttf")
CANVAS = 1024
BOX_MARGIN = 64
BOX_SIZE = CANVAS - (BOX_MARGIN * 2)
BOX_RADIUS = 256
DOT_RADIUS = 96
DOT_CX = BOX_MARGIN + BOX_SIZE
DOT_CY = BOX_MARGIN + 160
TEXT_SIZE = 730

LIGHT = {
    "name": "light",
    "bg": "#4A6B4D",
    "fg": "#F4F1E4",
    "dot": "#C7E07A",
}

DARK = {
    "name": "dark",
    "bg": "#E9F0D8",
    "fg": "#131A15",
    "dot": "#4F8A6A",
}

PNG_SIZES = [128, 192, 256, 384, 512]
FAVICON_SIZES = [16, 32, 96, 128]
APPLE_TOUCH_SIZE = 180
ANDROID_LAUNCHER_SIZES = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192,
}
ANDROID_ADAPTIVE_SIZES = {
    "mdpi": 108,
    "hdpi": 162,
    "xhdpi": 216,
    "xxhdpi": 324,
    "xxxhdpi": 432,
}


def ensure_dirs() -> None:
    PUBLIC_ICONS.mkdir(parents=True, exist_ok=True)
    CAPACITOR_ICONS.mkdir(parents=True, exist_ok=True)
    for density in set(ANDROID_LAUNCHER_SIZES) | set(ANDROID_ADAPTIVE_SIZES):
        (ANDROID_RES / f"mipmap-{density}").mkdir(parents=True, exist_ok=True)


def build_svg(theme: dict[str, str]) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}">
  <rect x="{BOX_MARGIN}" y="{BOX_MARGIN}" width="{BOX_SIZE}" height="{BOX_SIZE}" rx="{BOX_RADIUS}" fill="{theme['bg']}"/>
  <text x="{CANVAS / 2}" y="640" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="{TEXT_SIZE}" fill="{theme['fg']}">V</text>
  <circle cx="{DOT_CX}" cy="{DOT_CY}" r="{DOT_RADIUS}" fill="{theme['dot']}"/>
</svg>
"""


def write_svg(theme: dict[str, str]) -> Path:
    path = PUBLIC_ICONS / f"icon-{theme['name']}.svg"
    path.write_text(build_svg(theme), encoding="utf-8")
    return path


def render_master(theme: dict[str, str]) -> Image.Image:
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (BOX_MARGIN, BOX_MARGIN, BOX_MARGIN + BOX_SIZE, BOX_MARGIN + BOX_SIZE),
        radius=BOX_RADIUS,
        fill=theme["bg"],
    )
    font = ImageFont.truetype(str(FONT_PATH), TEXT_SIZE)
    bbox = draw.textbbox((0, 0), "V", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (CANVAS - text_w) / 2 - bbox[0]
    y = (CANVAS - text_h) / 2 - bbox[1] - 28
    draw.text((x, y), "V", font=font, fill=theme["fg"])
    draw.ellipse(
        (DOT_CX - DOT_RADIUS, DOT_CY - DOT_RADIUS, DOT_CX + DOT_RADIUS, DOT_CY + DOT_RADIUS),
        fill=theme["dot"],
    )
    return image


def render_foreground(theme: dict[str, str]) -> Image.Image:
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(str(FONT_PATH), TEXT_SIZE)
    bbox = draw.textbbox((0, 0), "V", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (CANVAS - text_w) / 2 - bbox[0]
    y = (CANVAS - text_h) / 2 - bbox[1] - 28
    draw.text((x, y), "V", font=font, fill=theme["fg"])
    draw.ellipse(
        (DOT_CX - DOT_RADIUS, DOT_CY - DOT_RADIUS, DOT_CX + DOT_RADIUS, DOT_CY + DOT_RADIUS),
        fill=theme["dot"],
    )
    return image


def save_pngs(master: Image.Image) -> None:
    for size in PNG_SIZES:
        target = PUBLIC_ICONS / f"icon-{size}x{size}.png"
        master.resize((size, size), Image.Resampling.LANCZOS).save(target)


def save_favicons(master: Image.Image) -> None:
    for size in FAVICON_SIZES:
        target = PUBLIC_ICONS / f"favicon-{size}x{size}.ico"
        icon = master.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(target, format="ICO", sizes=[(size, size)])

    root_icon = master.resize((128, 128), Image.Resampling.LANCZOS)
    root_icon.save(PUBLIC_FAVICON, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])


def save_apple_touch_icon(master: Image.Image) -> None:
    target = PUBLIC_ICONS / "apple-touch-icon.png"
    master.resize((APPLE_TOUCH_SIZE, APPLE_TOUCH_SIZE), Image.Resampling.LANCZOS).save(target)


def save_android_icons(master: Image.Image, foreground: Image.Image) -> None:
    for density, size in ANDROID_LAUNCHER_SIZES.items():
        icon = master.resize((size, size), Image.Resampling.LANCZOS)
        target_dir = ANDROID_RES / f"mipmap-{density}"
        icon.save(target_dir / "ic_launcher.png")
        icon.save(target_dir / "ic_launcher_round.png")

    for density, size in ANDROID_ADAPTIVE_SIZES.items():
        fg = foreground.resize((size, size), Image.Resampling.LANCZOS)
        target_dir = ANDROID_RES / f"mipmap-{density}"
        fg.save(target_dir / "ic_launcher_foreground.png")


def sync_capacitor() -> None:
    for source in PUBLIC_ICONS.iterdir():
        if source.is_file():
            shutil.copy2(source, CAPACITOR_ICONS / source.name)
    shutil.copy2(PUBLIC_FAVICON, CAPACITOR_FAVICON)


def main() -> None:
    ensure_dirs()
    write_svg(LIGHT)
    write_svg(DARK)
    master = render_master(LIGHT)
    foreground = render_foreground(LIGHT)
    save_pngs(master)
    save_favicons(master)
    save_apple_touch_icon(master)
    save_android_icons(master, foreground)
    sync_capacitor()
    print("Generated app icon assets.")


if __name__ == "__main__":
    main()
