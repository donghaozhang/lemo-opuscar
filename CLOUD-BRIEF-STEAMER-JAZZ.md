# Cloud brief: film 8 — 《蒸笼爵士》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** 1930s Rubber Hose Cartoon (`styles/rubber-hose`).
- **Language:** Simplified Chinese for the title, the shop sign, the newspaper, every title card and the `.srt`.
  Use a period-looking OFL Chinese face (an old-style Song/Ming or a 1930s display face) with full coverage of every
  character you use.
- **Topic:** Shanghai, a lane (弄堂) on a winter morning in the 1930s, 4 a.m. Old Baker Wang falls asleep over the
  dough in his tiny steamed-bun shop. His alarm clock has stopped because he forgot to wind it (a set-up), and the
  sign on the door says the shop opens at 6. The moment he snores, the kitchen wakes up and swings to a hot jazz band:
  the rolling pin, the cleaver, the big copper kettle, the sleepy stove flame and a tall stack of bamboo steamer
  baskets that moves like a concertina. They make the morning's buns themselves as a dance number (kneading, pleating,
  the steamers breathing in time). Outside the frosted window a ragged newsboy watches, hungry (a set-up). A greedy rat
  sneaks in after the buns: a slapstick chase, the steamer stack topples and the buns roll out into the snowy lane.
  The newsboy catches them all. He holds the last warm bun and hesitates (the emotional beat: slow down, hold the
  close-up, the band drops to a lone clarinet), then knocks and hands every bun back through the door. The kitchen is
  moved: the kettle slips him the best bun, and the tools wind the alarm clock. 6:00: it rings, Baker Wang wakes to
  perfect buns and an honest newsboy at the door, and gives him a second bun; the newsboy runs off shouting the
  headline that brings a queue: 「王记包子 开门啦！」. Final gag: the rat in an apron, kneading dough in time with the
  band. Iris out. Funny first, warm at the end, with a clear beginning, middle and end, and real set-ups and
  pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: an iris-in on the lane, wides of the kitchen as a stage, mediums and close-ups of the object
  characters (each with a readable face and one secondary feature carrying the mood: steam, the flame, a spring), the
  newsboy at the window, the chase through the lane, a held close-up for the newsboy's choice, and the style's devices
  (the whole world dancing on the beat, surreal transformations, the iris out).
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over and no vocals. A 1930s hot dance band / ragtime score within the style's sound rules
  (stride piano, clarinet, muted trumpet, trombone, tuba, banjo, brushes, xylophone, slide whistle) with real changes
  of mood and tempo: a sleepy opening, the big kitchen number, the chase, the lone clarinet for the newsboy, and a
  stomping finale; the band "answers" the characters. Foley by material for every visible action (porcelain, wood,
  metal, dough, steam, snow), then the optical-soundtrack pass. Mix to −14 LUFS, true peak at or below −1 dBTP.
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

- Work on the branch `cloud/film-4-pixel`, where this session already works. Never push to `main` and never open a pull request.
- The project folder is `films/steamer-jazz/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/steamer-jazz/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/steamer-jazz/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
