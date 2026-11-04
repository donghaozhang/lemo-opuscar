# Cloud brief: film 9 — 《中秋的灯》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Paper-cut Lightbox (`styles/paper-lantern`).
- **Language:** Simplified Chinese for the title, every paper text strip and the `.srt` (an OFL brush font for
  titles and Noto Serif SC for subtitles, as the style says), with full coverage of every character you use.
- **Topic:** Mid-Autumn Festival in a small fishing village on a rocky coast. A girl, A-Yue, cuts a paper rabbit
  lantern for her father, a fisherman due home tonight for the festival; on the table, a box of mooncakes with one cake
  for each of the three of them (a set-up). On the headland stands an old lighthouse whose lamp has been dark for years
  (a set-up, seen in the first wide). At dusk a thick fog rolls in from the sea and swallows the moon; the radio
  crackles: the boats cannot find the harbour mouth, and her father's boat is out there. Her mother runs to the pier.
  A-Yue takes her small rabbit lantern, climbs the cliff path to the dark lighthouse and sets it in the lamp-room
  window: it is far too small to be seen. She sits down and cries (the emotional low: slow down, hold the close-up,
  the music drops to one instrument). Then lights appear on the path below: the villagers have followed her, each with
  a festival lantern (lotus, fish, star, carp), and they line the cliff path and the lighthouse gallery until a chain
  of light burns through the fog (the showpiece: each lantern a hole of light burning through the paper layers). Out at
  sea her father sees the line of lights and steers home. The fog thins, the full moon burns through, the boat reaches
  the pier, and the family shares the mooncakes with the rabbit lantern beside them under the moon. Last shot: the lit
  lamp on a table in a dark room, someone's keepsake. Moving and warm, with a clear beginning, middle and end, and real
  set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: box framing for the opening and the last shot, full-bleed for the story; wides of the village,
  the sea and the headland; mediums and close-ups of A-Yue (a cut-paper figure whose cut eye and mouth read in the
  backlight, with clearly different expressions; the acting is in posture, head and hands), her mother on the pier,
  her father at the wheel in the fog; inserts (scissors cutting the rabbit, the mooncakes, the radio, lanterns being
  lit one by one); slow parallax moves through the layers; and the style's light cues (the lamp nearly off at the
  lowest moment, then the lanterns lighting it back up).
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. A score within the style's sound rules (felt piano, music box, guzheng or pipa,
  bamboo flute, soft strings; no drum kit) with real changes of mood and tempo: a homely opening, unease as the fog
  comes, the low point, a rising swell as the lanterns appear, and a gentle finale. Foley of paper and light (a switch
  click and shimmer for each light, paper rustle) plus the sea, wind, a foghorn, the radio crackle and the boat's
  engine. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-9-lantern`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/moon-lanterns/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/moon-lanterns/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/moon-lanterns/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
