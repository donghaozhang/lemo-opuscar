# TREATMENT — 《愚公移山》 *The Old Man Who Moved the Mountains*

Woodcut Print · 1920×1080 · 24 fps · 145.4 s · Simplified Chinese margin captions, no voice.
Written before opening the style's `DEMO.md` or demo code. `timeline.json` is the single source of truth for every
time below (`python3 tl.py` prints it); this file explains the choices.

---

## 1. Three candidate structures

1. **A woodcut novel, plate by plate (chronological).** Each shot is one self-contained plate that carves itself; the
   fable runs in its classical order (the detour → the decision → the dig → a year → the mockery → the answer →
   Heaven → the giants → the open road). Captions are short fragments of the Liezi text, set in the margin like plate
   captions. *Strength:* the fable's own rhetoric (setup, scoffer, answer, miracle) is already a perfect three-act
   shape; the wordless-novel grammar is native to the style. *Risk:* a list of plates; needs rhythm and a through-line.
2. **The same block recut.** One single mountain block is re-carved scene after scene: every season the knife takes a
   little more; the giants' scene is the knife taking all of it. *Strength:* one image, time made visible, ending is
   the block emptied. *Risk:* no room for faces, close-ups, the boy, the scoffer — the brief demands coverage.
3. **Two routes (before/after).** Open on the knife cutting the winding detour on a map, end on the knife cutting the
   straight road; everything in between is the cost of turning one line into the other. *Strength:* a bookend the
   audience reads at a glance. *Risk:* abstract; the people get lost.

**Chosen: 1, with 2 and 3 folded in.** The plate-by-plate novel carries the characters and the coverage; the mountain
plate is **re-cut each season** (structure 2) so the seasons montage shows the notch growing; and the film is
**bookended by two knife-drawn routes** on the same map plate (structure 3): the winding detour at 0:20, the
straight road at 2:16. The opening image is not the mountains but the **knife itself cutting the title backwards
into black wood** (hook in the first second: the first gouge, loud), pulled as a true print — so the style's own
mirror reversal is the first thing the film teaches, and the ending answers it.

## 2. Logline and arc

**Logline:** A ninety-year-old man whose door faces a mountain decides to carry it to the sea one basket at a time;
everyone laughs except a gap-toothed seven-year-old — and his answer, that his family will never end but the
mountain will never grow, moves Heaven to cut the mountains out of the world.

- **Setup (0:08–0:54):** the wall of rock outside the door; the long detour to market; the night council by the
  lamp; dawn; picks on rock; the boy with his tiny basket and his single pebble; earth falling into the far sea.
- **Turn (0:54–1:42):** a year of seasons on one re-cut plate — and the pull-back shows the notch is a scratch. The
  Wise Old Man laughs, plucks a blade of grass. Silence. Yu Gong's answer, held in close-up, one low string:
  sons, grandsons, an endless line of carriers drawn out of his own beard and into the distance.
- **Ending (1:42–2:25):** the mountain's stone face takes fright; Heaven's light; true silence; two giants; the knife
  cuts the mountains out of the block, light floods; the first colour of the film, sunrise red, on the open road
  south. The scoffer speechless; Yu Gong at peace; the boy runs down the new road with his tiny basket; the knife
  cuts the straight road on the map; 完.

## 3. Benchmark

- **Chinese New Woodcut Movement (1930s–40s: Li Hua, Gu Yuan, Huang Xinbo)** — *learn:* labour shown with weight
  (bent backs, the diagonal of the swung tool), peasants as heroic silhouettes, sky carved in long sweeps, the white
  of a face against black wood. *Don't take:* any plate, composition or figure.
- **Frédéric Back, *The Man Who Planted Trees* (1987)** — *learn:* patient labour as the subject, seasons passing on
  the same landscape to make decades readable, the scale reveal at the end. *Don't take:* its look, story, shots or
  music.
- (Style's own references — Masereel, Ward — for the wordless-novel sequencing only.)

## 4. Characters (all drawn in code; model and expression sheets in `stills/`)

| Who | Silhouette | Face (skin carved white, features black) | Expressions needed |
|---|---|---|---|
| **愚公 Yu Gong**, 90 | short, bent back, huge flowing white beard (V-gouge strands), topknot with a pin, knotted staff/hoe, wide sleeves | big brow ridges, deep-set eyes with clear pupils, crow's feet, long bushy brows that droop | weary, determined (brows down, jaw set), warm laugh, calm resolve (eyes lifted, still), serene smile (eyes closed) |
| **小儿 the boy**, 7 | tiny, round head, two tufted hair-buns, short jacket, bare feet, a tiny basket on a string | round eyes, big pupils, **gap in the front teeth** (始龀) | eager grin (gap teeth), pout (angry/hurt), wonder |
| **智叟 the Wise Old Man** | tall, thin, a tall scholar's hat, long straight robe, a folding fan, pointed thin moustache and goatee | narrow eyes, arched brows, long nose | smug smile, belly laugh (head back, eyes squeezed), sneer, speechless (jaw dropped, eyes wide, brows up) |
| **sons & grandsons** | broad shoulders, head cloths, picks and carrying poles | medium shots only | effort |
| **山神 the mountain spirit** | a face in the rock of the cliff, two snakes in its "hands" (rock outcrops) | stone eyes opening, then widening in fright | calm → fright |
| **two giants (夸娥氏二子)** | colossal dark figures, only shoulders and backs, carved by rim light | none | — |

## 5. Shot list

Framing: W wide, F full, M medium, CU close-up, ECU extreme close-up, INS insert, OTS over-the-shoulder.
Every plate carves itself in (coarse U-gouge first, V-gouge and knife after) unless noted; a hard cut is a new
impression (two frames of misregistration).

| # | t (s) | Framing / angle | Camera | Why |
|---|---|---|---|---|
| T1 | 0.00–4.00 | ECU block, glossy black wood | track with the knife tip | Hook: the knife is the narrator. Title 愚公移山 cut **mirrored**. |
| T2 | 4.00–5.50 | the block, then paper | paper transition (brayer, sheet down, baren, peel toward camera) | The mirror becomes true: the style's grammar taught once. |
| T3 | 5.50–8.00 | locked plate, title read true | locked | Reading time. Margin: 列子·汤问. |
| B1 | 8.00–12.17 | extreme W, two mountains filling the sky | slow pull-back + crane down | Scale of the obstacle; carved sky sweeps. |
| B2 | 12.17–14.67 | W, a tiny cottage at the foot; its door faces sheer rock | push in to the door | Plant the problem: the door is blocked. |
| B3 | 14.67–18.00 | F/M, Yu Gong opens the door, steps out with pole, nose almost on rock, looks up, up | locked, then his head tilts | Physical comedy; introduce him (caption: 年且九十). |
| B4 | 18.00–20.50 | low angle up the cliff | tilt/crane up to the summit lost in cloud | Show how high: his POV. |
| B5 | 20.50–25.50 | map plate (overhead) | track with the knife tip along the winding detour | The detour: the house, the two mountains, the market far south; a tiny walker; three moons (stab cuts) mark nights. Bookend #1. |
| B6 | 25.50–28.00 | CU Yu Gong at dusk, sweat, frown → brows lower, decision | slow push | The decision on a face. Hard cut on the downbeat. |
| C1 | 28.00–31.57 | M interior night: family round an oil lamp, Yu Gong slams a fist and points | locked, lamp-lit | **Night** = practical lamp, dark walls; carved light radiates from the flame. |
| C2 | 31.57–33.71 | M group reaction: sons and grandsons nod, one raises a pick | small push | Consent (杂然相许). |
| C3 | 33.71–35.86 | W dawn: the family marches out in silhouette, tools on shoulders, low sun rays | pan with them | **Dawn** = long carved rays from the horizon; figures black on white sky. |
| C4 | 35.86–37.29 | INS: pick strikes rock, stab-cut sparks | snap zoom & hold | The first blow. Anticipation 4 frames, 2-frame strike, settle. |
| C5 | 37.29–40.14 | M: sons swinging, grandsons loading baskets, rhythm | slow track right | Toil on the beat. |
| C6 | 40.14–43.71 | F: the boy runs in from the right with a tiny basket, skids to a stop beside the tall sons | follow pan, ease to stop | **Set-up**: the boy and his basket. Squash on the skid. |
| C7 | 43.71–46.57 | CU boy: gap-toothed grin, holds his tiny basket up beside his face; a big old hand drops ONE pebble in | locked | **Set-up** of the tiny basket; comedy of scale. |
| C8 | 46.57–48.71 | M two-shot: Yu Gong laughs, pats the boy's head | locked | Warmth; their bond. |
| C9 | 48.71–51.57 | extreme W: a line of carriers on poles across the plain to the far sea | slow pan left → right | Distance: the round trip is long. |
| C10 | 51.57–53.71 | INS: a basket tips, earth falls into the waves, splash | locked, waves boil on twos | Where the earth goes (setup: the sea). |
| D1 | 53.71–56.84 | W, the **same mountain plate**, spring: blossom branch in foreground, diggers small | locked | Same block recut #1. |
| D2 | 56.84–59.34 | same plate, summer: carved sun rays, heat | locked | recut #2 (hard cut, new impression). |
| D3 | 59.34–61.84 | same plate, autumn: wind, leaves streaming | locked | recut #3. |
| D4 | 61.84–64.34 | same plate, winter: snow stabs, carriers bent | locked | recut #4. Caption: 寒暑易节，始一反焉. |
| D5 | 64.34–68.71 | from the notch the family dug (it looks big) **pull back** until it is a scratch on an enormous mountain | continuous pull-back | Scale reveal; the comedy that sets up the mockery. |
| E1 | 68.71–71.44 | W, frame in a frame: through willow branches, 智叟 strolls along the river bend with a fan | locked, he walks in | Introduce the scoffer, at a distance. |
| E2 | 71.44–74.17 | CU 智叟 laughs: head back, eyes squeezed, moustache bouncing | small shake on laughs | Mockery, on the woodblock "laugh" motif. |
| E3 | 74.17–76.90 | INS: his thin fingers pluck ONE blade of grass from the slope, hold it up, it flutters away | snap zoom & hold | 曾不能毁山之一毛 made visual. |
| E4 | 76.90–79.62 | OTS: over 智叟's shoulder (hat, ear, collar, back of head) to Yu Gong and family below | locked | Power: the scoffer looks down. |
| E5 | 79.62–82.35 | CU boy: pout, clutches his tiny basket, glares | locked | Reaction: the child is the only one angry. Music drains away. |
| F1 | 82.35–87.91 | CU Yu Gong, head ≈ 55% of frame: he exhales (长息), eyes lift slowly to camera | very slow push in | **Climax.** Near-silence, then one low string. |
| F2 | 87.91–93.46 | paper peel from his face to a plate of generations: a son, a grandson, a great-grandson, each carrying a basket | peel (rack between two plates) | The line of descent printed over him. |
| F3 | 93.46–97.91 | the line of carriers recedes to infinity along the mountain road | continuous pull-back as cuts spread | "Without end": the carved line becomes a world. |
| F4 | 97.91–102.35 | ECU Yu Gong's eyes, calm, unblinking; then the mountain above, not one cut taller | locked, hold | The argument lands. |
| G1 | 102.35–104.02 | CU 智叟: smile fades, fan stops | locked | Reaction beat. |
| G2 | 104.02–107.35 | M: the cliff face; stone eyes open in the rock, then widen in fright; two stone snakes recoil | snap zoom & hold | The mountain spirit hears. |
| G3 | 107.35–110.68 | crane up into the clouds: carved radial light from above | crane up | Heaven is moved. |
| G4 | 110.68–112.35 | black uncut wood, nothing | locked | **True silence** before the loudest moment. |
| H1 | 112.35–114.85 | extreme W: two colossal giants rise behind the mountains, shoulders under the peaks | low angle, slight push | **First hit** after silence: tam-tam + gran cassa. |
| H2 | 114.85–121.52 | **signature shot**: the giant knife sweeps through the plate; the mountains are cut away from the block in great U-gouges as the giants lift them; light floods | pull back as cuts spread | The giants' work = the carver's knife. |
| H3 | 121.52–125.68 | W: the open road to the south; the sun rises; **red appears for the first time**, glowing out of the carved white | slow crane down onto the road | The one colour, saved for this. |
| I1 | 125.68–127.91 | CU 智叟 speechless: jaw dropped, eyes wide, fan slipping | snap zoom & hold | Pay-off of the mockery. |
| I2 | 127.91–130.13 | CU Yu Gong, eyes closed, serene smile, red rim light on his beard | locked | Peace. |
| I3 | 130.13–135.68 | W/F: the boy runs down the new road toward the red sun with his tiny basket (the one pebble bouncing in it) | tracking with him, then he runs away from camera | **Pay-off** of the basket. |
| I4 | 135.68–139.57 | the map plate again: the knife cuts a straight line from the house to the market; the red sun on the edge | track with the knife tip | Bookend #2 (the detour answered). |
| I5 | 139.57–145.35 | end plate: 完 carved, peel | locked | Closing print. |

## 6. Beat sheet (second by second, summary)

- **0.0** first gouge (loud knife-in-wood), track the knife writing 移山愚公 backwards. **4.0** brayer; **4.6** paper down; **5.0** peel; **5.5** title reads true, struck-metal ding.
- **8.0** first plate: mountains carve in (sky sweeps first). Low drone + pizz bass. **12.2** cottage; **14.7** door creak, Yu Gong bumps nose-to-rock, looks up (comedy pause). **18.0** tilt up. **20.5** knife draws the detour; footsteps patter; moons stab in. **25.5** CU decision on the downbeat.
- **28.0** lamp-lit council (lamp flicker sound, fist thump on 28.6). **31.6** nods. **33.7** dawn march (bar of frame drum). **35.9** first pick strike on the downbeat — CLANG + sparks. **37.3** toil on every beat. **40.1** the boy's patter, skid on beat 3. **43.7** CU grin; pebble drops into tiny basket (a single "tik" on woodblock) at 45.4. **46.6** laugh/pat. **48.7** procession to the sea, wind. **51.6** earth into the sea, splash on the downbeat.
- **53.7** seasons, tempo 96, a timpani hit on each cut (53.7, 56.8, 59.3, 61.8); **64.3** pull-back, music holds one chord; at 67.5 a lone pizzicato "plink" (the scratch).
- **68.7** 智叟 strolls (pizz staccato, woodblock); **71.4** laugh (woodblock tok-tok-tok on the laugh shakes); **74.2** the blade of grass, flutters off on a flute-less whistle of wind; **76.9** OTS; **79.6** boy pouts — music drains out bar by bar.
- **82.4** near-silence (wind only), Yu Gong's breath out (low noise swell) at 83.0; **83.5** one low cello note enters (D2), sustains under the whole answer. **87.9** peel; **88.6** caption 子又生孙; **93.5** the chain pulls back; **97.9** ECU; the note swells slightly, then ends at 102.0.
- **102.4** 智叟's fan stops (one woodblock tick). **104.0** stone eyes open (grinding rock), snakes hiss (filtered noise), tremolo strings. **107.4** heaven: timpani roll crescendo + struck metal. **110.7** cut to black: **true digital silence 1.67 s**.
- **112.35** TAM-TAM + gran cassa + low unison D (the loudest sound). Giant footfalls (sub thumps) 113.2, 114.0. **114.85** knife sweeps: each gouge a huge wood-tearing rasp on beats; rock rumble; strings rising D dorian → D major. **121.5** red sunrise: bright struck-metal chord, drone opens.
- **125.7** finale tempo 108: frame drum + woodblock dance; 智叟 jaw-drop on 125.9 (a "bonk" of log drum). **127.9** Yu Gong smiles. **130.1** boy runs; patter on beat. **135.7** knife cuts the straight road (one long cut sound). **139.6** 完 carved; tam-tam ring and paper peel; music resolves; ring-out to 145.4.

## 7. Cue map

| Sec | t | Tempo / grid | Instrumentation | Hits |
|---|---|---|---|---|
| A title | 0–8 | 60 bpm, 8 beats | knife foley; drone fades in at 4.0; struck metal at 5.5 | peel 4.0, print 5.5 |
| B detour | 8–28 | 72 bpm, 6 bars of 4 | contrabass pizz walking (D dorian), log drum on 1 & 3, hurdy-gurdy-like drone on D, wind bed | every cut on a beat; the bump at 15.8 (beat 1.4 of B3 + rest) |
| C dig | 28–53.7 | 84 bpm, 9 bars | C1–C2 drone + soft frame drum; from C3 spiccato cello ostinato, log drum, woodblock on pick strikes, frame drum | first pick 35.86 (downbeat); pebble 45.4; splash 51.57 |
| D seasons | 53.7–68.7 | 96 bpm, 6 bars | ostinato continues faster, cello motif, timpani on each season cut; D5 a held chord, a lone pizz plink | cuts 53.71/56.84/59.34/61.84/64.34 |
| E mockery | 68.7–82.4 | 88 bpm, 5 bars | pizzicato staccato "mocking" falling figure, woodblock laugh, log drum; thins out bar by bar from 76.9 | laugh hits 71.8–73.5 |
| F answer | 82.4–102.4 | 54 bpm, very slow | **one low string** (cello D2, then contrabass D1 doubling only in the last 4 beats), wind bed only | breath 83.0, string 83.5 |
| G heaven | 102.4–112.35 | 72 bpm | tremolo low strings, struck metal shimmer, timpani roll; **digital silence** 110.68–112.35 | stone eyes 104.5, fright 105.8 |
| H giants | 112.35–125.7 | 72 bpm, 4 bars | tam-tam, gran cassa, timpani, low strings in octaves (D), log drums for footsteps; modal shift to D major at 121.5 | hit 112.35; knife gouges on beats of H2; red 121.52 |
| I finale | 125.7–145.4 | 108 bpm, 7½ bars + ring | bright D major dance: frame drum, woodblock, pizz bass, cello melody, drone; ending tam-tam + struck metal chord, ring out | 125.68, 130.13, 135.68 (knife), 139.57 (完) |

Every cut lands on a beat of its section (they are built from beats in `timeline.json`); `tools/cuecheck.py`
checks that every key visual hit in `EV` lands on its musical cue (target 0 ms).

## 8. Sound design table

| Section | Ambience bed | Main Foley | Music state |
|---|---|---|---|
| A | room tone of a workshop, faint | knife into wood (transient + fibre tearing), chips, brayer tack, paper air, baren rasp, wet peel | drone enters, a struck-metal ding |
| B | mountain wind | door creak, nose-bump "tok", footsteps on the long road, pole creak | pizz walk, log drum, drone |
| C | night: lamp flicker / crickets; dawn: wind & birds-less hush | fist thump, picks and hoes on rock (clink + thud), baskets (wicker creak), earth pouring, the boy's bare-foot patter and skid, pebble tik, the sea (waves) | toil ostinato |
| D | season beds: spring breeze, summer cicada-like buzz (filtered noise), autumn gusts, winter howl | picks distant, crunch in snow | faster, timpani at cuts |
| E | river (soft water), wind | fan flicks, grass pluck, wind takes the blade | mocking pizz + woodblock, draining |
| F | wind only, very low | the long breath | one low string |
| G | rock groan | stone grind, snake hiss, Heaven shimmer | tremolo, timpani roll → digital silence |
| H | huge sub rumble | giant footfalls, rock tearing, the giant knife (enormous gouge rasps), falling scree | the loudest tutti, then major |
| I | morning wind, faint | fan drops, the boy's patter, basket rattle, straight long knife cut, peel | bright dance, ring-out |

Silences: (1) 82.4–83.5 near-silence before the answer; (2) 110.68–112.35 digital silence before the giants.
J/L cuts: the sea's waves start under C9 before the insert; the mountain wind runs over the T3 → B1 print; the
giants' rumble starts under G3 (J-cut); morning wind carries from H3 into I1.

## 9. Subtitle and title design

- **Title**: 愚公移山 carved out of the black block in Noto Serif SC Black (OFL), mirrored while the block is shown,
  true after the peel. Below it in the margin, small letterpress: 列子·汤问.
- **Captions**: classical lines from 《列子·汤问》 (public domain), ≤ 14 characters each, letterpress in the bottom
  paper margin (Noto Serif SC SemiBold, ≈ 44 px, ink, through the print shader); ink up in 0.1 s, fade 0.15 s; never
  on the image. The `.srt` carries the same lines with the same timings. Hold ≥ characters ÷ 4.5 + 1.5 s (all pass in
  `tl.py`).
- **End**: 完 carved white out of a black panel, small.
- No voice (no TTS on this machine, per the brief).

## 10. The one colour

**Sunrise red** (a vermilion, #c8331f-ish on paper), on the colour plate, printed **only where white is carved**.
It is withheld for 121.5 s and appears first on H3's sun and the open road; it then stays as a highlight (rim light
on Yu Gong's beard in I2, the sun behind the running boy in I3, the sun on the map in I4) and is the last colour seen.

## 11. Production notes

- Technique to learn from the demo engine after this treatment: carving masks, the WebGL print compositor, the
  paper peel, `woodcutFilter` for sculpted close-ups (faces in CU will be height-field sculpts filtered into cuts,
  with eyes drawn as clear black shapes on white skin so they read at a glance).
- Characters on twos; camera on ones. Every plate carves in over its first 0.4–1.2 s (coarse first), then holds and
  animates.
- Checks: model + expression sheet, style frames, contact sheets at 1 fps (two passes), 0.2 s strips of the key
  actions (pick strike, pebble, laugh, the answer, the knife), `cuecheck`, `readcheck`, loudness, blackdetect (G4 is
  black wood with grain, not digital black — it must not trip blackdetect at the default threshold, checked), CJK glyph
  coverage.
