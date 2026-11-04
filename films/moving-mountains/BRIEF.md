# Brief — 《愚公移山》 (The Foolish Old Man Moves the Mountains)

Summed up from `CLOUD-BRIEF.md` (the owner's complete answer to the Brief step). No questions asked; defaults decided here.

- **Style:** Woodcut Print (`styles/woodcut`) — STYLE.md kept whole: black block, light only where the knife cut, plates carve themselves (coarse gouges first, fine after), mirrored block → true print, paper margin fixed, captions letterpress in the bottom margin.
- **Topic:** the Liezi fable 愚公移山, told as a wordless woodcut novel of self-contained plates. Beats required: the long detour to market; the decision; sons, grandsons and the neighbour's 7-year-old boy with a tiny basket (set-up); a year-long round trip to the sea (seasons on the plates); the Wise Old Man's mockery; Yu Gong's answer as the emotional climax (slow, held close-up, music to one low string); the mountain spirit's fright; Heaven sends two giants; the knife clears the mountains; the one colour (sunrise red) first appears on the open road south; the Wise Old Man speechless; the boy runs down the new road with his basket.
- **Format:** 1920×1080, 24 fps, 100–150 s (planned ≈ 145 s).
- **Language:** Simplified Chinese — carved title, letterpress margin captions, `.srt`. Font: Noto Serif SC (OFL), subset to the characters used, through the print shader.
- **Voice:** none (no TTS). Story told by picture, score, Foley and margin captions.
- **Sound:** original score in the style palette (low strings, log drum, woodblock, frame drum, timpani, struck metal, folk drone); Foley for picks/hoes, baskets, earth, sea, wind, knife, giants; silence before the loudest moment; −14 LUFS, TP ≤ −1 dBTP.
- **Storyboard review:** no. **Owner material:** none; everything drawn in code.
- **Machine:** 4 CPU, no GPU. ffmpeg 9 static (from the `imageio-ffmpeg` wheel) on PATH ahead of the system ffmpeg 6.1; core tier installed.
- **Delivery:** `deliveries/moving-mountains/` — final.mp4 (<95 MB), final-720p.mp4 (<28 MB), poster.jpg, subtitles.srt, README.md. Branch `cloud/film-11-woodcut`.
