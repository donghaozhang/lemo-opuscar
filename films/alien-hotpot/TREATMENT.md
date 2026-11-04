# 外星人来吃火锅 · Treatment

Style: Sci-Fi Sitcom Toon (`styles/scifi-toon/STYLE.md`, kept whole). Inspired by adult-swim-era sci-fi sitcom cartoons; every character, prop and device below is our own.

## Brief (summed up)

- Topic: a rainy Chongqing night, a hot-pot shop about to close, two aliens crash on its roof, chilli broth turns out to be their fuel, the shop is saved, a fleet comes back for more.
- 1920×1080, 24 fps, target **139 s**. Simplified Chinese title, signs, menu, subtitles with speaker pills, `.srt`.
- No voice-over, no real-language speech. Aliens: synthesised gibberish (low/flat vs high/fast), translator: beeps, Auntie Liu: looks, plus two hummed grunts ("嗯。") — never words. Every line subtitled.
- Synth score (theremin lead, analog bass, square arpeggio, drum machine) with one genre cue per scene; hard cuts to silence for punchlines. Synth foley. −14 LUFS, TP ≤ −1 dBTP.
- No storyboard stop. No owner material: everything drawn in code. Font: a rounded OFL Chinese face (jf open 粉圓 / Huninn, OFL), thickened with a same-colour round-join stroke so it reads heavy, subset to every character used.

## 1. Three candidate structures

1. **Three-act sitcom episode (night → meal → morning).** Cold open on the dying shop, the crash as the act break, the meal as the comedy core, the take-off as the set piece, morning as the reversal, the fleet as the button. Clear set-ups and pay-offs, classic sitcom coverage.
2. **The translator's log.** The whole film as entries on the translator's VT323 screen ("日志 01: 迫降"), each entry cutting to the scene it describes, the screen mistranslating each one. Clever, but the device becomes the narrator and pulls focus from Auntie Liu, whose looks are the heart of it.
3. **Mid-disaster open.** Start on the saucer already burning in the sky, then rewind ("三小时前") to the coins. Strong hook, but a flashback breaks the night→morning light logic and spends the 「转让」 set-up after the audience already knows something big is coming.

**Chosen: 1, with a piece of 2.** The three-act shape gives the set-ups (sign, coins, empty pot, cell that flickers near chilli) room to land, and the light tells the time (night practicals → cyan fuel wash → dawn). From 2 we keep only the translator's screen as a running gag and the world tags as a terminal stamp (「重庆 · 雨夜 · 23:47」). The hook in the first 3 s is a tiny cyan streak crossing the rain sky behind the title-less opening: the saucer, already falling, that nobody in frame notices.

## 2. Logline and arc

**Logline:** On the last night of a failing Chongqing hot-pot shop, two stranded aliens order 「最辣的」 by mistake and discover the broth is the fuel their ship needs — and the shop gets a new kind of customer.

- **Setup (0–35 s):** rain, the 「转让」 sign, Auntie Liu's three coins, one pot simmering for nobody. A saucer falls; impact on the roof; title. On the roof the tall one's power cell reads 0 % — and flickers when a wisp of chilli steam drifts past (plant).
- **Turn (35–110 s):** the doorbell; two dripping aliens; the translator's 「最辣的」; the nine-grid pot; the nervous one's first bite (cold silence, steam from every opening, colour change, 「再来一盘」); the deadpan one learns 七上八下 with chopsticks as antennae; the cell glows near the pot (pay-off) — they fill it with the ladle; the glowing coin beside the three old coins; Auntie's first smile.
- **Ending (110–139 s):** take-off over the night city; morning; a queue round the block; 「转让」 torn down, 「外星人认证」 up; the fleet arrives, aliens queuing with tiny bowls; the translator's last line 「再来一盘 × 200」.

## 3. Benchmark

- **Jacques Tati, *Mon Oncle* / *Playtime*.** Learn: comedy with almost no words, gags carried by sound (a squeak, a hum, a door), deadpan held wides that let the audience find the joke, silence as timing. Don't take: shots, compositions, characters, music.
- **The food-documentary grammar of *A Bite of China* (舌尖上的中国).** Learn: food inserts that make you hungry — macro framing, steam backlit, the bubble and the sizzle on the cut, the hands of the cook. Don't take: footage, narration style, music.

## 4. Cast and devices (our own)

| Who | Silhouette | Costume idea | Colour | Voice |
|---|---|---|---|---|
| **刘姨 Auntie Liu** | short, wide trapezoid, round head with a high bun stuck through by a single chopstick | blue oversleeves (套袖) over a red apron; reading glasses on a bead chain | apron oxblood, sleeves denim blue, skin warm tan, hair charcoal with a grey streak | none: looks, two hummed "嗯" |
| **祖格 Zug** (tall, deadpan) | a 2.4-head-tall pole: long egg head, thin neck, long noodle limbs | a too-short brown necktie on a flight suit; one antenna stub with a bulb | skin slate violet, suit mustard, tie brown | low, flat, slow gibberish (~95 Hz, saturated, 180 Hz bump) |
| **皮皮 Pip** (small, nervous) | a short bean with two ball-tipped antennae, huge touching eyes | a giant red scarf wrapped up to the nose, translator on a lanyard | skin pale mint, scarf tomato; after the bite: whole body flushes red | high, fast chirpy gibberish (~260 Hz, presence boost) |
| **翻译器** the translator | a chunky beige box, one antenna, a small VT323 screen | — | beige, screen dark with amber text | beeps only |

- **The saucer**: a dented dish-shaped craft with a lid like a pot lid (it is literally a pot-lid saucer), three stubby legs; its exhaust is the only glowing thing besides the cell and the coin.
- **The power cell**: a glass cylinder with a funnel cap and a gauge 「能量」; glows **cyan (#6ff4ff)** — the style's "only glow colour". Nothing else in the film uses that hue (neons are magenta and amber).
- **The alien coin**: a hexagon that glows cyan; it is ship tech.
- The fleet: twelve saucers of the same family, different dents; queuing aliens of five new shapes (never more than one creature design per shot reads, all non-verbal).

## 5. Palettes (one per "world")

| World | Colours | Light |
|---|---|---|
| Rain city night | indigo #1f2150, violet #3a3470, wet slate #5b5a8c, amber windows #ffb648, magenta neon #ff4f9a | flat sky bands, practical windows |
| Shop interior, night | mustard wall #b88a3c in shadow #7a5a2c, oxblood #7d2630, tile cream #d8c9a0, one fluorescent tube, red lantern | warm-dark, hard shadow shapes |
| Fuel wash | the interior palette shifted cool by the cell's cyan, flat translucent ring + wash over the whole frame | changes walls, floor and figures together |
| Morning | peach #ffcfa3, sky #9fd6e8, cream #fff1d6, terracotta #d9734e | low sun, long flat shadow shapes |

Line #221432 (purple-black) and eye white #fffdf6 never change.

## 6. Shot list (framing · angle · move · duration · why)

| # | t | Shot | Framing / move | Dur | Why |
|---|---|---|---|---|---|
| 1 | 0.0 | Rain city, hillside stacks, a rail line through a building; tiny cyan streak falls behind the towers | Extreme wide, slow tilt down + push | 4.0 | establish place & night; the hook is the streak |
| 2 | 4.0 | The alley, 「老刘火锅」 sign with one flickering character | Wide, push in toward the door | 3.5 | locate the shop, show it's dying |
| 3 | 7.5 | 「转让」 taped on the door glass, rain running | Insert, static, tape corner flapping | 3.0 | set-up 1 |
| 4 | 10.5 | Auntie at the counter, empty tables, one pot simmering | Medium-wide from the door, slight push | 3.5 | the situation |
| 5 | 14.0 | Three coins slid one by one; the third rolls off | Insert, top-down | 3.0 | set-up 2 (the coins), a sound gag |
| 6 | 17.0 | Auntie close-up, heavy lids, sigh | Close-up | 2.5 | her face, the stakes |
| 7 | 19.5 | City: saucer spiralling down, sparking | Wide, whip-tilt follow | 2.0 | the event arrives |
| 8 | 21.5 | Auntie looks up, the tube flickers, dust falls | Medium, shake | 1.0 | reaction |
| 9 | 22.5 | Impact on the roof | Wide exterior, squash, big shake, block lights blink out and back | 0.75 | set piece 1 |
| 10 | 23.25 | Title 「外星人来吃火锅」 over the smoking roof | Wide, title pops in 12 fps steps on four hits | 5.0 | title on the impact |
| 11 | 28.25 | Hatch pops; Zug rises slowly; Pip springs out jittering | Medium two-shot on the roof | 3.75 | introduce the duo by contrast |
| 12 | 32.0 | The cell in Zug's hands: 「能量 0%」; a red steam wisp from the shop chimney drifts past and it flickers; Zug taps it | Insert, slight push | 3.0 | set-up 3 (cell ↔ chilli) |
| 13 | 35.0 | Doorbell; the door opens; the two dripping silhouettes; Auntie's shoulder and bun in foreground | Over-the-shoulder wide, static | 3.0 | cold silence, the meeting |
| 14 | 38.0 | Auntie close-up: one blink | Close-up | 1.5 | her deadpan |
| 15 | 39.5 | Duo two-shot: Zug speaks low; Pip raises the translator | Medium two-shot | 3.5 | the ask |
| 16 | 43.0 | Translator screen: 「修 理 飞 船」 glitches into 「最 辣 的」 | Insert, over-the-shoulder on the screen | 2.5 | the joke's engine |
| 17 | 45.5 | Auntie close-up: brow up, slow nod | Close-up | 2.0 | reaction |
| 18 | 47.5 | Menu on the wall; her finger slides down to 「最辣」 | Insert, tilt down | 3.0 | food world + the choice |
| 19 | 50.5 | The nine-grid pot set on the burner; chillies, peppercorns, nine squares boiling | Insert macro from low angle, steam backlit | 2.5 | the pot as a character |
| 20 | 53.0 | Zug's belt: the cell glows as the pot passes | Insert | 1.5 | plant pays forward (only the audience sees) |
| 21 | 54.5 | Pip lifts a piece, fist-grip chopsticks, anticipation, chomp | Medium | 2.0 | the bite |
| 22 | 56.5 | Pip close-up: **cold silence** — pupils shrink, colour climbs up from the scarf, steam bursts from antennae, ears and nose | Tight close-up, very slow push | 5.0 | punchline in silence |
| 23 | 61.5 | Zug close-up: one blink | Close-up | 1.0 | reaction 1 |
| 24 | 62.5 | Auntie close-up: arms crossed | Close-up | 1.0 | reaction 2 |
| 25 | 63.5 | Pip, red, squeaks 「再来一盘」, plate up | Medium, hard cut, music sting | 2.5 | pay-off of the silence |
| 26 | 66.0 | Zug drops tripe in, stares… it comes out a shrunk pebble | Medium two-shot across the pot | 3.0 | wrong way 1 |
| 27 | 69.0 | Auntie close-up: tiny head shake; "嗯。" | Close-up | 1.5 | reaction |
| 28 | 70.5 | Auntie demonstrates: 七上八下 — up, down, on the beat, counter 「一 … 七 / 八」 | Medium on her hands and face, slight push | 5.0 | the lesson in rhythm |
| 29 | 75.5 | Pip sticks two chopsticks on his head as antennae; the translator beeps in time | Medium | 3.0 | chopstick-antenna gag |
| 30 | 78.5 | Zug, eyes closed, chopsticks on his head twitching with her rhythm, dips in perfect sync | Two-shot, Zug and Auntie mirrored across the pot (match staging) | 4.0 | he gets it |
| 31 | 82.5 | Tripe up, perfect; Zug eats; one corner of his mouth curls | Close-up, push | 3.0 | deadpan breaks by 2 px |
| 32 | 85.5 | Zug's cell on the table next to the pot: glowing, gauge 「12%」→「38%」 | Insert | 2.5 | pay-off 3 begins |
| 33 | 88.0 | Pip moves the cell to the pot (glow up) and away (down), twice | Medium | 3.0 | the discovery by experiment |
| 34 | 91.0 | Duo look at the pot, at each other, at Auntie | Whip pan between faces | 2.0 | double take |
| 35 | 93.0 | Auntie close-up: deadpan; she slides the ladle across | Close-up → insert of the ladle | 2.5 | consent without a word |
| 36 | 95.5 | Zug ladles red broth into the cell: glug, glug; 「100%」; the cyan wash fills the whole room | Medium-wide, push | 4.5 | pay-off; light change of the whole frame |
| 37 | 100.0 | The glowing hex coin set next to the three old coins | Insert, same top-down as #5 (match framing) | 2.5 | callback to the coins |
| 38 | 102.5 | **Climax:** Auntie close-up, the coin's glow on her face; she looks to the 「转让」 sign, then back; a small smile; music drops to theremin alone | Close-up, very slow push | 6.0 | the emotional beat, held |
| 39 | 108.5 | Street: the saucer powers up on the roof; Auntie under an umbrella; Pip waves with a takeaway bowl | Wide low angle | 3.5 | set piece 2 begins; plant the tiny bowl |
| 40 | 112.0 | Saucer stretches and launches | Medium, tilt up, stretch & squash | 1.5 | the take-off |
| 41 | 113.5 | Over the city: the cyan streak rises (the opening streak reversed) | Extreme wide, crane up | 3.5 | bookend of shot 1 |
| 42 | 117.0 | Morning: the alley, a queue round the block | Wide, pull back | 3.5 | the reversal, morning light |
| 43 | 120.5 | A hand tears 「转让」 off; 「外星人认证」 goes up, coin taped beside it | Insert | 4.5 | pay-off 1 |
| 44 | 125.0 | Auntie close-up, morning light: deadpan + half smile, ladle on shoulder | Close-up | 2.0 | her new state |
| 45 | 127.0 | The sky: a fleet of saucers descends over the rooftops | Wide, tilt up | 3.0 | the button begins |
| 46 | 130.0 | The queue: aliens of five shapes with tiny bowls behind the humans; Pip and Zug at the front | Wide tracking pan | 3.5 | final gag |
| 47 | 133.5 | Auntie close-up: one blink. Silence. Translator beep: 「再来一盘 × 200」 | Close-up → insert screen | 2.0 | callback button in silence |
| 48 | 135.5 | End card 「外星人来吃火锅」·「完」 | Card | 4.0 | end |

Camera moves used: tilt, push, pull, whip pan, crane, shake, follow tilt, tracking pan (≥ 4). Signature shot: #22, the nine-opening steam silence in a tight close-up. Native moves: **duo contrast**, **hardware as junk** (a spaceship fuelled by hot-pot broth with a ladle), **rule of three** (tripe: too long, the lesson, perfect), **dead-air reversal** (#22 and #47), **callback button** (「再来一盘」).

## 7. Cue map (one timeline: `timeline.js` → `timeline.json`)

| Section | t | bpm | Bars | Instruments | Hits |
|---|---|---|---|---|---|
| rain | 0–19.5 | 80 | 6.5 × 3 s | rain bed, slow theremin over a minor analog bass, soft brushed drum-machine tick | streak at 2.5; coin clinks on beats; sigh at 18 |
| fall | 19.5–22.5 | 160 | 2 × 1.5 s | tremolo square, rising theremin glide, snare roll | impact 22.5 = **hard cut to silence** |
| title | 23.25–35.0 | 120 | ~6 × 2 s | main theme: theremin lead, analog bass, square arpeggio, drum machine | 4 title hits on beats 1–4 of bar 1; hatch on a downbeat |
| door | 35.0–38.0 | — | — | **silence**: rain, doorbell, fluorescent hum | |
| order | 38.0–50.5 | 100 | 5 × 2.4 s | elevator bossa: Karplus nylon guitar, soft Rhodes, shaker | translator beeps on the beat |
| pot | 50.5–56.5 | 120 | 3 × 2 s | drum machine build, tom fills, bass ostinato | chomp at 56.4; **hard cut** at 56.5 |
| bite | 56.5–63.5 | — | — | **silence**: bubbling, hum; steam "pfffft" at 59.8 | |
| sting | 63.5–66.0 | 120 | — | kazoo-like square sting + slide whistle | 「再来一盘」 |
| tripe | 66.0–85.5 | 120 | ~10 × 2 s | brushed swing with vibes (FM bells), walking bass, square arp | every dip on a beat; pebble "boing" |
| fuel | 85.5–102.5 | 120 → 132 | 8.5 bars | arp + theremin rising, filter opening, drum machine | 100 % at 99.0 on a downbeat |
| climax | 102.5–108.5 | 60 | free | **music drops**: theremin alone, long notes, spring reverb | smile at 106 |
| launch | 108.5–117.0 | 132 | 4.5 bars | full theme, big drums, bass up an octave at the end | launch on a downbeat at 112.0; streak up |
| morning | 117.0–130.0 | 112 | ~6 bars | toy-piano + square arp version of the theme, bright | sign tear at 121.5 |
| fleet | 130.0–133.5 | 112 | — | tremolo strings swell, brass-ish square stab | **hard cut** at 133.5 |
| button | 133.5–135.5 | — | — | silence, one blink "blip", translator beep | |
| end | 135.5–139.5 | 112 | 2 bars | final theme tag, theremin last note | |

`tools/cuecheck.py` checks every visual hit against its beat.

## 8. Sound design table

| Section | Ambience | Foley | Music |
|---|---|---|---|
| rain / alley | rain bed (band noise + drops), far traffic hiss | flickering neon buzz, tape flap, 3 coin clinks + roll + drop | slow theremin |
| fall / impact | rain | saucer whine down-sweep, sparks, sub boom, debris rattle, car alarm "beep-beep" | tremolo → silence |
| roof | rain, light | hatch "fwump", steam hiss, cell empty blink, tap tap | theme |
| door | rain muffled, fluorescent hum | door bell, door creak, drips | silence |
| order | room tone | translator beeps, glitch crackle, menu tap | bossa |
| pot / bite | burner hiss, broth bubbling | pot clunk, chopsticks clack, chomp, **steam pfffft ×4**, gulp | build → silence → sting |
| tripe | bubbling | dip splash ×8 on beats, boing (pebble), chopstick tick | swing |
| fuel | bubbling | cell hum rising with glow, ladle glug ×3, charge "ding", coin "clink-hum" | rising arp |
| climax | hum, rain far | coin hum | theremin alone |
| launch | rain | engine hum swell, launch whoosh, boom | full theme |
| morning | birds (synth chirps), street murmur (band noise) | tape rip, sign slap | toy-piano theme |
| fleet / button | murmur | many engine hums, blink blip, translator beep | swell → silence → tag |

Voices: gibberish made by a formant synthesiser (glottal pulse train through two formant bands with random vowel targets per syllable); Zug ~95 Hz, slow syllables, flat contour, saturated with a 180 Hz bump; Pip ~260 Hz, fast syllables, rising contours, presence boost. Auntie: two hummed "嗯" (closed-mouth formant, 180 Hz). Lip-sync from each line's RMS and centroid.

## 9. Subtitles and titles

- Bottom centre, Huninn (rounded, OFL) at 50 px, made heavy with a 3 px same-colour round-join stroke, white fill, 11 px black outline, a speaker pill in the character's colour on the left (祖格 violet, 皮皮 mint, 刘姨 oxblood, 翻译器 amber).
- Title 「外星人来吃火锅」: chunky letters popped in on 12 fps steps on four hits, cream fill with a tomato drop shadow and a thick purple-black outline, slight per-letter tilt — a 70s Chinese movie-poster feel, no green, no slime.
- World tags: VT323-style terminal stamps typed in top-left, coloured per world (「重庆 · 雨夜 · 23:47」, 「次日 · 07:30」).
- Signs drawn in the same rounded face: 「老刘火锅」, 「转让」, 「外星人认证」, menu.

## 10. What differs from the demo (filled in after reading DEMO.md)

See the end of this file.

### Not the demo again (written after reading DEMO.md)

| | Demo (*Coffee Run*) | This film |
|---|---|---|
| Structure | errand through parallel worlds, rule of three → montage | one place over one night and a morning; a three-act sitcom episode |
| Opening | cold open on an empty coffee pot, dialogue | rain city wide with a falling streak nobody notices; no dialogue for 28 s |
| Signature shot | rush-zoom portal swirl wipes | the cold-silence close-up of Pip, colour climbing up from the scarf, steam from every vent |
| Camera path | lab → worlds → lab, same framing per world | city → alley → interior coverage (OTS, CUs, inserts, whip pan) → street → city → morning alley |
| Score shape | 120 bpm theme + one motif per world | tempo arc 80 → 160 → 120 → 100 → 120 → 60 → 120, four hard silences, A minor theme turning A major at the fuel moment |
| Ending | decaf reversal, callback line, end card | a fleet queuing with tiny bowls; the translator's 「再来一盘 × 200」 in silence |

All six differ. The one shared grammar is the style's own (duo contrast, reaction close-ups, a cold pause).

### Decisions made without the owner (cloud brief)

- Font: Huninn (jf 粉圓) has no simplified glyphs (锅 认 证 转 让 庆 missing), so the film uses ZCOOL KuaiLe, a rounded heavy OFL face with full coverage, thickened with a same-colour round stroke.
- Film length 145.4 s (the order scene grew by one bar so that every on-screen text holds long enough to read).
- Auntie Liu never speaks words: two hummed lines (「嗯。」, 「七上八下。」) are a closed-mouth hum, subtitled.
