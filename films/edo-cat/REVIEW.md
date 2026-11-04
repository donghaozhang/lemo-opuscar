# Review log

## Pass 1 (first full render, 1 fps contact sheets in stills/review1-*, 0.2 s action strips)
- Story beats all present and readable: two-fish set-up (0 s) → gift pay-off (132.8 s); kitten planted (4–13 s); kite planted in the dawn sky.
- Light by hour: dawn pink, grey shower, snow, midday fields, ochre pass, deep sea, dusk with lit lanterns — OK.
- Fixed: the catch (signature shot) was framed too wide (cat ≈ 1/10 of frame) → push-in to z 1.85 on the catch, cat ≈ 1/3 frame, print border visible below.
- Fixed: snow-temple roof read as a thin floating band → heavy tiled roof mass with eave fascia.
- Fixed: Fuji match cut — the cat stood on the peak → the arched leap now peaks above the summit.
- Fixed: true peak −0.7 dBFS after mux → K-weighted master to −14.3 LUFS with a −1.6 dBFS look-ahead limiter.
- Fixed earlier in the pass: the 七 暮归 cartouche appeared too late to be read (1.35 s) → appears as the dusk blocks land (3 s).

## Pass 2 (second full render, stills/review2-*)
- Catch above the border now holds a close framing (cat ≈ 1/3 frame) — lands.
- Fixed: Fuji match — the leap rode too high (head out of frame) → lower arc, arched back framed against the summit.
- Fixed: s51 the fishmonger on the bridge was too small for a medium → tilt ends in a push-in (z 1.3), he fills ~60 % of the height.
- Mux: true peak −0.7 dBTP after AAC → limiter ceiling −3 dBFS before mux → −14.0 LUFS, −1.0 dBTP.
- readcheck failures fixed: snow cartouche moved into the band that stays in frame during the tilt; fields cartouche moved onto the span the track covers (track slowed); the pass shot holds on the climb (cartouche bottom-right) and tilts in the last 0.9 s; the shout, dusk and end slips held longer. readcheck: all OK.
- CJK glyph check (glyphcheck.py): 0 missing glyphs in both subset fonts.
