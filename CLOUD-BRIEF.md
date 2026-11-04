# Cloud brief: film 15 — 《后羿射日》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Paper Pop-up Book (`styles/paper-popup`).
- **Language:** Simplified Chinese for the book cover, signs, speech bubbles and the `.srt`, with a playful OFL
  Chinese face (for example ZCOOL KuaiLe) and full coverage of every character you use.
- **Topic:** a pop-up book lies on a desk by lamplight; it opens on the old legend of the archer Hou Yi. Ten suns
  live in a tree at the eastern edge of the sky and cross the sky one at a time, until one day all ten rise together
  for fun. The earth bakes: the paper rivers dry and crack, the crops curl and brown, the paper people hide (the heat
  shown as paper physics: curling edges, scorch, flutter). Hou Yi climbs the highest mountain with his red bow and a
  quiver of exactly ten arrows (a set-up: show the count). One by one he shoots the suns down; each falls as a paper
  three-legged crow and flutters into the sea. The ninth falls. The last sun, the youngest and smallest, trembles and
  tries to hide behind a mountain. Hou Yi draws the tenth arrow and aims (the emotional climax: slow down, hold the
  close-ups of the archer and the frightened little sun, the music stops), then lowers the bow: the world needs one
  sun. The last sun rises gently, rain falls, the paper fields turn green and the rivers run again. The tenth arrow
  stays in the quiver (the pay-off). The book closes on the desk as real morning light comes through the window. A
  clear beginning, middle and end, with real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: the real desk and lamp, the book opening and spreads springing up back to front; wides of
  the sky with ten suns, mediums and close-ups of Hou Yi, the people and the youngest sun (flat paper faces with
  readable eyes and clearly different expressions), inserts (the quiver count, an arrow being nocked, a crow
  fluttering into the sea), pull-tabs and page turns as transitions, and real lens blur and light on the paper.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over: speech bubbles type on with blips. A score within the style's sound rules (music
  box, pizzicato strings, clarinet, glockenspiel, plus Chinese colour from dizi and small gongs) with real changes of
  mood and tempo: a playful sky, the heat, the heroic climb, the shots, the hush of the last arrow, and a gentle
  recovery. Paper Foley for every action (pop-up snaps, page swish, bow creak, arrow whoosh, crows fluttering, rain on
  paper). Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-15-popup`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/archer-suns/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/archer-suns/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/archer-suns/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
