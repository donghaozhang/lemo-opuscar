# 《最后一场皮影戏》 The Last Shadow Play

A 140-second film in the Chinese Shadow Puppetry style, drawn entirely in code. On the night of his last performance an old shadow-puppet
master lights the oil lamp with the last of its oil while his grandson stares at his phone. The boy is drafted as helper; the show is the
Monkey King against the White Bone Demon. Halfway through the old man's hands shake and the Monkey King falls off the cloth; for four
seconds the shadows move with nobody holding them and the demon grows huge against the lamp, until the boy grabs the rods: clumsy, then the
somersault his grandfather teaches him with one tap, then the staff pulled toward the lamp until its shadow fills the screen. The lamp gutters;
the boy lights the cloth with the phone he was told to put away; the crowd cheers; the old man hands him the lamp. At dawn the boy practises alone
against a cloth lit by the sun. The whole film is itself a shadow play: the square, the master, the boy and the crowd are carved hide on a cloth,
lit by two low night lamps; the show inside is a second, bright cloth with its own lamp. Everything on screen is Simplified Chinese; there is no
voice-over and no singing; the score is an original gong-and-drum theatre score (clapper drum, hall drum, cymbals, small and big gong, a banhu-like
fiddle, one suona passage, a bamboo flute and a sanxian-like pluck) with two hard silences, and all foley is synthesized.

**Files:** `final.mp4` (1920×1080, 24 fps), `final-720p.mp4` (for phones), `poster.jpg`, `subtitles.srt` (the placards and plaques), this README.
Source, treatment, model and expression sheets, style frames and contact sheets: `films/last-shadow-play/` on the branch `cloud/film-5-shadow`
(`sh films/last-shadow-play/build.sh` rebuilds everything). Third-party assets and licences: `films/last-shadow-play/CREDITS` (OFL fonts, CC0 samples).

**How it was made.** One timeline (`timeline.js`: tempo sections, 124 hit points, 48 shots, placards) drives the picture, the score, the foley
and the checks. The picture is a WebGL2 compositor (`lamp light × hide transmittance × cloth weave`, `1 − exp` tonemap, bloom, warm vignette)
over Canvas 2D pieces carved with cut-out patterns and a hide texture; puppets are jointed rigs with two-bone IK arms, pre-simulated pendulums
(feathers, tail, ribbons, beard, cowlick) and hand tremor. The master and the boy use the medium's own device for expressions: a brow piece on a
rivet, a sliding lid, a sliding pupil and a swapped mouth strip. Rendered frame by frame in headless Chromium, scored with the library's
sampler (VSCO 2 CE, VCSL, Karoryfer erhu, all CC0) and physical-modelling pluck, mixed in numpy, mastered with a two-pass loudnorm.

**Checks run (results):** see the table below.

| Check | Result |
|---|---|
| CHECKS_TABLE | |
