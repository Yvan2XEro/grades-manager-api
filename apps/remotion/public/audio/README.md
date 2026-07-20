# Audio files requis

Placer les 3 fichiers MP3 dans ce dossier avant de lancer `bun run render`.

---

## background.mp3
Musique de fond instrumentale — joue pendant toute la vidéo (fade in/out automatique).

**Style recommandé :** Corporate ambient, cinematic minimal, lo-fi instrumental.
**Durée recommandée :** 2–5 min (la piste est en loop automatique).

Sources gratuites :
- https://pixabay.com/music/search/corporate/
- https://freemusicarchive.org
- https://musopen.org

Suggestions Pixabay (rechercher) :
- "Corporate Inspiration" 
- "Motivational Ambient"
- "Professional Background"

---

## transition.mp3
Son court joué au début de chaque scène (0.6–1 s).

**Style :** Whoosh subtil, swoosh léger, UI sound.
**Volume appliqué :** 14% (déjà réduit dans le code).

Sources gratuites :
- https://freesound.org (rechercher "whoosh" ou "swoosh")
- https://pixabay.com/sound-effects/search/whoosh/

---

## reveal.mp3  
Chime discret pour les révélations d'éléments clés (optionnel, 0.3–0.5 s).

**Style :** Ting, chime, soft notification.
**Volume appliqué :** 10%.

Sources gratuites :
- https://freesound.org (rechercher "chime" ou "ding")

---

## Désactiver l'audio temporairement

Dans `src/lib/theme.ts`, mettre `enabled: false` dans le bloc `AUDIO` :

```ts
export const AUDIO = {
  enabled: false,   // ← changer ici
  ...
} as const;
```

Cela empêche toute erreur au render si les fichiers ne sont pas encore présents.
