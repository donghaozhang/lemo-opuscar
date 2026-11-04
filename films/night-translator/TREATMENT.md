# TREATMENT — 《深夜翻译官》 The Night Translator

1920s Silent Film · ≈ 70 s · 1920×1080 · 24 fps · intertitles in Simplified Chinese · no voice

## 0. Decisions taken without the owner (cloud session)

- **Foley vs. the style.** The brief asks for "Foley for every visible action"; `STYLE.md` §7 says the instrument is
  the sound design and there is no modern Foley. Both are kept the period way: every visible action is sounded **by the
  picture-house pit** — the pianist's mickey-mousing *plus* the effects drummer's trap box that 1920s houses really had
  (wood block, slapstick, cowbell, triangle, ratchet, slide whistle, hand bell, a siphon "hiss", a sand-block). No
  recorded or "realistic" room sound; the only ambience is the projector in the booth.
- **The one colour** (`STYLE.md` §3): the proofreader's **red ink** — the correction strike, and at the end the red
  seal 「译毕」 on the last reel. Getting it right is what the film is about; nothing else is coloured.
- Characters are robots, not humans, so the human 2.5D rig is replaced by two simple robot rigs of my own (eased
  keyframe lists, no `if` poses), with the style's deadpan acting: the body acts, the face (two lamp eyes) barely moves.

## 1. Three candidate structures

1. **The countdown.** A wall clock is the spine: 12:00, 2:00, 4:00, 5:59, each hour a faster version of the same work
   loop, until dawn. Clear and funny, but a list; the turn (the fire) would feel like one more item.
2. **The chain in one take.** The whole night as one locked extreme wide: reels go down a chute to the translator,
   pages up a tube to the proofreader, mistakes back down — a Rube-Goldberg archive. Very silent-film, but at
   archive scale the robots are tiny and the jam/rescue would be unreadable in a thumbnail (STYLE §9).
3. **The reel you are watching (chosen).** The film itself is one of the archive's reels. It opens on an **English**
   title card that the little robot pulls down like a roller blind to reveal the Chinese title; it ends with a card
   telling the audience the reel they just watched was the last one. When the reel jams and smoulders, **our own print
   starts to burn in from the edges**; when it is saved, the print heals and warms. The clock of (1) survives as a
   background prop; the work loop of (2) survives as one legible full shot.

**Why 3:** the topic is translating film captions, so the medium's own intertitles can be *translated on screen*, and
the medium's own burn damage can *be* the smouldering reel. The opening, the native move and the ending all come from
the topic, not from the style's usual picture-house opening.

## 2. Logline and arc

A little tin robot races the dawn to turn a thousand English-captioned reels into Chinese — and when the last one
catches fire, it learns its fussy proofreader is on its side.

- **Setup** (0–18 s): the title is translated in front of us; a vast night archive; the goal card.
- **Development** (18–38 s): the work loop; a mistake bounced back onto the robot's head ("Break a leg!" → 「摔断一条腿！」
  struck through in red); hours rush by.
- **Turn** (38–49 s): a reel jams and smoulders — nitrate burns — the print itself burns; a dash down the aisle, a
  trip, the reel in the air, silence; the proofreader catches it in the fire bucket.
- **Ending** (49–70 s): the saved reel is No. 1000, the last; the proofreader pats the head it once bonked (echo
  gesture); red seal, filed at first light, the archive's lamps come on row by row; the card to the audience; 完.

## 3. Benchmark

| Work | Learn | Don't take |
|---|---|---|
| Buster Keaton, *Sherlock Jr.* (1924) | the film-within-the-film idea; deadpan reaction held long enough to be funny | any gag, shot or the projectionist plot |
| Keaton, *The General* (1926) | a mechanical process staged whole in one locked wide; the wait is the joke | trains, chases, composition of any shot |
| Wordless robot pantomime in animation (e.g. *WALL·E*'s first act) | robots act through posture, eye lamps and timing; sound effects give them voice | any robot design, eyes, sounds or story beat |
| 1920s photoplay cue sheets | music by mood section (Misterioso, Allegretto, Hurry, Agitato, Tenderly, Maestoso) | any published melody |

## 4. Characters & world

- **小译 Xiao Yi, the translator** — about 1/3 of frame height in the full shots. A film-can drum on one wheel: a round
  pale-tin body (value 0.8) with a five-spoke reel face plate, two lamp eyes under a single brow plate, a springy
  antenna with a bulb, two tube arms with three-finger grips. Silhouette: a circle on a wheel.
- **老校 Lao Jiao, the proofreader** — twice Xiao Yi's height. A dark iron (0.2) hat-stand: three-caster base, a tall
  stem, a square head with one big monocle lens (pale, glinting), a long arm ending in a red-nibbed pen, a second arm
  with a rubber stamp. Silhouette: a tall line with a circle on top. Dark against the lamplit wall; pale lens reads.
- **The archive** — floor-to-ceiling shelves of film cans fading into dark, a tall arched window (night → dawn), a
  wall clock, a desk with a reel viewer and a typewriter under a hanging lamp, a mountain of cans, a pneumatic tube
  between desk and proof stand, a fire bucket (「消防」) at the end of the aisle.

## 5. Shot list

| # | t (s) | Framing / angle | Camera | Duration | Why |
|---|---|---|---|---|---|
| 1 | 0.0–7.6 | intertitle (the title card), flat | locked | 7.6 | hook: the English title is pulled down like a blind by a robot hand-on-card — premise in 4 s |
| 2 | 7.6–15.0 | extreme wide, eye level, the whole archive | iris opens from black on Xiao Yi entering | 7.4 | scale and loneliness; the clock reads 12 |
| 3 | 15.0–18.6 | narration card, double rule + fans | locked | 3.6 | the goal: 「天亮之前，全部译完。」 |
| 4 | 18.6–26.0 | full shot of the desk + proof stand, both robots | locked | 7.4 | the work loop seen whole; the bounced page lands on the head |
| 4b | 24.6–26.0 | (inside 4) half-open iris on Xiao Yi | iris to half, held | 1.4 | the look at the audience after the bonk |
| 5 | 26.0–30.2 | insert: the returned page | iris in on the page | 4.2 | the gag must be read: literal 「摔断一条腿！」 struck red, 「祝你演出顺利！」 |
| 6 | 30.2–38.8 | same full shot as 4 | locked, **undercranked** (sampled 20 fps), slow push-in in the last 2 s | 8.6 | hours fly (clock spins 12 → 5), pile shrinks; then the jam |
| 7 | 38.8–42.0 | shout card, heavy rule, text shakes | locked | 3.2 | 「硝酸胶片，一点就着！」 — the stakes, not a description |
| 8 | 42.0–45.2 | full, side-on, the aisle | **tracking** left→right with shelves passing in the foreground | 3.2 | the dash; the print burns in from the edges |
| 9 | 45.2–49.4 | wide, end of the aisle, bucket | locked | 4.2 | trip → reel in the air (silence) → catch: cause and effect whole |
| 10 | 49.4–56.0 | medium two-shot at the bucket | **slow push-in** | 6.6 | tenderness: the reel is No. 1000; the pat on the head |
| 11 | 56.0–63.2 | the extreme wide of shot 2 (bookend), dawn | locked; the light does the moving | 7.2 | red seal, Lao Jiao lifts Xiao Yi to the last slot, lamps come on row by row |
| 12 | 63.2–67.2 | tender card, vines & flowers | locked | 4.0 | 「您刚才看的，就是最后一卷。」 |
| 13 | 67.2–70.6 | end card 「完」 / THE END | curtains close | 3.4 | the picture house closes |

Camera moves used: iris in/out, half-open iris, locked off, tracking with foreground, slow push-in, curtain — six.
Signature shot: **9 → print heal** (the reel in the air in silence, the catch, the burn retreating from our own frame).

## 6. Beat sheet (seconds)

- 0.0 lamp click, projector motor spins up; curtains already open; English title card in the gate.
- 0.3 「THE NIGHT TRANSLATOR · A Photoplay in One Reel」 (English studio card) fades up.
- 1.8 Xiao Yi's head rises from the card's lower edge (grace note); 2.4 it looks at us, looks up at the words.
- 2.9 it reaches up, grabs the bottom of the English strip; 3.1 tugs (ratchet) — the strip snaps up like a blind (slide
  whistle up) revealing 《深夜翻译官》; 3.4 the robot nods once (wood block). Title held to 7.6. 6.2 robot drops away.
- 7.6 iris closes; 8.0 iris opens on the archive at night, the clock at 12. 9.0 Xiao Yi rolls in from left (squeak per
  wheel turn), 11.8 parks beside the mountain of cans; 12.6 Lao Jiao, already at its stand, lifts its lens (glint,
  triangle). 13.6 clock strikes (hand bell, one stroke).
- 15.0 card 「天亮之前，全部译完。」.
- 18.6 desk full shot. 19.2 grabs a can (clank), 19.8 threads it (ratchet); 20.4–21.6 types (wood-block clicks),
  21.8 bell, page shoots up the tube (pop + slide whistle). 22.4 Lao Jiao reads; 22.8 stamps ✓ (thump) → done basket.
  23.2 second page up the tube; 23.6 Lao Jiao reads, recoils (diminished sforzando), scribbles red; 24.0 crumples and
  throws; 24.5 it bonks Xiao Yi's head (slapstick + low "boing"); 24.6 half iris, Xiao Yi looks at us (hold).
- 26.0 insert page: "Break a leg!" / 「摔断一条腿！」; 27.4 red strike (pen scratch); 27.9 「祝你演出顺利！」 written in.
- 30.2 Hurry: undercranked full shot, clock hands spin 12 → 5, pages zip both ways, pile shrinks, done basket grows.
- 36.8 a can jams in the viewer (grind); 37.4 Xiao Yi shakes it; 37.8 a wisp of smoke; music drops to a trill;
  38.4 the music stops (first silence: projector only, crackle).
- 38.8 shout card 「硝酸胶片，一点就着！」 (forearm cluster on the cut). Burn starts at the frame edges.
- 42.0 track: Xiao Yi races right with the smoking can held overhead; shelves rush past; burn creeps in.
- 45.2 bucket wide: 45.8 Xiao Yi trips on a loose film strip (slapstick), 46.0 the can flies up — **second silence**
  (music and trap stop, projector only) — 47.0 Lao Jiao glides in, 47.4 catches it in the bucket: **hiss + splash** (the
  first sound after the silence), steam. 47.8 the burn retreats from the frame, print cleans; rolled chord.
- 49.4 push-in at the bucket; 50.2 Xiao Yi lifts the dripping can, label reads 「No. 1000」; 51.6 looks at Lao Jiao;
  52.4 Lao Jiao raises the pen arm (Xiao Yi flinches — the earlier bonk), 53.0 and pats its head instead (soft
  wood block ×2): the echo gesture. Tenderly theme.
- 56.0 dawn wide: window greying to light; 56.6 Lao Jiao stamps the red seal 「译毕」 on the can (thump); 57.6 lifts
  Xiao Yi up to the last empty slot; 59.0 the can slides in (clunk); 59.4 lamps come on along the shelves, row by row,
  each a click and a rising piano note; tint warms, print clean. Maestoso.
- 63.2 card 「您刚才看的，就是最后一卷。」.
- 67.2 「完 · THE END」; 68.0 curtains close; piano holds the last chord; 70.0 lamp off; 70.6 end.

## 7. Cue map

The score is written on the same `timeline.js` sections the picture reads; every hit is section + beat.

| Section | t0 | Tempo / metre | Cue-sheet mood | Instrumentation | Hits on beats |
|---|---|---|---|---|---|
| title | 0.0 | 96, 4/4 | Introduction | piano, theme in octaves | robot peek, blind snap (on a downbeat), nod |
| night | 7.6 | 72, 4/4 | Misterioso | piano: low tremolo, chromatic creep for the rolling | iris, each wheel turn on beats, lens glint, clock bell |
| goal | 15.0 | 72 | Misterioso (cadence) | piano | card on bar line |
| work | 18.6 | 120, 2/4 stride | Allegretto (the theme) | stride piano + trap box (wood block, bell) | grab, type clicks on eighths, bell, tube pop, stamp, bonk |
| page | 26.0 | 120 | Allegretto, thinned | right hand only, grace notes | red strike on a beat |
| hurry | 30.2 | 152, 2/4 | Hurry | piano galop, trap on every page | jam, smoke, trill, stop |
| shout | 38.8 | — | Agitato | forearm cluster, diminished tremolo | card |
| dash | 42.0 | 160 | Agitato hurry | piano, chromatic runs, ratchet | trip |
| catch | 45.2 | 160 → silence | — | silence 46.0–47.4 | hiss on 47.4, rolled chord |
| tender | 49.4 | 66, 3/4 | Tenderly (theme in major, waltz) | piano, soft | pat on beat 1 |
| dawn | 56.0 | 88, 4/4 | Maestoso (the theme full) | piano, both hands, octaves | seal, clunk, each lamp on an eighth |
| card / end | 63.2 | 66 | Tenderly → final chord | piano | 完 on a downbeat, held chord |

The exact numbers live in `timeline.js` (exported to `timeline.json`); `tools/cuecheck.py` checks every visual hit
against its beat (target 0 ms).

## 8. Sound design table

| Section | Ambience | Effects (pit trap box) | Music |
|---|---|---|---|
| title | projector start, purr | grace note peek, ratchet tug, slide whistle up, wood block nod | theme intro |
| night | projector | wheel squeaks (high wood block), triangle glint, hand bell clock | misterioso |
| goal | projector | — | cadence |
| work | projector | can clank (cowbell), ratchet thread, type clicks, carriage bell, tube pop + whistle, stamp thump, slapstick bonk + low boing | stride |
| page | projector | pen scratch (sand block) | thin |
| hurry | projector, faster purr | clicks, pops, swishes for every page, grind of the jam | galop → trill → **silence 1** |
| shout | projector | cymbal choke | cluster |
| dash | projector, film flap | ratchet for the wheel, crackle | agitato |
| catch | projector only | slapstick trip, **silence 2**, siphon hiss + splash, steam | rolled chord |
| tender | projector | drips (plinks), two soft wood blocks for the pat | tenderly |
| dawn | projector | stamp thump, clunk, a click per lamp | maestoso |
| end | projector winds down, lamp off | curtain swish | held chord |

Two silences (38.4 and 46.0); sound across cuts: the projector purr runs through every cut, the clock bell rings
over the cut into the goal card (L-cut), the hurry galop starts one beat before shot 6 (J-cut), the smoke crackle
runs under the shout card into the dash.

## 9. Titles and subtitles

- Intertitle cards (black, deco border, Noto Serif SC subset, OFL): the title (English studio card → Chinese), the
  goal (double rule, stepped corners, fans), the shout (one heavy rule, text shakes), the last card (vines and small
  flowers), the end card. Latin: Playfair Display SC and Old Standard TT Italic (OFL).
- The insert page is diegetic (a typed page with a red correction): its text is in `subtitles.srt` too.
- `subtitles.srt` lists every card's text, Chinese only (the English studio line excepted).
- Tint plan: night = cool silver (sepia 0.12), work = neutral, hurry/fire = colder and harsher (damage up, burn from
  the edges), tender = warmer, dawn/end = warmest and cleanest (sepia 0.34).

## 10. Against the library demo (written after reading `DEMO.md`)

| | Demo (*The Runaway Loaf*) | This film | Differs? |
|---|---|---|---|
| Structure | chase comedy: object escapes → chain gag → tender gift | work loop → the reel itself burns → rescue → the reel you watched | yes |
| Opening | curtains part on a dark screen, projector spins up, title, iris on the loaf | film already running; an English title card pulled away like a blind by a robot on the card | yes |
| Signature shot | locked-off chain gag (see-saw → melon → constable) | the can in the air in silence while our own print burns in, the catch, the burn retreating | yes |
| Camera path | iris, locked full, tracking, extreme wide, push-in, iris close | iris open, locked full + half iris, iris insert, push-in on the jam, tracking, locked wide, push-in, pull-back reveal | partly (shared period grammar) |
| Score shape | Maestoso → Andante → Hurry → Misterioso → Agitato → silence → reed organ → Tenderly | Introduction → Misterioso → Allegretto stride → Hurry galop → Agitato → two silences → Tenderly waltz → Maestoso with one note per lamp, plus a trap box | partly (cue-sheet idiom is the style) |
| Ending | iris closes on the girl's wink | lamps come on row by row at dawn, a card telling the audience the reel was the last one | yes |

Four of six clearly differ. Changed in production: the page insert was lengthened (13 beats) so the correction stays
on screen ≥ 3 s; the jam got a slow push-in; the dawn shot starts close on the seal and pulls back for the lamps.
