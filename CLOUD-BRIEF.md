# Cloud brief: film 17 — 《沪宁夜快车》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Art Deco (`styles/art-deco`).
- **Language:** Simplified Chinese for the title, signs, plaques, the calling card and the `.srt`, with an OFL
  Chinese face that suits the style's geometric display look and full coverage of every character you use.
- **Topic:** 1930s, the night express from Shanghai to Nanjing. In the dining car, a famous jeweller's luminous
  pearl, 「夜明珠」, sits under a glass dome. The young conductor has one habit (a set-up): he counts the bulbs of every
  carriage, twelve per car. A glamorous lady in a cloche hat with a black-cat brooch boards at the last minute (a
  set-up). Midnight, the train enters a long tunnel and every light goes out; when the bulbs come back on one by one,
  the dome is empty. Chaos: passengers accuse each other, the jeweller faints, dials and clocks spin. The conductor
  walks the corridor counting the bulbs as they flicker, and in the observation car he counts thirteen: one glows a
  soft green (the emotional beat: slow down, hold on his face and the thirteenth light, the music down to a clock tick).
  The pearl is hidden in an empty lamp socket. He returns it to the jeweller; the lady in the cloche hat smiles,
  tips her hat to him and vanishes into the steam at Nanjing station, leaving a black-cat calling card in his pocket.
  A stylish caper, with a clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: symmetrical compositions on a centre axis, the train as architecture (setbacks, chevrons,
  sunbursts), gold keylines drawing themselves on black, wides of the night train and the stations, mediums and
  close-ups of the conductor, the lady and the jeweller (airbrushed faces with readable eyes and clearly different
  expressions), inserts (the dome, the clocks, the counted bulbs, the calling card), doors splitting along the seam
  as transitions, and the tunnel blackout and the bulbs returning in counted order as the set piece.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. Symphonic jazz of the 1920s–30s within the style's sound rules (stride piano,
  clarinet, strings, muted trumpet commentary, trombone and sax section) with real changes of mood and tempo: a
  glamorous departure, the blackout, the chase of clues, the hush of the thirteenth bulb, and a sly finale. Foley for
  the train (wheels, couplings, steam, whistle), brass clicks, glass, knife switches and filament hum, heels on
  marble. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-17-deco`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/shanghai-express/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/shanghai-express/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/shanghai-express/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
