# Cloud brief: film 12 — 《外星人来吃火锅》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Sci-Fi Sitcom Toon (`styles/scifi-toon`). Invent your own cast and devices and follow the style's
  copyright red lines strictly.
- **Language:** Simplified Chinese for the title, signs, the menu, the subtitles with speaker pills and the
  `.srt`, with a rounded heavy OFL Chinese face that matches the style's subtitle look and full coverage of every
  character you use.
- **Topic:** Chongqing, a rainy night. A tiny old hot-pot restaurant is about to close for good: a 「转让」 sign is
  taped to the door and its owner, Auntie Liu, counts the day's few coins (a set-up). A small flying saucer crash-lands
  on the roof. Two aliens stumble in, looking for something to fix their ship: a tall, deadpan one and a small,
  nervous one whose translator gadget gets everything wrong, so they end up ordering 「最辣的」. Comedy: the nervous
  one's first bite of the nine-grid pot (a cold silent pause, steam from every opening, a colour change, then
  「再来一盘」), the deadpan one learning to dip tripe 「七上八下」 with the exact timing Auntie Liu mimes, chopsticks
  used as antennae. Their ship's power cell glows whenever chilli is near (a set-up): the bubbling red broth turns out
  to be the perfect fuel. They fill the cell with a ladle, pay with a glowing alien coin and lift off over the night
  city. Next morning there is a queue around the block, the 「转让」 sign is torn down and a new one says
  「外星人认证」. Final gag: the saucer returns with a whole fleet, aliens queuing with tiny bowls. Dry, funny and
  warm, with a clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: sitcom coverage: establishing wides of the rainy city and the restaurant, two-shots of the
  duo, reaction close-ups (big white eyes, brows carrying the emotion), Auntie Liu's deadpan reactions, inserts (the
  coins, the sign, the bubbling pot, the power cell, the translator's screen), the crash and the take-off as the action
  set pieces, and silence as the punchline.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over and no real-language speech: the aliens speak synthesised gibberish in two
  contrasting timbres (low and flat for the deadpan one, high and fast for the nervous one), the translator speaks in
  beeps, Auntie Liu answers mostly with looks, and every line is subtitled. A synthesised score within the style's
  sound rules (a theremin-like lead, analog bass, square-wave arpeggio, retro drum machine) with genre cues per scene,
  real changes of mood and tempo, and hard cuts to silence for the punchlines. Foley for rain, the crash, sizzling
  broth, chopsticks, slurps, the gadget and the ship. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-12-scifi`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/alien-hotpot/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/alien-hotpot/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/alien-hotpot/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
