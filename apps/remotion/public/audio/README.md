# Required audio files

Place the 3 MP3 files in this folder before running `bun run render`.

---

## background.mp3
Instrumental background music — plays throughout the whole video (automatic fade in/out).

**Recommended style:** Corporate ambient, cinematic minimal, lo-fi instrumental.
**Recommended length:** 2–5 min (the track loops automatically).

Free sources:
- https://pixabay.com/music/search/corporate/
- https://freemusicarchive.org
- https://musopen.org

Pixabay suggestions (search for):
- "Corporate Inspiration" 
- "Motivational Ambient"
- "Professional Background"

---

## transition.mp3
Short sound played at the start of each scene (0.6–1 s).

**Style:** Subtle whoosh, light swoosh, UI sound.
**Applied volume:** 14% (already reduced in the code).

Free sources:
- https://freesound.org (search for "whoosh" or "swoosh")
- https://pixabay.com/sound-effects/search/whoosh/

---

## reveal.mp3  
Discreet chime for key element reveals (optional, 0.3–0.5 s).

**Style:** Ting, chime, soft notification.
**Applied volume:** 10%.

Free sources:
- https://freesound.org (search for "chime" or "ding")

---

## Disabling audio temporarily

In `src/lib/theme.ts`, set `enabled: false` in the `AUDIO` block:

```ts
export const AUDIO = {
  enabled: false,   // ← change here
  ...
} as const;
```

This prevents any render error if the files are not present yet.
