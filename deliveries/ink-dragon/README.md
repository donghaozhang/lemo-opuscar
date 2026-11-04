# 《墨龙借雨》 The Ink Dragon Borrows the Rain

A Chinese ink-wash film, 132 s, 1920×1080, 24 fps, Simplified Chinese inscriptions, no voice. In a painter's studio at night a drop of ink spills from
the inkstone and becomes a small dragon; the village in the painting on the desk is dying of drought, and the dragon must bring rain before the incense
burns out. It travels through the painted landscape (the mist, the dry river with its beached boat, the pine cliff), fails three ways to wake a stubborn
sleeping cloud, looks back at the child holding up an empty bowl, and gives itself up: it dives into the cloud and its body unravels into threads of
ink that fall as the first rain. The river fills, the boat floats, the bowl fills, the village dances; one vermilion drop falls last, into the inkstone.
At dawn the painter wakes, finds the painting rain-soaked and the colophon run, writes the title 墨龙借雨 beside it and presses the seal; in the inkstone
a small dragon is curled asleep, and the ink dries into paper.

**How it was made.** Everything is drawn by code with the Lemo-Opuscar library's Chinese Ink Wash style: a Canvas2D brush engine (loaded strokes whose
dark edge is the contour, flying white, washes, blots) composited on procedural rice paper by a WebGL shader (bleed, edge pooling, paper, vignette);
a parametric dragon rig (serpentine body with a line of action, squash and stretch, a face with lids, brow, pupil, mouth shapes, whiskers and mane that
follow the motion); a cloud with a face that fills with ink; a studio and a 3000×2000 painting world drawn by the same code and seen both on the desk and
from inside; the title traced stroke by stroke from the skeleton of the OFL brush font Ma Shan Zheng and written by the brush engine; an original
guqin-led score (physically modelled guqin, a sampled xiao substitute, bass drum, gran cassa, timpani, frame drum, woodblock, claves, gongs from CC0
libraries) cued to the timeline; procedural Foley for every visible action; and a mix mastered to −14 LUFS. Forty-one shots. Source, treatment, credits
and a one-command `build.sh` are in `films/ink-dragon/` on this branch; the model sheet, style frames and the review contact sheets are in
`films/ink-dragon/stills/`.

**Files.** `final.mp4` (1080p, 65 MB), `final-720p.mp4` (24 MB, for phones), `poster.jpg`, `subtitles.srt` (the seven inscriptions), this README.

**Checks run on the final film and their results.**

| Check | Result |
|---|---|
| Loudness (ffmpeg ebur128 on the mastered file and on both deliverables, which carry the same mastered audio track) | −14.0 LUFS integrated, LRA 9.9 LU, true peak −3.3 dBTP |
| Black frames (ffmpeg blackdetect, d ≥ 0.04 s) | none |
| Reading time (`readcheck.mjs`, CJK ÷ 4.5 + 1.5 s) | all 7 inscriptions pass; the shortest margin is 香尽之前，须借得雨来 (needs 3.63 s, held 3.92 s) |
| Cue check (`tools/cuecheck.py`: score onset vs timeline hit) | 45 cues checked, all within 75 ms; 41 within 40 ms; the three beyond 40 ms are guqin slides with a soft attack by design (snoreJ 68 ms, mumble 47 ms, plip 47 ms) |
| CJK glyphs (`tools/glyphcheck.mjs`: every character of the film against the loaded font faces, plus a rendered sheet scanned for boxes) | 31 characters, 31 covered by Ma Shan Zheng (and by Noto Serif SC); no missing-glyph boxes |
| Review passes | three full renders, each reviewed on 1 fps contact sheets (`stills/r1_sheet*.jpg`, `r2_sheet*.jpg`, `r3_sheet*.jpg`); the producer's notes after render 1 (dragon redesign, coverage, scale, eyes, the sacrifice beat, night and dawn) were folded in before render 2; the fix round after pass 2 changed the pupil size and the painter's back |
| Literal silences | 75.0–81.2 s (one drip at 78.0, then a single guqin note at 81.3 before the drum) and 130–132 s, bus at zero |
| Sign-off grep | no library credit or watermark in the project (`grep -rniE "lemo ?lab|opus 5\.5"` finds nothing outside the library's own files) |

Third-party material: fonts under the SIL Open Font License (Ma Shan Zheng; Noto Serif SC on test pages only), CC0 sample libraries (VSCO 2 CE, VCSL),
guqin by physical modelling, Foley synthesised; full list in `films/ink-dragon/CREDITS`. The owner is responsible for the materials used in the film.
