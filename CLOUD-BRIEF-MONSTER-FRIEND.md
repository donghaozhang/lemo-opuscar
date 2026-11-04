# Cloud brief: film 14 — 《我的怪兽朋友》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code
cloud session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`,
but never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Crayon Picture Book (`styles/crayon-book`).
- **Language:** Simplified Chinese for the hand-lettered title, the book's printed words and the `.srt`, with an
  OFL Chinese handwriting face that suits a picture book and full coverage of every character you use.
- **Topic:** Dou Dou has just moved to a new city and starts at a new kindergarten, and he is too shy to say a
  word. At night he draws a big, soft purple monster in his crayon book, and the monster climbs off the page. The
  monster's size follows Dou Dou's courage (a set-up shown early and clearly): when he is scared it shrinks to the size
  of a mouse, when he is brave it grows. Next morning it rides to kindergarten in his backpack (only Dou Dou can see it)
  and makes gentle trouble: it eats the crayons, sneezes colour, hides in the sandpit. At play time a girl, Ni Ni,
  sits alone under a tree because her red balloon is caught in the branches. The monster nudges Dou Dou toward her;
  he is scared and it shrinks to the size of a bean on his shoulder (the emotional beat: slow down, hold the close-up,
  the music down to a music box). He takes a breath and holds out a purple crayon: 「你好」. The monster grows huge,
  lifts him up to free the balloon, and Ni Ni laughs; she draws her own yellow monster with his crayon, and it comes to
  life too. The two monsters play while the two children laugh together. That night the purple monster climbs back
  into the book. Last page: two children and two monsters drawn on one page, 「我的朋友」. Tender and funny, with a
  clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: the page being drawn and coloured while we watch; wides of the new city and the kindergarten,
  mediums and close-ups of Dou Dou, the monster and Ni Ni (readable eyes and clearly different expressions), inserts
  (the crayon box, the balloon, the backpack), the monster's changes of size as visual beats, and page turns as
  transitions.
- **Animation:** real character acting: anticipation, follow-through, squash and stretch where the style allows, eye
  acting, physical comedy, and readable silhouettes.
- **Sound:** no voice-over: the story's words are the book's printed words. A score within the style's sound
  rules (ukulele or nylon guitar, clarinet, music box, glockenspiel, toy piano, recorder) with real changes of mood and
  tempo: a lonely opening, the magic of the drawing, playful trouble, the hush of the brave moment, and a joyful
  finale. Foley for crayons, the brush wash, page turns, the playground and the balloon. Mix to −14 LUFS, true peak at
  or below −1 dBTP.
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

- Work on the branch `cloud/film-2-fable`, where this session already works. Never push to `main` and never open a pull request.
- The project folder is `films/monster-friend/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, model and expression sheets, style frames,
  cue map, score, Foley, first full render, each review pass, final), and at least every 10 minutes. During long
  renders, append one line to `films/monster-friend/STATUS.md` about every 10 minutes (UTC time, step, frames done / total)
  and commit and push it. Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/monster-friend/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
