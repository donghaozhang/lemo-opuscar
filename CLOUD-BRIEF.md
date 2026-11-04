# Cloud brief: film 19 — 《一笔》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** One-line Drawing (`styles/one-line`): the pen never leaves the paper.
- **Language:** Simplified Chinese for the written title and the few written lines, and the `.srt`, with an OFL
  Chinese handwriting face and full coverage of every character you use.
- **Topic:** one line draws a whole life of two people. Childhood: the line draws a tree and a swing, a girl on
  the swing and a boy who folds a paper plane and sends it to her (a set-up). The line morphs, never lifting: the two
  of them on one bicycle, sharing an umbrella in the rain, a school gate. Then a train takes him away to another city;
  the line stretches across the paper as the distance, thinner and thinner until it nearly breaks (the low point:
  slow down, the music down to a single sustained note). It holds: the line writes 「想你」, folds itself into a paper
  plane that flies across the page to her window (the pay-off), and the train comes back. A wedding (the film's one
  accent colour, red, used once), a home, a child on the same swing, the years passing as the tree changes. Last: the
  two of them old, on the swing under the same tree, and the line closes into a circle around them; only then does
  the pen lift for the first time. Tender, with a clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: one continuous line drawn while we watch, the camera following the nib with a little lag
  and anticipation; scenes morph rather than cut; wides of the places, mediums and close-ups of the two faces at
  every age (a few confident strokes that make the eyes and expressions read), the stretching line as the visual
  climax, and the single red accent at the wedding.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. One solo instrument with one unbroken melodic line, within the style's sound
  rules (erhu or cello), written to the drawing: key notes on marks and corners, the highest note on the most
  important touch, a stopped line as one long note into silence. The pen on paper as the most important sound,
  synthesised from the pen speed. Mix to −14 LUFS, true peak at or below −1 dBTP.
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
  morning gets its own light. When a light changes (a lamp dies, a candle is blown out, a lantern is lit), the whole
  frame changes with it (walls, ground and figures), not one layer.
- **Set-ups and pay-offs:** plant every pay-off early and show it clearly.
- **Readable staging:** one focal point per shot, strong silhouettes, nothing important crossing a face. An
  over-the-shoulder foreground must read as a shoulder and the back of a head (hair, ear, collar), never a flat blob.
- **No voices from text-to-speech:** the VM cannot download voice models, so there is no voice-over and no spoken
  dialogue unless the brief says otherwise; the story must read from picture, music, sound and on-screen text.
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

- Work on the branch `cloud/film-19-oneline`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/one-line-love/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/one-line-love/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/one-line-love/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
