# 《深夜翻译官》 The Night Translator

A 74-second 1920s-style silent film (1920×1080, 24 fps, Simplified Chinese intertitles). In a vast film archive at night, the little tin robot 小译 (Xiao Yi) races the dawn to translate a mountain of English-captioned reels into Chinese, while the tall iron proofreader 老校 (Lao Jiao) checks every page and throws the mistakes back, including "Break a leg!" rendered as 「摔断一条腿！」. One reel jams and smoulders, and as it does, the film you are watching starts to burn in from its own edges. Xiao Yi dashes down the aisle and trips, and the can sails through the air in silence until Lao Jiao catches it in the fire bucket. It is reel No. 1000, the last one. At first light it is stamped with the red seal 「译毕」 and filed, the archive's lamps come on row by row, and a final card tells the audience that the reel they just watched was the last one.

Everything was made in code with the Lemo-Opuscar silent-film engine: tonal paintings → ink/hatch Redraw pass (WebGL2) → silver-sepia print with grain, flicker, weave and scratches → the 4:3 gate between theatre curtains. The proofreader's red ink is the only colour. The sound is an original photoplay score for an upright piano (VSCO 2 CE, CC0), plus a period effects drummer's trap box that gives every visible action a sound: sampled VCSL wood block, triangle, bells and cymbals (CC0), and synthesised slide whistle, ratchet, slapstick, sand block and hiss. The projector in the booth is the ambience. Fonts: Noto Serif SC, Playfair Display SC and Old Standard TT (OFL). There is no voice, footage or stock material.

The checks run, with their results:

- **Cue check:** 48 picture hits against the score and trap box, worst offset 0 ms.
- **Reading time:** `readcheck` passes for all 15 on-screen texts.
- **Loudness:** −14.0 LUFS integrated, peak −1.1 dBFS (ebur128).
- **Silences:** both sit about 11 dB below the film's average level (projector only), and the hiss after the catch comes in about 17 dB above them.
- **Black frames (`blackdetect`):** only the two planned iris transitions are found, 1.08 s after the title card and 0.25 s between the tender scene and dawn, with the lit theatre curtains still visible around them.
- **CJK glyphs:** checked on contact sheets of the final file; no missing-glyph boxes.
- **No library sign-off:** a grep finds no LemoLab sign-off in the project, and the last seconds of the film were reviewed.
- **File:** H.264 with AAC audio, 55.8 MB.

Source, treatment, credits and a one-command `build.sh` are in `films/night-translator/`.
