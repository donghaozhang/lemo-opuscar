# Cloud brief: film 10 — 《最后一班渡船》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** HD-2D (`styles/hd-2d`): pixel sprites in a lit 3D diorama. Never use the term "HD-2D" as a title or
  brand in the film.
- **Language:** Simplified Chinese for the chapter cards, the title, the dialogue boxes and the `.srt`, with a CJK
  font that suits the style's serif look (for example Noto Serif SC) and full coverage of every character you use.
- **Topic:** a water town south of the Yangtze in autumn. Tomorrow the new bridge opens and the ferry closes after
  forty years; today is the old ferryman Lao Zhou's last day. His crossings play as small lit vignettes from the high
  camera: morning schoolchildren (one boy, Xiao Shi, always sits at the bow and drops a folded paper boat on the water
  every crossing: a set-up), a wedding party with red umbrellas at noon, an old couple with a goose at dusk. The new
  bridge stands beside the ferry, fenced off, with one span still missing (a set-up). Night: Lao Zhou ties up, blows
  out his lantern and looks at the bridge. Then a storm: rain and lightning, and Xiao Shi's mother runs to the pier
  carrying the boy, burning with fever; the clinic is across the river and the bridge cannot be crossed. Lao Zhou
  relights his lantern and rows them across through the storm (the heart of the film: lantern light on the rain, the
  fight with the current, close-ups of his hands and the boy's face, the music down to a heartbeat when the lantern
  nearly dies). The clinic door opens in warm light. Dawn: the bridge opens with firecrackers and a red ribbon, and the
  town crosses it. Lao Zhou sits alone in his moored boat. Then Xiao Shi, well again, runs down to the old pier and
  gives him a paper boat with 「谢谢周爷爷」 written on it. Lao Zhou sets it on the water, and it drifts under the new
  bridge in the morning light. A clear beginning, middle and end, with real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: the style's high three-quarter camera and tilt-shift band for the town, plus lower, closer
  framings for the human beats; chapter cards (清晨, 正午, 黄昏, 夜, 黎明); a few lines in dialogue boxes with name
  plates and portraits (readable faces and expressions in the portraits); the storm crossing as the set piece (rain,
  lightning flashes with thunder, the lantern as the key light); and dawn with its own warm light and long
  shadows.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over: dialogue appears only in the dialogue boxes, with the style's chime. A score of
  small Chinese folk instruments (dizi, pipa, guzheng, erhu) with light strings, with real changes of mood and tempo: a
  gentle morning, a festive noon, a quiet night, the storm, and a warm dawn. Foley for oars and water, footsteps per
  surface, rain and thunder, the lantern, the goose, firecrackers and the town. Mix to −14 LUFS, true peak at or below
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

- Work on the branch `cloud/film-10-ferry`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/last-ferry/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/last-ferry/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/last-ferry/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
