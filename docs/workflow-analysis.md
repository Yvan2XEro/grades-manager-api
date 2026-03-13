# Analyse Complète du Workflow — Grades Manager API

> Généré le 2026-02-20 — analyse post-merge (frontend-redesign ← organization-structure).
> Ce document recense l'état réel du code sans y apporter de modifications.

---

## Table des matières

1. [Architecture globale](#1-architecture-globale)
2. [Ce qui est en place](#2-ce-qui-est-en-place)
3. [Workflows métier analysés bout en bout](#3-workflows-métier-analysés-bout-en-bout)
4. [Désynchronisation Frontend ↔ Backend](#4-désynchronisation-frontend--backend)
5. [Incohérences dans le code existant](#5-incohérences-dans-le-code-existant)
6. [Manquements fonctionnels](#6-manquements-fonctionnels)
7. [Problèmes de sécurité et d'autorisation](#7-problèmes-de-sécurité-et-dautorisation)
8. [Problèmes de schéma de base de données](#8-problèmes-de-schéma-de-base-de-données)
9. [Problèmes de performance](#9-problèmes-de-performance)
10. [Code incomplet ou temporaire](#10-code-incomplet-ou-temporaire)
11. [Dette technique](#11-dette-technique)
12. [Synthèse et priorités](#12-synthèse-et-priorités)

---

## 1. Architecture globale

### Stack technique

| Couche              | Technologie                                              |
| ------------------- | -------------------------------------------------------- |
| Backend runtime     | Bun                                                      |
| Framework HTTP      | Hono                                                     |
| API                 | tRPC (end-to-end type-safety)                            |
| ORM                 | Drizzle ORM                                              |
| Base de données     | PostgreSQL                                               |
| Authentification    | Better-Auth (email/password + organisations)             |
| Multi-tenant        | Organisations Better-Auth + table `institutions`         |
| Frontend            | React 19 + Vite + TailwindCSS v4 + shadcn/ui             |
| State global        | Zustand (avec persist en localStorage)                   |
| i18n                | i18next (en, fr)                                         |
| Tests backend       | Bun test                                                 |
| Tests frontend      | Vitest + Cypress                                         |
| Background jobs     | setInterval (2 jobs) + batch-jobs framework (DB-tracked) |
| Export              | Handlebars templates → HTML/PDF                          |
| Règles de promotion | json-rules-engine                                        |

### Hiérarchie des rôles

```
owner > super_admin > administrator > dean > teacher > staff > student
```

Chaque rôle hérite des permissions du rôle inférieur.

**Permissions calculées :**

- `canManageCatalog` : administrator, dean, super_admin, owner
- `canManageStudents` : administrator, dean, super_admin, owner
- `canGrade` : teacher, administrator, dean, super_admin, owner
- `canAccessAnalytics` : administrator, dean, super_admin, owner

### Types de procédures tRPC (backend)

| Procédure                   | Prérequis                       |
| --------------------------- | ------------------------------- |
| `publicProcedure`           | Aucun                           |
| `protectedProcedure`        | Session valide                  |
| `adminProcedure`            | Session + ADMIN_ROLES           |
| `superAdminProcedure`       | Session + SUPER_ADMIN_ROLES     |
| `gradingProcedure`          | Session + canGrade              |
| `tenantProcedure`           | Institution en contexte         |
| `tenantProtectedProcedure`  | Institution + session           |
| `tenantAdminProcedure`      | Institution + ADMIN_ROLES       |
| `tenantSuperAdminProcedure` | Institution + SUPER_ADMIN_ROLES |
| `tenantGradingProcedure`    | Institution + canGrade          |

---

## 2. Ce qui est en place

### Modules backend (30 routers enregistrés dans `routers/index.ts`)

| Module                       | Procédures                                                                                                                                                                                | État                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `academic-years`             | create, update, delete, setActive, list, getById                                                                                                                                          | ✅                                                         |
| `classes`                    | create, update, delete, list, getById, transferStudent, search                                                                                                                            | ✅                                                         |
| `class-courses`              | create, update, delete, list, getById, roster, search                                                                                                                                     | ✅                                                         |
| `courses`                    | create, update, delete, list, getById, search, assignDefaultTeacher                                                                                                                       | ✅                                                         |
| `cycle-levels`               | create, update, delete, list, getById, getByCode, search                                                                                                                                  | 🔴 MODULE COMPLET MAIS NON EXPORTÉ dans `routers/index.ts` |
| `enrollments`                | create, update, updateStatus, list, getById                                                                                                                                               | ⚠️ pas de delete                                           |
| `exam-grade-editors`         | list, assign, revoke                                                                                                                                                                      | ✅                                                         |
| `exam-scheduler`             | preview, schedule, history, details, previewRetakes, scheduleRetakes                                                                                                                      | ✅                                                         |
| `exam-types`                 | create, update, delete, list, getById                                                                                                                                                     | ✅                                                         |
| `exams`                      | create, update, delete, submit, validate, lock, list, getById, listRetakeEligibility, upsertRetakeOverride, deleteRetakeOverride, createRetake                                            | ✅ (retakes feature-flagged)                               |
| `exports`                    | generatePV, previewPV, generateEvaluation, previewEvaluation, generateUE, previewUE, previewTemplate, getConfig, getPVData                                                                | ✅                                                         |
| `export-templates`           | list, getById, getDefault, create, update, delete, setDefault                                                                                                                             | ✅                                                         |
| `files`                      | upload, delete                                                                                                                                                                            | ✅                                                         |
| `grades`                     | upsertNote, updateNote, deleteNote, importCsv, exportClassCourseCsv, listByExam, listByStudent, listByClassCourse, avgForExam, avgForCourse, avgForStudentInCourse, consolidatedByStudent | ⚠️ auth voir §7                                            |
| `institutions`               | get, list, upsert                                                                                                                                                                         | ⚠️ isolation voir §7                                       |
| `notifications`              | queue, list, flush, acknowledge                                                                                                                                                           | ⚠️ pas d'envoi réel                                        |
| `program-options`            | create, update, delete, list, search, getById                                                                                                                                             | ✅                                                         |
| `programs`                   | create, update, delete, list, getById, search                                                                                                                                             | ✅                                                         |
| `promotion-rules`            | create, update, delete, list, getById, refreshClassSummaries, evaluateClass, applyPromotion, listExecutions, getExecutionDetails                                                          | ⚠️ règles BDD non utilisées                                |
| `promotions`                 | evaluateStudent, listDefaultRules                                                                                                                                                         | 🔴 auth voir §7                                            |
| `registration-numbers`       | list, getActive, create, update, delete, preview                                                                                                                                          | ✅                                                         |
| `semesters`                  | list                                                                                                                                                                                      | ⚠️ global, pas par institution                             |
| `student-course-enrollments` | create, bulkEnroll, updateStatus, autoEnrollClass, closeForStudent, getById, list                                                                                                         | ✅                                                         |
| `student-credit-ledger`      | summary, list                                                                                                                                                                             | ✅                                                         |
| `students`                   | create, admitExternal, update, bulkCreate, list, getById                                                                                                                                  | ✅                                                         |
| `study-cycles`               | createCycle, updateCycle, deleteCycle, listCycles, getCycle, createLevel, updateLevel, deleteLevel, listLevels, getLevel                                                                  | ✅                                                         |
| `teaching-units`             | create, update, delete, getById, list                                                                                                                                                     | ✅                                                         |
| `users`                      | list, createProfile, updateProfile, deleteProfile                                                                                                                                         | ⚠️ manques voir §4                                         |
| `workflows`                  | validateGrades, enrollmentWindow, enrollmentWindows, attendanceAlert                                                                                                                      | ⚠️ voir §7                                                 |
| `batch-jobs`                 | preview, run, cancel, rollback, get, list                                                                                                                                                 | ✅ bien conçu                                              |

### Pages frontend routées (dans `App.tsx`)

**Admin (`/admin/*`) :**

- `/admin` → Dashboard
- `/admin/courses`, `/admin/academic-years`, `/admin/classes`, `/admin/class-courses`
- `/admin/students`, `/admin/users`
- `/admin/exams`, `/admin/retake-eligibility`, `/admin/exam-types`, `/admin/exam-scheduler`
- `/admin/export-templates`, `/admin/export-templates/:templateId`
- `/admin/student-promotion` → **StudentManagement** (même page que `/admin/students`)
- `/admin/rules`, `/admin/registration-numbers`, `/admin/registration-numbers/:formatId`
- `/admin/institution`, `/admin/programs` → **`teacher/ProgramManagement.tsx`** (page enseignant dans route admin)
- `/admin/study-cycles`, `/admin/grade-export`, `/admin/monitoring`
- `/admin/batch-jobs`, `/admin/batch-jobs/:jobId`
- `/admin/enrollments`, `/admin/teaching-units`, `/admin/teaching-units/:teachingUnitId`
- `/admin/notifications`
- `/admin/promotion-rules`, `/admin/promotion-rules/rules`, `/admin/promotion-rules/evaluate`, `/admin/promotion-rules/execute`, `/admin/promotion-rules/history`

**Dean (`/dean/*`) :**

- `/dean` → MonitoringDashboard (page admin partagée)
- `/dean/workflows` → WorkflowApprovals

**Teacher (`/teacher/*`) :**

- `/teacher` → TeacherDashboard
- `/teacher/courses`, `/teacher/grades`, `/teacher/grades/:courseId`
- `/teacher/attendance`, `/teacher/workflows`

**Student (`/student/*`) :**

- `/student` → PerformanceDashboard

---

## 3. Workflows métier analysés bout en bout

### 3.1 Création d'un étudiant

**Flux attendu :**

1. Admin crée un compte Better-Auth (via UserManagement)
2. Admin crée un profil domaine (`users.createProfile`)
3. Admin crée l'étudiant (`students.create`) → génération du numéro d'immatriculation → création enrollment automatique
4. Auto-inscription aux cours (`studentCourseEnrollments.autoEnrollClass`)
5. Mise à jour du ledger de crédits

**Ce qui fonctionne :**

- Étapes 1-3 dans une transaction (étudiant + domainUser + enrollment créés ensemble)
- Numéro d'immatriculation auto-généré via format actif

**Ce qui manque / est incohérent :**

- L'étape 4 (auto-inscription aux cours) est une action **séparée** qui doit être déclenchée manuellement. Aucun mécanisme ne l'enchaîne automatiquement après la création.
- Les crédits de transfert (étape 5) sont appliqués **en dehors de la transaction** (`applyDelta()` appelé après le `db.transaction()`). Si cette fonction échoue, l'étudiant existe sans crédits de transfert enregistrés.
- L'admission externe (`students.admitExternal`) stocke les données d'admission en double : dans les colonnes `enrollments.admissionType`, `transferCredits`, etc. **ET** dans `enrollments.admissionMetadata` (JSONB). Pas de source de vérité unique.
- Aucune validation que le `registrationFormatId` passé appartient bien à l'institution.

---

### 3.2 Saisie de notes (workflow principal enseignant)

**Flux attendu :**

1. Enseignant sélectionne son class-course
2. Crée un examen (ou l'examen existe déjà via scheduler)
3. Saisit les notes pour chaque étudiant inscrit
4. Soumet l'examen (`exams.submit`)
5. Doyen/Admin valide (`workflows.validateGrades` ou `exams.validate`)
6. Examen verrouillé manuellement (`exams.lock`) ou automatiquement par le job

**Ce qui fonctionne :**

- Machine à états : draft → scheduled → submitted → approved/rejected → locked
- Vérification du pourcentage total (≤ 100%) dans la couche service
- Délégation de saisie à d'autres utilisateurs (`examGradeEditors`)
- Logs d'audit pour les modifications de notes

**Incohérences et manquements :**

- **Tout enseignant avec `canGrade` peut créer des examens pour N'IMPORTE quel class-course** — le service ne valide pas que `classCourse.teacherId === actor.profileId` (voir §7.2).
- **Le job de fermeture automatique** (`closeExpiredApprovedExams`) ne ferme que les examens en statut `approved`. Un examen encore `submitted` après sa date d'échéance **n'est jamais fermé automatiquement** : les notes peuvent être saisies après la date.
- **Statut `rejected` :** un examen rejeté peut être re-soumis sans correction obligatoire. Aucune validation ne force une modification avant re-soumission.
- **`exams.delete` réservé aux admins**, alors que `exams.create` et `exams.update` sont accessibles aux enseignants. Un enseignant qui crée un examen par erreur ne peut pas le supprimer lui-même.
- **Validation du pourcentage :** la somme des pourcentages est vérifiée dans le service (transaction DB), mais il n'y a **pas de CHECK constraint en base**. Deux requêtes concurrentes peuvent chacune passer la validation et créer un total > 100%.

---

### 3.3 Workflow de rattrapage (retakes) — nouveau depuis le merge

**Flux attendu :**

1. Examen principal approuvé
2. Admin liste les étudiants éligibles (`exams.listRetakeEligibility`)
3. Admin peut forcer l'éligibilité/inéligibilité d'un étudiant (`exams.upsertRetakeOverride`)
4. Admin crée l'examen de rattrapage (`exams.createRetake`)
5. Enseignant saisit les notes du rattrapage
6. Le système recalcule la note finale selon la `scoringPolicy` (replace ou best_of)

**Ce qui fonctionne :**

- Système complet de feature flag (`RETAKES_FEATURE_FLAG`)
- Éligibilité calculée : note < seuil de passage OU statut failed OU pas de note
- Overrides par étudiant (force_eligible / force_ineligible)
- Une seule tentative de rattrapage par examen parent
- Recalcul automatique des crédits après saisie de note de rattrapage

**Incohérences et manquements :**

- **Seuil de passage = 10 hardcodé** (`exams.service.ts` ligne ~271, commentaire `TODO(INST-SETTINGS)`). Non configurable par institution.
- **Limite de tentatives = 2 hardcodée** (même fichier ligne ~272). Non configurable.
- **Pas de validation que la date du rattrapage est postérieure à l'examen parent.** Un rattrapage peut être créé avec une date antérieure.
- **Planification en masse des rattrapages** (`examScheduler.previewRetakes`, `examScheduler.scheduleRetakes`) existe dans le backend, mais **n'est pas dans le sidebar de navigation**. La fonctionnalité est accessible via `ExamScheduler.tsx` mais sans lien direct.
- **Aucun audit trail des overrides** : `retakeOverrides` est upserted (écrase) sans historique des changements d'avis.
- **La politique de scoring** (`scoringPolicy: replace | best_of`) est appliquée dans `student-facts.service.ts` et non dans `grades.service.ts`. Le découplage crée un risque de désynchronisation si l'un est modifié sans l'autre.
- **`RetakeEligibility.tsx`** (admin) n'est **pas dans le sidebar**. La route `/admin/retake-eligibility` existe dans `App.tsx` mais aucun lien dans la navigation ne permet d'y accéder.

---

### 3.4 Workflow de promotion

**Flux attendu :**

1. Admin configure des règles de promotion (`promotionRules`)
2. Admin lance l'évaluation de la classe (`promotionRules.evaluateClass`)
3. Le moteur évalue chaque étudiant selon les règles
4. Admin applique la promotion (`promotionRules.applyPromotion`)
5. Les étudiants promus passent à la classe/niveau suivant

**Ce qui fonctionne :**

- Infrastructure complète : tables `promotionRules`, `promotionExecutions`, `promotionExecutionResults`, `studentPromotionSummaries`
- CRUD des règles via API
- Évaluation par classe avec résultats stockés

**Incohérences critiques :**

- Les règles stockées en base (`promotionRules.ruleset` en JSONB) **ne sont jamais chargées dans le moteur de règles**. L'évaluation utilise les règles hardcodées dans `rules-engine/default-rules.ts`.
- **Deux systèmes d'évaluation indépendants et incompatibles :**
  - `promotions.evaluateStudent` (portail étudiant) → appelle un service différent, sans contexte institution
  - `promotionRules.evaluateClass` (admin) → appelle le moteur de règles via le module promotion-rules
  - Résultats potentiellement contradictoires pour le même étudiant.
- `promotionRules.applyPromotion` génère un `PromotionExecution` avec résultats, mais **ne déplace pas réellement les étudiants** dans une nouvelle classe. La table `promotionExecutionResults` stocke `wasPromoted=true` mais l'étudiant reste dans la même classe (pas de mise à jour de `students.classId`).
- La page frontend affiche un avertissement : _"Les surcharges de règles ne sont pas encore persistées"_ — confirme que la personnalisation des règles est une UI sans effet réel.

---

### 3.5 Workflow d'inscription aux cours

**Flux attendu :**

1. Admin ouvre une fenêtre d'inscription (`workflows.enrollmentWindow`)
2. Étudiants (ou admin) s'inscrivent aux cours
3. Admin ferme la fenêtre
4. Inscriptions enregistrées dans `studentCourseEnrollments`

**Ce qui fonctionne :**

- Gestion des fenêtres d'inscription (open/close) via workflows
- Auto-inscription en masse (`studentCourseEnrollments.autoEnrollClass`)
- Inscriptions individuelles

**Manquements :**

- **Aucun portail d'auto-inscription étudiant.** Seul l'admin peut inscrire. Les étudiants n'ont pas accès à cette fonctionnalité depuis leur portail.
- **La fenêtre d'inscription n'est pas vérifiée** avant d'inscrire un étudiant. On peut appeler `autoEnrollClass` même si la fenêtre est fermée.
- **La fenêtre n'est pas validée** par rapport aux dates de l'année académique (peut être ouverte hors période).
- **Le changement de statut d'une inscription** (`studentCourseEnrollments.updateStatus`) ne met **pas à jour** le ledger de crédits (`student-credit-ledger`). Les deux sont totalement décorrélés.

---

### 3.6 Workflow de notification

**Ce qui existe :**

- Table `notifications` avec channel (email/webhook), type, payload, status (pending/sent/failed)
- Job `sendPending()` toutes les minutes

**Problème critique :**
La fonction `sendPending()` dans `notifications.service.ts` **marque immédiatement les notifications comme `sent` sans les envoyer**. Il n'y a aucun appel à un fournisseur email (SMTP, SendGrid, Resend, etc.) ni à un webhook. Les notifications sont créées, "envoyées" (statut = sent), mais personne ne les reçoit jamais.

---

### 3.7 Workflow des exports (PV, évaluations)

**Ce qui fonctionne :**

- Templates Handlebars configurables par institution
- Génération PV (`generatePV`), évaluations (`generateEvaluation`), UE (`generateUE`)
- Données structurées disponibles (`getPVData`)
- Prévisualisation HTML avant génération PDF

**Manquements :**

- **Aucun log d'export** : on ne sait pas qui a exporté quoi et quand.
- `exports.generatePV` utilise `gradingProcedure` (non tenant) — un enseignant peut générer le PV d'un class-course qui n'est pas le sien si l'id lui est connu.

---

### 3.8 Workflow de batch jobs

**Ce qui fonctionne :**

- Framework complet : preview → run → cancel / rollback
- Deux types de jobs enregistrés : `creditLedger.recompute`, `studentFacts.refreshClass`
- Scope lock (1 seul job actif par type/institution)
- Heartbeat + détection des jobs bloqués (stale > 10 min)
- Logs par step
- UI dédiée (`/admin/batch-jobs`)

**Manquements :**

- **`/admin/batch-jobs` n'est pas dans le sidebar.** La route existe mais aucun lien de navigation ne permet d'y accéder.
- Seulement 2 types de jobs disponibles. Des candidats naturels manquent : `promotions.execute` (promotion en masse), `grades.import` (import en masse), `notifications.send` (envoi réel).
- **Timeout de heartbeat fixe à 10 minutes** pour tous les jobs. Aucun moyen d'ajuster par job type.
- Si une étape prend > 10 minutes sans appeler `reportStepProgress`, le job est marqué `stale` sans possibilité de récupération.

---

## 4. Désynchronisation Frontend ↔ Backend

### 4.1 Procédures appelées depuis le frontend qui n'existent PAS côté backend

| Appel frontend         | Fichier                        | Procédure backend attendue                                                                                       |
| ---------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `enrollments.delete`   | `EnrollmentManagement.tsx:224` | ❌ Le router enrollments n'a pas de procédure `delete`                                                           |
| `cycleLevels.search`   | `ClassManagement.tsx:284`      | ❌ Le router `cycle-levels` existe mais n'est **pas enregistré** dans `appRouter` (absent de `routers/index.ts`) |
| `cycleLevels.*` (tous) | `ClassManagement.tsx`          | ❌ Toute opération sur `cycleLevels` échouera avec "procedure not found"                                         |

**Note :** Les anciens problèmes identifiés avant le merge (`users.ban`, `grades.upsertMultiple`, `examGradeEditors.add/remove`, `students.import`) ont été résolus dans le merge `organization-structure`. Les noms sont maintenant corrects (`examGradeEditors.assign/revoke`, `students.bulkCreate`, etc.).

### 4.2 Pages fichier existantes mais NON routées dans `App.tsx`

| Fichier                                                | Statut          |
| ------------------------------------------------------ | --------------- |
| `apps/web/src/pages/teacher/ClassCourseManagement.tsx` | ❌ Pas de route |
| `apps/web/src/pages/teacher/CourseManagement.tsx`      | ❌ Pas de route |
| `apps/web/src/pages/teacher/ExamManagement.tsx`        | ❌ Pas de route |
| `apps/web/src/pages/teacher/GradeExport.tsx`           | ❌ Pas de route |
| `apps/web/src/pages/teacher/StudentManagement.tsx`     | ❌ Pas de route |

Ces 5 pages sont du code mort ou des fonctionnalités prévues mais non intégrées.

### 4.3 Routes existantes avec des problèmes de composant

| Route                      | Composant utilisé               | Problème                                                |
| -------------------------- | ------------------------------- | ------------------------------------------------------- |
| `/admin/programs`          | `teacher/ProgramManagement.tsx` | Une page enseignant sert de page admin                  |
| `/admin/student-promotion` | `StudentManagement.tsx`         | Même composant que `/admin/students` — doublon de route |
| `/dean` (index)            | `MonitoringDashboard.tsx`       | Page admin partagée, sans tableau de bord doyen dédié   |

### 4.4 Fonctionnalités accessibles via route mais absentes du sidebar

| Route                       | Fonctionnalité              | Dans sidebar ? | Dans breadcrumbs ?                                                |
| --------------------------- | --------------------------- | -------------- | ----------------------------------------------------------------- |
| `/admin/retake-eligibility` | Éligibilité aux rattrapages | ❌ Non         | ✅ Oui (`retake-eligibility`)                                     |
| `/admin/batch-jobs`         | Tableau de bord des jobs    | ❌ Non         | ❌ Non — `batch-jobs` absent de `useBreadcrumbs.ts:segmentLabels` |
| `/admin/batch-jobs/:jobId`  | Détail d'un job             | ❌ Non         | ❌ Non                                                            |

Ces pages sont inaccessibles pour les utilisateurs normaux (aucun lien vers elles). Pour `/admin/batch-jobs`, même en tapant l'URL directement, le fil d'Ariane affichera `batch-jobs` tel quel au lieu d'un label traduit.

### 4.5 Procédures backend existantes mais jamais appelées depuis le frontend

| Procédure backend               | Module                | Observation                                                     |
| ------------------------------- | --------------------- | --------------------------------------------------------------- |
| `studentCreditLedger.list`      | student-credit-ledger | Existe mais non utilisée dans aucune page                       |
| `promotions.listDefaultRules`   | promotions            | Existe mais non utilisée                                        |
| `exports.previewTemplate`       | exports               | Existe mais non utilisée dans l'UI principale                   |
| `students.admitExternal`        | students              | Appelée depuis frontend, mais distinctions avec `create` floues |
| `registrationNumbers.getActive` | registration-numbers  | Jamais appelée depuis l'UI                                      |

### 4.6 Sidebar : items présents mais sans logique de rôle

Le sidebar affiche `/admin/programs` avec `teacher/ProgramManagement.tsx`. La page enseignant contient un composant `BulkActionBar` avec suppression en masse de programmes. Les enseignants **ne devraient pas** avoir accès à la gestion du catalogue.

### 4.7 Redirection post-inscription hardcodée

`Register.tsx` redirige systématiquement vers `/teacher` après un signup réussi, quel que soit le rôle réel de l'utilisateur. Si un admin se crée un compte, il atterrit sur le portail enseignant.

---

## 5. Incohérences dans le code existant

### 5.1 Rôles Better-Auth vs rôles domaine

Better-Auth est configuré avec `adminRoles = ["admin"]` (`lib/auth.ts:21`). Le système métier utilise 7 rôles (`super_admin`, `administrator`, `dean`, `teacher`, `staff`, `student`, `owner`). Il n'y a **aucun mapping explicite** documenté entre le rôle Better-Auth `admin` et les rôles domaine. L'autorisation réelle repose sur `businessRole` du profil domaine, pas sur le rôle Better-Auth.

### 5.2 Le module `faculties` n'existe pas

La documentation (`CLAUDE.md`, plusieurs fichiers dans `/docs/`) mentionne des "faculties" dans la hiérarchie académique. Il n'existe **aucun module `faculties`** dans `apps/server/src/modules/`. La hiérarchie réelle est : `institutions → programs → studyCycles → cycleLevels → classes`.

### 5.3 Machine à états des examens — état `cancelled` manquant

La machine à états est : `draft → scheduled → submitted → approved / rejected → locked`.

Il n'existe pas d'état `cancelled`. Un examen mal créé ne peut être annulé proprement que par suppression (admin uniquement), qui supprime toutes les notes associées en cascade. Pas de mécanisme "annuler sans supprimer".

### 5.4 `enrollments.exitedAt` mis à jour pour TOUT changement de statut

Dans `enrollments.service.ts`, `updateStatus()` set `exitedAt: new Date()` pour **tout** changement de statut, y compris passer à `active`. `exitedAt` devrait uniquement être set pour les statuts terminaux (`completed`, `withdrawn`). C'est un bug logique : une inscription active a une date de sortie.

### 5.5 Champ `attempt` dans `studentCourseEnrollments` jamais incrémenté

Le champ `attempt` (integer, default 1) est prévu pour les redoublements. Les services `bulkCreateStudents`, `autoEnrollClass`, et `createEnrollment` ne l'incrémentent jamais. La valeur reste toujours à 1 même lors d'une réinscription après échec.

### 5.6 Statut `planned` traité comme `active` dans les calculs

Le statut par défaut d'une `studentCourseEnrollment` est `planned`. Aucune logique de transition de `planned → active` n'est implémentée. Les rapports et calculs de moyennes ne filtrent pas sur ce statut : un cours `planned` (pas encore commencé) apparaît dans les relevés de notes avec une note vide et est pris en compte dans les calculs.

### 5.7 Deux pages admin pour les promotions étudiantes

- `/admin/student-promotion` → `StudentManagement.tsx` (gestion des étudiants)
- `/admin/promotion-rules` → PromotionRules pages

La route `/admin/student-promotion` charge `StudentManagement` (même composant que `/admin/students`). Ces deux routes pointent vers le même code mais dans des contextes différents.

### 5.8 Dean sans tableau de bord dédié

Le portail `/dean` (index) charge `MonitoringDashboard`, une page conçue pour l'admin. Le doyen n'a pas de tableau de bord propre adapté à son rôle (validation des examens soumis, vue de sa faculté).

### 5.9 `courses.defaultTeacherId` jamais utilisé dans la logique métier

Le champ `courses.defaultTeacherId` existe en schéma (nullable). Lors de la création d'examens ou l'affectation de cours à une classe, c'est toujours `classCourses.teacherId` qui est utilisé. `defaultTeacherId` n'est **jamais lu** dans la logique métier, créant une confusion sur le flux d'affectation par défaut.

### 5.10 Programmes sans lien direct aux cycles d'études

La table `programs` n'a **pas de FK vers `studyCycles`**. La hiérarchie `program → studyCycle` est implicite via les classes (une classe référence un cycleLevel qui référence un cycle). Si on cherche tous les cycles d'un programme, il faut passer par les classes.

### 5.11 Semesters globaux, non scopés par institution

La table `semesters` n'a pas de colonne `institutionId`. Les semestres sont partagés entre toutes les institutions. Si deux institutions ont des semestres de même nom (ex : "S1"), ils partagent le même enregistrement. Cela peut causer des collisions en environnement multi-tenant.

### 5.12 Logs d'audit des notes incomplets

La table `gradeEditLogs` enregistre les modifications de notes. Mais dans `grades.service.ts`, seules les modifications faites par un **délégué** déclenchent la fonction de log. Les modifications d'un enseignant principal ou d'un admin ne sont **pas loggées**, malgré le fait que le schéma prévoit les rôles `admin`, `teacher`, `delegate`.

### 5.13 Données de crédits de transfert en double

Les crédits de transfert sont stockés dans :

1. `enrollments.transferCredits` (colonnes dédiées)
2. `studentCreditLedgers` via un appel séparé à `addTransferCredits()`

Ces deux appels sont faits séquentiellement mais **pas dans la même transaction**. Si le second échoue, les données divergent.

---

## 6. Manquements fonctionnels

### 6.1 Portail étudiant quasi-vide

Le portail `/student` ne contient qu'une seule page (`PerformanceDashboard`) affichant :

- Barre de progression des crédits
- Badge d'éligibilité à la promotion
- Informations de classe/cycle

**Ce qui manque totalement :**

| Fonctionnalité                                      | Impact                            |
| --------------------------------------------------- | --------------------------------- |
| Relevé de notes (notes par cours, par examen)       | Critique — fonctionnalité de base |
| Calendrier des examens                              | Critique                          |
| Liste des cours inscrits                            | Critique                          |
| Auto-inscription aux cours (fenêtre d'inscription)  | Élevé                             |
| Historique des promotions                           | Moyen                             |
| Téléchargement de documents (attestations, relevés) | Moyen                             |
| Profil personnel (modification de données)          | Moyen                             |
| Notifications reçues                                | Faible                            |

### 6.2 Suppression des entités

Plusieurs entités n'ont pas de route DELETE :

| Entité                    | Procédure delete ?                        | Cascade prévu ?         |
| ------------------------- | ----------------------------------------- | ----------------------- |
| `enrollments`             | ❌ Non                                    | N/A                     |
| `students`                | ❌ Non                                    | RESTRICT sur domainUser |
| Statut de sortie étudiant | Via `enrollments.updateStatus` uniquement | —                       |

Est-ce volontaire (soft-delete sémantique via statut) ou un oubli ? Aucune documentation dans le code ne l'explique.

### 6.3 Prérequis des cours non vérifiés à l'inscription

La table `coursePrerequisites` stocke les dépendances entre cours. Mais `student-course-enrollments.service.ts` n'inclut **aucune vérification** des prérequis lors de l'inscription d'un étudiant à un cours. Un étudiant peut s'inscrire à "Mathématiques III" sans avoir validé "Mathématiques I" et "Mathématiques II".

### 6.4 Alertes d'assiduité sans données d'assiduité

La page `AttendanceAlerts.tsx` (teacher) est présente et permet de déclencher une alerte. Le router `workflows.attendanceAlert` existe. Mais :

- Il n'y a **pas de module de suivi de présence** (pas de table `attendance` dans le schéma)
- L'alerte ne référence aucune donnée réelle de présence
- Elle crée simplement une notification (qui n'est de toute façon pas envoyée, voir §3.6)

### 6.5 Prérequis circulaires possibles en base

La table `coursePrerequisites` a une contrainte unique sur `(courseId, prerequisiteCourseId)` mais **pas de check pour les cycles** : A requiert B, B requiert A est possible. Aucune validation dans les services lors de la création d'un prérequis.

### 6.6 Transfert d'étudiant entre classes incomplet

`classes.transferStudent` déplace un étudiant vers une nouvelle classe. Mais :

- Les inscriptions aux cours (`studentCourseEnrollments`) de l'ancienne classe ne sont **pas migrées** vers la nouvelle.
- Les notes obtenues dans les anciens class-courses restent liées à l'ancienne `classCourseId` et sont invisibles dans le nouveau contexte.

### 6.7 Gestion des capacités de classe absente

Aucune notion de capacité maximale (`max_students`) n'existe dans la table `classes`. Il est impossible de limiter les inscriptions à une classe.

### 6.8 Statut des étudiants inexistant

La table `students` n'a pas de champ `status`. Il est impossible de distinguer un étudiant actif, diplômé, ou exclu sans passer par les enrollments.

### 6.9 Aucune archivage de cours

Il n'y a pas de champ `isActive` ou `archivedAt` sur la table `courses`. Pour retirer un cours du catalogue, la seule option est la suppression (avec tout ce que ça implique en cascade).

---

## 7. Problèmes de sécurité et d'autorisation

### 7.1 [CRITIQUE] Mutations de notes avec procédure trop permissive

**Fichier :** `apps/server/src/modules/grades/grades.router.ts:29-54`

`upsertNote`, `updateNote`, `deleteNote`, `importCsv` utilisent toutes `tenantProtectedProcedure`. N'importe quel utilisateur authentifié membre de l'organisation peut appeler ces endpoints au niveau du router. La vérification réelle (est-ce que l'acteur peut éditer cet examen ?) est faite dans la couche service via `ensureActorCanEditExam()`. Si cette fonction est contournée ou oubliée dans un futur développement, les données sont exposées.

**Procédure correcte attendue :** `tenantGradingProcedure`

### 7.2 [CRITIQUE] Tout enseignant peut créer des examens pour tous les class-courses

**Fichier :** `apps/server/src/modules/exams/exams.service.ts`

`exams.create` utilise `tenantGradingProcedure` (correct). Mais le service ne valide pas que `classCourse.teacherId === ctx.profile.id`. Un enseignant A peut créer et modifier des examens pour les cours d'un enseignant B.

### 7.3 [CRITIQUE] `promotions.evaluateStudent` sans contrôle d'accès

**Fichier :** `apps/server/src/modules/promotions/promotions.router.ts:9`

- Utilise `protectedProcedure` (pas de tenant, pas d'admin)
- Reçoit un `studentId` sans vérification que ce studentId appartient à l'institution du demandeur
- N'importe quel utilisateur authentifié peut interroger l'éligibilité à la promotion de n'importe quel étudiant

### 7.4 [ÉLEVÉ] Alertes d'assiduité : risque DoS

**Fichier :** `apps/server/src/modules/workflows/workflows.router.ts:36-45`

`attendanceAlert` utilise `tenantProtectedProcedure`. N'importe quel utilisateur authentifié peut :

- Déclencher une alerte vers n'importe quel `recipientId`
- Sans limite de débit (pas de rate limiting)
- Sans validation que le `recipientId` appartient à la même institution

### 7.5 [ÉLEVÉ] Exports sans vérification de propriété du class-course

**Fichier :** `apps/server/src/modules/exports/exports.router.ts`

`exports.generatePV`, `exports.generateEvaluation`, `exports.generateUE` utilisent `gradingProcedure` (non-tenant). Un enseignant peut générer le PV d'un class-course qui n'est pas le sien si l'ID lui est connu.

### 7.6 [ÉLEVÉ] Isolation multi-tenant par filtres manuels uniquement

Il n'y a **aucune Row Level Security (RLS)** configurée sur la base PostgreSQL. Chaque repo doit manuellement filtrer par `institutionId`. Un oubli dans un repo expose des données cross-tenant.

Exemple : `exams.repo.ts` → `findById(examId)` retourne un examen sans vérification d'`institutionId`. La validation vient ensuite, mais si elle est omise dans un appel futur, la donnée est exposée.

### 7.7 [MOYEN] Profil domaine non scopé par organisation lors de la création du contexte

`domainUsersRepo.findByAuthUserId()` retourne le **premier** profil domaine trouvé, sans filtrer par `organizationId`. Si un utilisateur est membre de deux organisations, son profil de la mauvaise organisation peut être utilisé.

### 7.8 [MOYEN] `institutions.organizationId` nullable + SET NULL

Si l'organisation Better-Auth est supprimée, l'institution perd sa référence `organizationId`. Toutes les données (étudiants, notes, examens) restent en base mais sont inaccessibles car le contexte tenant ne peut plus être résolu. Données orphelines sans mécanisme de récupération.

### 7.9 [MOYEN] Suppression asymétrique des examens

Créer un examen : `tenantGradingProcedure` (teachers et admins).
Supprimer un examen : `tenantAdminProcedure` (admins uniquement).

Un enseignant qui crée un examen par erreur ne peut pas le supprimer lui-même. Il doit solliciter un admin.

---

## 8. Problèmes de schéma de base de données

### 8.1 Contrainte restrictive `students → domainUsers` (RESTRICT)

Supprimer un profil domaine échoue si l'utilisateur est étudiant. Il faut donc supprimer l'étudiant d'abord, mais `students` n'a pas de procédure delete. Désinscription impossible proprement.

### 8.2 Contrainte restrictive `students → classes` (RESTRICT)

Supprimer une classe échoue si des étudiants y sont encore affectés. Il n'y a pas de procédure "archiver une classe" qui déplacerait les étudiants d'abord.

### 8.3 Pas de contrainte sur la somme des pourcentages d'examens

La règle métier (somme des pourcentages = 100% par class-course) est uniquement vérifiée dans le service. Pas de CHECK constraint en base. Inserts concurrents peuvent dépasser 100%.

### 8.4 Statut `planned` comme défaut dans `studentCourseEnrollments`

La valeur par défaut est `planned` mais il n'y a pas de logique de transition vers `active`. Des inscriptions restent `planned` indéfiniment.

### 8.5 `enrollmentStatuses` sans `suspended`

`domainStatuses` (pour les utilisateurs) inclut `suspended`. `enrollmentStatuses` n'inclut pas ce statut. Il est impossible de suspendre une inscription sans la retirer complètement.

### 8.6 Chaîne de rattrapages non limitée en profondeur

`exams.parentExamId` permet de chaîner des rattrapages. Le service valide qu'un rattrapage ne peut pas être la base d'un autre rattrapage (`sessionType !== "retake"`), mais si cette logique change, des chaînes infinies deviennent possibles. Aucune contrainte en base.

### 8.7 Lock des examens : champ booléen sans métadonnées

`exams.isLocked` est un simple booléen. Pas de `lockedAt`, `lockedBy`, `lockReason`. Impossible de savoir pourquoi et quand un examen a été verrouillé.

### 8.8 Pas de `status` sur les étudiants

La table `students` n'a pas de champ `status`. Pas de distinction entre actif, diplômé, exclu, en congé.

---

## 9. Problèmes de performance

### 9.1 N+1 queries sur le dashboard admin

`Dashboard.tsx` déclenche au chargement :

- 6 requêtes parallèles (institutions, programs, courses, exams, students, academicYears)
- Pour chaque programme avec l'année active : `classes.list(programId)` → N requêtes
- Pour chaque classe : `students.list(classId)` → N×M requêtes

Avec 10 programmes et 5 classes par programme : **50+ requêtes** au chargement.

### 9.2 N+1 queries sur le dashboard enseignant

`teacher/Dashboard.tsx` déclenche pour chaque class-course :

- `classes.getById`, `courses.getById`, `programs.getById`, `students.list`, `exams.list`

Un enseignant avec 5 cours : **25+ requêtes** au chargement.

### 9.3 `semesters.list` sans pagination

La procédure `semesters.list` retourne tous les semestres sans pagination. Chargée dans des selects de formulaires sur plusieurs pages.

### 9.4 Validation du pourcentage d'examens dans une transaction

`assertPercentageLimit()` fait une requête SELECT en transaction pour sommer les pourcentages. Si de nombreux examens sont créés simultanément, cela peut créer des contentions de locks.

### 9.5 Batch jobs exécutés de façon synchrone

Les deux jobs de background (`closeExpiredApprovedExams`, `sendPending`) tournent via `setInterval` simples, sans queue. Si un job plante (exception non catchée), il s'arrête silencieusement. Pas de retry, pas d'alerting, pas de monitoring.

### 9.6 Recalcul synchrone après chaque note

Après chaque `upsertNote`, `updateNote`, `deleteNote` : appel synchrone à `recomputeCreditsAfterGradeChange()`. Si un import CSV de 100 étudiants déclenche 100 recalculs synchrones, c'est une opération lourde en ligne.

---

## 10. Code incomplet ou temporaire

### 10.1 Console.log de debug en production

**Fichier :** `apps/server/src/modules/exam-scheduler/exam-scheduler.service.ts` (lignes ~44, ~50)

```typescript
console.log("[DEBUG preview] input:", input, "institutionId:", institutionId);
console.log("[DEBUG preview] Found classes:", classes.length);
```

Expose des IDs d'institution et des données internes dans les logs serveur de production.

### 10.2 TODOs identifiés dans le code

| Fichier                    | Commentaire                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `exams.service.ts:~367`    | `TODO(INST-SETTINGS): centralize academic policy resolution (passing threshold, retake attempts)` |
| `ClassManagement.tsx:~149` | `TODO: N+1 Query Problem - fetches students for each class separately`                            |
| `dropzone.tsx:~450`        | `TODO: test if this actually works?`                                                              |
| `dropzone.tsx:~812`        | `TODO: add proper done transition`                                                                |

### 10.3 Notifications jamais envoyées

`notifications.service.ts` → `sendPending()` marque toutes les notifications `pending` comme `sent` sans les envoyer. Aucun appel à un fournisseur email ou webhook. Les deux canaux définis (`email`, `webhook`) sont traités de façon identique (pas envoyés).

### 10.4 Règles de promotion hardcodées

`rules-engine/default-rules.ts` contient des règles statiques (crédits minimum, moyenne minimum). Ces règles sont utilisées à la place des règles configurées en base. La fonctionnalité de personnalisation des règles est une UI sans effet.

### 10.5 Logique de scoring des rattrapages dans le mauvais module

La `scoringPolicy` (replace / best_of) des rattrapages est appliquée dans `student-facts.service.ts` (module de promotion) et non dans `grades.service.ts`. Le découplage crée un risque de désynchronisation.

---

## 11. Dette technique

### 11.1 Schémas Zod dupliqués frontend/backend

Le backend définit des schémas Zod dans `*.zod.ts`. Le frontend re-définit ses propres schémas Zod inline dans chaque composant. Aucun package partagé `packages/shared-schemas`. Les validations peuvent diverger (longueurs minimales différentes, champs manquants).

### 11.2 Deux patterns de requêtes tRPC dans le frontend

Certaines pages utilisent :

```typescript
useQuery({ ...trpc.resource.list.queryOptions(filters) });
```

D'autres utilisent :

```typescript
trpcClient.resource.list.query(filters);
```

Pas de pattern unifié. La gestion du cache et des invalidations est incohérente entre pages.

### 11.3 Session dupliquée entre Zustand et Better-Auth

La session Better-Auth est maintenue par cookie httpOnly. Zustand persiste aussi `user` en localStorage. Si le cookie expire, le store Zustand a encore l'utilisateur → l'UI pense que l'utilisateur est connecté mais les requêtes API échouent en 401. Pas de gestion globale du 401 qui forcerait un logout + nettoyage du store.

### 11.4 Clés de traduction manquantes avec fallback hardcodé

Plusieurs composants utilisent `t("key", { defaultValue: "Fallback" })`. Cela masque les clés manquantes au lieu de les signaler. Le français peut manquer ces clés → UI partiellement en anglais dans une session française.

### 11.5 Aucun Error Boundary React

Aucune page n'utilise de `ErrorBoundary` React. Si une requête retourne une erreur inattendue, le composant peut crasher silencieusement ou afficher un écran blanc.

### 11.6 Traductions françaises incomplètes pour les nouvelles fonctionnalités

**Fichier :** `apps/web/src/i18n/locales/fr/translation.json`

Les features ajoutées dans `organization-structure` sont partiellement traduites :

| Section             | Clés EN | Clés FR traduites | % traduit |
| ------------------- | ------- | ----------------- | --------- |
| `admin.batchJobs.*` | ~37     | ~20               | ~54%      |
| `admin.retake.*`    | ~37     | ~17               | ~46%      |

**Clés manquantes en FR :**

- `admin.batchJobs.status.*` (tous les statuts : pending, previewed, running, completed, failed, cancelled, stale, rolled_back)
- `admin.batchJobs.stepStatus.*` (statuts des étapes)
- `admin.batchJobs.types.*` (noms des types de jobs)
- La plupart des clés `admin.batchJobs.detail.*` et `admin.batchJobs.preview.*`
- Plusieurs clés `admin.retake.*` (overrides, reasons)

Les utilisateurs francophones verront les fallback anglais pour ces features.

### 11.7 Texte français dans le fichier de traduction anglais

**Fichier :** `apps/web/src/i18n/locales/en/translation.json`

Trois clés contiennent du texte en français dans le fichier EN :

```json
"FAILED_EXAM": "Exam échoué"      // devrait être "Failed exam"
"PASSED_EXAM": "Exam réussi"      // devrait être "Passed exam"
"grade": "Score actuelle"          // devrait être "Current score"
```

Ces clés se trouvent dans la section `admin.retake.reasons.*`.

### 11.9 Mutations sans invalidation de cache systématique

Certaines mutations invalident leur cache (`queryClient.invalidateQueries(...)`), d'autres non. Des données stales peuvent rester à l'écran après une opération.

---

## 12. Synthèse et priorités

### Problèmes bloquants (fonctionnalité cassée)

| #   | Problème                                                                      | Fichiers concernés                                                      |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| B1  | `cycleLevels` router non enregistré — tout appel depuis ClassManagement crash | `routers/index.ts`, `cycle-levels.router.ts`, `ClassManagement.tsx:284` |
| B2  | `enrollments.delete` appelé depuis l'UI mais absent du router                 | `EnrollmentManagement.tsx:224`, `enrollments.router.ts`                 |
| B3  | Notifications jamais envoyées                                                 | `notifications.service.ts`                                              |
| B4  | Règles de promotion en BDD ignorées, moteur hardcodé                          | `rules-engine.ts`, `default-rules.ts`                                   |
| B5  | `applyPromotion` ne déplace pas les étudiants réellement                      | `promotions.service.ts`, `promotionExecutionResults`                    |
| B6  | Portail étudiant sans relevé de notes (fonctionnalité de base)                | `PerformanceDashboard.tsx`                                              |

### Problèmes de sécurité critiques

| #   | Problème                                                         | Risque                                          |
| --- | ---------------------------------------------------------------- | ----------------------------------------------- |
| S1  | Grades mutations avec `tenantProtectedProcedure`                 | Tout utilisateur peut tenter d'éditer des notes |
| S2  | Tout enseignant peut créer des examens pour n'importe quel cours | Manipulation de données                         |
| S3  | `promotions.evaluateStudent` sans contrôle d'accès               | Info disclosure                                 |
| S4  | Alertes d'assiduité sans rate limiting ni validation             | DoS                                             |
| S5  | Exports PV sans vérification de propriété                        | Accès aux données d'autres cours                |
| S6  | Pas de RLS en base de données                                    | Cross-tenant data leak possible                 |
| S7  | Console.log d'IDs institution en production                      | Fuite d'informations dans les logs              |

### Incohérences majeures

| #   | Problème                                                  | Impact                                 |
| --- | --------------------------------------------------------- | -------------------------------------- |
| I1  | `enrollments.exitedAt` set sur tout changement de statut  | Données corrompues                     |
| I2  | Champ `attempt` jamais incrémenté                         | Redoublements non tracés               |
| I3  | Deux systèmes d'évaluation de promotion incompatibles     | Résultats contradictoires              |
| I4  | `/admin/programs` utilise `teacher/ProgramManagement.tsx` | Mauvais composant dans mauvais portail |
| I5  | Semesters globaux (pas scopés par institution)            | Collision multi-tenant                 |
| I6  | Logs d'audit des notes incomplets (seulement delegates)   | Audit trail insuffisant                |
| I7  | Données de crédits de transfert en double                 | Divergence potentielle                 |
| I8  | `courses.defaultTeacherId` jamais utilisé                 | Confusion dans le modèle               |
| I9  | 5 pages teacher non routées dans App.tsx                  | Code mort / confusion                  |
| I10 | Redirection hardcodée vers `/teacher` après inscription   | Mauvaise UX pour admins                |

### Fonctionnalités manquantes à haute valeur

| #   | Manquement                                                             | Effort      |
| --- | ---------------------------------------------------------------------- | ----------- |
| M1  | Relevé de notes étudiant                                               | Moyen       |
| M2  | Calendrier des examens (portail étudiant)                              | Faible      |
| M3  | Portail doyen dédié (pas MonitoringDashboard partagée)                 | Moyen       |
| M4  | Liens sidebar vers batch-jobs et retake-eligibility                    | Faible      |
| M5  | État `cancelled` pour les examens                                      | Faible      |
| M6  | Validation des prérequis à l'inscription                               | Moyen       |
| M7  | Logs d'audit complets (admin + teacher + delegate)                     | Faible      |
| M8  | Envoi réel des notifications (SMTP/webhook)                            | Moyen       |
| M9  | Seuil de passage et limite de tentatives configurables par institution | Faible      |
| M10 | Gestion 401 global + logout automatique                                | Faible      |
| M11 | Transfert de classe avec migration des inscriptions aux cours          | Élevé       |
| M12 | Statut des étudiants (actif, diplômé, exclu)                           | Moyen       |
| M13 | Breadcrumb `batch-jobs` manquant dans `useBreadcrumbs.ts`              | Faible      |
| M14 | Traductions FR complètes pour batch-jobs et retakes                    | Faible      |
| M15 | Corrections textes FR dans fichier EN (`retake.reasons.*`)             | Très faible |

---

_Fin de l'analyse. Ce document recense l'état réel du code sans y apporter de modifications._
_Toutes les références à des lignes de code sont approximatives et basées sur l'exploration statique._
