# 《墨龙借雨》 The Ink Dragon Borrows the Rain

A Chinese ink-wash film, 132 s, 1920×1080, 24 fps, Simplified Chinese inscriptions, no voice. In a painter's studio at night a drop of ink spills
from the inkstone and becomes a small dragon; the village in the painting on the desk is dying of drought, and the dragon must bring rain before the
incense burns out. It travels through the painted landscape, fails to wake a stubborn sleeping cloud, and gives itself up to become the rain. At
dawn the painter finds the painting rain-soaked, writes the title beside the colophon, presses the seal, and one small dragon is curled back in
the inkstone.

Made entirely in code with the Lemo-Opuscar library (Chinese Ink Wash style): a Canvas2D brush engine (loaded strokes, flying white, masses, blots) and a
WebGL rice-paper compositor (bleed, edge pooling, paper); a parametric dragon rig with expressions, a cloud with a face, a studio and a 3000×2000
painting world drawn with the same code; the title 墨龙借雨 traced stroke by stroke from the skeleton of an OFL brush font; an original guqin-led score
(physically modelled guqin, sampled xiao substitute, drums), procedural Foley for every visible action, and a mix mastered to −14 LUFS.

Files: `ink-dragon.mp4`, `ink-dragon.srt`, `poster.jpg`, `TREATMENT.md`, `CREDITS`, the source and `build.sh`. Deliveries for the owner are in
`deliveries/ink-dragon/` (`final.mp4`, `final-720p.mp4`, `poster.jpg`, `subtitles.srt`, `README.md` with the checks and their results).

Build from the library root: `sh films/ink-dragon/build.sh` (needs the core and music tiers, the `vsco2ce` and `vcsl` sample libraries, ffmpeg 7+).
