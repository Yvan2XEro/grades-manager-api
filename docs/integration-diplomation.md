# Integration grades-manager-api → DIPLOMATION

## Objectif

L'application **grades-manager-api** doit générer des fichiers Excel (.xlsx) prêts à l'emploi pour l'application **DIPLOMATION** (SGN-Notes), une application desktop Electron qui produit des documents académiques officiels (diplômes, relevés de notes, attestations) avec QR codes chiffrés.

**Flux simplifié :**

```
grades-manager-api  →  Fichier Excel (.xlsx)  →  DIPLOMATION  →  PDF (diplômes, relevés, attestations)
```

---

## Table des matières

1. [Vue d'ensemble des deux applications](#1-vue-densemble-des-deux-applications)
2. [Fichiers Excel attendus par DIPLOMATION](#2-fichiers-excel-attendus-par-diplomation)
3. [Mapping des données : grades-manager-api → DIPLOMATION](#3-mapping-des-données)
4. [Règles de validation et formats](#4-règles-de-validation-et-formats)
5. [Calculs et formules](#5-calculs-et-formules)
6. [Plan d'implémentation](#6-plan-dimplémentation)
7. [Endpoints API à créer](#7-endpoints-api-à-créer)
8. [Exemples de données](#8-exemples-de-données)

---

## 1. Vue d'ensemble des deux applications

### grades-manager-api (source des données)

| Aspect | Détail |
|--------|--------|
| **Stack** | Bun + Hono + tRPC + Drizzle ORM + PostgreSQL |
| **Rôle** | Gestion complète des données académiques |
| **Données** | Étudiants, inscriptions, cours, UE, examens, notes, crédits, promotions |
| **Exports existants** | PV de délibération, publications d'évaluations, publications d'UE (PDF/HTML) |
| **Localisation** | `C:\Users\tefba\Desktop\OverBrand\grades-manager-api` |

### DIPLOMATION (consommateur des données)

| Aspect | Détail |
|--------|--------|
| **Stack** | Electron + React + Vite + Tailwind + shadcn/ui |
| **Rôle** | Génération de documents académiques officiels avec QR codes |
| **Input** | Fichiers Excel (.xlsx, .xls) |
| **Output** | PDF (diplômes, relevés de notes, attestations) + QR codes chiffrés |
| **Documents** | 4 types : Diplôme, Relevé de Notes, Attestation, Attestation de Centre |
| **Localisation** | `C:\Users\tefba\Documents\FMSP\DIPLOMATION` |

---

## 2. Fichiers Excel attendus par DIPLOMATION

DIPLOMATION attend **4 types de fichiers Excel**, chacun avec des colonnes spécifiques.

---

### 2.1 — DIPLÔME (`diplomation-diplomes.xlsx`)

#### Colonnes OBLIGATOIRES

| # | Nom de colonne exact | Type | Format | Contraintes | Exemple |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | texte | — | Min 2 caractères, non vide, pas "N/D" | `ANGOA SAAH` |
| 2 | `PRENOM` | texte | — | Min 2 caractères, non vide, pas "N/D" | `GABRIELLE SANDRA` |
| 3 | `MATRICULE` | texte | Alphanumérique | Min 3 caractères, **unique** dans le fichier | `17MM019` |
| 4 | `DATE DE NAISSANCE` | texte | `DD/MM/YYYY` | Date valide, 1900 ≤ année ≤ année courante | `27/01/2000` |
| 5 | `LIEU DE NAISSANCE` | texte | — | Min 2 caractères | `YAOUNDE` |
| 6 | `PARCOURS` | texte | — | Min 1 caractère | `MÉDECINE` |
| 7 | `SPECIALITE` | texte | — | Min 1 caractère | `MÉDECINE GÉNÉRALE` |
| 8 | `MOYENNE` | nombre | Décimal (0-20) | 0 ≤ valeur ≤ 20, **minimum 10 pour générer** | `16.5` |
| 9 | `GRADE` | texte | Lettre(s) | Valeurs acceptées : A+, A, B+, B, B-, C+, C, C-, D, E, F | `A+` |
| 10 | `MENTION` | texte | — | Non vide, pas "N/D" | `TRES HONORABLE AVEC FELICITATIONS DU JURY` |
| 11 | `TITRE DIPLOME FR` | texte | — | Non vide, pas "N/D" | `DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE` |
| 12 | `TITRE DIPLOME EN` | texte | — | Non vide, pas "N/D" | `DOCTOR OF MEDICINE STATE DEGREE` |
| 13 | `ANNEE OBTENTION` | texte/nombre | Année (4 chiffres) | Format année valide | `2024` |
| 14 | `DATE JURY ADMISSION` | texte | `DD/MM/YYYY` | Date valide | `13/10/2017` |
| 15 | `DATE JURY DELIBERATION` | texte | `DD/MM/YYYY` | Date valide | `28/07/2024` |

#### Colonnes OPTIONNELLES

| # | Nom de colonne exact | Type | Exemple |
|---|----------------------|------|---------|
| 16 | `OPTION` | texte | `Chirurgie` ou `N/A` |
| 17 | `OPTION_EN` | texte | `Surgery` ou `N/A` |
| 18 | `MENTION_EN` | texte | `HIGH HONORS WITH JURY COMMENDATION` |

---

### 2.2 — ATTESTATION DE RÉUSSITE (`diplomation-attestations.xlsx`)

#### Colonnes OBLIGATOIRES

| # | Nom de colonne exact | Type | Format | Contraintes | Exemple |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | texte | — | Min 2 caractères | `DUPONT` |
| 2 | `PRENOM` | texte | — | Min 2 caractères | `Jean` |
| 3 | `MATRICULE` | texte | Alphanumérique | Min 3 caractères, unique | `2024001` |
| 4 | `DATE DE NAISSANCE` | texte | `DD/MM/YYYY` | Date valide | `15/03/2005` |
| 5 | `LIEU DE NAISSANCE` | texte | — | Min 2 caractères | `Douala` |
| 6 | `MOYENNE` | nombre | Décimal (0-20) | 0 ≤ valeur ≤ 20, min 10 pour éligibilité | `15.5` |
| 7 | `PARCOURS` | texte | — | Min 1 caractère | `Informatique` |
| 8 | `SPECIALITE` | texte | — | Min 1 caractère | `Génie Logiciel` |

#### Colonnes OPTIONNELLES

| # | Nom de colonne exact | Type | Exemple | Description |
|---|----------------------|------|---------|-------------|
| 9 | `NIVEAU` | texte | `L3` | Niveau académique |
| 10 | `SEMESTRE` | texte | `2` | Numéro de semestre |
| 11 | `CYCLE` | texte | `Licence` | Cycle d'études |
| 12 | `FILIERE` | texte | `Informatique` | Filière |
| 13 | `ANNEE ACADEMIQUE` | texte | `2024-2025` | Année académique |
| 14 | `SEXE` | texte | `M` ou `F` | Genre |
| 15 | `EMAIL` | texte | `jean@example.com` | Adresse email |
| 16 | `OPTION` | texte | `Réseaux` | Option/spécialisation |
| 17 | `GRADE` | texte | `B+` | Grade lettre |
| 18 | `MENTION` | texte | `Bien` | Mention |
| 19 | `FINALITE` | texte | `Professionnelle` | Type de diplôme |
| 20 | `TOTAL CREDIT` | nombre | `180` | Total crédits obtenus |
| 21 | `DOMAINE` | texte | `Sciences et Technologies` | Domaine d'études |
| 22 | `DATE JURY` | texte | `15/06/2024` | Date du jury |

#### Colonnes supplémentaires OBLIGATOIRES si `establishmentType = "faculty"`

| # | Nom de colonne exact | Type | Exemple |
|---|----------------------|------|---------|
| 23 | `DOMAINE_EN` | texte | `Science and Technology` |
| 24 | `PARCOURS_EN` | texte | `Computer Science` |
| 25 | `SPECIALITE_EN` | texte | `Software Engineering` |
| 26 | `FINALITE_EN` | texte | `Professional` |

#### Colonnes OPTIONNELLES (mode faculty)

| # | Nom de colonne exact | Type | Exemple |
|---|----------------------|------|---------|
| 27 | `OPTION_EN` | texte | `Networks` |
| 28 | `MENTION_EN` | texte | `Good` |

---

### 2.3 — RELEVÉ DE NOTES / TRANSCRIPT (`diplomation-releves.xlsx`)

#### Colonnes OBLIGATOIRES

| # | Nom de colonne exact | Type | Format | Contraintes | Exemple |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | texte | — | Min 2 caractères | `MARTIN` |
| 2 | `PRENOM` | texte | — | Min 2 caractères | `Sophie` |
| 3 | `MATRICULE` | texte | Alphanumérique | Min 3 caractères, unique | `2024001` |
| 4 | `DATE DE NAISSANCE` | texte | `DD/MM/YYYY` | Date valide | `15/03/2005` |
| 5 | `LIEU DE NAISSANCE` | texte | — | Min 2 caractères | `Yaoundé` |

#### Colonnes OPTIONNELLES (métadonnées)

| # | Nom de colonne exact | Type | Exemple | Description |
|---|----------------------|------|---------|-------------|
| 6 | `NIVEAU` | texte | `L2` | Niveau de classe |
| 7 | `SEMESTRE` | texte | `1` | Numéro de semestre |
| 8 | `CYCLE` | texte | `Licence` | Cycle d'études |
| 9 | `FILIERE` | texte | `Informatique` | Filière/programme |
| 10 | `ANNEE ACADEMIQUE` | texte | `2024-2025` | Année académique (format YYYY-YYYY) |
| 11 | `SEXE` | texte | `F` | Genre |
| 12 | `EMAIL` | texte | `sophie@example.com` | Adresse email |

#### Colonnes DYNAMIQUES (notes par cours)

Chaque cours (EC) est représenté par **une colonne** dont le nom est le nom du cours :

| Format de colonne | Type | Plage | Exemple |
|-------------------|------|-------|---------|
| `{Nom du cours}` | nombre | 0-20 | Colonne `Mathématiques` → valeur `15.5` |
| `{Nom du cours 2}` | nombre | 0-20 | Colonne `Physique` → valeur `12.0` |
| ... | ... | ... | ... |

#### Colonnes DYNAMIQUES (sessions par cours) — optionnelles

Chaque cours peut avoir une colonne de session préfixée par `S/` :

| Format de colonne | Type | Format valeur | Exemple |
|-------------------|------|---------------|---------|
| `S/{Nom du cours}` | texte | `N/YYYY-YYYY` ou `R/YYYY-YYYY` | `S/Mathématiques` → `N/2024-2025` |

- `N` = Session Normale
- `R` = Session de Rattrapage

#### Exemple de structure complète

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | NIVEAU | SEMESTRE | ANNEE ACADEMIQUE | Anatomie Humaine | Physiologie | S/Anatomie Humaine | S/Physiologie |
|-----|--------|-----------|-------------------|-------------------|--------|----------|------------------|------------------|-------------|---------------------|---------------|
| MARTIN | Sophie | 2024001 | 15/03/2005 | Yaoundé | L1 | 1 | 2024-2025 | 15.5 | 12.0 | N/2024-2025 | R/2024-2025 |

---

### 2.4 — ATTESTATION DE CENTRE (`diplomation-attestations-centre.xlsx`)

#### Colonnes OBLIGATOIRES

| # | Nom de colonne exact | Type | Format | Contraintes | Exemple |
|---|----------------------|------|--------|-------------|---------|
| 1 | `NOM` | texte | — | Min 2 caractères | `MARTIN` |
| 2 | `PRENOM` | texte | — | Min 2 caractères | `Sophie` |
| 3 | `MATRICULE` | texte | Alphanumérique | Min 3 caractères, unique | `2024001` |
| 4 | `DATE DE NAISSANCE` | texte | `DD/MM/YYYY` | Date valide, 1900 ≤ année ≤ courante | `15/03/2005` |
| 5 | `LIEU DE NAISSANCE` | texte | — | Min 2 caractères | `Douala` |
| 6 | `SPECIALITE` | texte | — | Min 3 caractères | `Systèmes et Réseaux` |
| 7 | `SESSION_EXAMEN` | texte | — | Min 3 caractères | `septembre 2025` |
| 8 | `LIEU_DELIVRANCE` | texte | — | Min 2 caractères | `Douala` |
| 9 | `MENTION` | texte | — | Non vide | `Bien` |
| 10 | `GRADE` | texte | Lettre(s) | Grade valide | `B+` |
| 11 | `MOYENNE` | nombre | Décimal (0-20) | 0 ≤ valeur ≤ 20 | `15.5` |

#### Colonnes OPTIONNELLES

| # | Nom de colonne exact | Type | Exemple | Description |
|---|----------------------|------|---------|-------------|
| 12 | `SPECIALITE_EN` | texte | `Systems and Networks` | Spécialité en anglais |
| 13 | `MENTION_EN` | texte | `Good` | Mention en anglais |
| 14 | `NUMERO_ORDRE` | texte | `001` | Numéro d'ordre du jury |
| 15 | `OPTION` | texte | `Sécurité Informatique` | Option |
| 16 | `OPTION_EN` | texte | `Cybersecurity` | Option en anglais |
| 17 | `ANNEE_ACADEMIQUE` | texte | `2024-2025` | Année académique |
| 18 | `TITRE_ATTESTATION_FR` | texte | `Attestation de Réussite` | Titre FR |
| 19 | `TITRE_ATTESTATION_EN` | texte | `Certificate of Success` | Titre EN |
| 20 | `SPECIALITE_ABR` | texte | `SR` | Abréviation spécialité |

---

## 3. Mapping des données

> **Légende :**
> - ✅ **AUTO** = Fourni automatiquement depuis la base de données
> - 🔶 **CALC** = Calculé automatiquement depuis d'autres champs
> - ❌ **VIDE** = Non disponible dans grades-manager-api — **la colonne sera présente mais vide**, à compléter manuellement dans le fichier Excel avant import dans DIPLOMATION

---

### 3.1 — Mapping DIPLÔME

#### Colonnes remplies automatiquement (✅ AUTO + 🔶 CALC)

| Colonne DIPLOMATION | Statut | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Majuscules |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | Tel quel |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | Tel quel |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | Formatter en `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | Tel quel (vide si non renseigné dans le profil) |
| `PARCOURS` | ✅ AUTO | `programs.name` | Tel quel |
| `SPECIALITE` | ✅ AUTO | `programOptions.name` | Tel quel (fallback: `programs.name` si pas d'option) |
| `MOYENNE` | ✅ AUTO | `studentPromotionSummaries.overallAverage` | Arrondi 2 décimales |
| `ANNEE OBTENTION` | ✅ AUTO | `academicYears.name` | Extraire l'année finale (ex: `2024/2025` → `2025`) |
| `GRADE` | 🔶 CALC | Calculé depuis `overallAverage` | Voir table §5.1 |
| `MENTION` | 🔶 CALC | Calculé depuis `overallAverage` | Voir table §5.2 (mentions diplômes) |
| `MENTION_EN` | 🔶 CALC | Calculé depuis `overallAverage` | Traduction anglaise automatique de la mention |

#### Colonnes laissées VIDES (❌)

| Colonne DIPLOMATION | Statut | Raison | Action requise |
|---------------------|--------|--------|----------------|
| `TITRE DIPLOME FR` | ❌ VIDE | Pas de champ "titre officiel du diplôme" dans la DB. Varie selon le contexte institutionnel officiel. | À remplir manuellement. Ex: `DIPLÔME D'ÉTAT DE DOCTEUR EN MÉDECINE` |
| `TITRE DIPLOME EN` | ❌ VIDE | Idem, version anglaise. | À remplir manuellement. Ex: `DOCTOR OF MEDICINE STATE DEGREE` |
| `DATE JURY ADMISSION` | ❌ VIDE | Le champ `enrollments.admissionDate` représente la date d'inscription, pas la date du jury d'admission officiel. | À remplir manuellement. Format `DD/MM/YYYY` |
| `DATE JURY DELIBERATION` | ❌ VIDE | Aucun champ correspondant dans le schéma. C'est la date du jury final de soutenance/délibération. | À remplir manuellement. Format `DD/MM/YYYY` |
| `OPTION` | ❌ VIDE | Le champ `programOptions.name` sert déjà pour `SPECIALITE`. L'option est un sous-niveau supplémentaire qui n'existe pas. | À remplir si applicable, sinon laisser vide |
| `OPTION_EN` | ❌ VIDE | Pas de traductions anglaises dans les tables `programs`/`programOptions`. | À remplir si applicable |

---

### 3.2 — Mapping ATTESTATION

#### Colonnes remplies automatiquement (✅ AUTO + 🔶 CALC)

| Colonne DIPLOMATION | Statut | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Majuscules |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | Tel quel |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | Tel quel |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | Tel quel |
| `MOYENNE` | ✅ AUTO | `studentPromotionSummaries.overallAverage` | Arrondi 2 décimales |
| `PARCOURS` | ✅ AUTO | `programs.name` | Tel quel |
| `SPECIALITE` | ✅ AUTO | `programOptions.name` | Tel quel |
| `NIVEAU` | ✅ AUTO | `cycleLevels.code` | Ex: `L3`, `M2`, `BTS2` |
| `SEMESTRE` | ✅ AUTO | `semesters.orderIndex` | Ex: `1`, `2` |
| `CYCLE` | ✅ AUTO | `studyCycles.name` | Ex: `Licence`, `Master`, `BTS` |
| `FILIERE` | ✅ AUTO | `programs.name` | Tel quel |
| `ANNEE ACADEMIQUE` | ✅ AUTO | `academicYears.name` | Remplacer `/` par `-` → `2024-2025` |
| `SEXE` | ✅ AUTO | `domainUsers.gender` | `male` → `M`, `female` → `F` |
| `EMAIL` | ✅ AUTO | `domainUsers.primaryEmail` | Tel quel |
| `TOTAL CREDIT` | ✅ AUTO | `studentPromotionSummaries.creditsEarned` | Tel quel |
| `GRADE` | 🔶 CALC | Calculé depuis `overallAverage` | Voir table §5.1 |
| `MENTION` | 🔶 CALC | Calculé depuis `overallAverage` | Voir table §5.2 (mentions attestations) |
| `MENTION_EN` | 🔶 CALC | Calculé depuis `overallAverage` | Traduction anglaise automatique |

#### Colonnes laissées VIDES (❌)

| Colonne DIPLOMATION | Statut | Raison | Action requise |
|---------------------|--------|--------|----------------|
| `OPTION` | ❌ VIDE | Sous-niveau de spécialisation absent du schéma. | À remplir si applicable |
| `FINALITE` | ❌ VIDE | Pas de champ "finalité" (professionnelle, recherche, etc.) dans le schéma. | À remplir manuellement. Ex: `Professionnelle` |
| `DOMAINE` | ❌ VIDE | Pas de champ "domaine d'études" (regroupement au-dessus du programme). | À remplir manuellement. Ex: `Sciences et Technologies` |
| `DATE JURY` | ❌ VIDE | Aucun champ de date de jury dans le schéma. | À remplir manuellement. Format `DD/MM/YYYY` |
| `DOMAINE_EN` | ❌ VIDE | Pas de traductions anglaises dans la DB. | À remplir si mode faculty |
| `PARCOURS_EN` | ❌ VIDE | Pas de champ `nameEn` sur la table `programs`. | À remplir si mode faculty |
| `SPECIALITE_EN` | ❌ VIDE | Pas de champ `nameEn` sur la table `programOptions`. | À remplir si mode faculty |
| `FINALITE_EN` | ❌ VIDE | Voir `FINALITE`. | À remplir si mode faculty |
| `OPTION_EN` | ❌ VIDE | Voir `OPTION`. | À remplir si applicable |

---

### 3.3 — Mapping RELEVÉ DE NOTES

#### Colonnes remplies automatiquement (✅ AUTO)

| Colonne DIPLOMATION | Statut | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Majuscules |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | Tel quel |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | Tel quel |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | Tel quel |
| `NIVEAU` | ✅ AUTO | `cycleLevels.code` | Ex: `L1`, `BTS1` |
| `SEMESTRE` | ✅ AUTO | `semesters.orderIndex` | Ex: `1`, `2` |
| `CYCLE` | ✅ AUTO | `studyCycles.name` | Ex: `Licence`, `BTS` |
| `FILIERE` | ✅ AUTO | `programs.name` | Tel quel |
| `ANNEE ACADEMIQUE` | ✅ AUTO | `academicYears.name` | Format `YYYY-YYYY` |
| `SEXE` | ✅ AUTO | `domainUsers.gender` | `male` → `M`, `female` → `F` |
| `EMAIL` | ✅ AUTO | `domainUsers.primaryEmail` | Tel quel |
| `{Nom du cours}` | 🔶 CALC | `grades` + `exams` via `classCourses` | Moyenne pondérée CC+Examen par cours (voir §5.3) |
| `S/{Nom du cours}` | 🔶 CALC | `exams.sessionType` + `academicYears.name` | `normal` → `N/YYYY-YYYY`, `retake` → `R/YYYY-YYYY` |

#### Colonnes laissées VIDES (❌)

**Aucune colonne vide pour le relevé de notes.** Toutes les données nécessaires sont disponibles dans grades-manager-api. Les colonnes dynamiques (notes et sessions) sont générées automatiquement depuis les examens et notes enregistrés.

---

### 3.4 — Mapping ATTESTATION DE CENTRE

#### Colonnes remplies automatiquement (✅ AUTO + 🔶 CALC)

| Colonne DIPLOMATION | Statut | Source | Transformation |
|---------------------|--------|--------|----------------|
| `NOM` | ✅ AUTO | `domainUsers.lastName` | Majuscules |
| `PRENOM` | ✅ AUTO | `domainUsers.firstName` | Tel quel |
| `MATRICULE` | ✅ AUTO | `students.registrationNumber` | Tel quel |
| `DATE DE NAISSANCE` | ✅ AUTO | `domainUsers.dateOfBirth` | `DD/MM/YYYY` |
| `LIEU DE NAISSANCE` | ✅ AUTO | `domainUsers.placeOfBirth` | Tel quel |
| `SPECIALITE` | ✅ AUTO | `programOptions.name` | Tel quel |
| `MOYENNE` | ✅ AUTO | `studentPromotionSummaries.overallAverage` | Arrondi 2 décimales |
| `ANNEE_ACADEMIQUE` | ✅ AUTO | `academicYears.name` | Format `YYYY-YYYY` |
| `GRADE` | 🔶 CALC | Calculé depuis `overallAverage` | Voir table §5.1 |
| `MENTION` | 🔶 CALC | Calculé depuis `overallAverage` | Voir table §5.2 (mentions attestations) |
| `MENTION_EN` | 🔶 CALC | Calculé depuis `overallAverage` | Traduction anglaise automatique |

#### Colonnes laissées VIDES (❌)

| Colonne DIPLOMATION | Statut | Raison | Action requise |
|---------------------|--------|--------|----------------|
| `SESSION_EXAMEN` | ❌ VIDE | Pas de concept de "session d'examen" (juin/septembre) dans le schéma. L'API propose ce champ en paramètre d'input, mais s'il n'est pas fourni, la colonne reste vide. | À remplir manuellement. Ex: `juin 2025` |
| `LIEU_DELIVRANCE` | ❌ VIDE | Pas de champ "lieu de délivrance" dédié. `institutions.addressFr` contient l'adresse complète, pas la ville seule. | À remplir manuellement. Ex: `Douala` |
| `NUMERO_ORDRE` | ❌ VIDE | Pas de numéro d'ordre séquentiel du jury dans le schéma. | À remplir manuellement. Ex: `001` |
| `SPECIALITE_EN` | ❌ VIDE | Pas de champ `nameEn` sur la table `programOptions`. | À remplir si nécessaire |
| `OPTION` | ❌ VIDE | Sous-niveau absent. | À remplir si applicable |
| `OPTION_EN` | ❌ VIDE | Voir `OPTION`. | À remplir si applicable |
| `TITRE_ATTESTATION_FR` | ❌ VIDE | Titre personnalisé de l'attestation, non prévu dans le schéma. | À remplir si nécessaire. Ex: `Attestation de Réussite` |
| `TITRE_ATTESTATION_EN` | ❌ VIDE | Idem, version anglaise. | À remplir si nécessaire. Ex: `Certificate of Success` |
| `SPECIALITE_ABR` | ❌ VIDE | Pas d'abréviation de spécialité dans le schéma. | À remplir si nécessaire. Ex: `SR` |

---

### 3.5 — Résumé : Taux de couverture par type de document

| Type de document | Colonnes totales | ✅ AUTO | 🔶 CALC | ❌ VIDE | Taux de couverture |
|------------------|-----------------|---------|---------|--------|-------------------|
| **Diplôme** | 18 | 9 | 3 | 6 | **67%** (12/18) |
| **Attestation** | 28 | 16 | 3 | 9 | **68%** (19/28) |
| **Relevé de Notes** | 12 + dynamiques | 10 + dynamiques | 2 (par cours) | 0 | **100%** |
| **Attestation Centre** | 20 | 8 | 3 | 9 | **55%** (11/20) |

> **Le relevé de notes est le seul document 100% automatisable.**
> Pour les autres, l'utilisateur devra compléter les colonnes vides dans le fichier Excel avant de l'importer dans DIPLOMATION.

---

## 4. Règles de validation et formats

### 4.1 — Formats de dates

| Règle | Détail |
|-------|--------|
| Séparateurs acceptés par DIPLOMATION | `/`, `-`, `.` |
| Format requis | `DD/MM/YYYY` (jour/mois/année) |
| Jour valide | 1-31 (vérifié selon le mois) |
| Mois valide | 1-12 |
| Année valide | 1900 à année courante |

**Transformation** : `domainUsers.dateOfBirth` (type `date` PostgreSQL) → formater en `DD/MM/YYYY`.

### 4.2 — Formats numériques

| Règle | Détail |
|-------|--------|
| Échelle de notation | 0 à 20 |
| Séparateur décimal accepté | `.` (point) et `,` (virgule) |
| Précision | 2 décimales |
| Seuil de réussite (diplôme) | ≥ 10.00 |

### 4.3 — Formats texte

| Règle | Détail |
|-------|--------|
| Accents | Préservés (É, È, Ê, Ç, À, etc.) |
| Casse des colonnes | Insensible (`NOM`, `nom`, `Nom` acceptés) |
| Espaces | Retirés en début/fin (trim) |
| Valeurs interdites | `""` (vide), `"N/D"` pour les champs obligatoires |

### 4.4 — Noms de colonnes alternatifs acceptés

DIPLOMATION accepte ces noms alternatifs (case-insensitive) :

| Nom principal | Alternatives acceptées |
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

**Recommandation** : Utiliser les noms principaux (colonne de gauche) pour maximiser la compatibilité.

---

## 5. Calculs et formules

### 5.1 — Table de conversion Moyenne → Grade

| Moyenne | Grade |
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

### 5.2 — Table de conversion Moyenne → Mention

#### Mentions pour Diplômes

| Moyenne | Mention FR | Mention EN |
|---------|-----------|-----------|
| ≥ 18.00 | `TRES HONORABLE AVEC FELICITATIONS DU JURY` | `HIGHEST HONORS WITH JURY COMMENDATION` |
| ≥ 16.00 | `TRES HONORABLE` | `HIGHEST HONORS` |
| ≥ 14.00 | `HONORABLE` | `HIGH HONORS` |
| ≥ 12.00 | `ASSEZ BIEN` | `GOOD` |
| ≥ 10.00 | `PASSABLE` | `SATISFACTORY` |

#### Mentions pour Attestations

| Moyenne | Mention FR | Mention EN |
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

### 5.3 — Formules de calcul des notes

#### Moyenne par cours (EC)

```
moyenne_cours = Σ(note_examen × pourcentage_examen) / 100
```

Exemple : CC=12 (40%) + Examen=15 (60%) → `(12×40 + 15×60) / 100 = 13.8`

#### Résolution des rattrapages

- **Politique `replace`** : la note de rattrapage remplace la note normale
- **Politique `best_of`** : on garde `max(note_normale, note_rattrapage)`

#### Moyenne par UE (Unité d'Enseignement)

```
moyenne_UE = Σ(moyenne_cours × coefficient_cours) / Σ(coefficient_cours)
```

#### Moyenne générale (pondérée par crédits)

```
moyenne_generale = Σ(moyenne_UE × credits_UE) / Σ(credits_UE)
```

### 5.4 — Décisions académiques

| Condition | Décision |
|-----------|----------|
| moyenne_UE ≥ note_passage (10) ET toutes les notes présentes | `Ac` (Acquis) |
| Au moins une note manquante dans l'UE | `Inc` (Incomplet) |
| moyenne_UE < note_passage | `Nac` (Non Acquis) |

### 5.5 — Crédits

| Condition | Crédits attribués |
|-----------|-------------------|
| UE validée (`Ac`) | Totalité des crédits de l'UE |
| UE non validée (`Nac` ou `Inc`) | 0 crédit |

---

## 6. Plan d'implémentation

### Phase 1 : Module d'export DIPLOMATION (Backend)

**Nouveau module** : `apps/server/src/modules/diplomation-export/`

```
apps/server/src/modules/diplomation-export/
├── index.ts                          # Export du router
├── diplomation-export.router.ts      # Endpoints tRPC
├── diplomation-export.service.ts     # Logique métier
├── diplomation-export.repo.ts        # Requêtes base de données
├── diplomation-export.zod.ts         # Schémas de validation (input)
├── diplomation-export.helpers.ts     # Fonctions de calcul (grade, mention)
├── diplomation-export.types.ts       # Types TypeScript
└── __tests__/
    └── diplomation-export.caller.test.ts  # Tests
```

### Phase 2 : Intégration du router

Ajouter le module dans `apps/server/src/routers/index.ts` :

```typescript
diplomationExport: diplomationExportRouter,
```

### Phase 3 : Frontend (boutons d'export)

Ajouter des boutons dans l'interface web pour déclencher le téléchargement des fichiers Excel :

- Page de classe → "Exporter pour DIPLOMATION" → choix du type (Diplôme, Attestation, Relevé, Attestation Centre)
- Génération côté backend → téléchargement du .xlsx

### Phase 4 : Dépendance

Ajouter la librairie Excel au backend :

```bash
bun add exceljs --filter server
```

---

## 7. Endpoints API à créer

### 7.1 — Export Diplômes

```
POST /trpc/diplomationExport.generateDiplomas
```

**Input :**
```typescript
{
  classId: string;              // ID de la classe (obligatoire)
  academicYearId: string;       // ID de l'année académique (obligatoire)
}
```

**Colonnes remplies :** NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, PARCOURS, SPECIALITE, MOYENNE, GRADE, MENTION, MENTION_EN, ANNEE OBTENTION
**Colonnes VIDES à compléter :** TITRE DIPLOME FR, TITRE DIPLOME EN, DATE JURY ADMISSION, DATE JURY DELIBERATION, OPTION, OPTION_EN

**Output :** Fichier `.xlsx` en base64 ou téléchargement direct

### 7.2 — Export Attestations

```
POST /trpc/diplomationExport.generateAttestations
```

**Input :**
```typescript
{
  classId: string;              // ID de la classe (obligatoire)
  academicYearId: string;       // ID de l'année académique (obligatoire)
  semesterId?: string;          // Optionnel, pour un semestre spécifique
}
```

**Colonnes remplies :** NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, MOYENNE, PARCOURS, SPECIALITE, NIVEAU, SEMESTRE, CYCLE, FILIERE, ANNEE ACADEMIQUE, SEXE, EMAIL, TOTAL CREDIT, GRADE, MENTION, MENTION_EN
**Colonnes VIDES à compléter :** OPTION, FINALITE, DOMAINE, DATE JURY, DOMAINE_EN, PARCOURS_EN, SPECIALITE_EN, FINALITE_EN, OPTION_EN

### 7.3 — Export Relevés de Notes

```
POST /trpc/diplomationExport.generateTranscripts
```

**Input :**
```typescript
{
  classId: string;              // ID de la classe (obligatoire)
  semesterId: string;           // ID du semestre (obligatoire)
  academicYearId: string;       // ID de l'année académique (obligatoire)
}
```

**Colonnes remplies :** TOUTES (100% automatique)
**Colonnes VIDES :** Aucune

### 7.4 — Export Attestations de Centre

```
POST /trpc/diplomationExport.generateCentreAttestations
```

**Input :**
```typescript
{
  classId: string;              // ID de la classe (obligatoire)
  academicYearId: string;       // ID de l'année académique (obligatoire)
}
```

**Colonnes remplies :** NOM, PRENOM, MATRICULE, DATE DE NAISSANCE, LIEU DE NAISSANCE, SPECIALITE, MOYENNE, ANNEE_ACADEMIQUE, GRADE, MENTION, MENTION_EN
**Colonnes VIDES à compléter :** SESSION_EXAMEN, LIEU_DELIVRANCE, NUMERO_ORDRE, SPECIALITE_EN, OPTION, OPTION_EN, TITRE_ATTESTATION_FR, TITRE_ATTESTATION_EN, SPECIALITE_ABR

---

## 8. Exemples de données

### 8.1 — Exemple Excel Diplôme

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | PARCOURS | SPECIALITE | MOYENNE | GRADE | MENTION | TITRE DIPLOME FR | TITRE DIPLOME EN | ANNEE OBTENTION | DATE JURY ADMISSION | DATE JURY DELIBERATION |
|-----|--------|-----------|-------------------|-------------------|----------|------------|---------|-------|---------|------------------|------------------|-----------------|---------------------|------------------------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | BTS Sciences Infirmières | Soins Infirmiers | 14.50 | B+ | HONORABLE | BREVET DE TECHNICIEN SUPÉRIEUR EN SCIENCES INFIRMIÈRES | HIGHER TECHNICIAN CERTIFICATE IN NURSING SCIENCES | 2025 | 01/09/2024 | 15/07/2025 |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | BTS Sciences Infirmières | Soins Infirmiers | 16.20 | A | TRES HONORABLE | BREVET DE TECHNICIEN SUPÉRIEUR EN SCIENCES INFIRMIÈRES | HIGHER TECHNICIAN CERTIFICATE IN NURSING SCIENCES | 2025 | 01/09/2024 | 15/07/2025 |

### 8.2 — Exemple Excel Attestation

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | MOYENNE | PARCOURS | SPECIALITE | NIVEAU | CYCLE | ANNEE ACADEMIQUE | GRADE | MENTION | TOTAL CREDIT | SEXE |
|-----|--------|-----------|-------------------|-------------------|---------|----------|------------|--------|-------|------------------|-------|---------|--------------|------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | 14.50 | BTS Sciences Infirmières | Soins Infirmiers | BTS2 | BTS | 2024-2025 | B+ | Bien | 120 | M |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | 16.20 | BTS Sciences Infirmières | Soins Infirmiers | BTS2 | BTS | 2024-2025 | A | Très Bien | 120 | F |

### 8.3 — Exemple Excel Relevé de Notes

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | NIVEAU | SEMESTRE | CYCLE | FILIERE | ANNEE ACADEMIQUE | Anatomie Humaine | Physiologie | Soins Infirmiers de Base | S/Anatomie Humaine | S/Physiologie | S/Soins Infirmiers de Base |
|-----|--------|-----------|-------------------|-------------------|--------|----------|-------|---------|------------------|------------------|-------------|--------------------------|---------------------|---------------|----------------------------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | BTS1 | 1 | BTS | Sciences Infirmières | 2024-2025 | 14.00 | 12.50 | 16.00 | N/2024-2025 | N/2024-2025 | N/2024-2025 |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | BTS1 | 1 | BTS | Sciences Infirmières | 2024-2025 | 17.00 | 15.00 | 16.50 | N/2024-2025 | R/2024-2025 | N/2024-2025 |

### 8.4 — Exemple Excel Attestation de Centre

| NOM | PRENOM | MATRICULE | DATE DE NAISSANCE | LIEU DE NAISSANCE | SPECIALITE | SESSION_EXAMEN | LIEU_DELIVRANCE | MENTION | GRADE | MOYENNE | ANNEE_ACADEMIQUE |
|-----|--------|-----------|-------------------|-------------------|------------|----------------|-----------------|---------|-------|---------|------------------|
| NDONG | Alain | INSES-2024-0001 | 15/06/1998 | Douala | Soins Infirmiers | juin 2025 | Douala | Bien | B+ | 14.50 | 2024-2025 |
| EYEBE | Rachel | INSES-2024-0002 | 22/03/2000 | Yaoundé | Soins Infirmiers | juin 2025 | Yaoundé | Très Bien | A | 16.20 | 2024-2025 |

---

## Annexe A — Tables de la base de données utilisées

### Chemin des requêtes pour chaque export

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIPLÔME / ATTESTATION                        │
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
│                    RELEVÉ DE NOTES                              │
│                                                                 │
│  classes ──→ classCourses ──→ courses ──→ teachingUnits         │
│    │              │                                             │
│    │              └── exams ──→ grades (par étudiant)            │
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

### Fichiers source clés (grades-manager-api)

| Fichier | Contenu |
|---------|---------|
| `apps/server/src/db/schema/app-schema.ts` | Schéma complet de la base (1984 lignes) |
| `apps/server/src/modules/exports/exports.service.ts` | Service d'export existant (PV, Eval, UE) |
| `apps/server/src/modules/exports/exports.repo.ts` | Requêtes DB pour les exports |
| `apps/server/src/modules/exports/template-helper.ts` | Helpers de template (appréciations, formatage) |
| `apps/server/src/modules/student-promotion-summaries/` | Calcul des résumés de promotion |

### Fichiers source clés (DIPLOMATION)

| Fichier | Contenu |
|---------|---------|
| `src/lib/diploma-generator/types.ts` | Types DiplomaStudentRecord |
| `src/types/student.ts` | Types StudentRecord, CourseRecord |
| `src/lib/validators/excel-columns.ts` | Validation des colonnes Excel |
| `src/lib/helpers/grades.ts` | Calculs de grades et mentions |
| `src/lib/helpers/excel-template-generator.ts` | Génération de templates Excel |
| `src/lib/form-schemas/diploma-theme-settings.ts` | Paramètres de thème (40+) |

---

## Annexe B — Inventaire complet des colonnes VIDES (non fournies)

Ces colonnes seront **présentes dans le fichier Excel mais avec des cellules vides**. L'utilisateur doit les remplir manuellement dans le fichier Excel avant de l'importer dans DIPLOMATION.

### Diplôme (6 colonnes vides sur 18)

| Colonne vide | Obligatoire dans DIPLOMATION ? | Pourquoi absente | Exemple à remplir |
|--------------|-------------------------------|------------------|-------------------|
| `TITRE DIPLOME FR` | **OUI** | Titre officiel du diplôme, non modélisé. Varie selon le contexte institutionnel. | `BREVET DE TECHNICIEN SUPÉRIEUR EN SCIENCES INFIRMIÈRES` |
| `TITRE DIPLOME EN` | **OUI** | Idem, version anglaise. | `HIGHER TECHNICIAN CERTIFICATE IN NURSING SCIENCES` |
| `DATE JURY ADMISSION` | **OUI** | Date du jury initial d'admission, différente de la date d'inscription. | `01/09/2024` |
| `DATE JURY DELIBERATION` | **OUI** | Date du jury final de délibération. Aucun champ dans le schéma. | `15/07/2025` |
| `OPTION` | Non (optionnel) | Sous-niveau de spécialisation, absent du schéma. | `Chirurgie` ou laisser vide |
| `OPTION_EN` | Non (optionnel) | Pas de traduction anglaise des programmes dans la DB. | `Surgery` ou laisser vide |

### Attestation (9 colonnes vides sur 28)

| Colonne vide | Obligatoire dans DIPLOMATION ? | Pourquoi absente | Exemple à remplir |
|--------------|-------------------------------|------------------|-------------------|
| `OPTION` | Non | Sous-niveau absent du schéma. | `Réseaux` |
| `FINALITE` | Non | Pas de concept "finalité" (professionnelle/recherche) dans le schéma. | `Professionnelle` |
| `DOMAINE` | Non | Pas de regroupement "domaine" au-dessus du programme. | `Sciences et Technologies` |
| `DATE JURY` | Non | Aucune date de jury. | `15/06/2025` |
| `DOMAINE_EN` | **OUI si mode faculty** | Pas de traductions anglaises dans la DB. | `Science and Technology` |
| `PARCOURS_EN` | **OUI si mode faculty** | Pas de champ `nameEn` sur `programs`. | `Nursing Sciences` |
| `SPECIALITE_EN` | **OUI si mode faculty** | Pas de champ `nameEn` sur `programOptions`. | `Nursing Care` |
| `FINALITE_EN` | **OUI si mode faculty** | Voir `FINALITE`. | `Professional` |
| `OPTION_EN` | Non | Voir `OPTION`. | `Networks` |

### Relevé de Notes (0 colonnes vides)

**Aucune colonne vide.** Toutes les données sont disponibles dans grades-manager-api.

### Attestation de Centre (9 colonnes vides sur 20)

| Colonne vide | Obligatoire dans DIPLOMATION ? | Pourquoi absente | Exemple à remplir |
|--------------|-------------------------------|------------------|-------------------|
| `SESSION_EXAMEN` | **OUI** | Pas de concept "session d'examen" (juin/septembre) dans le schéma. | `juin 2025` |
| `LIEU_DELIVRANCE` | **OUI** | Pas de champ dédié "ville de délivrance". | `Douala` |
| `NUMERO_ORDRE` | Non (warning si absent) | Pas de numéro d'ordre séquentiel du jury. | `001` |
| `SPECIALITE_EN` | Non | Pas de traduction anglaise de la spécialité. | `Nursing Care` |
| `OPTION` | Non | Sous-niveau absent. | `Sécurité Informatique` |
| `OPTION_EN` | Non | Voir `OPTION`. | `Cybersecurity` |
| `TITRE_ATTESTATION_FR` | Non | Titre personnalisé non prévu dans le schéma. | `Attestation de Réussite` |
| `TITRE_ATTESTATION_EN` | Non | Idem, version anglaise. | `Certificate of Success` |
| `SPECIALITE_ABR` | Non | Pas d'abréviation stockée. | `SR` |

---

## Annexe C — Configuration institution existante

La table `institutions` contient un champ `metadata` (JSONB) avec la structure `export_config` :

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

Cette configuration est **réutilisable** pour les exports DIPLOMATION (appréciations, note de passage, échelle).
