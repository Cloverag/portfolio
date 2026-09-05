#!/usr/bin/env python3
"""
Draws assets/og.png — the 1200x630 card link previews show on LinkedIn, X, Slack.

Build-time only: the site itself has no dependencies. This needs Pillow and a
JetBrains Mono TTF, and is re-run by hand when the card text should change.

    python3 scripts/make_og.py

The contribution strip along the bottom is drawn from the real counts in
data/github.js, so the card cannot drift from what the page claims.
"""

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630

BG      = (10, 10, 10)
FG      = (230, 226, 217)
DIM     = (154, 148, 138)
FAINT   = (111, 106, 97)
ACCENT  = (255, 180, 84)
GREEN   = (143, 206, 122)

FONTS = Path('/usr/share/fonts/TTF')
def font(weight, size):
    return ImageFont.truetype(str(FONTS / f'JetBrainsMonoNerdFontMono-{weight}.ttf'), size)


def contribution_counts():
    """Pull the daily counts straight out of the generated snapshot."""
    src = (ROOT / 'data' / 'github.js').read_text()
    counts = json.loads(re.search(r'"counts":\s*(\[[^\]]*\])', src).group(1))
    total = json.loads(re.search(r'"total":\s*(\d+)', src).group(1))
    return counts, total


def blend(fg, bg, alpha):
    return tuple(round(f * alpha + b * (1 - alpha)) for f, b in zip(fg, bg))


def main():
    counts, total = contribution_counts()

    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)

    # A hairline frame, the way a terminal window reads.
    d.rectangle([0, 0, W - 1, H - 1], outline=(36, 36, 36))
    d.rectangle([0, 0, W - 1, 3], fill=ACCENT)

    x = 76
    f_prompt = font('Regular', 25)

    # prompt line, coloured in parts
    y = 78
    for text, colour in [('raghav@iiitn', GREEN), (':~', DIM), ('$', FAINT), ('  whoami', FG)]:
        d.text((x, y), text, font=f_prompt, fill=colour)
        x += d.textlength(text, font=f_prompt)

    # name + block cursor
    f_name = font('Bold', 92)
    y = 128
    d.text((76, y), 'Raghav Singh', font=f_name, fill=FG)
    name_w = d.textlength('Raghav Singh', font=f_name)
    d.rectangle([76 + name_w + 8, y + 14, 76 + name_w + 8 + 34, y + 96], fill=ACCENT)

    d.text((76, 246), 'Data Science & Analytics  ·  IIIT Nagpur  ·  class of 2027',
           font=font('Regular', 26), fill=DIM)

    # thesis, with the same accent rule the page uses
    f_thesis = font('Medium', 31)
    lines = ['I build systems that remember, measure,', 'and hold up when someone checks the numbers.']
    d.rectangle([76, 312, 79, 312 + len(lines) * 46 - 8], fill=ACCENT)
    for i, line in enumerate(lines):
        d.text((100, 312 + i * 46), line, font=f_thesis, fill=FG)

    # measured numbers — each one appears on the page too
    f_k = font('Bold', 30)
    f_l = font('Regular', 19)
    x = 76
    for value, label in [(f'{total:,}', 'contributions'), ('15', 'projects'),
                         ('0.906', 'AUC, LUAD'), ('0.931', 'kaggle LB')]:
        d.text((x, 428), value, font=f_k, fill=ACCENT)
        d.text((x, 464), label, font=f_l, fill=FAINT)
        x += max(d.textlength(value, font=f_k), d.textlength(label, font=f_l)) + 56

    # contribution strip, real data, quartile buckets like the site uses
    nz = sorted(n for n in counts if n > 0)
    q = lambda f: nz[int(len(nz) * f)] if nz else 1
    t1, t2, t3 = q(0.25), q(0.5), q(0.75)

    cell, gap = 10, 2
    cols = (len(counts) + 6) // 7
    ox = 76
    oy = 522
    for i, n in enumerate(counts):
        col, row = divmod(i, 7)
        if n <= 0:
            colour = (28, 28, 28)
        else:
            alpha = 0.24 if n <= t1 else 0.46 if n <= t2 else 0.72 if n <= t3 else 1.0
            colour = blend(ACCENT, BG, alpha)
        px = ox + col * (cell + gap)
        py = oy + row * (cell + gap)
        d.rectangle([px, py, px + cell - 1, py + cell - 1], fill=colour)

    d.text((ox + cols * (cell + gap) + 26, oy + 30),
           'last 365 days', font=font('Regular', 19), fill=FAINT)

    out = ROOT / 'assets' / 'og.png'
    img.save(out, optimize=True)
    print(f'wrote {out}  ({out.stat().st_size // 1024} KB)')


if __name__ == '__main__':
    main()
