# Cloud brief: film 7 — 《机甲外婆》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** 80s Cel Anime (`styles/cel-anime-80s`).
- **Language:** Simplified Chinese for all on-screen text, signs, phone screens, title cards and the `.srt`.
- **Topic:** a neon megacity on a typhoon night. Grandma, who drove construction mechs in her youth (planted
  with an old photo), hears on the phone that her grandson, a programmer, has been working for three days straight on
  the 88th floor of a tower and has not eaten. She wraps a steaming lunchbox of dumplings, pulls the cover off an old
  yellow construction mech in the garage, and drives it across the city: through the traffic, past a collapsing
  billboard, dodging a security drone that takes her for a threat, then climbing the tower in the wind. On the 88th
  floor the grandson looks up from his screen to see a giant robot hand at the window holding out the lunchbox. They
  eat together on the mech's palm above the city as the storm clears and the sun rises. Big 80s-anime action and
  comedy, and a warm ending, with a clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: an anime opening, establishing wides of the neon city in the rain, cockpit close-ups of
  grandma (readable eyes and big expressions), the grandson at his desk, speed lines, held impact frames, low angles on
  the mech, the climb, and a big sunrise pull-back.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over and no vocals. A city-pop and synth score with an anime action cue, real changes
  of mood and tempo, and a warm finale. Foley for mech servos and footsteps, rain, wind, sirens, the drone, the
  lunchbox, and the city. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-1`, where this session already works. Never push to `main` and never open a pull request.
- The project folder is `films/mecha-grandma/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/mecha-grandma/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/mecha-grandma/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
