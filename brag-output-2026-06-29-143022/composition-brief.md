# Hyperframes Composition Brief: Itti Alliance Finder

## Objective
Create a short launch-style brag video for Itti Alliance Finder — an AI-powered commercial alliance discovery system for Ueno Bank (Paraguay).

## Output
- Composition directory: `brag-output-2026-06-29-143022/composition/`
- Rendered video: `brag-output-2026-06-29-143022/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 20 seconds

## Source Material
- Project root: `/home/Ignacio/Nextcloud/Personal/Proyects/Itti_Project`
- Primary files read: `packages/web/src/app/globals.css`, `packages/web/src/app/page.tsx`, `packages/web/src/app/discover/page.tsx`, `packages/web/src/app/scoring/page.tsx`, `packages/web/src/app/search/content.tsx`, `README.md`, `PLAN.md`
- Product name: Itti Alliance Finder
- Tagline / strongest claim: "Intelligent partnership discovery for Ueno Bank"
- Key UI or visual moment to recreate: The Dashboard with KPI cards and Top 10 score badges, and the Discover page with AI-generated query tags
- Copy that must appear verbatim:
  - "Finding the right partners shouldn't take weeks."
  - "398 companies analyzed. 8 criteria scored. One AI pipeline."
  - "Intelligent partnership discovery for Ueno Bank."

## Creative Direction
- Tone preset: polished
- Creative direction: quiet premium product film for an internal banking tool
- Interpretation: Confidence through restraint. Fewer scenes, longer holds. Typography is light-to-medium, mixed case, generous spacing. Transitions are slow crossfades. The product is treated like it already deserves attention.
- Angle: A working bank tool that uses on-premise AI to do in minutes what used to take weeks. The video shows it working — not promising.
- Hook: "Finding the right partners shouldn't take weeks."
- Outro / punchline: "398 companies analyzed. 8 criteria scored. One AI pipeline."
- Avoid:
  - Generic SaaS language ("streamline", "leverage", "unlock")
  - Abstract filler visuals (color washes, particle systems)
  - Unrelated visual redesign

## Visual Identity
- Background: #F5F7FA (light gray, from globals.css body)
- Text: #111827 (gray-900, primary text color)
- Accent: #0066FF (Ueno blue, from `--ueno-blue` CSS variable)
- Secondary text: #6B7280 (gray-500)
- Display font: system (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- Body font: system (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- Visual references from the project: KPI cards (Building2, TrendingUp, BarChart3, Users icons from Lucide), score badges (color-coded 0-100), Discover search field with Sparkles icon, query tags in blue-100 pills, results table with star ratings

## Storyboard
Use the storyboard in `brag-output-2026-06-29-143022/brag-plan.md` as the creative contract.

Scene summary:
1. Hero Reveal — 5s — Ueno blue fills screen, product name "Alliance Finder" in large light-weight type, tagline fades in
2. Discovery Flow — 7s — Discover page UI: search field types query, 3 AI query tags pop in sequentially, results table slides up
3. Score Dashboard — 5s — Dashboard: 4 KPI cards slide in one by one with count-up, Top 10 list with score badges
4. Outro — 3s — Final claim text, product name, tagline, music fade

## Audio
- Audio role: warm bed
- Audio arc: starts quiet and confident, builds through the discovery and scoring scenes, swells gently before the final logo, fades to silence
- Music: assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3
- Music treatment: fade in at 0s, volume 0.3, gentle swell at 17s before final logo, fade out over last 2s
- Music cue guidance: Preset available at `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`. Tempo ~110 BPM. Strong cues: 8.74s (target for KPI cards last reveal), 17.47s (target for final tagline), 22.93s (beyond video end). Beat grid available for sequential snaps.
- Audio-reactive treatment: subtle; use music RMS to make the Ueno blue background glow breathe slightly. No waveform/equalizer visuals.
- Audio-coupled moments:
  - Scene 2 query tags — each tag snaps to a beat from the grid
  - Scene 3 KPI cards — 4 cards arrive on consecutive beats
  - Scene 3 score badges — count-up synced to beat grid
  - Scene 4 final text — lands near 17.47s strong cue
- SFX selection guidance: polished tone — 2-3 very subtle SFX. `interface/drop_001` for gentle card reveals. `interface/bong_001` for soft accent on final claim. Nothing aggressive.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy the chosen music into `brag-output-2026-06-29-143022/composition/assets/`

## Hyperframes Instructions
Use the current `hyperframes` skill and CLI workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project.
- Keep all text readable in the final render.
- Keep the video within 15-25 seconds.
- Include the planned music/SFX layer.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. Hyperframes decides exact animation timing and should ignore cues that hurt readability, scene pacing, or the product story.
- Major reveals may move toward nearby strong cues within about ±0.15s. Smaller entrances may align to nearby beat points within about ±0.10s. Use only 1-3 strong cue locks in a 15-25s video.
- Use SFX to support motion and interaction: card sounds for card-like reveals, short announcement cues for major payoffs, key/click sounds for text or user actions, and restraint when the edit is already busy.
- Honor planned music treatment such as fade-outs, ducking, beat-aligned reveals, or letting a final SFX ring over the music.
- Consider audio-reactive workflow: extract audio data and use RMS/frequency bands for subtle, brand-specific motion on the Ueno blue background glow.
- Use local assets for audio and any required runtime/media dependencies.
- Run Hyperframes lint and validate before render.
