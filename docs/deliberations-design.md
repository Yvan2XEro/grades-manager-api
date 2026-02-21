# Conception du module Délibérations

## Vue d'ensemble

Le module **Délibérations** gère le processus officiel par lequel un jury académique examine les résultats d'une classe pour un semestre ou une année académique, prend des décisions individuelles par étudiant, et produit un procès-verbal officiel.

Ce module s'inspire directement du module **Promotion Rules** existant (même architecture en 3 couches, même pattern evaluate → execute, même audit trail), mais couvre un périmètre plus large :

```
Promotions : Évalue des règles → déplace des étudiants entre classes
Délibérations : Examine les résultats → prend des décisions officielles → génère des PV → alimente DIPLOMATION
```

### Positionnement dans le workflow global

```
Notes saisies → Examens validés/verrouillés
                        ↓
              Délibération ouverte (jury constitué)
                        ↓
              Calcul automatique des résultats (facts)
                        ↓
              Jury examine, ajuste les décisions
                        ↓
              Délibération clôturée (PV signé)
                        ↓
              Export vers DIPLOMATION (Excel)
                        ↓
              Promotion/passage (module existant)
```

---

## Table des matières

1. [Concepts métier](#1-concepts-métier)
2. [Schéma de base de données](#2-schéma-de-base-de-données)
3. [Types et interfaces](#3-types-et-interfaces)
4. [Endpoints API (Router)](#4-endpoints-api-router)
5. [Logique métier (Service)](#5-logique-métier-service)
6. [Requêtes base de données (Repo)](#6-requêtes-base-de-données-repo)
7. [Schémas de validation (Zod)](#7-schémas-de-validation-zod)
8. [Workflow complet](#8-workflow-complet)
9. [Règles de délibération (json-rules-engine)](#9-règles-de-délibération)
10. [Intégration avec les modules existants](#10-intégration-avec-les-modules-existants)
11. [Lien avec DIPLOMATION](#11-lien-avec-diplomation)
12. [Structure des fichiers](#12-structure-des-fichiers)
13. [Tests](#13-tests)

---

## 1. Concepts métier

### Qu'est-ce qu'une délibération ?

Une **délibération** est l'acte officiel par lequel un **jury** composé d'enseignants et d'administrateurs :

1. **Examine** les résultats académiques d'une classe pour un semestre ou une année
2. **Valide ou invalide** les UE (Unités d'Enseignement) de chaque étudiant
3. **Attribue** les crédits correspondants
4. **Décide** du sort de chaque étudiant (admis, ajourné, redoublant, exclu, etc.)
5. **Attribue** les mentions (Très Bien, Bien, Assez Bien, Passable)
6. **Signe** le procès-verbal officiel

### Différence avec le module Promotions

| Aspect | Promotions | Délibérations |
|--------|-----------|---------------|
| **Quand** | Après la délibération | Avant la promotion |
| **Qui décide** | Règles automatiques (json-rules-engine) | Jury humain (avec suggestions automatiques) |
| **Granularité** | Par étudiant (promu oui/non) | Par UE + par étudiant + mentions |
| **Output** | Déplacement d'inscriptions entre classes | PV officiel + décisions + données pour DIPLOMATION |
| **Modifications** | Pas de modification manuelle | Le jury peut **surcharger** les décisions calculées |
| **Statut** | Exécution unique | Cycle de vie (draft → open → closed → signed) |

### Types de délibérations

| Type | Portée | Quand |
|------|--------|-------|
| **Semestrielle** | Un semestre d'une classe | Fin de chaque semestre |
| **Annuelle** | Année complète d'une classe | Fin d'année (combine les 2 semestres) |
| **Rattrapage** | Après session de rattrapage | Après les examens de rattrapage |

### Décisions possibles par étudiant

| Décision | Code | Description | Condition typique |
|----------|------|-------------|-------------------|
| **Admis** | `ADMITTED` | Étudiant valide l'année/semestre | Moyenne ≥ 10, crédits suffisants |
| **Admis par compensation** | `ADMITTED_COMPENSATED` | Certaines UE < 10 mais moyenne générale ≥ 10 | Moyenne ≥ 10, pas d'échec éliminatoire |
| **Ajourné** | `DEFERRED` | Doit repasser certains examens (rattrapage) | Moyenne < 10 mais récupérable |
| **Redoublant** | `REPEAT` | Doit refaire l'année | Moyenne très basse ou trop d'échecs |
| **Exclu** | `EXCLUDED` | Exclusion du programme | Redoublement consécutif, fraude, etc. |
| **En attente** | `PENDING` | Notes incomplètes, pas de décision | UE incomplètes |

### Décisions possibles par UE

| Décision | Code | Description |
|----------|------|-------------|
| **Acquis** | `ACQUIRED` | Moyenne UE ≥ note de passage, toutes notes présentes |
| **Non Acquis** | `NOT_ACQUIRED` | Moyenne UE < note de passage |
| **Incomplet** | `INCOMPLETE` | Notes manquantes |
| **Acquis par compensation** | `COMPENSATED` | UE < 10 mais compensée par la moyenne générale |

---

## 2. Schéma de base de données

### Table `deliberations`

Représente une session de délibération pour une classe donnée.

```typescript
export const deliberations = pgTable("deliberations", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  institutionId:    text("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),

  // Contexte académique
  classId:          text("class_id").notNull().references(() => classes.id, { onDelete: "restrict" }),
  semesterId:       text("semester_id").references(() => semesters.id, { onDelete: "set null" }),  // null = année complète
  academicYearId:   text("academic_year_id").notNull().references(() => academicYears.id, { onDelete: "restrict" }),

  // Type et statut
  type:             text("type").notNull(),        // "semester" | "annual" | "retake"
  status:           text("status").notNull().default("draft"),  // "draft" | "open" | "closed" | "signed"

  // Jury
  juryMembers:      jsonb("jury_members").notNull().default([]),  // JuryMember[]
  presidentId:      text("president_id").references(() => domainUsers.id, { onDelete: "set null" }),

  // Métadonnées
  label:            text("label"),                  // Libellé libre : "Délibération S1 2024-2025 L1 Info"
  notes:            text("notes"),                  // Observations générales du jury
  sessionDate:      timestamp("session_date", { withTimezone: true }),  // Date de la session du jury

  // Statistiques (calculées à la clôture)
  studentsCount:    integer("students_count").default(0),
  admittedCount:    integer("admitted_count").default(0),
  deferredCount:    integer("deferred_count").default(0),
  repeatCount:      integer("repeat_count").default(0),
  excludedCount:    integer("excluded_count").default(0),
  globalSuccessRate: doublePrecision("global_success_rate").default(0),
  globalAverage:    doublePrecision("global_average").default(0),

  // Lien avec une règle de délibération (optionnel)
  ruleId:           text("rule_id").references(() => deliberationRules.id, { onDelete: "set null" }),

  // Timestamps
  openedAt:         timestamp("opened_at", { withTimezone: true }),
  closedAt:         timestamp("closed_at", { withTimezone: true }),
  signedAt:         timestamp("signed_at", { withTimezone: true }),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_deliberations_institution").on(t.institutionId),
  index("idx_deliberations_class").on(t.classId),
  index("idx_deliberations_year").on(t.academicYearId),
  index("idx_deliberations_status").on(t.status),
  unique("uq_deliberation_class_semester_year").on(t.classId, t.semesterId, t.academicYearId, t.type),
]);
```

**Cycle de vie des statuts :**

```
draft → open → closed → signed
         ↑        ↓
         └── reopen (retour à open si besoin de correction)
```

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| `draft` | Créée, jury pas encore constitué | Modifier jury, ouvrir |
| `open` | Jury en session, décisions en cours | Calculer, ajuster décisions, clôturer |
| `closed` | Décisions finalisées, PV généré | Signer, réouvrir si erreur |
| `signed` | PV signé, délibération terminée | Lecture seule, export DIPLOMATION |

---

### Table `deliberation_student_results`

Résultat individuel de chaque étudiant dans une délibération.

```typescript
export const deliberationStudentResults = pgTable("deliberation_student_results", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  deliberationId:   text("deliberation_id").notNull().references(() => deliberations.id, { onDelete: "cascade" }),
  studentId:        text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),

  // Décision
  decision:         text("decision").notNull().default("PENDING"),
    // "ADMITTED" | "ADMITTED_COMPENSATED" | "DEFERRED" | "REPEAT" | "EXCLUDED" | "PENDING"
  decisionSource:   text("decision_source").notNull().default("auto"),
    // "auto" (calculé par les règles) | "manual" (surchargé par le jury)

  // Mention
  mention:          text("mention"),          // "TRES BIEN" | "BIEN" | "ASSEZ BIEN" | "PASSABLE" | null
  mentionEn:        text("mention_en"),       // English translation

  // Résultats calculés (snapshot au moment de la délibération)
  overallAverage:        doublePrecision("overall_average"),
  overallAverageUnweighted: doublePrecision("overall_average_unweighted"),
  totalCreditsEarned:    integer("total_credits_earned").default(0),
  totalCreditsAttempted: integer("total_credits_attempted").default(0),
  requiredCredits:       integer("required_credits").default(0),

  // Grade lettre
  grade:            text("grade"),            // "A+", "A", "B+", etc.

  // Rang dans la classe
  rank:             integer("rank"),
  rankOutOf:        integer("rank_out_of"),

  // Détails par UE (snapshot)
  ueResults:        jsonb("ue_results").notNull().default([]),
    // DeliberationUEResult[]

  // Observations du jury pour cet étudiant
  juryObservation:  text("jury_observation"),

  // Snapshot complet des facts au moment de la délibération (audit)
  evaluationData:   jsonb("evaluation_data").notNull().default({}),

  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_delib_results_deliberation").on(t.deliberationId),
  index("idx_delib_results_student").on(t.studentId),
  index("idx_delib_results_decision").on(t.decision),
  unique("uq_delib_results_deliberation_student").on(t.deliberationId, t.studentId),
]);
```

---

### Table `deliberation_rules`

Règles de délibération configurables (comme `promotionRules` mais pour les décisions de délibération).

```typescript
export const deliberationRules = pgTable("deliberation_rules", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  institutionId:    text("institution_id").notNull().references(() => institutions.id, { onDelete: "cascade" }),

  name:             text("name").notNull(),         // "Règles de délibération L1 INSES"
  description:      text("description"),

  // Scope (optionnel, pour cibler la règle)
  programId:        text("program_id").references(() => programs.id, { onDelete: "set null" }),
  cycleLevelId:     text("cycle_level_id").references(() => cycleLevels.id, { onDelete: "set null" }),

  // Règles json-rules-engine pour chaque type de décision
  admissionRuleset:      jsonb("admission_ruleset").notNull(),     // Conditions pour ADMITTED
  compensationRuleset:   jsonb("compensation_ruleset"),            // Conditions pour ADMITTED_COMPENSATED
  deferralRuleset:       jsonb("deferral_ruleset"),                // Conditions pour DEFERRED
  repeatRuleset:         jsonb("repeat_ruleset"),                  // Conditions pour REPEAT
  exclusionRuleset:      jsonb("exclusion_ruleset"),               // Conditions pour EXCLUDED

  // Configuration
  passingGrade:     doublePrecision("passing_grade").notNull().default(10),
  allowCompensation: boolean("allow_compensation").notNull().default(true),
  maxCompensableUEs: integer("max_compensable_ues").default(2),
  minCompensableScore: doublePrecision("min_compensable_score").default(8),

  isActive:         boolean("is_active").notNull().default(true),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_delib_rules_institution").on(t.institutionId),
  index("idx_delib_rules_program").on(t.programId),
  index("idx_delib_rules_active").on(t.isActive),
]);
```

---

### Table `deliberation_logs`

Journal d'audit de toutes les actions sur une délibération.

```typescript
export const deliberationLogs = pgTable("deliberation_logs", {
  id:               text("id").primaryKey().$defaultFn(() => sql`gen_random_uuid()`),
  deliberationId:   text("deliberation_id").notNull().references(() => deliberations.id, { onDelete: "cascade" }),
  actorId:          text("actor_id").notNull().references(() => domainUsers.id, { onDelete: "restrict" }),

  action:           text("action").notNull(),
    // "created" | "opened" | "computed" | "decision_overridden" | "closed" | "reopened" | "signed"

  // Détails de l'action
  targetStudentId:  text("target_student_id").references(() => students.id, { onDelete: "set null" }),
  previousValue:    jsonb("previous_value"),   // Ancien état (ex: décision avant override)
  newValue:         jsonb("new_value"),         // Nouveau état
  reason:           text("reason"),             // Justification (obligatoire pour les overrides)

  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_delib_logs_deliberation").on(t.deliberationId),
  index("idx_delib_logs_actor").on(t.actorId),
  index("idx_delib_logs_action").on(t.action),
]);
```

---

### Résumé des relations

```
deliberationRules (1:N deliberations)
  └── Règles réutilisables par programme/niveau

deliberations (1:N deliberationStudentResults)
  ├── class, semester, academicYear (contexte)
  ├── juryMembers (JSONB)
  ├── presidentId → domainUsers
  ├── ruleId → deliberationRules
  └── deliberationStudentResults (1 par étudiant)
       ├── decision, mention, grade, rank
       ├── ueResults (JSONB: décision par UE)
       └── evaluationData (JSONB: snapshot des facts)

deliberationLogs (audit trail)
  └── Toutes les actions avec acteur, raison, avant/après
```

---

## 3. Types et interfaces

### JuryMember

```typescript
interface JuryMember {
  profileId: string;        // Référence domainUsers.id
  name: string;             // Nom affiché (snapshot)
  role: string;             // "president" | "rapporteur" | "member" | "secretary"
  title: string;            // Titre : "Pr.", "Dr.", "M.", "Mme"
  department?: string;      // Département
  signature?: string;       // URL de signature (optionnel)
}
```

### DeliberationUEResult

```typescript
interface DeliberationUEResult {
  teachingUnitId: string;
  teachingUnitCode: string;
  teachingUnitName: string;
  credits: number;              // Crédits de l'UE

  average: number | null;       // Moyenne UE calculée
  decision: string;             // "ACQUIRED" | "NOT_ACQUIRED" | "INCOMPLETE" | "COMPENSATED"
  decisionSource: string;       // "auto" | "manual"
  creditsEarned: number;        // Crédits obtenus (= credits si acquis, 0 sinon)

  courses: DeliberationCourseResult[];
}

interface DeliberationCourseResult {
  courseId: string;
  courseCode: string;
  courseName: string;
  coefficient: number;

  ccScore: number | null;       // Note CC
  examScore: number | null;     // Note Examen
  average: number | null;       // Moyenne pondérée du cours
  isRetake: boolean;            // Vient d'un rattrapage
  sessionType: string;          // "normal" | "retake"
}
```

### DeliberationFacts (étend StudentPromotionFacts)

```typescript
interface DeliberationFacts extends StudentPromotionFacts {
  // Champs additionnels pour la délibération
  ueDecisions: Record<string, {
    average: number | null;
    decision: "ACQUIRED" | "NOT_ACQUIRED" | "INCOMPLETE";
    credits: number;
    creditsEarned: number;
  }>;

  compensableUEs: number;        // Nombre d'UE entre minCompensable et passingGrade
  nonCompensableUEs: number;     // Nombre d'UE sous minCompensable
  allUEsComplete: boolean;       // Toutes les UE ont toutes les notes

  // Historique (pour les règles de redoublement/exclusion)
  previousDeliberationDecision?: string;  // Décision de l'année précédente
  consecutiveRepeats: number;             // Nombre de redoublements consécutifs
  totalRepeats: number;                   // Nombre total de redoublements
}
```

### ClassDeliberationPreview

```typescript
interface ClassDeliberationPreview {
  deliberationId: string;
  classId: string;
  className: string;
  semesterId: string | null;
  academicYearId: string;
  status: string;

  // Stats
  totalStudents: number;
  globalAverage: number;
  globalSuccessRate: number;

  // Résultats par étudiant
  students: StudentDeliberationPreview[];
}

interface StudentDeliberationPreview {
  studentId: string;
  registrationNumber: string;
  lastName: string;
  firstName: string;

  overallAverage: number | null;
  totalCreditsEarned: number;
  totalCreditsAttempted: number;
  grade: string | null;
  mention: string | null;
  rank: number;

  suggestedDecision: string;     // Décision calculée par les règles
  currentDecision: string;       // Décision actuelle (auto ou surchargée)
  decisionSource: string;        // "auto" | "manual"

  ueResults: DeliberationUEResult[];

  // Flags
  hasIncompleteUEs: boolean;
  hasEliminatoryFailures: boolean;
  isCompensated: boolean;
}
```

---

## 4. Endpoints API (Router)

### Gestion des délibérations

| Endpoint | Procédure | Input | Description |
|----------|-----------|-------|-------------|
| `create` | `adminProcedure` | `CreateDeliberationInput` | Créer une nouvelle délibération (status=draft) |
| `update` | `adminProcedure` | `UpdateDeliberationInput` | Modifier jury, notes, label (status=draft/open) |
| `getById` | `protectedProcedure` | `{ id: string }` | Récupérer une délibération avec ses résultats |
| `list` | `protectedProcedure` | `ListDeliberationsInput` | Lister les délibérations avec filtres |
| `delete` | `adminProcedure` | `{ id: string }` | Supprimer (uniquement si status=draft) |

### Cycle de vie

| Endpoint | Procédure | Input | Description |
|----------|-----------|-------|-------------|
| `open` | `adminProcedure` | `{ id: string }` | Passer draft → open (vérifie jury constitué) |
| `compute` | `adminProcedure` | `{ id: string, ruleId?: string }` | Calculer/recalculer les résultats de tous les étudiants |
| `close` | `adminProcedure` | `{ id: string }` | Passer open → closed (fige les résultats) |
| `reopen` | `adminProcedure` | `{ id: string, reason: string }` | Passer closed → open (avec justification obligatoire) |
| `sign` | `adminProcedure` | `{ id: string }` | Passer closed → signed (définitif) |

### Décisions

| Endpoint | Procédure | Input | Description |
|----------|-----------|-------|-------------|
| `overrideStudentDecision` | `adminProcedure` | `OverrideDecisionInput` | Surcharger la décision d'un étudiant |
| `overrideUEDecision` | `adminProcedure` | `OverrideUEDecisionInput` | Surcharger la décision d'une UE |
| `bulkOverrideDecisions` | `adminProcedure` | `BulkOverrideInput` | Surcharger plusieurs décisions à la fois |
| `resetStudentDecision` | `adminProcedure` | `{ deliberationId, studentId }` | Remettre la décision automatique |

### Consultation

| Endpoint | Procédure | Input | Description |
|----------|-----------|-------|-------------|
| `preview` | `protectedProcedure` | `{ id: string }` | Aperçu complet avec stats |
| `getStudentResult` | `protectedProcedure` | `{ deliberationId, studentId }` | Résultat détaillé d'un étudiant |
| `getStatistics` | `protectedProcedure` | `{ id: string }` | Statistiques agrégées |
| `getLogs` | `protectedProcedure` | `{ deliberationId, cursor?, limit? }` | Journal d'audit |

### Exports

| Endpoint | Procédure | Input | Description |
|----------|-----------|-------|-------------|
| `generatePV` | `adminProcedure` | `{ id: string, format: "pdf" \| "html" }` | Générer le PV de délibération |
| `exportForDiplomation` | `adminProcedure` | `ExportDiplomationInput` | Générer le fichier Excel pour DIPLOMATION |

### Règles de délibération

| Endpoint | Procédure | Input | Description |
|----------|-----------|-------|-------------|
| `rules.create` | `adminProcedure` | `CreateDelibRuleInput` | Créer une règle de délibération |
| `rules.update` | `adminProcedure` | `UpdateDelibRuleInput` | Modifier une règle |
| `rules.delete` | `adminProcedure` | `{ id: string }` | Supprimer (si pas utilisée) |
| `rules.list` | `protectedProcedure` | `ListDelibRulesInput` | Lister les règles |
| `rules.getById` | `protectedProcedure` | `{ id: string }` | Détail d'une règle |

---

## 5. Logique métier (Service)

### `deliberations.service.ts`

#### `create(input, institutionId)`

```
1. Vérifier que la classe existe et appartient à l'institution
2. Vérifier qu'il n'existe pas déjà une délibération pour (class, semester, year, type)
3. Créer la délibération avec status="draft"
4. Logger "created"
5. Retourner la délibération
```

#### `open(id, actorId, institutionId)`

```
1. Vérifier status = "draft"
2. Vérifier que juryMembers est non vide (au moins 1 membre)
3. Vérifier que presidentId est défini
4. Mettre à jour status = "open", openedAt = now()
5. Logger "opened"
```

#### `compute(id, ruleId, actorId, institutionId)`

```
1. Vérifier status = "open"
2. Charger la règle de délibération (ruleId ou deliberation.ruleId)
3. Récupérer tous les étudiants inscrits dans la classe pour l'année
4. Pour chaque étudiant :
   a. Calculer les DeliberationFacts (réutilise buildStudentFacts + extensions)
   b. Calculer les résultats par UE :
      - Récupérer notes CC + Examen (avec résolution rattrapages)
      - Calculer moyenne par cours
      - Calculer moyenne par UE
      - Déterminer décision UE (ACQUIRED / NOT_ACQUIRED / INCOMPLETE)
      - Appliquer compensation si autorisée :
        * UE avec note entre minCompensable et passingGrade
        * ET moyenne générale ≥ passingGrade
        → décision = "COMPENSATED"
   c. Calculer la moyenne générale (pondérée par crédits)
   d. Calculer le grade lettre et la mention
   e. Évaluer la décision via json-rules-engine :
      - Tester admissionRuleset → ADMITTED
      - Tester compensationRuleset → ADMITTED_COMPENSATED
      - Tester deferralRuleset → DEFERRED
      - Tester repeatRuleset → REPEAT
      - Tester exclusionRuleset → EXCLUDED
      - Si aucun match → PENDING
   f. Calculer le rang (classement par moyenne décroissante)
5. Upsert les deliberationStudentResults
6. Mettre à jour les statistiques de la délibération
7. Logger "computed"
8. Retourner le preview complet
```

#### `overrideStudentDecision(input, actorId, institutionId)`

```
1. Vérifier status = "open"
2. Vérifier que le résultat existe
3. Sauvegarder l'ancienne décision
4. Mettre à jour :
   - decision = input.newDecision
   - decisionSource = "manual"
   - juryObservation = input.reason (obligatoire)
5. Logger "decision_overridden" avec previousValue et newValue
6. Recalculer les statistiques de la délibération
```

#### `overrideUEDecision(input, actorId, institutionId)`

```
1. Vérifier status = "open"
2. Récupérer le résultat de l'étudiant
3. Modifier l'UE concernée dans ueResults :
   - decision = input.newDecision
   - decisionSource = "manual"
   - creditsEarned = (newDecision in ["ACQUIRED","COMPENSATED"]) ? ueCredits : 0
4. Recalculer totalCreditsEarned pour l'étudiant
5. Logger "ue_decision_overridden"
```

#### `close(id, actorId, institutionId)`

```
1. Vérifier status = "open"
2. Vérifier qu'aucun étudiant n'a decision = "PENDING"
   (tous doivent avoir une décision)
3. Figer les résultats : prendre un snapshot de evaluationData pour chaque étudiant
4. Calculer les statistiques finales
5. Mettre à jour status = "closed", closedAt = now()
6. Logger "closed"
```

#### `reopen(id, reason, actorId, institutionId)`

```
1. Vérifier status = "closed" (pas "signed")
2. Vérifier que reason est non vide
3. Mettre à jour status = "open", closedAt = null
4. Logger "reopened" avec reason
```

#### `sign(id, actorId, institutionId)`

```
1. Vérifier status = "closed"
2. Vérifier que l'acteur est le président du jury OU un super_admin
3. Mettre à jour status = "signed", signedAt = now()
4. Logger "signed"
5. Après signature : la délibération est DÉFINITIVE (lecture seule)
```

---

## 6. Requêtes base de données (Repo)

### `deliberations.repo.ts`

#### Requêtes principales

```typescript
// Créer une délibération
createDeliberation(data): Promise<Deliberation>

// Mettre à jour
updateDeliberation(id, data): Promise<Deliberation>

// Récupérer par ID avec résultats
getDeliberationById(id, institutionId): Promise<Deliberation & { results: StudentResult[] }>

// Lister avec filtres et pagination
listDeliberations(opts: {
  institutionId: string;
  classId?: string;
  academicYearId?: string;
  status?: string;
  type?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ items: Deliberation[], nextCursor?: string }>

// Vérifier l'unicité
findExistingDeliberation(classId, semesterId, academicYearId, type): Promise<Deliberation | null>

// Supprimer (draft only)
deleteDeliberation(id): Promise<void>
```

#### Résultats étudiants

```typescript
// Upsert un résultat étudiant
upsertStudentResult(data): Promise<StudentResult>

// Upsert en lot
bulkUpsertStudentResults(deliberationId, results[]): Promise<void>

// Récupérer un résultat
getStudentResult(deliberationId, studentId): Promise<StudentResult | null>

// Récupérer tous les résultats d'une délibération
getDeliberationResults(deliberationId): Promise<StudentResult[]>

// Mettre à jour une décision
updateStudentDecision(deliberationId, studentId, decision, decisionSource, observation?): Promise<void>

// Mettre à jour les résultats UE d'un étudiant
updateStudentUEResults(deliberationId, studentId, ueResults): Promise<void>
```

#### Données pour le calcul (réutilise ExportsRepo)

```typescript
// Réutilise les requêtes existantes de exports.repo.ts :
// - getPVData(classId, semesterId, academicYearId)
// - getUEData(teachingUnitId, classId, semesterId, academicYearId)
// Ces requêtes fournissent déjà : étudiants, cours, UE, examens, notes

// Requêtes additionnelles :
getStudentDeliberationHistory(studentId, institutionId): Promise<{
  previousDecisions: { academicYearId: string, decision: string }[];
  consecutiveRepeats: number;
  totalRepeats: number;
}>
```

#### Logs

```typescript
// Ajouter un log
addLog(data: {
  deliberationId: string;
  actorId: string;
  action: string;
  targetStudentId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
}): Promise<void>

// Lister les logs
getLogs(deliberationId, cursor?, limit?): Promise<{ items: Log[], nextCursor?: string }>
```

---

## 7. Schémas de validation (Zod)

```typescript
// === Création ===
const createDeliberationSchema = z.object({
  classId: z.string().min(1),
  semesterId: z.string().optional(),       // null = annuelle
  academicYearId: z.string().min(1),
  type: z.enum(["semester", "annual", "retake"]),
  label: z.string().optional(),
  ruleId: z.string().optional(),
  juryMembers: z.array(z.object({
    profileId: z.string().min(1),
    name: z.string().min(1),
    role: z.enum(["president", "rapporteur", "member", "secretary"]),
    title: z.string().min(1),
    department: z.string().optional(),
  })).optional().default([]),
  presidentId: z.string().optional(),
  sessionDate: z.date().optional(),
});

// === Mise à jour ===
const updateDeliberationSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  notes: z.string().optional(),
  juryMembers: z.array(/* même schema que ci-dessus */).optional(),
  presidentId: z.string().optional(),
  sessionDate: z.date().optional(),
  ruleId: z.string().optional(),
});

// === Override décision étudiant ===
const overrideStudentDecisionSchema = z.object({
  deliberationId: z.string().min(1),
  studentId: z.string().min(1),
  newDecision: z.enum(["ADMITTED", "ADMITTED_COMPENSATED", "DEFERRED", "REPEAT", "EXCLUDED"]),
  reason: z.string().min(10, "La justification doit faire au moins 10 caractères"),
});

// === Override décision UE ===
const overrideUEDecisionSchema = z.object({
  deliberationId: z.string().min(1),
  studentId: z.string().min(1),
  teachingUnitId: z.string().min(1),
  newDecision: z.enum(["ACQUIRED", "NOT_ACQUIRED", "COMPENSATED"]),
  reason: z.string().min(10),
});

// === Override en lot ===
const bulkOverrideSchema = z.object({
  deliberationId: z.string().min(1),
  overrides: z.array(z.object({
    studentId: z.string().min(1),
    newDecision: z.enum(["ADMITTED", "ADMITTED_COMPENSATED", "DEFERRED", "REPEAT", "EXCLUDED"]),
    reason: z.string().min(10),
  })).min(1),
});

// === Calcul ===
const computeSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().optional(),
});

// === Réouverture ===
const reopenSchema = z.object({
  id: z.string().min(1),
  reason: z.string().min(10, "La raison de réouverture est obligatoire"),
});

// === Liste ===
const listDeliberationsSchema = z.object({
  classId: z.string().optional(),
  academicYearId: z.string().optional(),
  status: z.enum(["draft", "open", "closed", "signed"]).optional(),
  type: z.enum(["semester", "annual", "retake"]).optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

// === Export DIPLOMATION ===
const exportDiplomationSchema = z.object({
  deliberationId: z.string().min(1),
  exportType: z.enum(["diploma", "attestation", "transcript", "centre_attestation"]),
  // Champs optionnels (pré-remplissage des colonnes vides)
  titreDiplomeFr: z.string().optional(),
  titreDiplomeEn: z.string().optional(),
  sessionExamen: z.string().optional(),
  lieuDelivrance: z.string().optional(),
});

// === Règle de délibération ===
const createDelibRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  programId: z.string().optional(),
  cycleLevelId: z.string().optional(),
  admissionRuleset: z.record(z.unknown()),
  compensationRuleset: z.record(z.unknown()).optional(),
  deferralRuleset: z.record(z.unknown()).optional(),
  repeatRuleset: z.record(z.unknown()).optional(),
  exclusionRuleset: z.record(z.unknown()).optional(),
  passingGrade: z.number().min(0).max(20).default(10),
  allowCompensation: z.boolean().default(true),
  maxCompensableUEs: z.number().min(0).default(2),
  minCompensableScore: z.number().min(0).max(20).default(8),
});
```

---

## 8. Workflow complet

### Scénario type : Délibération de fin de semestre

```
PHASE 1 — PRÉPARATION
═══════════════════════

1. Admin crée la délibération
   POST deliberations.create {
     classId: "L1-INFO-2024",
     semesterId: "S1",
     academicYearId: "2024-2025",
     type: "semester",
     label: "Délibération S1 2024-2025 L1 Informatique"
   }
   → status = "draft"

2. Admin constitue le jury
   PUT deliberations.update {
     id: "delib-001",
     juryMembers: [
       { profileId: "prof-001", name: "Dr. NDONG", role: "president", title: "Pr." },
       { profileId: "prof-002", name: "M. EYEBE",  role: "rapporteur", title: "Dr." },
       { profileId: "prof-003", name: "Mme BELL",  role: "member", title: "Mme" },
       { profileId: "admin-001", name: "M. FOUDA", role: "secretary", title: "M." },
     ],
     presidentId: "prof-001",
     sessionDate: "2025-02-15T09:00:00Z"
   }


PHASE 2 — OUVERTURE ET CALCUL
══════════════════════════════

3. Admin ouvre la délibération
   POST deliberations.open { id: "delib-001" }
   → status = "open"
   → Vérifie : jury non vide, président défini

4. Admin lance le calcul automatique
   POST deliberations.compute {
     id: "delib-001",
     ruleId: "rule-L1-standard"    // Optionnel, sinon utilise la règle liée
   }
   → Pour chaque étudiant :
     - Calcule les notes CC + Examen par cours
     - Résout les rattrapages (replace/best_of)
     - Calcule les moyennes par UE
     - Détermine les décisions par UE (Acquis/Non Acquis/Incomplet)
     - Applique la compensation si autorisée
     - Calcule la moyenne générale
     - Évalue les règles de délibération
     - Attribue le grade et la mention
     - Calcule le rang
   → Retourne le preview complet


PHASE 3 — EXAMEN PAR LE JURY
═════════════════════════════

5. Le jury examine les résultats
   GET deliberations.preview { id: "delib-001" }
   → Affiche tous les étudiants avec leurs décisions suggérées

6. Le jury surcharge certaines décisions

   Exemple 1 : Un étudiant avec 9.8 de moyenne, le jury décide de l'admettre
   POST deliberations.overrideStudentDecision {
     deliberationId: "delib-001",
     studentId: "student-042",
     newDecision: "ADMITTED_COMPENSATED",
     reason: "Moyenne très proche du seuil (9.8/10), progression régulière, pas d'échec éliminatoire"
   }

   Exemple 2 : Le jury compense une UE
   POST deliberations.overrideUEDecision {
     deliberationId: "delib-001",
     studentId: "student-042",
     teachingUnitId: "ue-math",
     newDecision: "COMPENSATED",
     reason: "UE à 9.2/10 compensée par la moyenne générale de 10.5"
   }


PHASE 4 — CLÔTURE
══════════════════

7. Admin clôture la délibération
   POST deliberations.close { id: "delib-001" }
   → Vérifie : aucun étudiant en "PENDING"
   → Fige les résultats (snapshot evaluationData)
   → Calcule les statistiques finales
   → status = "closed"

8. (Optionnel) Si erreur détectée après clôture
   POST deliberations.reopen {
     id: "delib-001",
     reason: "Erreur sur la note de l'étudiant NDONG en Physique, correction nécessaire"
   }
   → status = "open"
   → Le jury peut modifier puis re-clôturer


PHASE 5 — SIGNATURE ET EXPORTS
═══════════════════════════════

9. Le président signe
   POST deliberations.sign { id: "delib-001" }
   → status = "signed" (DÉFINITIF)
   → Plus aucune modification possible

10. Admin génère le PV officiel
    POST deliberations.generatePV {
      id: "delib-001",
      format: "pdf"
    }
    → PDF avec en-tête institutionnel, tableau des résultats, signatures du jury

11. Admin exporte pour DIPLOMATION
    POST deliberations.exportForDiplomation {
      deliberationId: "delib-001",
      exportType: "attestation"
    }
    → Fichier Excel .xlsx au format DIPLOMATION
    → Colonnes remplies automatiquement depuis les résultats de délibération
    → Colonnes vides marquées (voir docs/integration-diplomation.md §3)


PHASE 6 — PROMOTION (module existant)
══════════════════════════════════════

12. Les étudiants ADMITTED/ADMITTED_COMPENSATED sont éligibles à la promotion
    → Le module promotionRules existant prend le relais
    → evaluateClass utilise les données mises à jour
    → applyPromotion déplace les étudiants vers la classe suivante
```

### Diagramme d'états

```
                  ┌───────┐
                  │ draft │
                  └───┬───┘
                      │ open()
                      ▼
                  ┌───────┐
            ┌────→│ open  │←────┐
            │     └───┬───┘     │
            │         │ close() │ reopen(reason)
            │         ▼         │
            │     ┌────────┐    │
            │     │ closed │────┘
            │     └───┬────┘
            │         │ sign()
            │         ▼
            │     ┌────────┐
            │     │ signed │  ← DÉFINITIF
            │     └────────┘
            │
            └── compute() (peut être appelé plusieurs fois en status "open")
```

---

## 9. Règles de délibération

### Format json-rules-engine

Les règles utilisent les `DeliberationFacts` comme source de données.

#### Règle d'admission standard

```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 10 },
      { "fact": "allUEsComplete", "operator": "equal", "value": true },
      { "fact": "eliminatoryFailures", "operator": "equal", "value": 0 }
    ]
  },
  "event": {
    "type": "ADMITTED",
    "params": { "message": "Admis - Moyenne >= 10, toutes UE complètes, pas d'échec éliminatoire" }
  }
}
```

#### Règle de compensation

```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 10 },
      { "fact": "allUEsComplete", "operator": "equal", "value": true },
      { "fact": "compensableUEs", "operator": "greaterThan", "value": 0 },
      { "fact": "compensableUEs", "operator": "lessThanInclusive", "value": 2 },
      { "fact": "nonCompensableUEs", "operator": "equal", "value": 0 },
      { "fact": "lowestUnitAverage", "operator": "greaterThanInclusive", "value": 8 }
    ]
  },
  "event": {
    "type": "ADMITTED_COMPENSATED",
    "params": { "message": "Admis par compensation - Moyenne >= 10, UE compensables <= 2, pas de note UE < 8" }
  }
}
```

#### Règle d'ajournement (rattrapage)

```json
{
  "conditions": {
    "all": [
      { "fact": "overallAverage", "operator": "greaterThanInclusive", "value": 8 },
      { "fact": "overallAverage", "operator": "lessThan", "value": 10 },
      { "fact": "failedTeachingUnitsCount", "operator": "lessThanInclusive", "value": 3 },
      { "fact": "consecutiveRepeats", "operator": "lessThan", "value": 2 }
    ]
  },
  "event": {
    "type": "DEFERRED",
    "params": { "message": "Ajourné - Autorisé à passer le rattrapage" }
  }
}
```

#### Règle de redoublement

```json
{
  "conditions": {
    "any": [
      {
        "all": [
          { "fact": "overallAverage", "operator": "lessThan", "value": 8 },
          { "fact": "consecutiveRepeats", "operator": "lessThan", "value": 2 }
        ]
      },
      {
        "all": [
          { "fact": "creditCompletionRate", "operator": "lessThan", "value": 0.3 },
          { "fact": "consecutiveRepeats", "operator": "lessThan", "value": 2 }
        ]
      }
    ]
  },
  "event": {
    "type": "REPEAT",
    "params": { "message": "Redoublant - Moyenne < 8 ou crédits < 30%" }
  }
}
```

#### Règle d'exclusion

```json
{
  "conditions": {
    "any": [
      { "fact": "consecutiveRepeats", "operator": "greaterThanInclusive", "value": 2 },
      { "fact": "totalRepeats", "operator": "greaterThanInclusive", "value": 3 }
    ]
  },
  "event": {
    "type": "EXCLUDED",
    "params": { "message": "Exclu - 2 redoublements consécutifs ou 3 au total" }
  }
}
```

### Ordre d'évaluation des règles

Les règles sont évaluées dans un ordre de priorité strict :

```
1. exclusionRuleset     → EXCLUDED (priorité la plus haute)
2. repeatRuleset        → REPEAT
3. deferralRuleset      → DEFERRED
4. compensationRuleset  → ADMITTED_COMPENSATED
5. admissionRuleset     → ADMITTED
6. (aucun match)        → PENDING
```

Le premier match gagne. Cela garantit qu'un étudiant exclu ne peut pas être "sauvé" par une règle d'admission.

---

## 10. Intégration avec les modules existants

### Modules réutilisés

| Module existant | Ce qu'il fournit à la délibération |
|----------------|-----------------------------------|
| `exports.repo` | Requêtes `getPVData`, `getUEData` pour récupérer notes, examens, UE |
| `exports.service` | `processPVData`, `resolveStudentGradesWithRetakes` pour le calcul des moyennes |
| `template-helper` | `getExportConfig`, `getAppreciation`, `formatNumber` |
| `student-facts.service` | `buildStudentFacts` pour calculer les StudentPromotionFacts |
| `student-credit-ledger` | `computeUeCredits` pour les crédits par UE |
| `promotion-rules` | Après la délibération, les étudiants admis deviennent éligibles aux promotions |
| `institutions` | Configuration `export_config` (note de passage, appréciations, signatures) |

### Nouvelles dépendances

```
deliberations.service
  ├── imports from exports.repo (getPVData, getUEData)
  ├── imports from exports.service (processPVData, resolveRetakes)
  ├── imports from student-facts.service (buildStudentFacts)
  ├── imports from student-credit-ledger (computeUeCredits)
  ├── imports from template-helper (getExportConfig)
  ├── imports from json-rules-engine (Engine)
  └── imports from exceljs (pour l'export DIPLOMATION)
```

### Impact sur les modules existants

| Module | Impact |
|--------|--------|
| `exports` | Aucune modification. Les exports PV existants continuent de fonctionner indépendamment. La délibération **consomme** les mêmes données mais ajoute les décisions du jury. |
| `promotions` | Aucune modification. Le module de promotion peut consulter les résultats de délibération pour vérifier qu'un étudiant a été admis avant de le promouvoir. |
| `grades` | Aucune modification. La délibération lit les notes mais ne les modifie jamais. |
| `student-promotion-summaries` | Aucune modification. La délibération crée ses propres snapshots (evaluationData) indépendamment des summaries existantes. |

---

## 11. Lien avec DIPLOMATION

L'endpoint `exportForDiplomation` génère un fichier Excel à partir des résultats d'une délibération **signée**.

### Avantage par rapport à un export "brut"

Quand l'export part d'une **délibération signée** plutôt que des données brutes :

| Donnée | Export brut (sans délibération) | Export depuis délibération |
|--------|--------------------------------|---------------------------|
| Décision | Calculée à la volée, non validée | **Officielle**, validée par le jury |
| Mention | Calculée depuis la moyenne | **Confirmée/surchargée** par le jury |
| Moyenne | Dernière valeur en base | **Figée** au moment de la clôture |
| Crédits | Calculés dynamiquement | **Validés** par le jury (avec compensations) |
| Rang | Non calculé | **Officiel** |
| Audit | Aucun | Qui a décidé quoi, quand, pourquoi |

### Colonnes DIPLOMATION alimentées par la délibération

#### Diplôme — Colonnes supplémentaires remplies grâce à la délibération

| Colonne | Sans délibération | Avec délibération |
|---------|-------------------|-------------------|
| `MENTION` | 🔶 Calculé | ✅ Mention officielle du jury |
| `GRADE` | 🔶 Calculé | ✅ Grade officiel |
| `DATE JURY DELIBERATION` | ❌ VIDE | ✅ `deliberations.sessionDate` |

#### Attestation — Colonnes supplémentaires

| Colonne | Sans délibération | Avec délibération |
|---------|-------------------|-------------------|
| `MENTION` | 🔶 Calculé | ✅ Officielle |
| `GRADE` | 🔶 Calculé | ✅ Officiel |
| `DATE JURY` | ❌ VIDE | ✅ `deliberations.sessionDate` |
| `TOTAL CREDIT` | ✅ Depuis summaries | ✅ Depuis résultats validés par le jury |

### Données toujours non disponibles (même avec délibération)

Ces colonnes restent vides même avec le module de délibération :

- `TITRE DIPLOME FR / EN` — Titre officiel du diplôme (contexte institutionnel)
- `DATE JURY ADMISSION` — Date du jury initial d'admission
- `DOMAINE / DOMAINE_EN` — Domaine d'études
- `FINALITE / FINALITE_EN` — Finalité (professionnelle/recherche)
- `PARCOURS_EN / SPECIALITE_EN` — Traductions anglaises
- `SESSION_EXAMEN` — Session d'examen (juin/septembre)
- `LIEU_DELIVRANCE` — Lieu de délivrance
- `TITRE_ATTESTATION_FR / EN` — Titres personnalisés

---

## 12. Structure des fichiers

```
apps/server/src/modules/deliberations/
├── index.ts                            # Export du router
├── deliberations.router.ts             # Endpoints tRPC (section 4)
├── deliberations.service.ts            # Logique métier (section 5)
├── deliberations.repo.ts               # Requêtes DB (section 6)
├── deliberations.zod.ts                # Schémas Zod (section 7)
├── deliberations.types.ts              # Types TypeScript (section 3)
├── deliberation-facts.service.ts       # Calcul des DeliberationFacts
├── deliberation-rules.service.ts       # Évaluation des règles json-rules-engine
├── deliberation-rules.router.ts        # CRUD des règles (sous-router)
├── deliberation-rules.repo.ts          # Requêtes pour les règles
├── deliberation-rules.zod.ts           # Validation des règles
├── deliberation-export.service.ts      # Génération Excel DIPLOMATION
├── deliberation-pv.service.ts          # Génération PV PDF/HTML
└── __tests__/
    ├── deliberations.caller.test.ts    # Tests du cycle de vie
    ├── deliberation-compute.test.ts    # Tests du calcul
    ├── deliberation-rules.test.ts      # Tests des règles
    └── deliberation-export.test.ts     # Tests de l'export
```

### Ajout au router principal

```typescript
// apps/server/src/routers/index.ts
import { deliberationsRouter } from "../modules/deliberations";

export const appRouter = router({
  // ... routers existants
  deliberations: deliberationsRouter,
});
```

### Ajout au schéma

```typescript
// apps/server/src/db/schema/app-schema.ts
// Ajouter les 4 nouvelles tables :
// - deliberations
// - deliberationStudentResults
// - deliberationRules
// - deliberationLogs
```

---

## 13. Tests

### Tests du cycle de vie

```typescript
describe("deliberations lifecycle", () => {
  test("create → open → compute → close → sign");
  test("cannot open without jury");
  test("cannot close with PENDING students");
  test("cannot sign if not closed");
  test("reopen requires reason");
  test("signed deliberation is readonly");
  test("unique constraint on (class, semester, year, type)");
});
```

### Tests du calcul

```typescript
describe("deliberations compute", () => {
  test("calculates UE averages correctly");
  test("resolves retake grades with replace policy");
  test("resolves retake grades with best_of policy");
  test("applies compensation when allowed");
  test("does not compensate below minCompensableScore");
  test("respects maxCompensableUEs limit");
  test("ranks students by descending average");
  test("assigns correct grade from average");
  test("assigns correct mention from average");
  test("handles incomplete UEs (missing grades)");
});
```

### Tests des décisions

```typescript
describe("deliberation decisions", () => {
  test("ADMITTED when avg >= 10 and all UEs complete");
  test("ADMITTED_COMPENSATED with compensation rules");
  test("DEFERRED when avg between 8 and 10");
  test("REPEAT when avg < 8 or credits < 30%");
  test("EXCLUDED after 2 consecutive repeats");
  test("override changes decisionSource to manual");
  test("override is logged in deliberation_logs");
  test("reset restores auto decision");
});
```

### Tests de l'export

```typescript
describe("deliberation export", () => {
  test("export requires signed deliberation");
  test("diploma export fills correct columns");
  test("attestation export fills correct columns");
  test("transcript export fills all columns");
  test("empty columns are present but blank");
  test("date format is DD/MM/YYYY");
  test("average is rounded to 2 decimals");
});
```

---

## Annexe A — Comparaison architecturale avec Promotion Rules

| Aspect | Promotion Rules | Deliberations |
|--------|----------------|---------------|
| **Tables** | promotionRules, promotionExecutions, promotionExecutionResults | deliberationRules, deliberations, deliberationStudentResults, deliberationLogs |
| **Statuts** | Pas de statut (exécution unique) | draft → open → closed → signed |
| **Règles** | 1 ruleset unique | 5 rulesets (admission, compensation, deferral, repeat, exclusion) |
| **Granularité** | Par étudiant (promu/non promu) | Par UE + par étudiant + mention + rang |
| **Override** | Non (tout automatique) | Oui (jury peut surcharger) |
| **Audit** | executionResults.evaluationData | deliberationLogs (journal complet) |
| **Output** | Déplacement d'inscriptions | PV officiel + export DIPLOMATION |
| **Réutilisation** | buildStudentFacts, json-rules-engine | Idem + exports.repo, processPVData |
| **Autorisation** | adminProcedure / protectedProcedure | Idem |
| **Pattern** | evaluate → apply | create → open → compute → override → close → sign |

---

## Annexe B — Estimation de complexité

| Composant | Fichiers | Estimation |
|-----------|----------|------------|
| Schéma DB (4 tables) | 1 fichier (ajout à app-schema.ts) | ~ 200 lignes |
| Types | deliberations.types.ts | ~ 150 lignes |
| Zod | deliberations.zod.ts + deliberation-rules.zod.ts | ~ 200 lignes |
| Repo | deliberations.repo.ts + deliberation-rules.repo.ts | ~ 400 lignes |
| Service (calcul) | deliberations.service.ts + deliberation-facts.service.ts | ~ 600 lignes |
| Service (règles) | deliberation-rules.service.ts | ~ 200 lignes |
| Service (export) | deliberation-export.service.ts | ~ 300 lignes |
| Service (PV) | deliberation-pv.service.ts | ~ 200 lignes |
| Router | deliberations.router.ts + deliberation-rules.router.ts | ~ 300 lignes |
| Tests | 4 fichiers de tests | ~ 500 lignes |
| **Total** | **~15 fichiers** | **~3050 lignes** |
