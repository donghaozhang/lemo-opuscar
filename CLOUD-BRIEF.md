# Cloud brief: film 11 — 《愚公移山》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Woodcut Print (`styles/woodcut`).
- **Language:** Simplified Chinese for the carved title, the letterpress captions in the margin and the `.srt`,
  with an OFL Chinese serif (for example Noto Serif SC or an old-style Song face) pushed through the print shader, with
  full coverage of every character you use.
- **Topic:** the old Chinese fable of the Foolish Old Man who moved the mountains, told as a woodcut novel of
  self-contained plates. Two great mountains, Taihang and Wangwu, block the door of ninety-year-old Yu Gong's family:
  every trip to the market is a long detour (show it). He decides to dig them away and carry the earth to the far sea,
  a round trip that takes a year (seasons pass on the plates). His sons and grandsons dig with him, and the neighbour's
  seven-year-old boy runs to join them with a tiny basket (a set-up). The Wise Old Man of the river bend laughs at him:
  at his age he cannot even move a blade of grass on the mountain. Yu Gong answers (the emotional climax: slow down,
  hold his carved face in close-up, the music down to one low string): when I die my son carries on, my son has sons,
  and their sons have sons, without end; the mountains will not grow any taller, so why can they not be levelled? The
  mountain spirit hears it and takes fright, and the Emperor of Heaven, moved, sends two giants to carry the mountains
  away on their backs. Make the giants' work the carver's knife: the mountains are cut away from the block until light
  floods the plate, and the film's one colour (the red of the sunrise) appears for the first time on the open road to
  the south. The Wise Old Man stands speechless; the boy runs down the new road with his tiny basket. A clear
  beginning, middle and end, with real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: plates that carve themselves, coarse gouges first and fine lines after; wides of the
  mountains, mediums of the family digging, close-ups of Yu Gong, the boy and the Wise Old Man (carved faces with
  readable eyes and clearly different expressions), inserts (the hoe on rock, the basket, earth falling into the sea),
  the mirror-print reversal as a transition, and the climax in which the knife clears the mountains.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over. A score within the style's sound rules (low strings, log drum, woodblock, frame
  drum, timpani, struck metal, a folk drone) with real changes of mood and tempo: toil, the seasons passing, mockery,
  the answer, awe as the giants come, and a bright finale. Foley for picks and hoes on rock, baskets, earth, the sea,
  wind, the carving knife itself, and the giants; silence before the loudest moment. Mix to −14 LUFS, true peak at or
  below −1 dBTP.
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

- Work on the branch `cloud/film-11-woodcut`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/moving-mountains/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/moving-mountains/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/moving-mountains/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
