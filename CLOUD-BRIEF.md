# Cloud brief: film 2 — 《墨龙借雨》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code cloud
session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`, but
never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going. Aim high: there is plenty of budget, so take the time to do it properly.

## The film

- **Style:** Chinese Ink Wash (`styles/ink-wash`).
- **Language:** Simplified Chinese for all on-screen text, calligraphy and the `.srt`.
- **Topic:** in a painter's studio at night, a drop of ink spills from the inkstone and becomes a small ink dragon.
  The village in the painting on the desk is dying of drought, and the dragon must bring rain before the incense
  stick burns out. It travels through the painted landscape (mountains, a river, mist, a pine cliff), argues with a
  stubborn, sleeping cloud, and in the end gives itself up to become the rain. The village celebrates; at dawn the
  painter wakes to find the painting rain-soaked and fresh, and one small dragon curled back in the inkstone.
  Wonder, humour and a little sacrifice, with a clear beginning, middle and end, and real set-ups and pay-offs.
- **Format:** 100–150 seconds, 1920×1080, 24 fps.
- **Direction:** many shots and real camera grammar: wides of the landscape, close-ups, inserts (the incense stick,
  the inkstone, brush tips), travelling moves along the scroll, match cuts between the studio and the painting.
- **Animation:** real character acting for the dragon: anticipation, follow-through, eye acting, playful physical
  comedy, readable silhouettes in ink.
- **Sound:** no voice-over. A score led by the guqin (with xiao, drums and timpani as the style says), with real
  changes of mood and tempo, and Foley for every visible action (brush, paper, water, wind, rain). Mix to −14 LUFS,
  true peak at or below −1 dBTP.
- **Storyboard review:** no. **Owner's own material:** none, draw everything with code.
- **Chinese text** must render with a real CJK font (OFL brush or serif fonts, for example from npm `@fontsource/*`).
  Check rendered frames for missing-glyph boxes.

## Quality passes

After the first full render, do at least two complete review passes: contact sheets at 1 fps, every scene checked
against the treatment and `STYLE.md`, and fix what is weak before the next render. Then run the cue check, readcheck,
loudness, blackdetect and the CJK glyph check.

## Environment notes

- Ubuntu VM without a GPU. Chrome for Testing is at `/usr/bin/google-chrome`; use it if Playwright's own browser
  download is blocked. Install ffmpeg with apt, or from a pip or npm package, if it is missing or too old.
- The network reaches package registries and GitHub only.
- First run `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps` (core tier only).

## Git: progress must be visible from outside

- Work on the branch `cloud/film-2-fable`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/ink-dragon/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, style frames, cue map, score, Foley,
  first full render, each review pass, final), and at least every 10 minutes. During long renders, append one line
  to `films/ink-dragon/STATUS.md` about every 10 minutes (UTC time, step, frames done / total) and commit and push it.
  Keep commits small: no frame dumps or other bulky intermediates.
- Deliver to `deliveries/ink-dragon/`: `final.mp4` (1080p, under 95 MB), `final-720p.mp4` (under 28 MB, for phones),
  `poster.jpg`, `subtitles.srt`, and `README.md` (one paragraph on the film, how it was made, and the checks you ran
  with their results). Commit and push them, then stop.
