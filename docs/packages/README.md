# Packages commerciaux

Ce dossier contient les sources LaTeX de la proposition de forfaits de licences.

## Fichiers

- `forfaits_licences.tex` : document principal
- `package_variables.tex` : noms commerciaux et tarifs modifiables

## Compilation

Depuis la racine du dépôt :

```bash
cd docs/packages
pdflatex forfaits_licences.tex
```

```bash
docker run --rm -v "$PWD/docs/packages:/work" -w /work ghcr.io/xu-cheng/texlive-small:latest sh -lc 'tlmgr install enumitem titlesec tcolorbox booktabs tabularx && pdflatex -interaction=nonstopmode -halt-on-error forfaits_licences.tex
```

Pour changer les noms des logiciels ou les prix, modifier uniquement `package_variables.tex`.
