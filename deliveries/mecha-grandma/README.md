# 《机甲外婆》 Mecha Grandma

On a typhoon night in a neon megacity, 外婆 learns from a phone chat 「吃了吗？」→「没空吃」「三天没下楼了」 that her programmer grandson 阿杰 hasn't left the 88th floor in three days. She is a construction-mech driver from way back, planted with a 1979 photo of her in a hard hat with the yellow machine 「大黄」. She packs steaming dumplings in a tin wrapped in a red checked cloth, pulls the tarp off 大黄 and smacks its coughing dashboard to life. Then she drives it across the city: through the traffic, catching a typhoon-torn billboard before it falls on a delivery rider, and past a security drone that scans her as a threat until she shows it the lunchbox (「识别：饺子 ×24」「威胁等级：外婆」). She climbs the tower in the wind, keeping the box level by the dashboard's bubble level. On the 88th floor 阿杰 looks up from his monitors to a giant yellow hand at the window holding out the lunchbox. The music drops out on his eyes, the cockpit lamp comes on, and she waves. At sunrise they eat on 大黄's palm above the city. His phone photo of her thumbs-up match-cuts to the 1979 photo, and he sends 「吃了。」.

The film is 140 s, 1920×1080 at 24 fps, with no voice, and all on-screen text and the `.srt` are in Simplified Chinese.

## How it was made

Everything was made in code (Canvas 2D + WebGL), in the style of the library's 80s Cel Anime engine:
- **Picture layers:** airbrushed plates painted once at load (a crane-down city, a neon street with wet reflections, the tower, storm and dawn skies). Over them sit flat cel characters with hard shadows and coloured lines.
- **Colour models:** one per lighting set (night neon, warm lamp, storm, cold monitor light, dawn).
- **Glow and tape:** backlit glow on an emissive layer, then a videotape + CRT pass with a power-on at the start and tracking noise when the drone locks on.
- **Characters:**
  - 外婆 and 阿杰 are built on an 80s head construction, approved on a model sheet and an expression sheet first (`films/mecha-grandma/stills/`).
  - 大黄 and the drone have their own design sheet in the same folder.
- **Animation:** characters are sampled on twos, performance beats on threes, and the camera, light and rain on ones.
- **Score:** an original synthesised city-pop / synth-funk score (FM e-piano, slap bass, gated snare, synth brass, a sax-like lead and Grandma's theme). It is written to the same bar grid as the 58 shots, with true silence before the impact frame and on the climax, and a semitone lift at dawn.
- **Foley:** all synthesised: servos, footsteps taken from the walk cycles, rain, wind, sirens, rotors, scan beeps, radio static, smacks, knocks, a shutter, birds.

The film was rendered in full three times, with two complete review passes in between. The 1 fps contact sheets and action strips are in `stills/`, and the fixes are listed in `films/mecha-grandma/REVIEW.md`.

## Checks

| Check | Result |
|---|---|
| Cue check (score sync points and cuts on the bar grid) | 85 cues (27 score sync points, 58 cuts), worst offset 0.05 ms |
| Reading time (`readcheck`) | 13 / 13 on-screen texts OK |
| Loudness, `final.mp4` | −14.1 LUFS integrated, true peak −4.8 dBTP |
| Loudness, `final-720p.mp4` | −14.2 LUFS integrated, true peak −3.3 dBTP |
| Black frames (`blackdetect`, ≥ 0.1 s) | one: 0.25 s at frame 0, the planned tape power-on |
| CJK glyphs | every text-bearing shot checked on frames from the final master (`stills/cjk_check.jpg`); no missing-glyph boxes |
| No library sign-off | a grep finds no LemoLab sign-off in the project |
| `final.mp4` | 1920×1080, 24 fps, 83.9 MB (under 95 MB) |
| `final-720p.mp4` | 1280×720, 24 fps, 25.0 MB (under 28 MB) |

Source, treatment, review log, `CREDITS` (all fonts OFL, no samples or stock material) and `build.sh` are in `films/mecha-grandma/`.
