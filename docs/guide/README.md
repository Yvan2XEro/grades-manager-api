# Guide d'utilisation - TKAMS

Ce répertoire contient le guide d'utilisation complet de **TKAMS (TK Academic Management System)** au format LaTeX.

TKAMS est un système de gestion académique destiné aux institutions d'enseignement supérieur (facultés, universités, instituts).

## Structure

```
docs/guide/
├── README.md                          # Ce fichier
├── LISTE_CAPTURES_ECRAN.md           # Liste des captures à réaliser
├── guide_principal.tex               # Fichier principal LaTeX
├── guide_sections/                   # Sections du guide
│   ├── 01_introduction.tex
│   ├── 02_installation.tex
│   ├── 03_structure_academique.tex
│   ├── 04_gestion_etudiants.tex
│   ├── 05_gestion_notes.tex
│   ├── 06_utilisateurs_autorisations.tex
│   ├── 07_exports_publications.tex
│   ├── 08_workflows.tex
│   ├── 09_configuration.tex
│   ├── 10_troubleshooting.tex
│   ├── 11_cas_usage.tex
│   └── 12_annexes.tex
└── images/                           # Images et captures d'écran
    └── (à ajouter - voir LISTE_CAPTURES_ECRAN.md)
```

## Prérequis pour la compilation

Pour compiler le guide en PDF, vous avez besoin d'une distribution LaTeX installée :

### Windows

- **MiKTeX** : https://miktex.org/download
- **TeX Live** : https://www.tug.org/texlive/

### macOS

```bash
# Via Homebrew
brew install --cask mactex
```

Ou téléchargez MacTeX : https://www.tug.org/mactex/

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install texlive-full
```

Pour Fedora/CentOS :
```bash
sudo dnf install texlive-scheme-full
```

## Compilation

### Méthode 1 : Ligne de commande

Naviguez vers le dossier du guide :

```bash
cd docs/guide
```

Compilez le document :

```bash
pdflatex guide_principal.tex
pdflatex guide_principal.tex  # Deux fois pour les références
```

Le fichier PDF sera généré : `guide_principal.pdf`

### Méthode 2 : Avec latexmk (recommandé)

```bash
latexmk -pdf guide_principal.tex
```

Cette commande compile automatiquement le bon nombre de fois et gère les références.

### Méthode 3 : Éditeur LaTeX

Vous pouvez utiliser un éditeur LaTeX avec interface graphique :

- **TeXstudio** (Windows/Linux/macOS) : https://www.texstudio.org/
- **TeXworks** (inclus avec MiKTeX et MacTeX)
- **Overleaf** (en ligne) : https://www.overleaf.com/

1. Ouvrez `guide_principal.tex` dans l'éditeur
2. Cliquez sur "Build" ou "Compile" (généralement F5 ou F6)
3. Le PDF sera généré automatiquement

## Ajout des images

Avant de compiler, ajoutez les images dans le dossier `images/` :

1. Consultez `LISTE_CAPTURES_ECRAN.md` pour la liste complète
2. Réalisez les captures d'écran
3. Nommez-les selon les labels indiqués (ex: `login-screen.png`)
4. Placez-les dans `docs/guide/images/`

**Note** : Le guide peut être compilé sans les images. Les emplacements seront marqués par des cadres vides avec le nom de la figure.

## Personnalisation

### Logo de l'établissement

Pour ajouter le logo de votre établissement sur la page de titre :

1. Placez votre logo dans `docs/guide/images/logo.png`
2. Décommentez la ligne 96 dans `guide_principal.tex` :
   ```latex
   % \includegraphics[width=0.4\textwidth]{images/logo.png}
   ```
   devient
   ```latex
   \includegraphics[width=0.4\textwidth]{images/logo.png}
   ```

### Informations de copyright

Modifiez les lignes 103-105 dans `guide_principal.tex` pour mettre à jour les informations de copyright et de contact.

### Couleurs et style

Les commandes personnalisées sont définies aux lignes 71-77 de `guide_principal.tex` :
- `\menu{}` : Éléments de menu (bleu)
- `\bouton{}` : Boutons (teal)
- `\champ{}` : Champs de formulaire (violet)
- `\attention{}` : Avertissements (rouge)
- `\info{}` : Informations (bleu)
- `\astuce{}` : Astuces (vert)

## Dépannage

### Erreur : "File not found"

Si LaTeX ne trouve pas les fichiers de section :
- Vérifiez que tous les fichiers `.tex` sont présents dans `guide_sections/`
- Vérifiez que les noms correspondent exactement (sensible à la casse)

### Erreur : "Package not found"

Si un package LaTeX est manquant :

**MiKTeX** : Installez automatiquement les packages manquants (option par défaut)

**TeX Live** :
```bash
sudo tlmgr install <nom-du-package>
```

Packages requis :
- babel
- inputenc
- fontenc
- graphicx
- geometry
- hyperref
- enumitem
- xcolor
- fancyhdr
- tcolorbox
- listings
- longtable
- array
- booktabs
- float
- amsmath
- amssymb

### Images manquantes

Si les images ne s'affichent pas :
- Vérifiez le chemin dans les commandes `\includegraphics{}`
- Assurez-vous que les fichiers sont au format PNG
- Vérifiez les permissions de lecture sur les fichiers

### Erreur de compilation Unicode

Si vous avez des erreurs avec les caractères spéciaux :
- Assurez-vous que vos fichiers sont encodés en UTF-8
- Vérifiez que les packages `inputenc` et `fontenc` sont bien chargés

## Génération automatique (optionnel)

Vous pouvez créer un script pour automatiser la compilation :

### Linux/macOS : `build.sh`

```bash
#!/bin/bash
cd "$(dirname "$0")"
latexmk -pdf -interaction=nonstopmode guide_principal.tex
latexmk -c  # Nettoyer les fichiers temporaires
echo "PDF généré : guide_principal.pdf"
```

Rendez-le exécutable et lancez-le :
```bash
chmod +x build.sh
./build.sh
```

### Windows : `build.bat`

```batch
@echo off
cd /d %~dp0
pdflatex guide_principal.tex
pdflatex guide_principal.tex
del *.aux *.log *.out *.toc *.tmp.*
echo PDF genere : guide_principal.pdf
pause
```

Lancez-le en double-cliquant dessus ou via :
```cmd
build.bat
```

## Nettoyage

Après compilation, vous pouvez supprimer les fichiers temporaires :

```bash
# Linux/macOS
rm -f *.aux *.log *.out *.toc *.tmp.*

# Windows
del *.aux *.log *.out *.toc *.tmp.*
```

Ou utilisez latexmk :
```bash
latexmk -c
```

## Contribution

Pour contribuer au guide :

1. Modifiez les fichiers `.tex` dans `guide_sections/`
2. Testez la compilation
3. Vérifiez qu'il n'y a pas d'erreurs
4. Committez vos changements

## Ressources

- **Documentation LaTeX** : https://www.latex-project.org/help/documentation/
- **Guide LaTeX (français)** : https://fr.wikibooks.org/wiki/LaTeX
- **Overleaf Guides** : https://www.overleaf.com/learn

## Support

Pour toute question concernant le guide :
- Email : cedrictefoye@gmail.com
- Consultez la documentation LaTeX en ligne

## Licence

© 2025 Faculté de Médecine et Sciences Pharmaceutiques. Tous droits réservés.
