# Cloud brief: film 3 — 《年兽来吃年夜饭》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Red Paper-cut (`styles/papercut-red`).
- **Language:** Simplified Chinese for all on-screen text, cut-paper characters and the `.srt`.
- **Topic:** New Year's Eve in a snowy northern village. Everyone pastes red paper-cuts on the windows and
  sets off firecrackers to scare away the Nian beast. This year the Nian is not hungry for people: it is lonely, and the
  smell of dumplings draws it down the mountain. A little girl whose parents work in the city, and may not make it home
  this year, is the only one who is not afraid: she leaves a bowl of dumplings outside the gate. The Nian and the girl
  become friends (comedy: it sneezes at every red paper-cut, panics at firecrackers, and tries to fold a dumpling with
  its huge paws). When her parents' bus is stuck in a snowdrift on the mountain road, the Nian carries the bus to the
  village gate just before midnight. At midnight the family eats together with the Nian squeezed in at the table, and
  the girl pastes on the window the paper-cut of the Nian she has been cutting all film long. Warm and funny, with a
  clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: wides of the village in the snow, close-ups of the girl and the Nian, inserts (scissors
  cutting, the dumplings, the clock, the paper-cut taking shape), the bus on the mountain road, and the paper-world
  tricks the style allows (folds, unfolding rosettes, backlight saved for the midnight moment).
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. A festive folk score (suona, erhu, dizi, gongs, drums and cymbals, as the style
  suggests) with real changes of mood and tempo: quiet and lonely, playful, a big action cue for the rescue, and a
  joyful finale. Foley for every visible action (scissors and paper, snow crunch, dumplings, firecrackers, the bus).
  Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-3-papercut`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/nian-dinner/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/nian-dinner/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/nian-dinner/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
