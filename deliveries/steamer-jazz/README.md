# 《蒸笼爵士》

It is 4 a.m. on a winter morning in a Shanghai lane, and old Baker Wang falls asleep over his dough. His alarm clock was never wound and the card on the door says 「六点开门」. The moment he snores, his kitchen wakes up and swings into hot jazz: the rolling pin, the cleaver, the copper kettle, the stove flame and a concertina stack of bamboo steamers make the morning's buns as a dance number, while a hungry newsboy watches through the frosted window. A rat steals the best bun and the chase topples the steamers, spilling every bun into the snowy lane. The newsboy catches them all. He holds the last warm one in a held close-up while the band drops to a lone clarinet, then knocks and hands every bun back. The kettle slips him the best bun and the tools wind the clock. At 6:00 it rings, Wang wakes to perfect buns and an honest boy and gives him a second bun, and the boy's headline 「王记包子 开门啦！」 brings a queue. The rat ends up in an apron, kneading the dough into 「完」 as the iris closes.

**How it was made.** The film is 143.7 s in the 1930s Rubber Hose Cartoon style, at 1920×1080 in a 4:3 gate, 24 fps, with no voice. It was made entirely in code:
- **Characters:** rubber-hose rigs with pie eyes, gloves and line boil, drawn on twos on a 72/120/144 BPM grid.
- **Backgrounds and light:** watercolour backgrounds painted once. A whole-frame light grade turns night into dawn when the clock is wound, with snow, period title cards, the iris and a film-damage pass on top.
- **Music:** an original 1930s hot dance band score built from CC0 samples (VSCO 2 CE and VCSL via the library sampler) plus a modelled banjo: stride piano, clarinet, muted trumpet, trombone, tuba, brushes, xylophone, woodblocks and slide whistle. It changes mood and tempo by act, and it stops dead four times (kettle, chase tail, knock, ring).
- **Sound:** synthesised Foley by material (wood, metal, porcelain, dough, steam, snow, paper) and an optical-soundtrack pass.
- **Fonts:** the Chinese text uses two OFL fonts, ZCOOL QingKe HuangYou and ZCOOL XiaoWei.

**Checks run on the final file:**
- **Loudness:** −14.1 LUFS integrated; true peak −6.5 dBTP (target ≤ −1).
- **Cue check:** all 26 visual hits land on their music beat, score accent or sound event with 0 ms offset.
- **Readcheck:** 5/5 on-screen texts are held long enough to read.
- **Blackdetect:** only the deliberate iris-in at 0:00 (0.42 s) and iris-out at the end (0.21 s).
- **CJK glyph check:** both fonts cover all 34 characters in the source, and no glyphs are missing from the on-screen strings.
- **Review:** two full review passes with 1 fps contact sheets. These, plus the model sheet, the expression sheets and the style frames, are in `films/steamer-jazz/stills/`.
- **No LemoLab sign-off** anywhere in the film.

Files: `final.mp4` (1080p, 92.5 MB), `final-720p.mp4` (15.5 MB), `poster.jpg`, `subtitles.srt`. Source and one-command rebuild: `films/steamer-jazz/` (`build.sh`, `TREATMENT.md`, `CREDITS`).
