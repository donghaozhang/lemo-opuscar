# 《外卖勇者》 — Treatment

16-bit Pixel RPG · 1920×1080 (320×180 × 6) · 24 fps · ≈ 148 s · Simplified Chinese on screen · no voice-over.

## 1. Three candidate structures

1. **One quest, four encounters (the console RPG run).** The city as an overworld, the order as a quest, every obstacle a random encounter, a boss, a cut-scene ending, a save point. Funny because the systems take a rider's night completely seriously; moving because the last "battle" is not a battle at all and the HUD (battery = HP, clock = timer) runs out exactly when it matters.
2. **A countdown told through the HUD.** Locked frame on the phone screen; the whole journey is seen as notifications, a map dot, a draining battery and messages, cutting out only at the door. Clear and economical, but it throws away the overworld, the battles and the character acting the brief asks for.
3. **The save file in reverse.** Open on the save screen at 00:01 (「幸福里 28F」), then the save slot "thumbnail expands" into the night and the film explains how he got there. A good hook, but it gives the ending away and blunts the grandson reveal.

**Chosen: 1**, with two borrowings: the HUD of 2 is the film's clock and pulse (the battery and the time are on screen the whole way and drive the climax), and the save screen of 3 is the ending, not the opening. The opening is a **boot-like ping**: a sleeping rider in the rain, the phone rings, a quest box types. The ending is **the save screen + a level-up** answered by a last overworld shot after the rain has stopped.

## 2. Logline and arc

At 23:40 in the rain, a delivery rider takes the night's last order — one bowl of longevity noodles before midnight — and fights his way across a city that plays like a 16-bit RPG, only to find the final "enemy" is an old woman's loneliness, which he beats with a song and the last 9 % of his battery.

- **Setup (0–32 s):** 小满 asleep on his e-bike; the order arrives (长寿面 × 1, 幸福里 2803, 备注「请帮忙插一根蜡烛」); quest accepted; items shown: 雨衣, 充电宝, 备用雨伞 (the three set-ups); title; the city as an overworld; battery 41 %, clock 23:43.
- **Confrontation (32–99 s):** four encounters, each a different joke about the same system: the red light that can't be fought or fled (you can only 等待); the flooded underpass (he wins, but the phone takes water: HP −12 %); the soaked kid at the bus stop (not a battle — he gives away the spare umbrella; the item list greys it out); the guard dog 大黄 whose battle is won by a command that only appears when you look (摸摸); the boss: the lift is broken, 28 floors of dark stairs; the flashlight eats the battery, the power bank saves him at 23:58.
- **Turn (99–137 s):** 23:59, door 2803. The old lady 林奶奶 opens; there is no candle; it is her birthday and she is alone. He looks at 9 %, the menu cursor stops bobbing (he hesitates), he picks 手电筒 and holds the phone upright over the bowl like a candle, and sings. 00:00. She "blows it out" and the phone dies at that instant: HP 0 %, but no GAME OVER.
- **Ending (137–148 s):** footsteps in the dark stairwell; a red umbrella comes up the stairs: 小豆, the kid from the bus stop, is her grandson. Save point; 「小满 升级了！ 温暖 +1」. The rain stops; he rides off under stars.

**Set-ups → pay-offs (every one planted on screen, readable):**

| Set-up | Where | Pay-off |
|---|---|---|
| 备注「请帮忙插一根蜡烛」 on the order | phone insert, 6 s | no candle at the door → the phone flashlight is the candle |
| Battery 41 % (HP), shown in the HUD in every travel and battle shot; flashlight drains it on the stairs | open, battles, boss | 9 % at the door; the "candle" uses the last of it; it dies on the blow-out |
| Clock 23:40 HUD, jumps while waiting at the red light | open, red light | 23:59 at the knock; 00:00 while he sings |
| 备用雨伞 in the item list (a red icon) | equip menu | given to 小豆 (greyed out in the list) → the red umbrella climbs the stairs at the end |
| 小豆: yellow boots, green dino backpack, cowlick, name tag in the dialog box | bus stop | same silhouette and umbrella in the stairwell; the name tag 「小豆」 on 「奶奶！」 |
| 林奶奶 tells the rider "孙子说要来，我叫他别来了，雨太大" (one line) | door | the grandson comes anyway |
| 充电宝 in the item list | equip menu | used at 23:58 on the stairs: "+20 %", without it the phone would already be dead |
| 大黄 the dog | gate battle | wags in the last overworld shot as he passes |

## 3. Benchmark

- **A modern-town console RPG of the mid-90s whose enemies are everyday things** (EarthBound, 1994) — *learn:* deadpan battle messages about ordinary life, enemies that are objects, a battle won by a non-violent command, the HUD as a character. *Don't take:* its characters, its font, its psychedelic battle backgrounds, its sound effects, its melodies.
- **Sprite cut-scenes of the 16-bit era** (Chrono Trigger, 1995) — *learn:* tiny sprites acting with anticipation, hops, head turns and a single held pose; the text box with a portrait as the close-up. *Don't take:* designs, UI frames, music.
- **To the Moon (2011)** for the ending — *learn:* restraint: the music drops out, the UI goes quiet, a held two-shot carries the feeling. *Don't take:* anything specific.

## 4. Look and palette plan

- **Master palette:** ENDESGA-32-like night ramp (32 indices, my own set: deep navies and slate for the night city, a warm ramp — amber, orange, rust, plum — that survives every remap), plus **two protected indices**:
  - **P-RED** (the umbrella): exempt from fades and the phone-death darkening; it is the thread: equip menu icon → bus stop → stairwell.
  - **P-GOLD** (warm home light): the quest marker window on the overworld, the light spilling from door 2803, the noodle steam glow. Everything else in the night is blue.
- **Rain by colour cycling:** rain streaks are drawn once with four cycle indices (C0–C3); the LUT rotates them at 12 fps, so the rain falls without redrawing. Puddle ripples and the 面馆 neon use their own cycling groups.
- **Palette swap at midnight:** after the kid arrives the "rain" palette is swapped for a "clear night" palette (cycle indices map to transparent background colours, the sky lifts one step, stars appear): the rain has stopped without anything moving.
- **Fades by steps** (4 levels), never alpha: open from black, into the battle (encounter swirl to white), the phone-death beat (two steps darker except the protected colours and the door light), the end.
- **Light tells the time:** night grounds are dark navy/slate; every practical source is a Bayer-thresholded ring of LIGHT[] stepping: street lamps, the noodle-shop neon, the bike headlight cone, phone screen glow on the face, the stairwell's sound-activated lamps, the warm door spill. No dawn: the film ends at 00:01, and its "new light" is the cleared night sky and the warm window.
- **Characters** (rig + parametric faces, all drawn in code on the native grid):
  - **小满**, 24, rider: orange helmet with a stubby antenna flag (silhouette mark), black hair tuft out the back in 3 spikes, navy jacket, big square delivery box on the bike. Raincoat: translucent-looking teal with a hood that blows over his face.
  - **林奶奶**, 79: silver bun with a red-wood hairpin, round glasses on a chain, plum cardigan, small and bent; warm eyes with lots of lid.
  - **小豆**, 8: big cowlick, yellow rain boots, green dino backpack with spikes (silhouette), soaked, later under the red umbrella.
  - **大黄**: a fat yellow mutt with one floppy ear.
- **Close-ups:** cinematic busts drawn natively at large size (head 64–80 px of 180, i.e. 36–44 % of frame height) with the same parametric face as the 32×32 dialog portraits: eye white, pupil with a 1-px highlight, upper/lower lids, a 2–3 px brow; expressions: neutral, sleepy, startled, determined, dread, deadpan, tired, soft, tearful smile, cheeky wink (rider); sad-wet, joyful (kid); surprised, wistful, tearful, overjoyed (lady). Checked on `stills/model-sheet.png` and `stills/expressions.png` before animating.

## 5. Shot list

Framing: W wide, F full, M medium, C close (bust), I insert. Durations are targets; `timeline.js` holds the exact grid.

| # | t (s) | Dur | Framing / angle | Camera | What happens | Why |
|---|---|---|---|---|---|---|
| 1 | 0.0 | 3.5 | W street, side, eye level | locked; palette fade-in by steps | Rain (cycling), 面馆 neon flickering, 小满 asleep on bike under awning, snore bubble; 23:40 HUD. Ping at 1.6 → he jolts (stretch), helmet pops up, lands (squash) | hook in 2 s: sound + a physical gag |
| 2 | 3.5 | 2.0 | C 小满, 3/4 | small push-in (2 px) | sleepy → startled eyes, phone glow on his face | first face at full size |
| 3 | 5.5 | 6.0 | I phone screen in his hand | mosaic zoom in | order card types: 长寿面×1 / 幸福里3栋2803 / 备注：请帮忙插一根蜡烛 / 🔋41% | plants the candle, the address, the battery |
| 4 | 11.5 | 4.5 | M 小满 on bike, quest window on top third | locked frame, UI on one third | 「任务：午夜前送达长寿面」 types; 接受 / 拒绝, cursor → 接受, ding | the system speaks; the choice |
| 5 | 16.0 | 4.0 | W overworld, top-down | slow pan right | title 《外卖勇者》 Bayer-dissolves in, held 4 s; gold window marker far away | the whole world, where things are |
| 6 | 20.0 | 5.0 | M side, menu on right third | locked | item menu slides in: 雨衣 · 充电宝 · 备用雨伞; equip 雨衣 → he pulls it on, the hood blows over his face, he swats it back | plants the 3 items; first physical comedy |
| 7 | 25.0 | 3.0 | F side | locked → bike exits frame | crouch, hop, lands on seat (squash), suspension bounce, headlight on, takes off | anticipation-action-follow-through |
| 8 | 28.0 | 4.0 | W overworld top-down | follows bike (integer px) | bike along the road, route dots to the gold window; HUD 41 % · 23:43; "!" over head, encounter swirl | travel, then danger |
| 9 | 32.0 | 3.3 | Battle side view | locked, enemy slides in | 「红灯 拦住了去路！」 the traffic light with a stern face, arms folded, counter 99 | conflict as a system |
| 10 | 35.3 | 3.2 | Battle, menu bottom | cursor | cursor drifts to 攻击, hovers, stops; 小满 shakes head; moves to 逃跑 → 「不能闯红灯！」 buzz, he's yanked back | the gag: no legal move |
| 11 | 38.5 | 3.3 | Battle → C 小满 inset | — | 等待: 「小满 等啊等……」 clock 23:44 → 23:47 in jumps, foot taps, yawn; counter hits 1 → resets to 99, light smirks | timing gag |
| 12 | 41.8 | 3.0 | Battle | screen shake small | the light turns green with an embarrassed face; 「绿灯 亮了！」 victory jingle; 经验 +0 | release |
| 13 | 44.8 | 4.0 | F side-scroll, 3 parallax layers | track with bike | rain, neon, puddles splashing, speed lines | journey; pace up |
| 14 | 48.8 | 6.4 | Battle: 积水地道 | shake 3-2-1 | water blob monster rises; 全速冲刺! bike charges, splash, -999; spray hits the phone 「手机进水了！」 HP 38 → 26 ticks | fast, physical |
| 15 | 55.2 | 3.0 | W bus stop | locked | soaked kid alone, shivering (2-frame), rider skids to a stop | new beat, slower |
| 16 | 58.2 | 4.0 | M two-shot | locked | kid portrait (sad, wet) 「公交停了……我走过去。」 | the need |
| 17 | 62.2 | 3.5 | M two-shot, menu right | cursor | 备用雨伞 → 给 小豆？ → 是; the red umbrella pops open over the kid (squash/stretch) | the gift, protected red |
| 18 | 65.7 | 2.5 | C 小豆 | — | joyful: 「谢谢叔叔！」 | the face we must remember |
| 19 | 68.2 | 2.6 | W | locked, kid exits | kid runs off, umbrella bouncing; top line 「备用雨伞 已赠送」 | game UI as narration |
| 20 | 70.8 | 1.6 | W overworld, gate of 幸福里 | pan | "!" swirl | rhythm |
| 21 | 72.4 | 3.2 | Battle: 大黄 | shake | 「大黄 汪汪汪！」 rider jumps (stretch), 惊吓 −1 % | gag set |
| 22 | 75.6 | 3.2 | Battle, menu | cursor | new command 「摸摸」 blinks in; pat → hearts | gag turn |
| 23 | 78.8 | 2.4 | Battle | — | dog rolls over, tail wag (follow-through); 「大黄 成了朋友！」 | pay the gag |
| 24 | 81.2 | 3.0 | M lobby | locked | lift with sign 电梯维修; he jabs the button: buzz buzz buzz | boss intro, comic |
| 25 | 84.2 | 1.5 | C 小满 | — | dread, sweat drop | reaction |
| 26 | 85.7 | 4.5 | W stairwell, low angle | integer tilt up 28 floors | dark spiral of flights, floor numbers to 28F, one gold window at the top; 「BOSS 二十八层楼梯」 | awe, scale; the signature shot |
| 27 | 90.2 | 3.0 | Battle frame | — | boss HP bar "28 层"; 大喊 → 声控灯 亮了！ (light pops on, sound) | system joke |
| 28 | 93.2 | 4.5 | F diagonal climb | track up | flights scroll, floor counter 7F → 22F, bowl held level, sweat; flashlight HP drains to 4 %; 充电宝 +20 % jingle; 23:58 | montage, acceleration |
| 29 | 97.7 | 2.5 | F 28F landing | locked | he crawls up the last step; 「楼梯 倒下了。」 he flops, then pops up | release |
| 30 | 100.2 | 3.0 | M door 2803 (panels, studs, 福) | locked | 23:59; knock-knock; rain only — first silence | anticipation |
| 31 | 103.2 | 2.5 | M | door swings, Bayer light spill | warm P-GOLD floods the corridor | the turn begins |
| 32 | 105.7 | 3.5 | C 林奶奶 | slight push | surprised → soft 「哎呀，淋成这样……」 | her face, at size |
| 33 | 109.2 | 3.5 | M two-shot over the bowl | locked | rider: 「对不起，蜡烛……没有。」 | the problem |
| 34 | 112.7 | 5.0 | C 林奶奶 | locked | wistful: 「今天我生日。孙子要来，我叫他别来了。」 | the need, and the set-up for the kid |
| 35 | 117.7 | 4.0 | C 小满, phone 9 % in the frame | music stops | menu 手电筒; the cursor stops bobbing — hesitation — then selects | the decision, silence |
| 36 | 121.7 | 8.0 | M two-shot | slow push-in, 1 px every 1.5 s | the phone held upright over the bowl like a candle; he sings: the text box shows 「♪ 祝你生日快乐 ♪」 while his text blips play the tune | the emotional climax: slow, held |
| 37 | 129.7 | 4.0 | C 林奶奶 | hold | tearful smile; the clock becomes 00:00 | hold the close-up |
| 38 | 133.7 | 3.0 | M two-shot | palette steps 2 darker | she blows; light off; 「手机 没电了。」 HP 0 %; only P-GOLD remains | the price, and no GAME OVER |
| 39 | 136.7 | 2.0 | W stairwell | tilt down 8 px | footsteps (J-cut, heard from 135.7); a red umbrella rises up the stairs | the pay-off arrives |
| 40 | 138.7 | 3.0 | M kid at door | — | 「奶奶！生日快乐！」 name tag 小豆 | pay-off |
| 41 | 141.7 | 2.5 | C 林奶奶 → C 小豆 | cut | 「小豆？！」 / kid sees rider: 「雨伞叔叔！」 rider wink | reaction chain |
| 42 | 144.2 | 3.0 | M three-shot inside door | — | save point sparkles; 「存档吗？」 是; save ticks | the save screen |
| 43 | 147.2 | 3.5 | Locked status window | — | 「小满 升级了！」 「温暖 +1」 fanfare | level up |
| 44 | 150.7 | ≈ 4 | W overworld | pan out / pull back | rain palette swapped to clear night; stars; he rides away, 大黄 wags; 「完」 | the world is calm; bookend of shot 5 |

(Durations above total ≈ 155 s on paper; the build tightens shots 5, 13, 20, 24 and 42–44 to land at ≤ 150 s, and the exact grid lives in `timeline.js`.)

## 6. Beat sheet (second by second, summary)

- 0–3.5 ping, jolt (laugh 1) · 3.5–11.5 face, order, candle note · 11.5–16 quest accepted (ding = downbeat) · 16–20 title · 20–25 raincoat gag (laugh 2) · 25–32 mount, overworld, "!"
- 32–45 red light: can't fight, can't run, wait, clock jumps, light smirks (laugh 3) · 45–55 ride, underpass, phone splashed (HP 26 %)
- 55–71 bus stop: kid, umbrella, 谢谢叔叔 (first warmth; slower)
- 71–81 dog: scare, 摸摸 (laugh 4)
- 81–100 boss: lift broken (laugh 5), dread, tilt up 28 floors (scale), shout lights, climb, power bank, 23:58, collapse
- 100–117 door: silence, knock, warm light, her face, no candle, her birthday, alone (turn)
- 117–137 decision (silence), song (hold), tearful smile, 00:00, phone dies
- 137–148 umbrella on the stairs, 小豆, reactions, save, 温暖 +1, rain stopped, ride away

## 7. Cue map

| Section | t | Tempo / metre | Bars | Instruments | Hits on the grid |
|---|---|---|---|---|---|
| OPEN | 0–16 | none (rain bed) | — | noise rain bed, ping (two pulse notes), text blips, menu blips | ping 1.6; quest accept ding 15.5; music downbeat 16.0 |
| OVERWORLD | 16–32 | 120 bpm 4/4 (bar 2.0 s), C major → A minor bridge | 8 | pulse 25 % lead, pulse 12.5 % arpeggio, triangle bass, noise hats, sampled-style kick/snare (synth), stereo echo | cuts on bar lines: 20, 25 (half bar), 28; "!" sting on 31.0 (beat 3 of bar 8) |
| BATTLE 1 | 32–44.8 | 150 bpm 4/4 (bar 1.6 s), D minor | 8 | driving triangle bass ostinato, pulse 50 % lead, noise snare | messages on bars 1, 3, 5, 7; green on bar 7 downbeat; victory jingle (2 bars) |
| RIDE | 44.8–48.8 | 120, overworld motif | 2 | full overworld band | swirl 48.0 |
| BATTLE 2 | 48.8–55.2 | 150 | 4 | battle theme B-section | dash hit on bar 3 downbeat (52.0) |
| BUS STOP | 55.2–70.8 | 120, overworld motif sparse (triangle + soft 12.5 % pulse) → tender motif first appears (3 notes) when the umbrella opens | 7.8 | sparse, rain louder | umbrella pop on 63.2 beat 1; 谢谢 on downbeat |
| DOG | 70.8–81.2 | 150, battle theme in major, bouncy | 6.5 | pulse + bark samples (synth) | bark hits on beats |
| BOSS | 81.2–100.2 | 160 bpm 4/4 (bar 1.5 s), E phrygian, heavier noise drums, low pulse 50 % octaves | 12.7 | boss theme | tilt starts on bar 3 downbeat; lights on bar 7; power bank jingle on bar 10; collapse on bar 13 downbeat |
| DOOR | 100.2–117.7 | silence 100.2–103.2 (rain only), then TENDER 80 bpm 4/4 (bar 3.0 s), F major, triangle + 12.5 % pulse with long echo | 4.8 | | door open on the downbeat (103.2) |
| CLIMAX | 117.7–136.7 | music drops to zero (rain −6 dB); the song (public-domain "Good Morning to All" tune) is sung by his text blips (one pulse voice with echo) at 90 bpm 3/4 | — | text-blip pulse only, then a single held triangle note on 00:00 | phone dies 134.7: bit-drop, then true silence 0.8 s |
| PAYOFF + END | 136.7–≈150 | TENDER theme full band (adds pulse lead + soft noise brush), then LEVEL-UP fanfare 120 bpm (2 bars), then a 1-bar overworld motif coda in major, resolved (the phrase left on the dominant in the opening overworld theme resolves here) | | | footsteps J-cut 135.7; 小豆 line on downbeat; fanfare at 147.2; 完 on the last downbeat |

## 8. Sound design table

| Section | Ambience | Foley | Music |
|---|---|---|---|
| OPEN | rain (noise, two layers: hiss + drips) and gutter trickle; neon buzz | snore, phone ping, jolt "boing" (pitch sweep), helmet clack, text blips (rider pitch), cursor blip, select ding | none |
| TITLE / EQUIP | rain −4 dB | menu blips, raincoat rustle (filtered noise), hood flap, swat | overworld |
| OVERWORLD | rain, distant traffic hiss | bike motor whine (pulse sweep), tyre splash, "!" sting | overworld |
| BATTLES | rain low | encounter swirl (rising noise + arpeggio), menu blips, error buzz, foot tap ×N, clock tick, hit, splash, HP tick-down, victory jingle, bark ×3, heart pops, tail swish | battle |
| BUS STOP | rain louder, bus-stop roof drumming | brake skid, kid shiver, umbrella pop, item-give jingle, small footsteps running | sparse overworld → tender motif |
| BOSS | stairwell room tone (low hum), rain far | lift button buzz ×3, sweat drop, shout, light-on clunk + hum, footsteps on concrete with echo (alternating pitch), power-bank jingle, floor ding per counter, collapse thud | boss |
| DOOR | rain far + corridor hum | knock ×2 (wood), door latch, door creak/grind, warm "light" shimmer | silence → tender |
| CLIMAX | rain very low | menu blips, flashlight click, song blips, breath (the one organic sound: her soft exhale on the blow), switch-off click, bit-drop on battery death | none |
| PAYOFF / END | corridor hum, rain stops at the palette swap | footsteps up stairs (J-cut), umbrella shake, save ticks, level-up fanfare, bike starting, dog bark (happy) | tender → fanfare → coda |

Silences: (1) 100.2–103.2 before the door opens (rain only, no music); (2) 117.7–121.7 the hesitation (rain only); (3) 134.7–135.5 after the phone dies (true zero, echo tails cut). The first sound after (3) is the footsteps.

J/L cuts: rain runs over the cut into every battle (L); stair footsteps start one second before shot 39 (J); the knock is heard on the last frame of the 28F shot (J); the overworld motif begins under the level-up window (J).

## 9. Subtitle and title design

- **No voice-over.** The dialog box is the subtitle: bottom quarter, layered rounded border (ink / white / silver), dithered dark-blue fill, 32×32 portrait on the left with the speaker's name tag (小满 / 小豆 / 林奶奶), Fusion Pixel 12 px glyphs on the native grid with a 1-px shadow, typing ≈ 12 characters / s with pitched blips; ▼ blinks when done. Each box holds ≥ max(1.8 s, characters ÷ 4.5 + 1.5 s) after it finishes typing.
- **Battle and system messages** in a thin top window (same font), the HUD (🔋 % and the clock) in a small top-right window in travel and battle shots.
- **Title** 《外卖勇者》 in the 12 px font drawn at 2×, 8-neighbour ink outline, row-by-row gradient (gold → orange), Bayer-dissolved in and out.
- The `.srt` is exported from the same subtitle array: dialog lines, battle/system messages and the quest box (the HUD numbers are not subtitled).

## 10. Native moves used

- **Game UI as narration:** the battery as HP, the clock as the timer, the greyed-out 备用雨伞, a menu command that appears (摸摸), the menu cursor that **stops bobbing** when he hesitates over 手电筒.
- **Encounter swirl** into every battle; screen shake 3-2-1.
- **Protected-colour thread:** the red umbrella (menu icon → bus stop → stairwell).
- **Palette swap** when the rain stops; **colour cycling** for rain, puddles and neon; **step fades** for the opening, the phone's death and the end.
- **Save point and level-up** as the ending: 「温暖 +1」.

## 11. Production notes

- Own engine in the project folder (indexed framebuffer, LUT, Bayer, mosaic, swirl, glyph atlas, UI, rig, parametric faces, scenes, timeline), written for this film. The demo will be read after this treatment only for technique.
- Score: own numpy chip synth (pulse / triangle / LFSR noise / short sampled-style drums synthesised), SNES-style echo; all melodies original except the public-domain birthday tune sung by the text blips.
- Checks: cue check (every visual hit vs. its grid time), readcheck, loudness (−14 LUFS, TP ≤ −1 dBTP), blackdetect, CJK glyph check (every character on screen exists in the atlas, no tofu), contact sheets at 1 fps × 2 passes.
