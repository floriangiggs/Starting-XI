#!/usr/bin/env python3
# Erzeugt maskable-Varianten der App-Icons (Prompt 7): das bestehende Motiv
# wird verkleinert und auf einem Canvas in der App-Hintergrundfarbe zentriert,
# damit es innerhalb der von Android/adaptive-icons erwarteten Safe Zone
# (Google empfiehlt: Inhalt im zentralen ~66%-Kreis) liegt und bei einer
# Kreis-/Squircle-Maske nicht angeschnitten wird.
# Aufruf: python3 tools/make-maskable-icons.py
from PIL import Image
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ICONS = os.path.join(HERE, "..", "icons")
BG_COLOR = (0x14, 0x20, 0x2B)  # background_color aus manifest.json
SAFE_SCALE = 0.70  # Motiv auf 70% verkleinern -> reichlich Puffer zur Safe Zone

for size, src_name in [(192, "icon-192.png"), (512, "icon-512.png")]:
    src = Image.open(os.path.join(ICONS, src_name)).convert("RGB")
    src = src.resize((size, size), Image.LANCZOS)

    inner = round(size * SAFE_SCALE)
    inner_img = src.resize((inner, inner), Image.LANCZOS)

    canvas = Image.new("RGB", (size, size), BG_COLOR)
    offset = ((size - inner) // 2, (size - inner) // 2)
    canvas.paste(inner_img, offset)

    out_name = src_name.replace(".png", "-maskable.png")
    canvas.save(os.path.join(ICONS, out_name))
    print(f"geschrieben: icons/{out_name} ({size}x{size}, Motiv {inner}x{inner})")
