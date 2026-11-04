# Cloud brief: film 18 — 《如何给猫洗澡》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Mid-century Cartoon (`styles/midcentury-toon`).
- **Language:** Simplified Chinese for the title, step headers, caption cards, detail tags and the `.srt`, with
  OFL Chinese faces that match the style's slab and geometric looks and full coverage of every character you use.
- **Topic:** a 1950s "follow along" classroom film: 「如何给猫洗澡：六个简单步骤」. A calm presenter, Mr. Zhang,
  demonstrates each numbered step with a perfectly still body and perfect manners, while his hands, eyes and the cat
  tell another story. Step 1, prepare the tub (bubbles, a rubber duck); step 2, find the cat (it is never where the
  arrow points); step 3, hold the cat gently (it pours out of his hands like liquid); step 4, wet the cat (the cat is
  dry, the presenter is wet); step 5, shampoo (foam everywhere, the cat now wearing a foam crown on top of the
  wardrobe); step 6, dry the cat (the hair dryer blows the presenter's hair into a 1950s quiff). Each step goes wrong in
  a bigger way, while his body stays calm and only his eye twitches (a running gag and a set-up). After step 6 he sits
  soaked in the tub, defeated (the emotional beat: slow down, hold the close-up, the combo drops to one vibraphone
  note). The cat walks over, climbs into his lap, licks his cheek and purrs. A final card: 「第七步：猫会自己洗澡。」
  Then the cat pulls the plug. Dry, funny and warm, with a clear beginning, middle and end, and real set-ups and
  pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: the style's colour-plane rooms and numbered step headers, mediums of the presenter (a held
  drawing; only arms, hands, eyes and mouth animate), close-ups of the cat and of his eye, inserts with curved arrows,
  call-outs and detail tags, iris and wipe transitions, and real comic timing (holds, takes, the pause before a gag).
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over: the caption cards carry the narration. An original West-Coast cool-jazz combo
  within the style's sound rules (flute or muted trumpet, vibraphone, pizzicato walking bass, brushes, bongos or finger
  snaps) with real changes of mood and tempo, and silence before each disaster. Foley for water, bubbles, the rubber
  duck, the hair dryer, paws, a purr and the plug. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-18-midcentury`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/cat-bath/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/cat-bath/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/cat-bath/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
