# Documentation - TKAMS

This folder contains all the documentation for **TKAMS (Tefoye and Kana Academic Management System)**.

TKAMS is an academic management system for higher education institutions (faculties, universities, institutes).

## Structure

```
docs/
├── README.md                # This file
└── guide/                   # Complete user guide
    ├── README.md           # Build instructions
    ├── LISTE_CAPTURES_ECRAN.md
    ├── guide_principal.tex # Main LaTeX file
    ├── guide_sections/     # Guide sections (12 .tex files)
    └── images/             # Images and screenshots
```

## Available documents

### User guide (LaTeX)

**Location**: `docs/guide/`

Complete guide for end users covering:
- Installation and configuration
- Managing the academic structure
- Managing students and enrollments
- Grade entry and validation
- Exports and publications
- System administration
- Troubleshooting
- Practical use cases

**Format**: LaTeX (.tex), compilable to PDF

**See**: `docs/guide/README.md` for build instructions

### Technical documentation

**Location**: `CLAUDE.md` (project root)

Technical documentation for developers, covering:
- Project architecture
- Monorepo structure
- Development patterns
- Common commands
- Configuration

## Generating the documentation

### PDF user guide

```bash
cd docs/guide
pdflatex guide_principal.tex
```

See `docs/guide/README.md` for more details.

## Additional documentation

Other documentation files in the project:

- **README.md** (root): Project overview
- **CLAUDE.md**: Detailed technical documentation
- **apps/server/README.md**: Backend documentation
- **apps/web/README.md**: Frontend documentation (if it exists)

## Contributing to the documentation

### User guide

1. Edit the `.tex` files in `docs/guide/guide_sections/`
2. Test the build: `pdflatex guide_principal.tex`
3. Add screenshots to `docs/guide/images/`
4. Update `LISTE_CAPTURES_ECRAN.md` if needed

### Technical documentation

Update `CLAUDE.md` for:
- New modules
- Architecture changes
- New commands
- Development patterns

## Screenshots

To complete the user guide, see:
`docs/guide/LISTE_CAPTURES_ECRAN.md`

This file lists the 32 screenshots to take to illustrate the guide.

## Versions and languages

**Current version**: 1.0.0

**Languages**: French (primary)

English versions may be added later by duplicating the structure.

## License

© 2025 Faculté de Médecine et Sciences Pharmaceutiques. All rights reserved.
