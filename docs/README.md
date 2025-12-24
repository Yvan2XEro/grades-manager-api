# Documentation - TKAMS

Ce dossier contient toute la documentation de **TKAMS (TK Academic Management System)**.

TKAMS est un système de gestion académique pour institutions d'enseignement supérieur (facultés, universités, instituts).

## Structure

```
docs/
├── README.md                # Ce fichier
└── guide/                   # Guide d'utilisation complet
    ├── README.md           # Instructions de compilation
    ├── LISTE_CAPTURES_ECRAN.md
    ├── guide_principal.tex # Fichier principal LaTeX
    ├── guide_sections/     # Sections du guide (12 fichiers .tex)
    └── images/             # Images et captures d'écran
```

## Documents disponibles

### Guide d'utilisation (LaTeX)

**Emplacement** : `docs/guide/`

Guide complet pour les utilisateurs finaux couvrant :
- Installation et configuration
- Gestion de la structure académique
- Gestion des étudiants et inscriptions
- Saisie et validation des notes
- Exports et publications
- Administration système
- Dépannage
- Cas d'usage pratiques

**Format** : LaTeX (.tex) compilable en PDF

**Voir** : `docs/guide/README.md` pour les instructions de compilation

### Documentation technique

**Emplacement** : `CLAUDE.md` (racine du projet)

Documentation technique pour les développeurs contenant :
- Architecture du projet
- Structure du monorepo
- Patterns de développement
- Commandes courantes
- Configuration

## Générer la documentation

### Guide utilisateur PDF

```bash
cd docs/guide
pdflatex guide_principal.tex
```

Voir `docs/guide/README.md` pour plus de détails.

## Documentation additionnelle

Autres fichiers de documentation dans le projet :

- **README.md** (racine) : Vue d'ensemble du projet
- **CLAUDE.md** : Documentation technique détaillée
- **apps/server/README.md** : Documentation du backend
- **apps/web/README.md** : Documentation du frontend (si existe)

## Contribuer à la documentation

### Guide utilisateur

1. Éditez les fichiers `.tex` dans `docs/guide/guide_sections/`
2. Testez la compilation : `pdflatex guide_principal.tex`
3. Ajoutez les captures d'écran dans `docs/guide/images/`
4. Mettez à jour `LISTE_CAPTURES_ECRAN.md` si nécessaire

### Documentation technique

Mettez à jour `CLAUDE.md` pour :
- Nouveaux modules
- Changements d'architecture
- Nouvelles commandes
- Patterns de développement

## Captures d'écran

Pour compléter le guide utilisateur, consultez :
`docs/guide/LISTE_CAPTURES_ECRAN.md`

Ce fichier liste les 32 captures d'écran à réaliser pour illustrer le guide.

## Versions et langues

**Version actuelle** : 1.0.0

**Langues** : Français (principale)

Des versions en anglais peuvent être ajoutées ultérieurement en dupliquant la structure.

## Licence

© 2025 Faculté de Médecine et Sciences Pharmaceutiques. Tous droits réservés.
