# Cloud brief: film 1 — 《深夜翻译官》

This file is the owner's complete answer to the **Brief** step in `AGENTS.md`. You are running in a Claude Code cloud
session with nobody watching: follow `AGENTS.md` → `DIRECTOR.md` → `TECHNIQUE.md` and the style's `STYLE.md`, but
never stop to ask questions and never wait for approval. Decide yourself, write the decision into `TREATMENT.md`,
and keep going.

## The film

- **Style:** 1920s Silent Film (`styles/silent-film`).
- **Language:** Simplified Chinese for intertitles and the `.srt`. English only where the period look needs it
  (for example a studio card).
- **Topic:** in a vast film archive at night, a small robot translator works through a mountain of film reels whose
  captions are in English, turning each one into Chinese before dawn. A second robot checks every page and sends
  back the mistakes. One reel jams and starts to smoulder and has to be rescued. At first light the last reel is
  stamped and filed, and the archive lights up. Warm and funny, with a clear beginning, middle and end.
- **Format:** 45–75 seconds, 1920×1080, 24 fps.
- **Sound:** no voice-over (it is a silent film). A synthesized period score (piano or a small band) and Foley for
  every visible action. Mix to about −14 LUFS with true-peak limiting.
- **Storyboard review:** no. **Owner's own material:** none — draw everything with code.
- **Chinese text** must render with a real CJK font (for example Noto Serif SC or Noto Sans SC from npm
  `@fontsource/*`). Check rendered frames for missing-glyph boxes before the final render.

## Environment notes

- Ubuntu VM without a GPU. Chrome for Testing is at `/usr/bin/google-chrome`; use it if Playwright's own browser
  download is blocked. Install ffmpeg with apt, or from a pip or npm package, if it is missing.
- The network reaches package registries and GitHub only.
- First run `sh plugin/skills/lemo-opuscar/scripts/setup.sh deps` (core tier only).

## Git: progress must be visible from outside

- Work on the branch `cloud/film-1`, which is checked out. Never push to `main` and never open a pull request.
- The project folder is `films/night-translator/`. It is git-ignored, so add its files with `git add -f`.
- Commit and push after every finished step (brief summary, `TREATMENT.md`, style frames, cue map, score, Foley,
  first full render, fixes, final), and at least every 10 minutes, so the owner can follow along. Keep commits small:
  no frame dumps or other bulky intermediates.
- Deliver to `deliveries/night-translator/`: `final.mp4` (under 90 MB), `poster.jpg`, `subtitles.srt`, and
  `README.md` (one paragraph on the film, how it was made, and the checks you ran with their results). Commit and
  push them, then stop.
