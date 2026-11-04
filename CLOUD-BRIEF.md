# Cloud brief: film 4 — 《外卖勇者》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** 16-bit Pixel RPG (`styles/pixel-rpg`).
- **Language:** Simplified Chinese for all on-screen text (text boxes, menus, battle messages, the quest log)
  and the `.srt`. Use an OFL Chinese pixel font with full coverage of every character you use (for example Fusion
  Pixel Font or Ark Pixel Font, from npm or GitHub releases), drawn on the native pixel grid.
- **Topic:** a delivery rider's last order of the night, told as a mid-90s console RPG. 23:40, rain. The
  quest box types: deliver one bowl of longevity noodles before midnight. The city is an overworld map, the e-bike is
  the mount, the phone battery is HP and the clock is the timer. Random encounters play as turn-based battles with
  menus and damage numbers: a red light that will not change, a flooded underpass, a broken lift (the boss: 28 floors
  of stairs), and a guard dog that turns out to want only a pat. Items: a raincoat, a power bank, and a spare umbrella
  he gives away to a soaked kid on the way (a set-up). The customer is an old lady living alone who ordered noodles for
  her own birthday. The soaked rider stays one minute to sing her happy birthday, and the kid from earlier turns out to
  be her grandson, arriving with the umbrella. Save point; level up: 「温暖 +1」. Funny first, moving at the end, with a
  clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: overworld travel, battle screens, menus and text boxes, but also cinematic RPG cut-scenes
  with close-up portraits in the text boxes (with readable expressions), the rain, the stairwell, the old lady's door,
  and the palette tricks the style allows (fades by steps, palette swaps, colour cycling for the rain and the neon).
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. A chiptune score within the style's sound rules (pulse, triangle, noise and
  sampled-drum channels with echo): an overworld theme, a battle theme, a boss theme, a tender theme for the old lady,
  and a level-up fanfare. Sound effects for every menu blip, hit, step, door and the rain. Mix to −14 LUFS, true peak
  at or below −1 dBTP.
- **Storyboard review:** no. **Owner's own material:** none, draw everything with code.

## Producer notes (lessons from the earlier films: treat them as requirements)

- **Coverage.** Real camera grammar: establishing wides, mediums, close-ups, inserts, reaction shots, two-shots and
  camera moves, with match cuts where the story allows. No framing holds longer than about 4 s unless something in it
  is changing.
- **Scale and faces.** The main characters get a medium shot or a close-up at every story beat; in a close-up the head
  is at least a quarter of the frame height. Eyes must read at a glance (a clear eye shape with a pupil, lids and a
  brow), and the expressions must be clearly different from one another. Check this on a model sheet and an
  expression sheet (commit both to `stills/`) before animating the shots.
- **The emotional climax must land:** slow down, hold a close-up, let the music drop, then pay it off.
- **Light tells the time:** a night scene must look like night (practical light sources, darker grounds), and dawn or
  morning gets its own light.
- **Set-ups and pay-offs:** plant every pay-off early and show it clearly.
- **Readable staging:** one focal point per shot, strong silhouettes, nothing important crossing a face.
- **Chinese text** must render with a real CJK font (OFL fonts, for example from npm `@fontsource/*` or GitHub
  releases). Check rendered frames for missing-glyph boxes.

## Quality passes

After the first full render, do at least two complete review passes: contact sheets at 1 fps (commit them to
`stills/`), every scene checked against the treatment, the producer notes above and `STYLE.md`, and fix what is weak
before the next render. Then run the cue check, readcheck, loudness, blackdetect and the CJK glyph check.

## Environment notes

- Ubuntu VM without a GPU. Chrome for Testing is at `/usr/bin/google-chrome`; use it if Playwright's own browser
  download is blocked. Install ffmpeg with apt, or from a pip or npm package, if it is missing or too old.
- The network reaches package registries and GitHub only.
- First run `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps` (core tier; add the music tier if the score needs it).

## Git: progress must be visible from outside

- Work on the branch `cloud/film-4-pixel`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/delivery-hero/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/delivery-hero/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/delivery-hero/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
