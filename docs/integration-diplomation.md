# grades-manager-api → DIPLOMATION integration

## Goal

The **grades-manager-api** application must generate ready-to-use Excel files (.xlsx) for the **DIPLOMATION** application (SGN-Notes), an Electron desktop application that produces official academic documents (diplomas, transcripts, certificates) with encrypted QR codes.

**Simplified flow:**

```
grades-manager-api  →  Excel file (.xlsx)  →  DIPLOMATION  →  PDF (diplomas, transcripts, certificates)
```

---

## Table of contents

1. [Overview of the two applications](#1-overview-of-the-two-applications)
2. [Excel files expected by DIPLOMATION](#2-excel-files-expected-by-diplomation)
3. [Data mapping: grades-manager-api → DIPLOMATION](#3-data-mapping)
4. [Validation rules and formats](#4-validation-rules-and-formats)
5. [Calculations and formulas](#5-calculations-and-formulas)
6. [Implementation plan](#6-implementation-plan)
7. [API endpoints to create](#7-api-endpoints-to-create)
8. [Data examples](#8-data-examples)

---

## 1. Overview of the two applications

### grades-manager-api (data source)

| Aspect | Detail |
|--------|--------|
| **Stack** | Bun + Hono + tRPC + Drizzle ORM + PostgreSQL |
| **Role** | Full management of academic data |
| **Data** | Students, enrollments, courses, teaching units (UE), exams, grades, credits, promotions |
| **Existing exports** | Deliberation minutes (PV), evaluation publications, teaching unit publications (PDF/HTML) |
| **Location** | `C:\Users\tefba\Desktop\OverBrand\grades-manager-api` |

### DIPLOMATION (data consumer)

| Aspect | Detail |
|--------|--------|
| **Stack** | Electron + React + Vite + Tailwind + shadcn/ui |
| **Role** | Generation of official academic documents with QR codes |
| **Input** | Excel files (.xlsx, .xls) |
| **Output** | PDF (diplomas, transcripts, certificates) + encrypted QR codes |
| **Documents** | 4 types: Diploma, Transcript, Certificate, Centre Certificate |
| **Location** | `C:\Users\tefba\Documents\FMSP\DIPLOMATION` |

---

## 2. Excel files expected by DIPLOMATION

DIPLOMATION expects **4 types of Excel files**, each with specific columns.

---

### 2.1 — DIPLOMA (`diplomation-diplomes.xlsx`)

#### REQUIRED columns

| # | Exact column name | Type | Format | Constraints | Example |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | text | — | Min 2 characters, not empty, not "N/D" | `ANGOA SAAH` |
| 2 | `PRENOM` | text | — | Min 2 characters, not empty, not "N/D" | `GABRIELLE SANDRA` |
| 3 | `MATRICULE` | text | Alphanumeric | Min 3 characters, **unique** within the file | `17MM019` |
| 4 | `DATE DE NAISSANCE` | text | `DD/MM/YYYY` | Valid date, 1900 ≤ year ≤ current year | `27/01/2000` |
| 5 | `LIEU DE NAISSANCE` | text | — | Min 2 characters | `YAOUNDE` |
| 6 | `PARCOURS` | text | — | Min 1 character | `MÉDECINE` |
| 7 | `SPECIALITE` | text | — | Min 1 character | `MÉDECINE GÉNÉRALE` |
| 8 | `MOYENNE` | number | Decimal (0-20) | 0 ≤ value ≤ 20, **minimum 10 to generate** | `16.5` |
| 9 | `GRADE` | text | Letter(s) | Accepted values: A+, A, B+, B, B-, C+, C, C-, D, E, F | `A+` |
| 10 | `MENTION` | text | — | Not empty, not "N/D" | `TRES HONORABLE AVEC FELICITATIONS DU JURY` |
| 11 | `TITRE DIPLOME FR` | text | — | Not empty, not "N/D" | `DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE` |
| 12 | `TITRE DIPLOME EN` | text | — | Not empty, not "N/D" | `DOCTOR OF MEDICINE STATE DEGREE` |
| 13 | `ANNEE OBTENTION` | text/number | Year (4 digits) | Valid year format | `2024` |
| 14 | `DATE JURY ADMISSION` | text | `DD/MM/YYYY` | Valid date | `13/10/2017` |
| 15 | `DATE JURY DELIBERATION` | text | `DD/MM/YYYY` | Valid date | `28/07/2024` |

#### OPTIONAL columns

| # | Exact column name | Type | Example |
|---|----------------------|------|---------|
| 16 | `OPTION` | text | `Chirurgie` or `N/A` |
| 17 | `OPTION_EN` | text | `Surgery` or `N/A` |
| 18 | `MENTION_EN` | text | `HIGH HONORS WITH JURY COMMENDATION` |

---

### 2.2 — CERTIFICATE OF SUCCESS (`diplomation-attestations.xlsx`)

#### REQUIRED columns

| # | Exact column name | Type | Format | Constraints | Example |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | text | — | Min 2 characters | `DUPONT` |
| 2 | `PRENOM` | text | — | Min 2 characters | `Jean` |
| 3 | `MATRICULE` | text | Alphanumeric | Min 3 characters, unique | `2024001` |
| 4 | `DATE DE NAISSANCE` | text | `DD/MM/YYYY` | Valid date | `15/03/2005` |
| 5 | `LIEU DE NAISSANCE` | text | — | Min 2 characters | `Douala` |
| 6 | `MOYENNE` | number | Decimal (0-20) | 0 ≤ value ≤ 20, min 10 for eligibility | `15.5` |
| 7 | `PARCOURS` | text | — | Min 1 character | `Informatique` |
| 8 | `SPECIALITE` | text | — | Min 1 character | `Génie Logiciel` |

#### OPTIONAL columns

| # | Exact column name | Type | Example | Description |
|---|----------------------|------|---------|-------------|
| 9 | `NIVEAU` | text | `L3` | Academic level |
| 10 | `SEMESTRE` | text | `2` | Semester number |
| 11 | `CYCLE` | text | `Licence` | Study cycle |
| 12 | `FILIERE` | text | `Informatique` | Field of study |
| 13 | `ANNEE ACADEMIQUE` | text | `2024-2025` | Academic year |
| 14 | `SEXE` | text | `M` or `F` | Gender |
| 15 | `EMAIL` | text | `jean@example.com` | Email address |
| 16 | `OPTION` | text | `Réseaux` | Option/specialization |
| 17 | `GRADE` | text | `B+` | Letter grade |
| 18 | `MENTION` | text | `Bien` | Honors (mention) |
| 19 | `FINALITE` | text | `Professionnelle` | Degree type |
| 20 | `TOTAL CREDIT` | number | `180` | Total credits earned |
| 21 | `DOMAINE` | text | `Sciences et Technologies` | Field of study (domain) |
| 22 | `DATE JURY` | text | `15/06/2024` | Jury date |

#### Additional REQUIRED columns if `establishmentType = "faculty"`

| # | Exact column name | Type | Example |
|---|----------------------|------|---------|
| 23 | `DOMAINE_EN` | text | `Science and Technology` |
| 24 | `PARCOURS_EN` | text | `Computer Science` |
| 25 | `SPECIALITE_EN` | text | `Software Engineering` |
| 26 | `FINALITE_EN` | text | `Professional` |

#### OPTIONAL columns (faculty mode)

| # | Exact column name | Type | Example |
|---|----------------------|------|---------|
| 27 | `OPTION_EN` | text | `Networks` |
| 28 | `MENTION_EN` | text | `Good` |

---

### 2.3 — TRANSCRIPT (`diplomation-releves.xlsx`)

#### REQUIRED columns

| # | Exact column name | Type | Format | Constraints | Example |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | text | — | Min 2 characters | `MARTIN` |
| 2 | `PRENOM` | text | — | Min 2 characters | `Sophie` |
| 3 | `MATRICULE` | text | Alphanumeric | Min 3 characters, unique | `2024001` |
| 4 | `DATE DE NAISSANCE` | text | `DD/MM/YYYY` | Valid date | `15/03/2005` |
| 5 | `LIEU DE NAISSANCE` | text | — | Min 2 characters | `Yaoundé` |

#### OPTIONAL columns (metadata)

| # | Exact column name | Type | Example | Description |
|---|----------------------|------|---------|-------------|
| 6 | `NIVEAU` | text | `L2` | Class level |
| 7 | `SEMESTRE` | text | `1` | Semester number |
| 8 | `CYCLE` | text | `Licence` | Study cycle |
| 9 | `FILIERE` | text | `Informatique` | Field of study/program |
| 10 | `ANNEE ACADEMIQUE` | text | `2024-2025` | Academic year (YYYY-YYYY format) |
| 11 | `SEXE` | text | `F` | Gender |
| 12 | `EMAIL` | text | `sophie@example.com` | Email address |

#### DYNAMIC columns (grades per course)

Each course (EC) is represented by **one column** whose name is the course name:

| Column format | Type | Range | Example |
|-------------------|------|-------|---------|
| `{Course name}` | number | 0-20 | Column `Mathématiques` → value `15.5` |
| `{Course name 2}` | number | 0-20 | Column `Physique` → value `12.0` |
| ... | ... | ... | ... |

#### DYNAMIC columns (sessions per course) — optional

Each course can have a session column prefixed with `S/`:

| Column format | Type | Value format | Example |
|-------------------|------|---------------|---------|
| `S/{Course name}` | text | `N/YYYY-YYYY` or `R/YYYY-YYYY` | `S/Mathématiques` → `N/2024-2025` |

- `N` = Normal session
- `R` = Retake session

#### Full structure example

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | NIVEAU | SEMESTRE | ANNEE ACADEMIQUE | Anatomie Humaine | Physiologie | S/Anatomie Humaine | S/Physiologie |
|-----|--------|-----------|-------------------|-------------------|--------|----------|------------------|------------------|-------------|---------------------|---------------|
| MARTIN | Sophie | 2024001 | 15/03/2005 | Yaoundé | L1 | 1 | 2024-2025 | 15.5 | 12.0 | N/2024-2025 | R/2024-2025 |

---

### 2.4 — CENTRE CERTIFICATE (`diplomation-attestations-centre.xlsx`)

#### REQUIRED columns

| # | Exact column name | Type | Format | Constraints | Example |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | text | — | Min 2 characters | `MARTIN` |
| 2 | `PRENOM` | text | — | Min 2 characters | `Sophie` |
| 3 | `MATRICULE` | text | Alphanumeric | Min 3 characters, unique | `2024001` |
| 4 | `DATE DE NAISSANCE` | text | `DD/MM/YYYY` | Valid date, 1900 ≤ year ≤ current | `15/03/2005` |
| 5 | `LIEU DE NAISSANCE` | text | — | Min 2 characters | `Douala` |
| 6 | `SPECIALITE` | text | — | Min 3 characters | `Systèmes et Réseaux` |
| 7 | `SESSION_EXAMEN` | text | — | Min 3 characters | `septembre 2025` |
| 8 | `LIEU_DELIVRANCE` | text | — | Min 2 characters | `Douala` |
| 9 | `MENTION` | text | — | Not empty | `Bien` |
| 10 | `GRADE` | text | Letter(s) | Valid grade | `B+` |
| 11 | `MOYENNE` | number | Decimal (0-20) | 0 ≤ value ≤ 20 | `15.5` |

#### OPTIONAL columns

| # | Exact column name | Type | Example | Description |
|---|----------------------|------|---------|-------------|
| 12 | `SPECIALITE_EN` | text | `Systems and Networks` | Specialty in English |
| 13 | `MENTION_EN` | text | `Good` | Honors in English |
| 14 | `NUMERO_ORDRE` | text | `001` | Jury order number |
| 15 | `OPTION` | text | `Sécurité Informatique` | Option |
| 16 | `OPTION_EN` | text | `Cybersecurity` | Option in English |
| 17 | `ANNEE_ACADEMIQUE` | text | `2024-2025` | Academic year |
| 18 | `TITRE_ATTESTATION_FR` | text | `Attestation de Réussite` | FR title |
| 19 | `TITRE_ATTESTATION_EN` | text | `Certificate of Success` | EN title |
| 20 | `SPECIALITE_ABR` | text | `SR` | Specialty abbreviation |

---

## 3. Data mapping

> **Legend:**
> - ✅ **AUTO** = Provided automatically from the database
> - 🔶 **CALC** = Calculated automatically from other fields
> - ❌ **EMPTY** = Not available in grades-manager-api — **the column will be present but empty**, to be filled in manually in the Excel file before importing into DIPLOMATION

---

### 3.1 — DIPLOMA mapping

#### Columns filled automatically (✅ AUTO + 🔶 CALC)

| DIPLOMATION column | Status | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Uppercase |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | As is |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | As is |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | Format as `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | As is (empty if not set in the profile) |
| `PARCOURS` | ✅ AUTO | `programs.name` | As is |
| `SPECIALITE` | ✅ AUTO | `programOptions.name` | As is (fallback: `programs.name` if there is no option) |
| `MOYENNE` | ✅ AUTO | `studentPromotionSummaries.overallAverage` | Rounded to 2 decimals |
| `ANNEE OBTENTION` | ✅ AUTO | `academicYears.name` | Extract the final year (e.g. `2024/2025` → `2025`) |
| `GRADE` | 🔶 CALC | Calculated from `overallAverage` | See table §5.1 |
| `MENTION` | 🔶 CALC | Calculated from `overallAverage` | See table §5.2 (diploma honors) |
| `MENTION_EN` | 🔶 CALC | Calculated from `overallAverage` | Automatic English translation of the honors |

#### Columns left EMPTY (❌)

| DIPLOMATION column | Status | Reason | Action required |
|---------------------|--------|--------|----------------|
| `TITRE DIPLOME FR` | ❌ EMPTY | No "official diploma title" field in the DB. Varies with the official institutional context. | Fill in manually. E.g. `DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE` |
| `TITRE DIPLOME EN` | ❌ EMPTY | Same, English version. | Fill in manually. E.g. `DOCTOR OF MEDICINE STATE DEGREE` |
| `DATE JURY ADMISSION` | ❌ EMPTY | The `enrollments.admissionDate` field is the enrollment date, not the date of the official admission jury. | Fill in manually. Format `DD/MM/YYYY` |
| `DATE JURY DELIBERATION` | ❌ EMPTY | No matching field in the schema. This is the date of the final defense/deliberation jury. | Fill in manually. Format `DD/MM/YYYY` |
| `OPTION` | ❌ EMPTY | The `programOptions.name` field is already used for `SPECIALITE`. The option is an additional sub-level that does not exist. | Fill in if applicable, otherwise leave empty |
| `OPTION_EN` | ❌ EMPTY | No English translations in the `programs`/`programOptions` tables. | Fill in if applicable |

---

### 3.2 — CERTIFICATE mapping

#### Columns filled automatically (✅ AUTO + 🔶 CALC)

| DIPLOMATION column | Status | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Uppercase |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | As is |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | As is |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | As is |
| `MOYENNE` | ✅ AUTO | `studentPromotionSummaries.overallAverage` | Rounded to 2 decimals |
| `PARCOURS` | ✅ AUTO | `programs.name` | As is |
| `SPECIALITE` | ✅ AUTO | `programOptions.name` | As is |
| `NIVEAU` | ✅ AUTO | `cycleLevels.code` | E.g. `L3`, `M2`, `BTS2` |
| `SEMESTRE` | ✅ AUTO | `semesters.orderIndex` | E.g. `1`, `2` |
| `CYCLE` | ✅ AUTO | `studyCycles.name` | E.g. `Licence`, `Master`, `BTS` |
| `FILIERE` | ✅ AUTO | `programs.name` | As is |
| `ANNEE ACADEMIQUE` | ✅ AUTO | `academicYears.name` | Replace `/` with `-` → `2024-2025` |
| `SEXE` | ✅ AUTO | `domainUsers.gender` | `male` → `M`, `female` → `F` |
| `EMAIL` | ✅ AUTO | `domainUsers.primaryEmail` | As is |
| `TOTAL CREDIT` | ✅ AUTO | `studentPromotionSummaries.creditsEarned` | As is |
| `GRADE` | 🔶 CALC | Calculated from `overallAverage` | See table §5.1 |
| `MENTION` | 🔶 CALC | Calculated from `overallAverage` | See table §5.2 (certificate honors) |
| `MENTION_EN` | 🔶 CALC | Calculated from `overallAverage` | Automatic English translation |

#### Columns left EMPTY (❌)

| DIPLOMATION column | Status | Reason | Action required |
|---------------------|--------|--------|----------------|
| `OPTION` | ❌ EMPTY | Specialization sub-level missing from the schema. | Fill in if applicable |
| `FINALITE` | ❌ EMPTY | No "purpose" field (professional, research, etc.) in the schema. | Fill in manually. E.g. `Professionnelle` |
| `DOMAINE` | ❌ EMPTY | No "field of study" field (grouping above the program). | Fill in manually. E.g. `Sciences et Technologies` |
| `DATE JURY` | ❌ EMPTY | No jury date field in the schema. | Fill in manually. Format `DD/MM/YYYY` |
| `DOMAINE_EN` | ❌ EMPTY | No English translations in the DB. | Fill in if faculty mode |
| `PARCOURS_EN` | ❌ EMPTY | No `nameEn` field on the `programs` table. | Fill in if faculty mode |
| `SPECIALITE_EN` | ❌ EMPTY | No `nameEn` field on the `programOptions` table. | Fill in if faculty mode |
| `FINALITE_EN` | ❌ EMPTY | See `FINALITE`. | Fill in if faculty mode |
| `OPTION_EN` | ❌ EMPTY | See `OPTION`. | Fill in if applicable |

---

### 3.3 — TRANSCRIPT mapping

#### Columns filled automatically (✅ AUTO)

| DIPLOMATION column | Status | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Uppercase |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | As is |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | As is |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | As is |
| `NIVEAU` | ✅ AUTO | `cycleLevels.code` | E.g. `L1`, `BTS1` |
| `SEMESTRE` | ✅ AUTO | `semesters.orderIndex` | E.g. `1`, `2` |
| `CYCLE` | ✅ AUTO | `studyCycles.name` | E.g. `Licence`, `BTS` |
| `FILIERE` | ✅ AUTO | `programs.name` | As is |
| `ANNEE ACADEMIQUE` | ✅ AUTO | `academicYears.name` | Format `YYYY-YYYY` |
| `SEXE` | ✅ AUTO | `domainUsers.gender` | `male` → `M`, `female` → `F` |
| `EMAIL` | ✅ AUTO | `domainUsers.primaryEmail` | As is |
| `{Course name}` | 🔶 CALC | `grades` + `exams` via `classCourses` | Weighted CC+Exam average per course (see §5.3) |
| `S/{Course name}` | 🔶 CALC | `exams.sessionType` + `academicYears.name` | `normal` → `N/YYYY-YYYY`, `retake` → `R/YYYY-YYYY` |

#### Columns left EMPTY (❌)

**No empty columns for the transcript.** All the required data is available in grades-manager-api. The dynamic columns (grades and sessions) are generated automatically from the recorded exams and grades.

---

### 3.4 — CENTRE CERTIFICATE mapping

#### Columns filled automatically (✅ AUTO + 🔶 CALC)

| DIPLOMATION column | Status | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Uppercase |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | As is |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | As is |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | As is |
| `SPECIALITE` | ✅ AUTO | `programOptions.name` | As is |
| `MOYENNE` | ✅ AUTO | `studentPromotionSummaries.overallAverage` | Rounded to 2 decimals |
| `ANNEE_ACADEMIQUE` | ✅ AUTO | `academicYears.name` | Format `YYYY-YYYY` |
| `GRADE` | 🔶 CALC | Calculated from `overallAverage` | See table §5.1 |
| `MENTION` | 🔶 CALC | Calculated from `overallAverage` | See table §5.2 (certificate honors) |
| `MENTION_EN` | 🔶 CALC | Calculated from `overallAverage` | Automatic English translation |

#### Columns left EMPTY (❌)

| DIPLOMATION column | Status | Reason | Action required |
|---------------------|--------|--------|----------------|
| `SESSION_EXAMEN` | ❌ EMPTY | No "exam session" concept (June/September) in the schema. The API offers this field as an input parameter, but if it is not provided, the column stays empty. | Fill in manually. E.g. `juin 2025` |
| `LIEU_DELIVRANCE` | ❌ EMPTY | No dedicated "place of issue" field. `institutions.addressFr` holds the full address, not just the city. | Fill in manually. E.g. `Douala` |
| `NUMERO_ORDRE` | ❌ EMPTY | No sequential jury order number in the schema. | Fill in manually. E.g. `001` |
| `SPECIALITE_EN` | ❌ EMPTY | No `nameEn` field on the `programOptions` table. | Fill in if needed |
| `OPTION` | ❌ EMPTY | Sub-level missing. | Fill in if applicable |
| `OPTION_EN` | ❌ EMPTY | See `OPTION`. | Fill in if applicable |
| `TITRE_ATTESTATION_FR` | ❌ EMPTY | Custom certificate title, not provided for in the schema. | Fill in if needed. E.g. `Attestation de Réussite` |
| `TITRE_ATTESTATION_EN` | ❌ EMPTY | Same, English version. | Fill in if needed. E.g. `Certificate of Success` |
| `SPECIALITE_ABR` | ❌ EMPTY | No specialty abbreviation in the schema. | Fill in if needed. E.g. `SR` |

---

### 3.5 — Summary: coverage rate per document type

| Document type | Total columns | ✅ AUTO | 🔶 CALC | ❌ EMPTY | Coverage rate |
|------------------|-----------------|---------|---------|--------|-------------------|
| **Diploma** | 18 | 9 | 3 | 6 | **67%** (12/18) |
| **Certificate** | 28 | 16 | 3 | 9 | **68%** (19/28) |
| **Transcript** | 12 + dynamic | 10 + dynamic | 2 (per course) | 0 | **100%** |
| **Centre Certificate** | 20 | 8 | 3 | 9 | **55%** (11/20) |

> **The transcript is the only fully (100%) automatable document.**
> For the others, the user will have to fill in the empty columns in the Excel file before importing it into DIPLOMATION.

---

## 4. Validation rules and formats

### 4.1 — Date formats

| Rule | Detail |
|-------|--------|
| Separators accepted by DIPLOMATION | `/`, `-`, `.` |
| Required format | `DD/MM/YYYY` (day/month/year) |
| Valid day | 1-31 (checked against the month) |
| Valid month | 1-12 |
| Valid year | 1900 to current year |

**Transformation**: `domainUsers.dateOfBirth` (PostgreSQL `date` type) → format as `DD/MM/YYYY`.

### 4.2 — Numeric formats

| Rule | Detail |
|-------|--------|
| Grading scale | 0 to 20 |
| Accepted decimal separator | `.` (dot) and `,` (comma) |
| Precision | 2 decimals |
| Pass threshold (diploma) | ≥ 10.00 |

### 4.3 — Text formats

| Rule | Detail |
|-------|--------|
| Accents | Preserved (É, È, Ê, Ç, À, etc.) |
| Column name case | Insensitive (`NOM`, `nom`, `Nom` accepted) |
| Whitespace | Stripped at start/end (trim) |
| Forbidden values | `""` (empty), `"N/D"` for required fields |

### 4.4 — Accepted alternative column names

DIPLOMATION accepts these alternative names (case-insensitive):

| Primary name | Accepted alternatives |
|---------------|------------------------|
| `NOM` | `nom`, `surname`, `last_name`, `family_name`, `nom de famille` |
| `PRENOM` | `prenom`, `firstname`, `first_name`, `given_name`, `prénom` |
| `MATRICULE` | `mat`, `student_id`, `registration_number`, `numero matricule` |
| `DATE DE NAISSANCE` | `date_naissance`, `birth_date`, `birthdate`, `date_of_birth`, `naissance` |
| `LIEU DE NAISSANCE` | `lieu_naissance`, `birth_place`, `birthplace`, `place_of_birth` |
| `PARCOURS` | `course`, `program`, `pathway`, `programme`, `formation` |
| `SPECIALITE` | `specialty`, `specialization`, `major`, `spécialité` |
| `MOYENNE` | `average`, `gpa`, `mean_grade`, `note moyenne`, `score` |
| `ANNEE ACADEMIQUE` | `annee_academique`, `academic_year`, `year`, `année académique` |
| `SEXE` | `genre`, `gender`, `sex` |
| `EMAIL` | `e-mail`, `mail`, `adresse email`, `courriel` |

**Recommendation**: Use the primary names (left column) to maximize compatibility.

---

## 5. Calculations and formulas

### 5.1 — Average → Grade conversion table

| Average | Grade |
|---------|-------|
| ≥ 18.00 | `A+` |
| ≥ 16.00 | `A` |
| ≥ 14.00 | `B+` |
| ≥ 13.00 | `B` |
| ≥ 12.00 | `B-` |
| ≥ 11.00 | `C+` |
| ≥ 10.00 | `C` |
| ≥ 9.00 | `C-` |
| ≥ 8.00 | `D` |
| ≥ 6.00 | `E` |
| < 6.00 | `F` |

### 5.2 — Average → Honors (mention) conversion table

#### Honors for Diplomas

| Average | Honors FR | Honors EN |
|---------|-----------|-----------|
| ≥ 18.00 | `TRES HONORABLE AVEC FELICITATIONS DU JURY` | `HIGHEST HONORS WITH JURY COMMENDATION` |
| ≥ 16.00 | `TRES HONORABLE` | `HIGHEST HONORS` |
| ≥ 14.00 | `HONORABLE` | `HIGH HONORS` |
| ≥ 12.00 | `ASSEZ BIEN` | `GOOD` |
| ≥ 10.00 | `PASSABLE` | `SATISFACTORY` |

#### Honors for Certificates

| Average | Honors FR | Honors EN |
|---------|-----------|-----------|
| ≥ 18.00 | `Excellent` | `Excellent` |
| ≥ 16.00 | `Très Bien` | `Very Good` |
| ≥ 14.00 | `Bien` | `Good` |
| ≥ 12.00 | `Assez Bien` | `Fairly Good` |
| ≥ 10.00 | `Passable` | `Satisfactory` |
| ≥ 9.00 | `Insuffisant` | `Insufficient` |
| ≥ 8.00 | `Faible` | `Weak` |
| ≥ 6.00 | `Très Faible` | `Very Weak` |
| < 6.00 | `Nul` | `Null` |

### 5.3 — Grade calculation formulas

#### Average per course (EC)

```
course_average = Σ(exam_grade × exam_percentage) / 100
```

Example: CC=12 (40%) + Exam=15 (60%) → `(12×40 + 15×60) / 100 = 13.8`

#### Retake resolution

- **`replace` policy**: the retake grade replaces the normal grade
- **`best_of` policy**: keep `max(normal_grade, retake_grade)`

#### Average per UE (teaching unit)

```
UE_average = Σ(course_average × course_coefficient) / Σ(course_coefficient)
```

#### Overall average (weighted by credits)

```
overall_average = Σ(UE_average × UE_credits) / Σ(UE_credits)
```

### 5.4 — Academic decisions

| Condition | Decision |
|-----------|----------|
| UE_average ≥ passing_grade (10) AND all grades present | `Ac` (Acquired) |
| At least one grade missing in the UE | `Inc` (Incomplete) |
| UE_average < passing_grade | `Nac` (Not acquired) |

### 5.5 — Credits

| Condition | Credits awarded |
|-----------|-------------------|
| UE validated (`Ac`) | All of the UE's credits |
| UE not validated (`Nac` or `Inc`) | 0 credits |

---

## 6. Implementation plan

### Phase 1: DIPLOMATION export module (Backend)

**New module**: `apps/server/src/modules/diplomation-export/`

```
apps/server/src/modules/diplomation-export/
├── index.ts                          # Router export
├── diplomation-export.router.ts      # tRPC endpoints
├── diplomation-export.service.ts     # Business logic
├── diplomation-export.repo.ts        # Database queries
├── diplomation-export.zod.ts         # Validation schemas (input)
├── diplomation-export.helpers.ts     # Calculation functions (grade, honors)
├── diplomation-export.types.ts       # TypeScript types
└── __tests__/
    └── diplomation-export.caller.test.ts  # Tests
```

### Phase 2: Router integration

Add the module in `apps/server/src/routers/index.ts`:

```typescript
diplomationExport: diplomationExportRouter,
```

### Phase 3: Frontend (export buttons)

Add buttons in the web interface to trigger the download of the Excel files:

- Class page → "Exporter pour DIPLOMATION" → choice of type (Diploma, Certificate, Transcript, Centre Certificate)
- Generation on the backend → download of the .xlsx

### Phase 4: Dependency

Add the Excel library to the backend:

```bash
bun add exceljs --filter server
```

---

## 7. API endpoints to create

### 7.1 — Diplomas export

```
POST /trpc/diplomationExport.generateDiplomas
```

**Input:**
```typescript
{
  classId: string;              // Class ID (required)
  academicYearId: string;       // Academic year ID (required)
}
```

**Filled columns:** NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, PARCOURS, SPECIALITE, MOYENNE, GRADE, MENTION, MENTION_EN, ANNEE OBTENTION
**EMPTY columns to fill in:** TITRE DIPLOME FR, TITRE DIPLOME EN, DATE JURY ADMISSION, DATE JURY DELIBERATION, OPTION, OPTION_EN

**Output:** `.xlsx` file as base64 or direct download

### 7.2 — Certificates export

```
POST /trpc/diplomationExport.generateAttestations
```

**Input:**
```typescript
{
  classId: string;              // Class ID (required)
  academicYearId: string;       // Academic year ID (required)
  semesterId?: string;          // Optional, for a specific semester
}
```

**Filled columns:** NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, MOYENNE, PARCOURS, SPECIALITE, NIVEAU, SEMESTRE, CYCLE, FILIERE, ANNEE ACADEMIQUE, SEXE, EMAIL, TOTAL CREDIT, GRADE, MENTION, MENTION_EN
**EMPTY columns to fill in:** OPTION, FINALITE, DOMAINE, DATE JURY, DOMAINE_EN, PARCOURS_EN, SPECIALITE_EN, FINALITE_EN, OPTION_EN

### 7.3 — Transcripts export

```
POST /trpc/diplomationExport.generateTranscripts
```

**Input:**
```typescript
{
  classId: string;              // Class ID (required)
  semesterId: string;           // Semester ID (required)
  academicYearId: string;       // Academic year ID (required)
}
```

**Filled columns:** ALL (100% automatic)
**EMPTY columns:** None

### 7.4 — Centre Certificates export

```
POST /trpc/diplomationExport.generateCentreAttestations
```

**Input:**
```typescript
{
  classId: string;              // Class ID (required)
  academicYearId: string;       // Academic year ID (required)
}
```

**Filled columns:** NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, SPECIALITE, MOYENNE, ANNEE_ACADEMIQUE, GRADE, MENTION, MENTION_EN
**EMPTY columns to fill in:** SESSION_EXAMEN, LIEU_DELIVRANCE, NUMERO_ORDRE, SPECIALITE_EN, OPTION, OPTION_EN, TITRE_ATTESTATION_FR, TITRE_ATTESTATION_EN, SPECIALITE_ABR

---

## 8. Data examples

### 8.1 — Diploma Excel example

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | PARCOURS | SPECIALITE | MOYENNE | GRADE | MENTION | TITRE DIPLOME FR | TITRE DIPLOME EN | ANNEE OBTENTION | DATE JURY ADMISSION | DATE JURY DELIBERATION |
|-----|--------|-----------|-------------------|-------------------|----------|------------|---------|-------|---------|------------------|------------------|-----------------|---------------------|------------------------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | BTS Sciences Infirmières | Soins Infirmiers | 14.50 | B+ | HONORABLE | BREVET DE TECHNICIEN SUPÉRIEUR EN SCIENCES INFIRMIÈRES | HIGHER TECHNICIAN CERTIFICATE IN NURSING SCIENCES | 2025 | 01/09/2024 | 15/07/2025 |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | BTS Sciences Infirmières | Soins Infirmiers | 16.20 | A | TRES HONORABLE | BREVET DE TECHNICIEN SUPÉRIEUR EN SCIENCES INFIRMIÈRES | HIGHER TECHNICIAN CERTIFICATE IN NURSING SCIENCES | 2025 | 01/09/2024 | 15/07/2025 |

### 8.2 — Certificate Excel example

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | MOYENNE | PARCOURS | SPECIALITE | NIVEAU | CYCLE | ANNEE ACADEMIQUE | GRADE | MENTION | TOTAL CREDIT | SEXE |
|-----|--------|-----------|-------------------|-------------------|---------|----------|------------|--------|-------|------------------|-------|---------|--------------|------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | 14.50 | BTS Sciences Infirmières | Soins Infirmiers | BTS2 | BTS | 2024-2025 | B+ | Bien | 120 | M |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | 16.20 | BTS Sciences Infirmières | Soins Infirmiers | BTS2 | BTS | 2024-2025 | A | Très Bien | 120 | F |

### 8.3 — Transcript Excel example

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | NIVEAU | SEMESTRE | CYCLE | FILIERE | ANNEE ACADEMIQUE | Anatomie Humaine | Physiologie | Soins Infirmiers de Base | S/Anatomie Humaine | S/Physiologie | S/Soins Infirmiers de Base |
|-----|--------|-----------|-------------------|-------------------|--------|----------|-------|---------|------------------|------------------|-------------|--------------------------|---------------------|---------------|----------------------------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | BTS1 | 1 | BTS | Sciences Infirmières | 2024-2025 | 14.00 | 12.50 | 16.00 | N/2024-2025 | N/2024-2025 | N/2024-2025 |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | BTS1 | 1 | BTS | Sciences Infirmières | 2024-2025 | 17.00 | 15.00 | 16.50 | N/2024-2025 | R/2024-2025 | N/2024-2025 |

### 8.4 — Centre Certificate Excel example

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | SPECIALITE | SESSION_EXAMEN | LIEU_DELIVRANCE | MENTION | GRADE | MOYENNE | ANNEE_ACADEMIQUE |
|-----|--------|-----------|-------------------|-------------------|------------|----------------|-----------------|---------|-------|---------|------------------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | Soins Infirmiers | juin 2025 | Douala | Bien | B+ | 14.50 | 2024-2025 |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | Soins Infirmiers | juin 2025 | Yaoundé | Très Bien | A | 16.20 | 2024-2025 |

---

## Appendix A — Database tables used

### Query path for each export

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIPLOMA / CERTIFICATE                        │
│                                                                 │
│  classes ──→ enrollments ──→ students ──→ domainUsers           │
│    │                            │                               │
│    ├── program ──→ programOptions                               │
│    │      └── studyCycles ──→ cycleLevels                       │
│    │                                                            │
│    └── academicYear                                             │
│                                                                 │
│  studentPromotionSummaries (overallAverage, creditsEarned)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TRANSCRIPT                                   │
│                                                                 │
│  classes ──→ classCourses ──→ courses ──→ teachingUnits         │
│    │              │                                             │
│    │              └── exams ──→ grades (per student)             │
│    │                                                            │
│    ├── enrollments ──→ students ──→ domainUsers                 │
│    │                                                            │
│    ├── program ──→ studyCycles ──→ cycleLevels                  │
│    │                                                            │
│    ├── semesters                                                │
│    │                                                            │
│    └── academicYear                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Key source files (grades-manager-api)

| File | Contents |
|---------|---------|
| `apps/server/src/db/schema/app-schema.ts` | Full database schema (1984 lines) |
| `apps/server/src/modules/exports/exports.service.ts` | Existing export service (PV, Eval, UE) |
| `apps/server/src/modules/exports/exports.repo.ts` | DB queries for the exports |
| `apps/server/src/modules/exports/template-helper.ts` | Template helpers (appreciations, formatting) |
| `apps/server/src/modules/student-promotion-summaries/` | Calculation of promotion summaries |

### Key source files (DIPLOMATION)

| File | Contents |
|---------|---------|
| `src/lib/diploma-generator/types.ts` | DiplomaStudentRecord types |
| `src/types/student.ts` | StudentRecord, CourseRecord types |
| `src/lib/validators/excel-columns.ts` | Excel column validation |
| `src/lib/helpers/grades.ts` | Grade and honors calculations |
| `src/lib/helpers/excel-template-generator.ts` | Excel template generation |
| `src/lib/form-schemas/diploma-theme-settings.ts` | Theme settings (40+) |

---

## Appendix B — Full inventory of EMPTY columns (not provided)

These columns will be **present in the Excel file but with empty cells**. The user must fill them in manually in the Excel file before importing it into DIPLOMATION.

### Diploma (6 empty columns out of 18)

| Empty column | Required in DIPLOMATION? | Why it is missing | Example to fill in |
|--------------|-------------------------------|------------------|-------------------|
| `TITRE DIPLOME FR` | **YES** | Official diploma title, not modeled. Varies with the institutional context. | `BREVET DE TECHNICIEN SUPÉRIEUR EN SCIENCES INFIRMIÈRES` |
| `TITRE DIPLOME EN` | **YES** | Same, English version. | `HIGHER TECHNICIAN CERTIFICATE IN NURSING SCIENCES` |
| `DATE JURY ADMISSION` | **YES** | Date of the initial admission jury, different from the enrollment date. | `01/09/2024` |
| `DATE JURY DELIBERATION` | **YES** | Date of the final deliberation jury. No field in the schema. | `15/07/2025` |
| `OPTION` | No (optional) | Specialization sub-level, missing from the schema. | `Chirurgie` or leave empty |
| `OPTION_EN` | No (optional) | No English translation of programs in the DB. | `Surgery` or leave empty |

### Certificate (9 empty columns out of 28)

| Empty column | Required in DIPLOMATION? | Why it is missing | Example to fill in |
|--------------|-------------------------------|------------------|-------------------|
| `OPTION` | No | Sub-level missing from the schema. | `Réseaux` |
| `FINALITE` | No | No "purpose" concept (professional/research) in the schema. | `Professionnelle` |
| `DOMAINE` | No | No "domain" grouping above the program. | `Sciences et Technologies` |
| `DATE JURY` | No | No jury date. | `15/06/2025` |
| `DOMAINE_EN` | **YES if faculty mode** | No English translations in the DB. | `Science and Technology` |
| `PARCOURS_EN` | **YES if faculty mode** | No `nameEn` field on `programs`. | `Nursing Sciences` |
| `SPECIALITE_EN` | **YES if faculty mode** | No `nameEn` field on `programOptions`. | `Nursing Care` |
| `FINALITE_EN` | **YES if faculty mode** | See `FINALITE`. | `Professional` |
| `OPTION_EN` | No | See `OPTION`. | `Networks` |

### Transcript (0 empty columns)

**No empty columns.** All the data is available in grades-manager-api.

### Centre Certificate (9 empty columns out of 20)

| Empty column | Required in DIPLOMATION? | Why it is missing | Example to fill in |
|--------------|-------------------------------|------------------|-------------------|
| `SESSION_EXAMEN` | **YES** | No "exam session" concept (June/September) in the schema. | `juin 2025` |
| `LIEU_DELIVRANCE` | **YES** | No dedicated "city of issue" field. | `Douala` |
| `NUMERO_ORDRE` | No (warning if missing) | No sequential jury order number. | `001` |
| `SPECIALITE_EN` | No | No English translation of the specialty. | `Nursing Care` |
| `OPTION` | No | Sub-level missing. | `Sécurité Informatique` |
| `OPTION_EN` | No | See `OPTION`. | `Cybersecurity` |
| `TITRE_ATTESTATION_FR` | No | Custom title not provided for in the schema. | `Attestation de Réussite` |
| `TITRE_ATTESTATION_EN` | No | Same, English version. | `Certificate of Success` |
| `SPECIALITE_ABR` | No | No stored abbreviation. | `SR` |

---

## Appendix C — Existing institution configuration

The `institutions` table holds a `metadata` field (JSONB) with the `export_config` structure:

```typescript
{
  export_config: {
    grading: {
      appreciations: [
        { label: "Excellent",     min: 16, max: 20 },
        { label: "Très Bien",     min: 14, max: 15.99 },
        { label: "Bien",          min: 12, max: 13.99 },
        { label: "Assez Bien",    min: 10, max: 11.99 },
        { label: "Passable",      min: 8,  max: 9.99 },
        { label: "Insuffisant",   min: 0,  max: 7.99 },
      ],
      passing_grade: 10,
      scale: 20,
    },
    signatures: {
      pv:         [{ position: "Le Rapporteur", name: "" }, ...],
      evaluation: [{ position: "L'Enseignant", name: "" }, ...],
      ue:         [{ position: "Le Rapporteur", name: "" }, ...],
    },
    exam_settings: {
      default_duration_hours: 2,
      default_coefficient: 1,
      exam_types: {
        CC:        { label: "Contrôle Continu",          coefficient: 0.4 },
        TPE:       { label: "Travaux Pratiques Encadrés", coefficient: 0.3 },
        TP:        { label: "Travaux Pratiques",          coefficient: 0.3 },
        EXAMEN:    { label: "Examen",                     coefficient: 0.6 },
        RATTRAPAGE:{ label: "Rattrapage",                 coefficient: 1.0 },
      },
    },
    watermark: { text: "ORIGINAL", enabled: true },
  }
}
```

This configuration is **reusable** for the DIPLOMATION exports (appreciations, passing grade, scale).
