# Brief — 《外卖勇者》 (films/delivery-hero)

From `CLOUD-BRIEF.md` (the owner's complete answer to the Brief step; no questions asked).

- **Style:** 16-bit Pixel RPG (`styles/pixel-rpg`), 320×180 indexed framebuffer ×6 → 1920×1080, 24 fps.
- **Length:** 100–150 s (target ≈ 145 s).
- **Language:** Simplified Chinese on screen and in the `.srt`; Fusion Pixel Font (OFL, npm `@vp-tw/cjk-web-fonts-fusion-pixel-font`), rasterised to a 1-bit glyph atlas on the native grid.
- **Topic:** a delivery rider's last order of the night as a mid-90s RPG: 23:40, rain, one bowl of longevity noodles before midnight. Overworld = city, e-bike = mount, phone battery = HP, clock = timer. Battles: a red light that won't change, a flooded underpass, a guard dog that wants a pat, the boss (broken lift → 28 floors of stairs). Items: raincoat, power bank, spare umbrella (given to a soaked kid). Customer: an old lady alone on her birthday; the rider sings; the kid is her grandson, arriving with the umbrella. Save point, level up 「温暖 +1」.
- **Sound:** no voice-over; original chiptune (pulse / triangle / noise / sampled-drum, echo): overworld, battle, boss, tender theme, level-up fanfare; foley for every blip, hit, step, door, rain. −14 LUFS, TP ≤ −1 dBTP.
- **Storyboard review:** no. **Owner's material:** none.
- **Environment:** core deps installed; ffmpeg 9.0.2 static (imageio-ffmpeg wheel) at `/opt/ff/bin` because the system ffmpeg is 6.1.
- **Delivery:** `deliveries/delivery-hero/` (final.mp4 < 95 MB, final-720p.mp4 < 28 MB, poster.jpg, subtitles.srt, README.md).
