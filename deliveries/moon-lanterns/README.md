# 《中秋的灯》 The Mid-Autumn Lantern

**The film.** On Mid-Autumn night in a fishing village on a rocky coast, a girl, A-Yue, cuts a red paper rabbit lantern for her
father, a fisherman due home for the festival; three mooncakes wait in a box, and an old lighthouse stands dark on the headland.
Fog rolls in and swallows the moon; the radio says the boats cannot find the harbour mouth. Her mother runs to the pier;
A-Yue carries her tiny lantern up the cliff and sets it in the dead lamp-room's window, where it is far too small, and she sits
and cries. Then a click below: the villagers have followed her with their festival lanterns, and they line the cliff path and the
gallery until a chain of light burns through the fog. Her father sees the line and steers home; the moon returns; the family shares
the three mooncakes under it. The last shot pulls out of the lamp to a table in a dark room, with a faded old rabbit lantern beside it.
Paper-cut Lightbox style (纸雕灯影), 141.5 s, 1920×1080, 24 fps, Simplified Chinese on screen, no voice-over.

**How it was made.** Everything is drawn in code (`films/moon-lanterns/` on the branch): a Canvas2D compositor stacks cut-paper sheets in a
shallow box with a warm backlight (pulp mottle, per-layer translucency), soft cast shadows from each sheet onto the next, per-layer
depth of field and bloom; the figures are jointed silhouettes with cut faces (eyes with paper pupils, lids, brows, mouth) whose
expressions are swapped on a blink. One timeline (`src/timeline.mjs`) drives the shots, the subtitles, the score and the Foley.
The score is original, played on sampled instruments (Salamander piano as a felt piano, VSCO 2 CE / VCSL strings, harp, hand chimes,
a small gong) and modelled or synthesized ones (music box, pipa, guqin, a bamboo flute); the Foley and beds are procedural.
Fonts: Ma Shan Zheng and Noto Serif SC (OFL). Credits and licences: `films/moon-lanterns/CREDITS`.

**Checks run.** (filled in at delivery)
