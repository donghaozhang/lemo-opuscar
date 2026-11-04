# Cloud brief: film 6 — 《江户猫追鱼记》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Ukiyo-e (`styles/ukiyoe`).
- **Language:** Simplified Chinese for the title cartouches, any other on-screen text and the `.srt`.
- **Topic:** Edo, early morning. A scrawny stray cat steals a fish from a fishmonger's basket to feed a hungry
  kitten hiding under a bridge (planted in the first shots). A black kite swoops down and snatches the fish. The cat
  chases the kite through a sequence of print views, each one a complete print (a bridge in a sudden shower with
  figures under umbrellas, a snowy temple, rice fields with Mount Fuji, a mountain pass), with the fishmonger chasing
  the cat all the way. At the sea the kite drops the fish into a great wave; the cat leaps onto a fishing boat, rides
  the wave and catches the fish in its teeth. It brings the fish home to the kitten under the bridge. The fishmonger,
  who has seen everything, quietly puts a second fish beside them. Comedy, a chase, a moment of awe on the wave, and a
  warm ending, with a clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: the camera moving over each print like an unrolling handscroll, bold geometric crops,
  close-ups of the cat's face (readable eyes), inserts (the fish, the kite's claws, the kitten), the fishmonger's
  reactions, and match cuts between the views.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. A score within the style's sound rules (shamisen, shakuhachi, koto and taiko)
  with real changes of mood and tempo: a sneaky opening, a chase, awe on the wave, and a quiet ending. Foley for paws,
  wings, the fish, rain, snow, waves and wood. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-6-ukiyoe`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/edo-cat/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/edo-cat/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/edo-cat/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
