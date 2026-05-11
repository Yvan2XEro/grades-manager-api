# TKAMS — Captures de présentation (Playwright)

Scripts Playwright dédiés à la génération d'assets visuels pour la présentation du projet TKAMS.
Séparés des tests Cypress e2e. Utilise les données réelles du seed INSES.

## Prérequis

1. **Installer le navigateur Playwright** (une seule fois) :
   ```bash
   bun run --filter web present:install
   ```

2. **Seeder la base de données** :
   ```bash
   bun run --filter server seed
   ```

3. **Démarrer l'application** :
   ```bash
   # Terminal 1
   bun dev:server

   # Terminal 2
   bun dev:web
   # → http://localhost:5174
   ```

   > Si Vite démarre sur un autre port, passer : `PLAYWRIGHT_BASE_URL=http://localhost:XXXX`

## Lancer les captures

```bash
# Tous les flows (~10 min)
bun run --filter web present:run

# Un seul flow
bun run --filter web present:flow "01 - Login & Dashboard"
bun run --filter web present:flow "02 - Gestion étudiants"
bun run --filter web present:flow "03 - Saisie des notes"
bun run --filter web present:flow "04 - Validation examen"
bun run --filter web present:flow "05 - Délibération"
bun run --filter web present:flow "06 - Export & Rapports"

# Rapport HTML
bun run --filter web present:report
```

## Comptes utilisés (seed 20-users.yaml)

| Rôle | Email | Mot de passe | Nom |
|------|-------|--------------|-----|
| Admin | admin@inses.cm | ChangeMe123! | Administrateur INSES |
| Enseignant | dr.mballa@inses.cm | Password123! | Dr. Mballa Jean |
| Enseignant | kombo@inses.cm | Password123! | Kombo Francis |
| Étudiant | ndong.student@inses.cm | Password123! | Ndong Alain |

## Données métier utilisées

| Entité | Valeur seedée |
|--------|--------------|
| Institution | INSES — Institut Supérieur de l'Espoir |
| Année académique | 2025-2026 (active) |
| Classe infirmier | INF25-BTS1A |
| Classe compta | COMPT25-BTS1A |
| Cours Dr. Mballa | Anatomie Humaine (ANAT101) |
| Cours Kombo | Introduction à la Comptabilité (COMPT101) |
| Examen 1 | Contrôle Continu Anatomie (CC, 40%, 15 oct 2025) |
| Examen 2 | Contrôle Continu Comptabilité (CC, 40%, 20 oct 2025) |
| Étudiant infirmier | Ndong Alain (INSES25-0001) |
| Étudiant compta | Eyebe Rachel (INSES25-0002) |

## Sorties générées

```
apps/web/presentation-assets/
├── screenshots/          # PNG 1440×900, ~35 captures nommées par étape
├── output/               # Vidéos WebM brutes (Playwright)
└── report/               # Rapport HTML interactif
```

## Flows & captures

| Flow | Tests | Screenshots |
|------|-------|-------------|
| 01 - Login & Dashboard | 2 | 01a–01h |
| 02 - Gestion étudiants | 3 | 02a–02h |
| 03 - Saisie des notes | 2 | 03a–03j |
| 04 - Validation examen | 3 | 04a–04i |
| 05 - Délibération | 2 | 05a–05k |
| 06 - Export & Rapports | 6 | 06a–06n |

## Configuration

`playwright.config.ts` — modifiable selon les besoins :
- `slowMo: 700` → ralentit les interactions pour les vidéos
- `headless: false` → navigateur visible
- `colorScheme: "light"` → changer en `"dark"` pour un rendu sombre
- `locale: "fr-FR"` → interface en français
