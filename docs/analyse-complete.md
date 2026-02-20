 # Analyse Complète du Workflow de l'Application

> **Date d'analyse :** 2026-02-20
> **Branche analysée :** `frontend-redesign`
> **Portée :** Architecture complète — backend, frontend, base de données, logique métier

---

## Table des matières

1. [Vue d'ensemble de la structure](#1-vue-densemble-de-la-structure)
2. [Architecture backend](#2-architecture-backend)
3. [Schéma de base de données](#3-schéma-de-base-de-données)
4. [Logique métier module par module](#4-logique-métier-module-par-module)
5. [Architecture frontend](#5-architecture-frontend)
6. [Flux de travail de bout en bout](#6-flux-de-travail-de-bout-en-bout)
7. [Incohérences et problèmes identifiés](#7-incohérences-et-problèmes-identifiés)
8. [Fonctionnalités manquantes](#8-fonctionnalités-manquantes)
9. [Problèmes de sécurité et d'accès](#9-problèmes-de-sécurité-et-daccès)
10. [Problèmes de qualité du code](#10-problèmes-de-qualité-du-code)
11. [Données de seed](#11-données-de-seed)
12. [Synthèse par priorité](#12-synthèse-par-priorité)

---

## 1. Vue d'ensemble de la structure

### 1.1 Monorepo

```
grades-manager-api/
├── apps/
│   ├── server/          # API backend (Hono + tRPC + Drizzle)
│   └── web/             # Frontend React (Vite + TailwindCSS + shadcn/ui)
├── packages/            # Packages partagés (vide actuellement)
├── docs/                # Documentation (30+ fichiers markdown + PDF)
└── seed/local/          # Fichiers YAML de seed (gitignorés)
```

### 1.2 Modules backend (40+ modules)

| Catégorie | Modules |
|-----------|---------|
| Académique | `academic-years`, `programs`, `program-options`, `study-cycles`, `cycle-levels`, `semesters`, `teaching-units`, `courses`, `classes`, `class-courses` |
| Étudiant | `students`, `enrollments`, `student-course-enrollments`, `student-credit-ledger` |
| Évaluation | `exams`, `exam-types`, `exam-scheduler`, `exam-grade-editors`, `grades` |
| Promotion | `promotion-rules`, `promotions`, `rules-engine` |
| Utilisateur / Auth | `users`, `domain-users`, `authz`, `institutions` |
| Workflow | `workflows`, `notifications` |
| Batch / Export | `batch-jobs`, `exports`, `export-templates`, `registration-numbers`, `files` |

### 1.3 Pages frontend

| Rôle | Nombre de pages |
|------|----------------|
| Admin | 37 routes |
| Teacher | 6 routes |
| Dean | 2 routes |
| Student | 1 route |
| Auth | 4 routes |
| Staff | **0 routes (rôle inexistant côté frontend)** |

---

## 2. Architecture backend

### 2.1 Procédures tRPC disponibles

Six types de procédures sont définis :

| Type | Condition |
|------|-----------|
| `publicProcedure` | Aucune auth requise |
| `protectedProcedure` | Session authentifiée |
| `adminProcedure` | Rôle dans `[administrator, dean, super_admin, owner]` |
| `superAdminProcedure` | Rôle dans `[super_admin, owner]` |
| `gradingProcedure` | Permission `canGrade` (teacher + admin) |
| Variantes `tenant*` | + contexte institution obligatoire |

**Total estimé : 170+ endpoints tRPC répartis sur 34 routeurs.**

### 2.2 Hiérarchie des rôles

```
owner
  └── super_admin
        └── administrator
              └── dean
                    └── teacher
                          └── staff
                                └── student
```

### 2.3 Permissions calculées à la requête (snapshot)

```typescript
{
  canManageCatalog: boolean    // ADMIN_ROLES
  canManageStudents: boolean   // ADMIN_ROLES
  canGrade: boolean            // teacher + admin roles
  canAccessAnalytics: boolean  // ADMIN_ROLES
}
```

### 2.4 Résolution du contexte multi-tenant

Flux de résolution du contexte par requête :
1. Lecture de `session.activeOrganizationId`
2. Fallback sur `domainUser.memberId`
3. Si aucun : erreur `PRECONDITION_FAILED`
4. Validation que l'utilisateur appartient à l'organisation
5. Calcul du snapshot de permissions

**Problème identifié :** Chaque requête effectue une requête DB pour récupérer l'institution. Aucun cache côté serveur.

### 2.5 Jobs en arrière-plan

| Job | Fréquence | Fonction |
|-----|-----------|---------|
| `close-expired-approved-exams` | Toutes les 5 min | Verrouille les examens approuvés dont la date est passée |
| `send-pending-notifications` | Toutes les 1 min | Envoie les notifications en attente |
| `mark-stale-batch-jobs` | Toutes les 5 min | Marque les batch jobs sans heartbeat comme "stale" |

**Problème identifié :** Aucune gestion des erreurs ni retry sur ces jobs. Un échec est simplement loggué.

---

## 3. Schéma de base de données

### 3.1 Tables complètes (44 tables)

#### Tables d'authentification (Better-Auth)
- `user`, `session`, `account`, `verification`
- `organization`, `member`, `invitation`

#### Tables institutionnelles
- `institutions` — Entité racine multi-tenant
- `domain_users` — Profils métier séparés des comptes auth
- `studyCycles`, `cycleLevels` — Hiérarchie des cycles d'études
- `semesters` — Catalogue statique (S1, S2…)
- `academicYears` — Années académiques par institution

#### Tables curriculum
- `programs`, `programOptions` — Programmes et options
- `teachingUnits` — Unités d'enseignement (UE)
- `courses` — Éléments constitutifs (EC)
- `coursePrerequisites` — Prérequis inter-cours
- `classes` — Cohortes/groupes
- `classCourses` — Affectation cours → classe + enseignant

#### Tables évaluation
- `examTypes`, `exams` — Types et instances d'examens
- `examScheduleRuns` — Audit des planifications en masse
- `grades` — Notes étudiant/examen
- `retakeOverrides` — Dérogations de rattrapage
- `examGradeEditors` — Délégation de saisie de notes
- `gradeEditLogs` — Journal des modifications de notes
- `classCourseAccessLogs` — Journal d'accès délégués

#### Tables étudiant
- `students`, `enrollments` — Étudiants et inscriptions annuelles
- `studentCourseEnrollments` — Tentatives par cours
- `studentCreditLedgers` — Suivi des crédits agrégés
- `studentPromotionSummaries` — Cache de promotion (50+ champs calculés)

#### Tables contrôle / promotion
- `enrollmentWindows` — Fenêtres d'inscription
- `promotionRules`, `promotionExecutions`, `promotionExecutionResults`

#### Tables infrastructure
- `notifications` — File de notifications
- `exportTemplates` — Templates Handlebars pour exports
- `registrationNumberFormats`, `registrationNumberCounters`
- `batchJobs`, `batchJobSteps`, `batchJobLogs`

### 3.2 Règles de cascade notables

| Table | Colonne | Référence | Action |
|-------|---------|-----------|--------|
| `domain_users` | `authUserId` | `user.id` | CASCADE |
| `domain_users` | `memberId` | `member.id` | SET NULL |
| `students` | `domainUserId` | `domain_users.id` | RESTRICT |
| `classes` | `academicYearId` | `academicYears.id` | RESTRICT |
| `promotionExecutions` | `sourceClassId` | `classes.id` | RESTRICT |
| Tous enfants | `institutionId` | `institutions.id` | CASCADE |
| `exams` | `parentExamId` | `exams.id` | **Non définie** |

---

## 4. Logique métier module par module

### 4.1 Module `grades`

**Ce qui existe :**
- Upsert de note par couple (student, exam)
- Mise à jour et suppression individuelle
- Import CSV (colonnes : `registrationNumber`, `score`)
- Export CSV d'une classe/cours
- Calcul de transcript consolidé avec pondération
- Logs de modification pour les délégués

**Flux de saisie d'une note :**
```
grades.upsertNote()
  → ensureActorCanEditExam()     [admin / teacher / délégué]
  → ensureStudentRegistered()    [statut planned/active/completed]
  → DB upsert (student, exam)
  → si retake : refreshAfterRetakeGrade()
  → toujours : recomputeCreditsAfterGradeChange()
  → si délégué : log dans gradeEditLogs
```

**Incohérences et manques :**
- Aucune validation de la plage de score (0 à 20 ? 0 à 100 ?) — valeur quelconque acceptée
- Import CSV non atomique : traitement ligne par ligne, état partiel possible en cas d'échec
- `updateNote` et `upsertNote` dupliquent exactement la même logique d'effets de bord
- `deleteNote` déclenche aussi les mêmes effets (retake refresh + credit recompute) — logique dupliquée 3×
- Historique des notes non conservé : seule la valeur courante est stockée
- Pas de détection de doublons dans l'import CSV (même étudiant 2× dans le fichier)
- Pas d'opération "supprimer toutes les notes d'un examen"
- Le transcript ne gère pas explicitement le cas "examen retake + examen normal" (risque de double-comptage)
- L'admin peut modifier des notes sans laisser de trace dans `gradeEditLogs` (log seulement pour les délégués)

### 4.2 Module `exams`

**Ce qui existe :**
- Cycle de vie complet : `draft → scheduled → submitted → approved / rejected`
- Validation du pourcentage total par class-course (≤ 100%)
- Retake : création à partir d'un examen parent approuvé
- Politiques de scoring retake : `replace` ou `best_of`
- Éligibilité au rattrapage avec dérogations admin
- Verrouillage manuel + auto-lock par job

**Machine à états de l'examen :**
```
draft
  ↓ submit()
scheduled → submitted
               ↓ validate(approved)     ↓ validate(rejected)
             approved                   rejected
               ↓ lock()
             [locked]  ← auto-lock par job si date passée
```

**Incohérences et manques :**
- Pas de validation des transitions d'état : `validate()` peut être appelé plusieurs fois
- Un examen `rejected` ne peut pas être re-soumis (pas de chemin `rejected → draft`)
- Aucun contrôle que la date d'examen est dans la plage de l'année académique
- Le pourcentage peut être 0% (schema accepte 0-100, mais 0 ne fait rien)
- `type` dans `exams` est une chaîne libre sans relation FK vers `examTypes`
- Seuil de rattrapage `DEFAULT_PASSING_GRADE = 10` et `RETAKE_ATTEMPT_LIMIT = 2` codés en dur dans le service
- La feature flag retakes est vérifiée dans le router mais pas dans les fonctions service — comportement indéfini si le flag change après création
- Pas de détection de conflits d'horaires (deux examens sur la même plage horaire)
- `createRetakeExam()` hérite du type/pourcentage du parent mais pas du nom

### 4.3 Module `enrollments`

**Ce qui existe :**
- Inscription étudiant → classe → année académique
- Types d'admission : `normal`, `transfer`, `direct`, `equivalence`
- Stockage des métadonnées de transfert (institution, crédits, niveau)
- Statuts : `pending → active → completed / withdrawn`

**Incohérences et manques :**
- Aucun contrôle des doublons : un étudiant peut avoir plusieurs inscriptions pour la même combinaison (student, class, year)
- Pas de machine à états : toute transition est possible, y compris `withdrawn → active`
- `exitedAt` est positionné à chaque `updateStatus()`, même pour les transitions non-sortantes (ex: `active → active`)
- Les fenêtres d'inscription (`enrollmentWindows`) ne sont jamais vérifiées lors de l'inscription
- Pas de vérification de prérequis académiques (cycle précédent validé ?)
- Les crédits de transfert sont stockés mais leur impact sur le ledger est manuel

### 4.4 Module `student-course-enrollments`

**Ce qui existe :**
- Inscription par cours (tentative)
- Auto-incrémentation du numéro de tentative
- Avertissements sur les prérequis (non bloquants)
- Auto-inscription de toute une classe pour tous ses class-courses
- Calcul de `creditsAttempted` au moment de l'inscription

**Incohérences et manques :**
- Les prérequis génèrent des avertissements mais ne bloquent jamais l'inscription
- Aucune limite sur le nombre de tentatives (contrairement à `RETAKE_ATTEMPT_LIMIT = 2` dans exams)
- Pas de vérification des transitions d'état (`planned → failed → active` est accepté)
- `creditsAttempted` = crédits de l'UE, figés à l'inscription — ne reflète pas les changements de programme
- Pas d'opération "fermer tous les cours d'un étudiant" en une seule transaction
- La validation `ensureStudentRegistered()` dans grades ne vérifie que `planned/active/completed` — un étudiant `failed` ne peut pas avoir de note ajoutée mais garde ses notes existantes

### 4.5 Module `workflows`

**Ce qui existe :**
- Validation des notes (approbation d'examen)
- Gestion des fenêtres d'inscription
- Alertes d'assiduité
- Routeur avec 4 procédures

**Incohérences et manques — CRITIQUE :**
- **Aucune table `workflows` n'existe dans le schéma** alors qu'un routeur `workflows` est exposé
- Pas de machine à états de workflow : aucun suivi de qui a approuvé, quand, avec quel commentaire
- `validateGrades()` appelle directement `examsService.validateExam()` + `examsService.setLock()` sans persistance de l'approbation
- Pas de chaîne d'approbation (impossible d'exiger dean + administrator)
- Pas de workflow de rejet avec demande de correction
- L'enrollment window ouvre/ferme un statut mais **n'est jamais vérifiée** lors des inscriptions effectives
- Le routeur `workflows.enrollmentWindows` (query) renvoie les fenêtres mais le service `createEnrollmentWindow()` est dans le module workflows — confusion de responsabilités

### 4.6 Module `notifications`

**Ce qui existe :**
- File d'attente de notifications (statuts: `pending / sent / failed`)
- Types : `grade_validated`, `enrollment_open`, `enrollment_closed`, `attendance_alert`, `exam_locked`
- Job background : envoi des pending toutes les minutes
- Canal : `email` ou `webhook`

**Incohérences et manques :**
- **Aucun envoi réel** : le service marque simplement les notifications comme "sent" sans intégration SMTP/webhook
- Pas de retry : un échec d'envoi reste en état `failed` indéfiniment
- Aucun template de notification : le payload est un JSONB libre
- Type de notification en chaîne libre — pas d'enum — risque de typo
- `recipientId` peut être NULL
- Pas de mécanisme de désinscription (unsubscribe)
- Le statut "sent" est positionné immédiatement, pas de confirmation de livraison
- Les erreurs d'envoi ne remontent pas en notification interne

### 4.7 Module `student-credit-ledger`

**Ce qui existe :**
- Calcul des crédits UE validés selon les règles LMD
- Politiques de scoring retake (`replace` / `best_of`)
- Crédits par statut : `earned`, `inProgress`, `attempted`
- Recalcul déclenché après chaque modification de note

**Algorithme de calcul (`computeUeCredits`) :**
```
Pour chaque UE inscrite :
  → calculer moyenne = Σ(note_EC × coeff) / Σ(coeff)
  → si moyenne ≥ 10 ET tous les ECs notés → validée → creditsEarned
  → si certains ECs non notés → en cours → creditsInProgress
  → sinon → échouée → 0
```

**Incohérences et manques :**
- Note de passage codée en dur : `DEFAULT_PASSING_GRADE = 10` (non configurable)
- Crédits requis codés en dur : `DEFAULT_REQUIRED_CREDITS = 60` (non par programme/cycle)
- Pas de crédits par semestre — seulement annuels
- Les crédits de transfert sont distincts mais ne sont pas marqués comme tels dans le ledger
- Pas de journal transactionnel : uniquement le solde agrégé
- Si les coefficients d'une UE sont tous 0 → division par zéro possible
- Race condition potentielle si deux notes sont saisies simultanément (pas de verrou)

### 4.8 Module `promotion-rules`

**Ce qui existe :**
- Règles configurables en JSON (format `json-rules-engine`)
- Snapshot de faits étudiant (50+ champs calculés et mis en cache)
- Exécution de promotion : crée les inscriptions dans la classe cible
- Historique des exécutions avec résultats par étudiant

**Faits calculés pour chaque étudiant :**
- Identification : studentId, classId, programId, registrationNumber…
- Moyennes : générale, par UE, par EC
- Distribution : scores > 10, < 10, < 8
- Échecs : failedCourses, failedTeachingUnits, compensableFailures, eliminatoryFailures
- Crédits : earned, inProgress, attempted, required, deficit, completionRate…
- Progression : performanceIndex, isOnTrack, progressionRate, canReachRequired…
- Transfert : admissionType, transferCredits, isTransferStudent…

**Incohérences et manques :**
- Les règles ne sont pas versionnées : modifier une règle change rétroactivement l'historique
- Pas de rollback d'une exécution de promotion
- Cache des faits (`studentPromotionSummaries`) potentiellement périmé si des notes sont ajoutées sans rafraîchissement
- `getStudentPromotionFacts(rebuildIfMissing: true)` utilisé de façon incohérente — pas toujours forcé
- Pas de planification automatique — les promotions doivent être déclenchées manuellement
- Aucun flag "prêt à diplômer" ni audit de diplôme
- Le `COMPENSABLE_THRESHOLD = 8` est défini dans les faits mais jamais utilisé dans les règles
- Pas de gestion des cas d'égalité ou de résultats ambigus dans les règles

### 4.9 Module `exam-scheduler`

**Ce qui existe :**
- Planification en masse d'examens pour des classes entières
- Preview avant confirmation
- Distribution linéaire des dates sur une plage
- Historique des runs de planification
- Gestion des rattrapages : preview + planification

**Incohérences et manques :**
- Distribution des dates naïve : interpolation linéaire sans vérification des conflits
- Validation du dépassement de pourcentage détectée après tentative de création (catch d'erreur), pas en amont
- Pas de validation que le `semesterId` appartient à l'`academicYearId`
- Un run annulé à mi-parcours laisse des examens partiellement créés (pas de transaction globale)
- Pas de possibilité d'annuler une planification (supprimer les examens d'un run)
- Contient des `console.log("[DEBUG preview]...")` non supprimés
- Le `scheduleRetakes` ne passe pas les détails complets à `createRetakeExam()` — risque de données manquantes

### 4.10 Module `exam-grade-editors`

**Ce qui existe :**
- Délégation de saisie de notes à d'autres profils
- Vérification d'accès : admin / enseignant titulaire / délégué
- Logging des accès délégués dans `classCourseAccessLogs`

**Incohérences et manques :**
- Aucune expiration de délégation (accès indéfini)
- La révocation supprime le record (hard delete) sans trace d'audit
- Aucune notification au délégué en cas de révocation
- L'assignation vérifie l'appartenance à l'institution mais pas la validité du profil (inactif ?)
- Le `list` endpoint utilise `tenantGradingProcedure` plutôt que `tenantAdminProcedure` — trop permissif

### 4.11 Module `batch-jobs`

**Ce qui existe :**
- Preview + exécution + annulation + rollback
- Suivi en étapes (`batchJobSteps`) et logs (`batchJobLogs`)
- Statuts : `pending / previewed / running / completed / failed / cancelled / stale / rolled_back`
- Détection de stale jobs par heartbeat

**Incohérences et manques :**
- Les `parentJobId` et `rollbackJobId` n'ont pas de contraintes FK dans le schéma
- Le rollback crée un lien mais n'implémente pas de logique d'annulation effective
- Les types de jobs (`BatchJobType`) sont castés sans registre formel exposé dans le router
- Pas de planification automatique des jobs

### 4.12 Module `registration-numbers`

**Ce qui existe :**
- Formats configurables avec segments (`literal`, `field`, `counter`)
- Un seul format actif à la fois par institution
- Prévisualisation avant activation
- Compteurs par scope (global, year, program, class…)

**Incohérences et manques :**
- Format du `scopeKey` non documenté et non validé (chaîne libre)
- `students.registrationNumber` n'a aucune FK vers le format ayant généré ce numéro
- Pas de vérification d'unicité lors de la génération (suppose que le compteur garantit l'unicité)
- Aucune validation de la longueur des noms de format

---

## 5. Architecture frontend

### 5.1 Routing et pages

**Routes par rôle :**

| Rôle | Routes principales |
|------|--------------------|
| Admin | Dashboard, académique, utilisateurs, examens, exports, promotion, système |
| Teacher | Dashboard, cours, saisie notes, assiduité, workflows |
| Dean | Monitoring, approbation workflows |
| Student | Dashboard performance |
| Staff | **AUCUNE ROUTE DÉFINIE** |

**Incohérence critique :**
Dans `Redirector.tsx`, `staff` est mappé vers `<Navigate to="/staff" replace />` mais aucune route `/staff/*` n'existe dans `App.tsx`. Un utilisateur avec le rôle `staff` est redirigé vers une URL inexistante.

### 5.2 Gestion d'état (Zustand)

```typescript
// Persisté dans localStorage sous "academic-management-store"
{
  user: {
    profileId, authUserId, role, firstName, lastName, email,
    permissions: { canManageCatalog, canManageStudents, canGrade, canAccessAnalytics }
  } | null,
  sidebarOpen: boolean,
  activeOrganizationSlug: string | null
}
```

**Incohérences :**
- Les permissions sont dupliquées : calculées côté serveur ET stockées côté client dans le store Zustand
- Si le rôle d'un utilisateur change côté serveur, le store client garde les anciennes permissions jusqu'au rechargement
- `activeOrganizationSlug` est stocké mais le serveur utilise `activeOrganizationId` — désynchronisation possible

### 5.3 Procédures tRPC appelées depuis le frontend

Toutes les 140+ procédures exposées par le backend sont bien appelées depuis le frontend, sauf :

**Non appelées depuis le frontend :**
- `promotions.listDefaultRules` — jamais utilisé côté UI
- `grades.importCsv` — endpoint existe mais aucune page UI ne l'expose (seulement export CSV visible)
- `grades.listByStudent` — appelé mais pas de page dédiée à la vue étudiant-enseignant
- `enrollments.delete` — appelé mais aucune page ne l'expose clairement
- `studentCreditLedger.list` — `summary` utilisé mais pas la liste détaillée

### 5.4 Internationalisation

- Deux langues : anglais (EN) et français (FR)
- 797+ clés de traduction
- Certaines clés suggèrent des fonctionnalités plus avancées que ce qui est implémenté (ex: `student.performance.*` avec plus de champs que ce qui est affiché)

**Incohérences :**
- Les modules `promotion-rules`, `batch-jobs`, `export-templates` ont peu ou pas de traductions FR dédiées
- Les messages d'erreur tRPC ne sont pas traduits — affichés en anglais brut

### 5.5 Composants manquants

**Fonctionnalités backend sans interface frontend :**
- Gestion des délégués (`examGradeEditors.assign/revoke`) — pas de page dédiée
- Import CSV de notes — pas d'UI exposée
- Audit trail des modifications de notes — pas de vue accessible
- Journal des accès délégués — pas visible
- Détail des notifications — lecture seule depuis le centre de notifications
- `registrationNumbers.list` — présent dans admin mais `getById` non exposé

### 5.6 Pages front incohérentes

- `/admin/student-promotion` route vers le composant `StudentManagement` (ligne 178 dans App.tsx) — devrait probablement être une page distincte
- `teacher/ProgramManagement.tsx` existe dans les fichiers mais n'est pas dans les routes déclarées
- `teacher/ClassCourseManagement.tsx` et `teacher/CourseManagement.tsx` sont des fichiers existants mais non utilisés dans le router teacher
- `teacher/StudentManagement.tsx` même situation — fichier sans route

---

## 6. Flux de travail de bout en bout

### 6.1 Flux complet de gestion des notes

```
PHASE 1 — Création d'examen
────────────────────────────
Admin/Teacher: exams.create()
  → Validation: pourcentage total ≤ 100% pour ce class-course
  → Statut initial: "draft" (sans scheduleur) ou "scheduled" (avec)
  → Roster vérifié: au moins 1 étudiant actif

PHASE 2 — Saisie des notes (3 modes)
─────────────────────────────────────
Mode A — Saisie manuelle:
  grades.upsertNote(examId, studentId, score)
  → Contrôle accès: admin / enseignant / délégué
  → Vérification: examen non verrouillé et non approuvé
  → Vérification: étudiant inscrit au cours
  → Upsert DB
  → [si retake] → refreshAfterRetakeGrade()
  → Toujours → recomputeCreditsAfterGradeChange()
  → [si délégué] → log dans gradeEditLogs

Mode B — Import CSV:
  grades.importCsv(examId, csvFile)
  → Validation headers: "registrationNumber", "score"
  → Traitement ligne par ligne (NON atomique)
  → Même effets de bord par note

Mode C — Pas d'interface d'import visible dans le frontend

PHASE 3 — Soumission de l'examen
──────────────────────────────────
Teacher: exams.submit(examId)
  → Statut: draft/scheduled → "submitted"

PHASE 4 — Validation (Workflow)
─────────────────────────────────
Admin: workflows.validateGrades(examId)
  → examsService.validateExam() → statut "approved"
  → examsService.setLock(false) — non verrouillé à ce stade
  → Notification "grade_validated" en file
  [MANQUE: Aucune persistance de l'approbation dans une table workflows]
  [MANQUE: Aucun workflow de rejet]

PHASE 5 — Verrouillage
───────────────────────
Admin: exams.lock(examId, true)
  → Requiert statut = "approved"
  → isLocked = true → notes immutables
  Auto: job toutes les 5 min verrouille les exams approuvés dont la date est passée

PHASE 6 — Rattrapage (feature-flagged)
───────────────────────────────────────
Admin: exams.listRetakeEligibility(examId)
  → Éligibilité: note < 10 OU pas de note OU statut "failed"
  → Seuil: DEFAULT_PASSING_GRADE = 10 (codé en dur)
  → Limite: ATTEMPT_LIMIT = 2 (codé en dur)
  → Dérogations: "force_eligible" ou "force_ineligible"

Admin: exams.createRetake(parentExamId, scoringPolicy)
  → Copie type/pourcentage/class-course du parent
  → Crée examen en statut "draft"
  → Une seule retake par parent (contrainte unique)
  → [Phases 2-5 répétées pour l'examen de rattrapage]

PHASE 7 — Calcul des crédits (déclenché automatiquement)
──────────────────────────────────────────────────────────
recomputeCreditsAfterGradeChange(studentId, academicYearId)
  → Pour chaque UE :
      moyenne_UE = Σ(note_EC × coeff_EC) / Σ(coeff_EC)
      [si retake] applique scoring policy (replace/best_of)
      si moyenne_UE ≥ 10 ET tous les EC notés → earned
      si EC manquants → inProgress
      sinon → 0
  → Met à jour studentCreditLedgers

PHASE 8 — Promotion
────────────────────
Admin: promotionRules.refreshClassSummaries(classId)
  → Recalcule le snapshot de faits pour tous les étudiants
  → 50+ métriques stockées dans studentPromotionSummaries

Admin: promotionRules.evaluateClass(ruleId, classId)
  → Exécute la règle json-rules-engine sur les faits de chaque étudiant
  → Retourne: éligibles / non éligibles

Admin: promotionRules.applyPromotion(ruleId, classId, targetClassId)
  → Crée enrollments dans la classe cible pour les étudiants éligibles
  → Enregistre l'exécution + résultats par étudiant
  → [MANQUE: Pas de rollback possible]
```

### 6.2 Flux d'inscription

```
Admin: students.create() ou students.admitExternal()
  Transaction:
  → Crée domain_user (profil métier)
  → Crée student (registrationNumber auto-généré)
  → Crée enrollment (statut "active") dans la classe
  → Crée studentCreditLedger pour l'année
  → [si transfert] addTransferCredits() au ledger

Admin: studentCourseEnrollments.autoEnrollClass(classId)
  → Trouve tous les étudiants actifs de la classe
  → Trouve tous les class-courses de la classe
  → Inscrit chaque étudiant à chaque cours
  → Ignore les doublons (continue sur conflit)
  → Génère avertissements prérequis (non bloquants)

[MANQUE: enrollmentWindows jamais vérifiées lors de l'inscription]
[MANQUE: Prérequis jamais bloquants]
```

---

## 7. Incohérences et problèmes identifiés

### 7.1 Incohérences de schéma DB

| # | Problème | Localisation | Impact |
|---|----------|-------------|--------|
| 1 | `exams.parentExamId` — FK sans règle ON DELETE définie | `app-schema.ts` | Retakes orphelins si parent supprimé |
| 2 | `batchJobs.parentJobId` et `rollbackJobId` — pas de contraintes FK | `app-schema.ts` | Intégrité référentielle non garantie |
| 3 | `enrollmentWindows` — pas de colonne `createdAt` | `app-schema.ts` | Impossible de tracer la création |
| 4 | `exportTemplates.createdBy / updatedBy` — ON DELETE no action | `app-schema.ts` | Impossible de supprimer un utilisateur auteur |
| 5 | `grades.score` — numeric(5,2) sans CHECK constraint | `app-schema.ts` | Valeurs impossibles acceptées (9999.99) |
| 6 | `gradeEditLogs.scoreBefore/After` — idem | `app-schema.ts` | Même problème |
| 7 | `domain_users.primaryEmail` — contrainte unique SUPPRIMÉE en migration 0001 | migration | Emails dupliqués possibles |
| 8 | Contrainte `uq_domain_users_email` supprimée mais `user.email` reste unique | migration | Désynchronisation email |
| 9 | `teachingUnits.semester` ET `classCourses.semesterId` — deux niveaux de contrôle du semestre | schéma | Conflits possibles si les deux sont définis différemment |
| 10 | `studentPromotionSummaries.facts` — JSONB sans structure documentée | schéma | Requêtes potentiellement cassées |

### 7.2 Incohérences entre modules

| # | Problème | Modules concernés |
|---|----------|------------------|
| 1 | Note de passage définie 3× : `student-credit-ledger`, `student-facts.service`, `exams.service` | grades, exams, credit-ledger |
| 2 | `RETAKE_ATTEMPT_LIMIT = 2` dans exams mais `studentCourseEnrollments` n'incrémente pas automatiquement | exams, student-course-enrollments |
| 3 | Le calcul de transcript dans `grades.service` et le calcul dans `student-facts.service` utilisent la même formule — si l'une diverge, les données sont incohérentes | grades, promotion-rules |
| 4 | Les crédits de transfert sont stockés dans `enrollments.transferCredits` ET dans `studentCreditLedgers` — double bookkeeping | enrollments, credit-ledger |
| 5 | `workflows.validateGrades` appelle `examsService` mais il n'existe pas de table `workflows` | workflows, exams |
| 6 | Les `enrollmentWindows` sont gérées dans `workflows` mais leur vérification est absente de `enrollments` et `student-course-enrollments` | workflows, enrollments |
| 7 | `cycleLevel.delete` utilise `superAdminProcedure` mais `create/update` utilisent `adminProcedure` — asymétrie | cycle-levels |
| 8 | `gradingProcedure` pour `grades.upsertNote` mais `tenantProtectedProcedure` aussi utilisé — manque de cohérence | grades |

### 7.3 Incohérences de contrôle d'accès

| # | Problème |
|---|----------|
| 1 | `cycleLevels` n'utilise pas le contexte tenant — pas d'isolation par institution |
| 2 | `users.list` est une liste globale sans filtre institution |
| 3 | `studentCourseEnrollments` utilise `adminProcedure` (non-tenant) mais le service utilise quand même un institutionId |
| 4 | `examGradeEditors.assign/revoke` utilisent `tenantGradingProcedure` — un teacher pourrait déléguer à n'importe qui |
| 5 | `exportTemplates` vérifie `ctx.permissions.canManageCatalog` manuellement dans chaque procédure — devrait être une procédure dédiée |
| 6 | Les modifications de notes admin ne sont pas loggées dans `gradeEditLogs` (seulement les délégués) |

### 7.4 Incohérences frontend / backend

| # | Problème |
|---|----------|
| 1 | Route `/admin/student-promotion` pointe vers `StudentManagement` (component réutilisé incorrectement) |
| 2 | `staff` rôle mappé vers `/staff` dans Redirector mais route inexistante → crash navigateur |
| 3 | Les fichiers `teacher/ProgramManagement.tsx`, `teacher/ClassCourseManagement.tsx`, `teacher/CourseManagement.tsx`, `teacher/StudentManagement.tsx` existent mais ne sont dans aucune route |
| 4 | `grades.importCsv` endpoint backend sans interface frontend |
| 5 | `promotions.listDefaultRules` non utilisé côté client |
| 6 | `studentCreditLedger.list` non utilisé côté client (seul `summary` est appelé) |
| 7 | Permissions dupliquées : stockées dans Zustand ET calculées par le serveur — risque de désynchronisation |
| 8 | `activeOrganizationSlug` (frontend) vs `activeOrganizationId` (backend) — deux référentiels |

---

## 8. Fonctionnalités manquantes

### 8.1 Fonctionnalités critiques absentes

| # | Fonctionnalité | Impact |
|---|----------------|--------|
| 1 | **Table `workflows` inexistante** | Impossible de tracer les approbations de notes, pas de chaîne de validation |
| 2 | **Validation des scores** (plage 0-20 ou 0-100) | Données corrompues acceptées silencieusement |
| 3 | **Enforcement des fenêtres d'inscription** | Les étudiants peuvent s'inscrire à tout moment |
| 4 | **Envoi réel de notifications** | Aucune notification n'atteint jamais les destinataires |
| 5 | **Workflow de rejet d'examen** | Un examen rejeté ne peut jamais être re-soumis |
| 6 | **Suppression en masse des notes d'un examen** | Impossible de corriger une importation erronée |
| 7 | **Routes pour le rôle `staff`** | Les utilisateurs `staff` sont bloqués après connexion |

### 8.2 Fonctionnalités importantes absentes

| # | Fonctionnalité | Impact |
|---|----------------|--------|
| 8 | **Historique / versioning des notes** | Pas d'audit trail complet des modifications |
| 9 | **Enforcement des prérequis** | Étudiants inscrits à des cours sans avoir validé les prérequis |
| 10 | **Rollback d'une exécution de promotion** | Promotions irréversibles |
| 11 | **Versioning des règles de promotion** | Modifier une règle corrompt l'historique rétroactivement |
| 12 | **Détection de conflits d'horaires** | Deux examens peuvent être planifiés au même moment |
| 13 | **Audit trail global** | Seuls les délégués sont loggés — admin/teacher non tracés |
| 14 | **Diplôme / graduation audit** | Pas de flag "éligible à l'obtention du diplôme" |
| 15 | **Configuration institutionnelle** | Note de passage, crédits requis, limite tentatives — tous codés en dur |

### 8.3 Fonctionnalités backend sans UI frontend

| Endpoint backend | Statut frontend |
|-----------------|----------------|
| `grades.importCsv` | Pas d'interface |
| `examGradeEditors.assign/revoke` | Pas de page dédiée |
| `gradeEditLogs` | Pas consultable en UI |
| `classCourseAccessLogs` | Pas consultable en UI |
| `registrationNumbers.getById` | Pas de détail accessible |
| `promotions.listDefaultRules` | Jamais appelé |
| `studentCreditLedger.list` | Jamais appelé |
| `enrollments.delete` | Appelé mais sans page explicite |

---

## 9. Problèmes de sécurité et d'accès

### 9.1 Isolation multi-tenant

| # | Problème | Sévérité |
|---|----------|---------|
| 1 | `cycleLevels` sans contexte institution → data leak cross-tenant possible | CRITIQUE |
| 2 | `users.list` liste tous les utilisateurs sans filtre institution | ÉLEVÉE |
| 3 | `studentCourseEnrollments` utilise `adminProcedure` (non-tenant) | MOYENNE |
| 4 | Aucun test de sécurité multi-tenant dans la suite de tests | ÉLEVÉE |

### 9.2 Contrôle d'accès

| # | Problème |
|---|----------|
| 1 | `examGradeEditors.assign` accessible via `gradingProcedure` — un teacher peut déléguer sans supervision admin |
| 2 | `grades.upsertNote` utilise `tenantProtectedProcedure` — pas de vérification de rôle spécifique au niveau procédure |
| 3 | Les vérifications `ctx.permissions.canManageCatalog` dans `exportTemplates` sont manuelles — risque d'oubli |
| 4 | Les logs de modifications de notes ne couvrent pas les admins et teachers — uniquement les délégués |

### 9.3 Validation des données

| # | Problème |
|---|----------|
| 1 | Scores non validés (0-20 ? 0-100 ?) |
| 2 | Pas de validation de la date d'examen par rapport à l'année académique |
| 3 | Crédits de transfert sans borne (valeur quelconque) |
| 4 | `scopeKey` des compteurs de numéro de matricule — format libre, pas validé |

---

## 10. Problèmes de qualité du code

### 10.1 Code dupliqué

| Duplication | Localisation |
|-------------|-------------|
| Logique retake refresh + credit recompute dans `upsertNote`, `updateNote`, `deleteNote` (3× identique) | `grades.service.ts` |
| `DEFAULT_PASSING_GRADE = 10` défini en 3 modules distincts | `grades.service`, `exams.service`, `student-facts.service` |
| Formule de calcul de moyenne pondérée présente dans `grades.service` ET `student-facts.service` | Risque de divergence |

### 10.2 Artefacts de debug

- `console.log("[DEBUG preview]...")` dans `exam-scheduler.service.ts` — non supprimé

### 10.3 Gestion des erreurs non standardisée

| Problème |
|---------|
| Certains modules utilisent `notFound()` helper, d'autres `new TRPCError({ code: "NOT_FOUND" })` |
| Certains catchent les `BAD_REQUEST` et les comptent comme conflits (exam-scheduler) |
| Pas de format de réponse d'erreur standardisé |
| Pas de request ID / correlation ID pour tracer une opération |

### 10.4 Patterns incohérents

| Problème |
|---------|
| Certains modules utilisent les variantes `tenant*` des procédures, d'autres non |
| Validation scindée entre router (Zod) et service (règles métier) — pas de couche unique |
| Transactions : exam creation en transaction, mais grade CSV import non |
| Soft delete absent — toutes les suppressions sont définitives |

---

## 11. Données de seed

### 11.1 Ce qui est seedé

| Fichier | Contenu |
|---------|---------|
| `00-foundation.yaml` | 1 institution (INSES), 7 cycles, 13 niveaux, 2 semestres, 2 années académiques, 1 format de matricule |
| `10-academics.yaml` | 33 programmes, 4 UE, 6 cours, 3 classes, 5 class-courses, 2 examens, 2 fenêtres d'inscription |
| `20-users.yaml` | 1 admin, 5 enseignants, 2 étudiants, inscriptions |
| `30-external-students.yaml` | 2 étudiants (transfert + admission directe) |

### 11.2 Ce qui N'est pas seedé

| Entité | Conséquence |
|--------|-------------|
| Notes (grades) | Examens en statut "draft" seulement |
| Règles de promotion | Module promotion inutilisable sans règles |
| Snapshots de promotion | Évaluation impossible |
| Notifications | File vide |
| Batch jobs | Aucun historique |
| Templates d'export | Export impossible sans template par défaut |
| Journal de modifications de notes | Audit trail vide |
| Prérequis de cours | Logique prérequis non testable |
| Dérogations de rattrapage | Feature non testable |

### 11.3 Couverture de tests

Les tests (`*.caller.test.ts`) couvrent les flux principaux mais :
- Aucun test de sécurité multi-tenant (cross-tenant data access)
- Aucun test des cas limites (score négatif, >20, division par zéro dans les coefficients)
- Aucun test du workflow de rattrapage complet
- Aucun test de l'atomicité des imports CSV
- Aucun test des transitions d'état invalides

---

## 12. Synthèse par priorité

### Critique — Bloquant pour la production

| # | Problème |
|---|----------|
| 1 | Rôle `staff` sans routes frontend → blocage après connexion |
| 2 | Table `workflows` inexistante → routeur sans persistance |
| 3 | Aucune validation de la plage des scores |
| 4 | `cycleLevels` sans isolation tenant → fuite de données potentielle |
| 5 | Notifications jamais envoyées (pas d'intégration SMTP) |
| 6 | `exams.parentExamId` sans règle ON DELETE |

### Élevé — Fonctionnalités incomplètes

| # | Problème |
|---|----------|
| 7 | Fenêtres d'inscription (enrollmentWindows) jamais vérifiées lors des inscriptions |
| 8 | Examen rejeté ne peut pas être re-soumis |
| 9 | Prérequis non bloquants |
| 10 | Import CSV de notes sans atomicité |
| 11 | Constantes métier codées en dur (note de passage, crédits requis, limite tentatives) |
| 12 | Pas d'audit trail pour les actions admin/teacher sur les notes |

### Moyen — Incohérences et manques notables

| # | Problème |
|---|----------|
| 13 | Règles de promotion non versionnées |
| 14 | Logique retake/credit dupliquée 3× dans grades.service |
| 15 | Permissions dupliquées client/serveur (Zustand + serveur) |
| 16 | `users.list` sans filtre institution |
| 17 | Pas de rollback des exécutions de promotion |
| 18 | FK manquantes sur batchJobs.parentJobId/rollbackJobId |
| 19 | Race condition potentielle sur recompute crédits |
| 20 | `console.log` de debug non supprimés |

### Bas — Améliorations et nettoyage

| # | Problème |
|---|----------|
| 21 | Soft delete absent — suppressions définitives partout |
| 22 | Pas de cache institution lookup dans le contexte |
| 23 | Gestion des erreurs non standardisée entre modules |
| 24 | Pas de request ID / correlation ID |
| 25 | Pas de planification automatique des promotions |
| 26 | Expiration de délégation absente |
| 27 | Pages teacher sans routes (ProgramManagement, ClassCourseManagement, etc.) |
| 28 | `enrollmentWindows` sans `createdAt` |
| 29 | Templates d'export : createdBy/updatedBy avec ON DELETE no action |
| 30 | `compensation_threshold = 8` défini mais jamais utilisé dans les règles |

---

*Document généré par analyse statique complète du code source — aucune correction effectuée.*
