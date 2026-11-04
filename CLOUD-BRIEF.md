# Cloud brief: film 16 — 《台灯上的月亮》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Brick Toy (`styles/brick-toy`). Never use a brand name or a minifigure silhouette.
- **Language:** Simplified Chinese for the title, the instruction sheet, labels and the `.srt`, with a rounded
  OFL Chinese face and full coverage of every character you use.
- **Topic:** night on a child's desk. A small astronaut built from bricks looks up at the desk lamp glowing like
  a moon. His rocket kit is missing three pieces, circled on the instruction sheet (a set-up): a nose cone, a fin and
  an engine. He sets out across the desk to find them: over the keyboard plain, down the pencil-case canyon, past the
  sleeping house cat (the giant: a tail sweeps, an eye opens), into the drawer of loose parts. He finds all three, but
  the cat wakes and chases him across the desk. He builds the rocket in a frantic montage, launches it with a rubber
  band hooked over two pencils (a set-up: the rubber band is seen early), and lands on the lampshade, the moon. He
  plants a tiny brick flag and looks back at the desk below (the emotional beat: slow down, hold the close-up, let the
  music drop to one instrument). Morning: sunlight across the desk, the cat sniffs the rocket on the lamp and sneezes,
  and the astronaut waves from his moon. Adventure and comedy, with a clear beginning, middle and end, and real
  set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: macro shots with shallow focus and real desk objects as landscape; wides of the desk at night,
  mediums and close-ups of the astronaut (a readable printed face with clearly different expressions), the cat as a
  giant seen in parts, inserts (the instruction sheet, each found piece, the rubber band), the chase, the launch and
  the landing as set pieces, stop-motion on twos while the camera moves smoothly, and the morning with its own warm
  light.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. A score within the style's sound rules (glockenspiel, toy piano, pizzicato,
  ukulele, whistling, a brass swell for the launch, a heartbeat drum for suspense) with real changes of mood and tempo.
  Foley for plastic footsteps, brick clicks, the parts drawer, the cat (purr, paws, a sneeze), the rubber band and the
  launch. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-16-bricks`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/lamp-moon/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/lamp-moon/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/lamp-moon/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
