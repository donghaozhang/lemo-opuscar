# 《我的怪兽朋友》 My Monster Friend

A crayon picture-book film, 140 s, 1920×1080, 24 fps, Simplified Chinese printed words and title, no voice. Dou Dou has just moved to a new city and
cannot say a word at his new kindergarten. At night he draws a big soft purple monster in his crayon book; he paints the night behind it, its white-wax
eyes shine through the ultramarine, and it climbs off the page. Its size follows his courage: a gasp shrinks it to a mouse, a giggle pops it back. Next
morning it rides to kindergarten in his backpack, eats the crayons, sneezes every colour across the page and hides in the sandpit. At play time Ni Ni sits
alone under the tree, her red balloon caught in the branches; the monster nudges him toward her, he freezes and it shrinks to a bean on his shoulder. He
takes a breath, holds out the purple crayon and says 「你好」; the monster grows until it fills the page, lifts him to free the balloon, burps up the yellow
crayon it ate, and Ni Ni draws a yellow monster of her own that comes alive. Two monsters play, two children laugh. That night the purple monster climbs
back into the book; the last page shows the four of them, 「我的朋友」, and the purple crayon is set down.

**How it was made.** Everything is drawn by code with the Lemo-Opuscar library's Crayon Picture Book style: a Canvas2D crayon engine (pressure, paper
tooth, hand wobble, lines that boil on twos, zig-zag colouring that overshoots the outline, white crayon as wax resist) composited by a WebGL shader on
procedural paper, with one watercolour (ultramarine) for the night pages and the lamp's cone of light knocked out of it; seven pages that draw and colour
themselves on a schedule, joined by page turns rendered as a bending sheet of 64 strips; character rigs for Dou Dou, Ni Ni and the monster with a real eye
system (white, indigo pupil, lids, brow, catchlight) and 26 expressions checked on a model sheet and an expression sheet; the monster at five sizes with
squash and stretch; the title and the words lettered from the OFL font ZCOOL KuaiLe; an original score in the style's palette (sampled ukulele, nylon
guitar, clarinet, recorder, glockenspiel, a toy piano, a physically modelled music box, woodblock, shaker, triangle, sleigh bells) cued to the timeline
with the theme hinted on the music box and heard in full at the balloon; synthesised Foley for every drawn line, colouring, brush pass, page turn, zip,
crunch, sneeze, balloon and breath; and a mix mastered to −14 LUFS. Thirty-six shots. Source, treatment, credits and a one-command `build.sh` are in
`films/monster-friend/` on this branch; the model sheet, the expression sheet, the style frames and the review contact sheets are in `films/monster-friend/stills/`.

**Files.** `final.mp4` (1080p, 91 MB), `final-720p.mp4` (26 MB, for phones), `poster.jpg`, `subtitles.srt` (the thirteen printed words), this README.

**Checks run on the final film and their results.**

| Check | Result |
|---|---|
| Loudness (ffmpeg ebur128 on the mastered file; both deliverables carry the same audio track) | −14.0 LUFS integrated, LRA 8.3 LU, true peak −3.7 dBTP (identical on final.mp4 and final-720p.mp4, which copy the master's audio track) |
| Black frames (ffmpeg blackdetect, d ≥ 0.04 s) | none |
| Reading time (`readcheck.mjs`, CJK ÷ 4.5 + 1.5 s, on the lettered texts; the printed words are held per the same rule in the timeline) | all 3 lettered texts pass (title 「我的怪兽朋友」 needs 2.83 s, held 3.0 s before the push-in crops it; 「你好」 needs 1.94 s, held 2.0 s; 「我的朋友」 needs 2.39 s, held 5.25 s); the thirteen printed words are held ≥ characters ÷ 4.5 + 1.5 s by the timeline (shortest margin 「豆豆搬到了新城市。」: needs 3.28 s, held 3.4 s) |
| Cue check (`tools/cuecheck.py`: score onset vs timeline hit) | 68 cues checked, all within 75 ms; 42 within 40 ms (the rest are sampled attacks or beats measured under the ukulele band; the three literal silences and the dead stop at the bell are gated to zero) |
| CJK glyphs (`tools/glyphcheck.mjs`: every character of the film against the loaded faces, plus a rendered sheet scanned for boxes) | 79 characters, 79 covered by ZCOOL KuaiLe (and by Ma Shan Zheng); no missing-glyph boxes on the rendered sheet |
| Review passes | three full renders, each reviewed on 1 fps contact sheets (`stills/r1_sheet*.jpg`, `r2_sheet*.jpg`, `r3_sheet*.jpg`) plus 0.2 s strips of the five action beats (`stills/strip_*.jpg`); pass 1 fixed the crayon-box insert framing, the hands over the mouth, the 「你好」 bubble and the balloon in the close two-shot; pass 2 tightened the insert framing and the hands once more; the final render was checked against both |
| Literal silences | 48.6–50.0 s (after the first shrink), 95.0–96.0 s (before the breath) and 139–140 s, bus at zero |
| Sign-off grep | no library credit or watermark in the project or the deliverables (`grep -rniE "lemo ?lab|opus 5\.5"` finds nothing outside the library's own files) |

Third-party material: fonts under the SIL Open Font License (ZCOOL KuaiLe; Ma Shan Zheng loaded as fallback only), CC0 sample libraries (FreePats,
VSCO 2 CE, VCSL), music box by physical modelling, Foley synthesised; full list in `films/monster-friend/CREDITS`. The owner is responsible for the
materials used in the film.
