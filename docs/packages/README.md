# Commercial packages

This folder contains the LaTeX sources for the license packages proposal.

## Files

- `forfaits_licences.tex`: main document
- `package_variables.tex`: editable product names and prices

## Build

From the repository root:

```bash
cd docs/packages
pdflatex forfaits_licences.tex
```

```bash
docker run --rm -v "$PWD/docs/packages:/work" -w /work ghcr.io/xu-cheng/texlive-small:latest sh -lc 'tlmgr install enumitem titlesec tcolorbox booktabs tabularx && pdflatex -interaction=nonstopmode -halt-on-error forfaits_licences.tex
```

To change the software names or the prices, edit only `package_variables.tex`.
