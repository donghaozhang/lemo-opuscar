# Cloud brief v2: 《深夜翻译官》, a substantially better film

The owner watched v1 and liked it. Now make a **substantially better v2**: there is plenty of budget, so aim high and
take the time to do it properly. Same rules as `CLOUD-BRIEF.md`: nobody is watching, so never ask questions and never
wait for approval. Decide, write the decision into the v2 `TREATMENT.md`, and keep going.

Work in `films/night-translator-v2/` (start from a copy of v1). Leave v1 and `deliveries/night-translator/`
untouched.

## What "better" means here

1. **Story, 100–150 seconds.** Keep the core arc and deepen it, with clear set-ups and pay-offs and real comic timing:
   - a cold open that hooks before the title;
   - the night shift: at least three reels from different genres (for example a western, a romance and a monster
     picture), each with its own literal-translation gag that 老校's red ink corrects;
   - the jam and fire as a proper set piece: danger, a chase or race, a rescue;
   - a quiet, tender beat where the two robots work as a team;
   - the dawn finale: the archive lights up, the red seal 「译毕」, a closing card that lands.
2. **Direction.** Many more shots and real camera grammar: establishing wides, mediums, close-ups on faces and hands,
   inserts of reels and pages, cut-ins, iris in and out, a tracking move along the shelves, a montage of the night's
   work. Vary shot length and use match cuts.
3. **Character animation.** Real acting: anticipation, squash and stretch, follow-through, eye and brow acting, idle
   breathing. 老校's monocle and red-pen gestures, 小译's wheel and antenna. Physical comedy with clear staging and
   readable silhouettes.
4. **Look.** Richer lighting (lamp pools, moving shadows, dawn through the high windows), depth with foreground and
   background layers and parallax, and period tinting per sequence if it fits `STYLE.md` (decide and record why).
   Keep the red ink meaningful. Give the intertitles proper period design and varied layouts.
5. **Music and sound.** A fuller photoplay score with a theme for each robot and real changes of mood and tempo
   (mysterioso, agitato for the fire, a tender waltz, a triumphant dawn). Add instruments from CC0 libraries if you
   can (strings and winds next to the upright piano), with dynamics. A richer trap-box effects track. Mix to −14 LUFS,
   true peak at or below −1 dBTP.
6. **Text.** Simplified Chinese intertitles: few words, witty, in a period voice.
7. **Quality passes.** After the first full render, do at least two complete review passes: contact sheets at 1 fps,
   every scene checked against the treatment and `STYLE.md`, and fix what is weak before the next render. Then run
   the cue check, readcheck, loudness, blackdetect and the CJK glyph check.

## Delivery

Deliver to `deliveries/night-translator-v2/`:

- `final.mp4`: 1080p, 24 fps, under 95 MB (raise the CRF if needed);
- `final-720p.mp4`: under 28 MB, for phones;
- `poster.jpg` and `subtitles.srt`;
- `README.md`: what changed from v1, and the checks you ran with their results.

Git rules are unchanged: branch `cloud/film-1`, commit and push after every finished step and at least every
10 minutes, never push to `main`, never open a pull request.
