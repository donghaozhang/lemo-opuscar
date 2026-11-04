# Cloud brief: film 13 — 《外公的单车》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Watercolor Brush (`styles/watercolor`): a journal page that paints itself.
- **Language:** Simplified Chinese for the title, the handwritten journal notes, the measured labels and the
  `.srt` (Noto Serif SC for titles and subtitles, an OFL Chinese handwriting face for the notes), with full coverage of
  every character you use.
- **Topic:** a watercolour journal kept by a girl, Xiao He, over many years. Summer, age six: in the lane behind
  the house, her grandpa teaches her to ride his old black 28-inch bicycle. She falls (the note: 「第一次：摔了 3 次」,
  a painted scraped knee). He holds the back of the saddle and says 「我扶着呢」, then quietly lets go; she rides fifty
  metres alone before she notices and turns to see him far behind, waving (the set-up). The pages turn through the
  years, each a season, each with a measured note: she rides to school while he waits at the corner; she rides off to
  the city for university under autumn leaves; the bicycle leans unused in the snow, and grandpa grows old (his
  walking stick appears on a page). Spring: she comes home. Grandpa can no longer ride. She lifts him onto the back
  seat and rides him slowly down the same lane under the blossoming trees, and says 「外公，我扶着您呢」 (the pay-off and
  the emotional climax: slow down, hold the close-up of his face, the music down to a single instrument). Last page:
  the two of them painted small at the end of the lane, and a note: 「骑了 50 米，和那年一样」. Tender, with a clear
  beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: journal pages that paint themselves stroke by stroke, structure before detail; wides of the
  lane in each season, mediums and close-ups of Xiao He and grandpa at every age (readable eyes and clearly different
  expressions, painted, not outlined), inserts (the saddle, his hand letting go, the scraped knee, the walking stick,
  the bell), the annotation layer as the storyteller, page turns as the time cuts, and the paper-coloured mist as
  the eraser between years.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. An acoustic score within the style's sound rules (felt piano, fingerpicked guitar,
  woodwinds, light strings, glockenspiel) with real changes of mood and tempo: a playful summer, the passing years, a
  hush in the snow, and the spring ride home. Foley: the brush rustle for each painting-in, pencil scratch for notes,
  page flips, the bicycle bell and chain, cicadas, rain, wind and birds. Mix to −14 LUFS, true peak at or below
  −1 dBTP.
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

- Work on the branch `cloud/film-13-watercolor`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/grandpas-bicycle/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/grandpas-bicycle/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/grandpas-bicycle/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
