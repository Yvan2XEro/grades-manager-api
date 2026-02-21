# Audit Complet de l'Application - Grades Manager API

> **Date**: 2026-02-21
> **Branche analysee**: `frontend-redesign-v2`
> **Objectif**: Inventaire exhaustif de l'existant, identification des incoherences, manquements et zones d'ombre

---

## Table des matieres

1. [Architecture Globale](#1-architecture-globale)
2. [Backend - Infrastructure](#2-backend---infrastructure)
3. [Backend - Modules (Inventaire Complet)](#3-backend---modules-inventaire-complet)
4. [Schema de Base de Donnees](#4-schema-de-base-de-donnees)
5. [Frontend](#5-frontend)
6. [Tests et Couverture](#6-tests-et-couverture)
7. [Systeme de Seeding](#7-systeme-de-seeding)
8. [Configuration et DevOps](#8-configuration-et-devops)
9. [Incoherences Identifiees](#9-incoherences-identifiees)
10. [Manquements Identifies](#10-manquements-identifies)
11. [Zones d'Ombre et Incomprehensions](#11-zones-dombre-et-incomprehensions)
12. [Resume Synthetique](#12-resume-synthetique)

---

## 1. Architecture Globale

### Stack Technique
- **Runtime**: Bun
- **Backend**: Hono + tRPC + Drizzle ORM
- **Frontend**: React + Vite + TailwindCSS v4 + shadcn/ui
- **Base de donnees**: PostgreSQL (PGlite pour les tests)
- **Authentification**: Better-Auth avec plugins (admin, customSession, organization)
- **API**: tRPC (type-safe end-to-end)
- **i18n**: i18next (EN/FR)
- **Etat global**: Zustand avec persistance localStorage
- **Jobs en arriere-plan**: pg-boss (PostgreSQL)
- **Moteur de regles**: json-rules-engine

### Structure Monorepo
```
grades-manager-api/
  apps/
    server/     # Backend API (Hono + tRPC + Drizzle)
    web/        # Frontend React (Vite + TailwindCSS + shadcn/ui)
  packages/     # Packages partages (vide actuellement)
```

---

## 2. Backend - Infrastructure

### 2.1 Point d'entree (`apps/server/src/index.ts`)

**Ce qui est en place:**
- Serveur Hono avec middleware logging, CORS, fichiers statiques, uploads
- Routes auth (`/api/auth/**`) et tRPC (`/trpc/*`)
- Demarrage des jobs en arriere-plan
- Arret gracieux (SIGTERM)
- Health check endpoint `/` retournant "OK"

**Problemes identifies:**
- CORS_ORIGINS peut etre vide (pas de validation), ce qui desactive le CORS sans avertissement
- Health check ne verifie pas la connectivite DB ni l'etat des jobs
- Pas de gestion d'erreur si `startBackgroundJobs()` echoue
- Les methodes HTTP pour auth sont hardcodees (`POST`, `GET`) - OPTIONS pour preflight non explicite

### 2.2 tRPC Setup (`apps/server/src/lib/trpc.ts`)

**Types de procedures definies (10):**
| Procedure | Auth | Tenant | Role |
|-----------|------|--------|------|
| `publicProcedure` | Non | Non | Aucun |
| `protectedProcedure` | Oui | Non | Aucun |
| `adminProcedure` | Oui | Non | administrator/dean/super_admin/owner |
| `superAdminProcedure` | Oui | Non | super_admin/owner |
| `gradingProcedure` | Oui | Non | canGrade=true |
| `tenantProcedure` | Non | Oui | Aucun |
| `tenantProtectedProcedure` | Oui | Oui | Aucun |
| `tenantAdminProcedure` | Oui | Oui | Admin+ |
| `tenantSuperAdminProcedure` | Oui | Oui | SuperAdmin+ |
| `tenantGradingProcedure` | Oui | Oui | canGrade=true |

**Problemes:**
- `tenantMiddleware` lance `INTERNAL_SERVER_ERROR` quand l'institution est absente, devrait etre `PRECONDITION_FAILED`
- Pas de procedure specifique pour les roles `teacher` ou `dean` individuellement
- Les procedures non-tenant (publicProcedure, protectedProcedure) n'ont pas d'isolation tenant

### 2.3 Creation de Contexte (`apps/server/src/lib/context.ts`)

**Flux:**
```
Session Better-Auth
  -> Domain User Profile (via authUserId)
  -> Organization Member (via memberId)
  -> Organization + Institution
  -> Permissions calculees
```

**Problemes:**
- Auto-creation du domain user avec `lastName: ""` si absent - donnees de mauvaise qualite
- Pas de transaction pour la creation du contexte (lecture multi-tables non atomique)
- Fallback de resolution du membership potentiellement inconsistant
- Le profil peut etre null dans beaucoup de procedures sans avertissement

### 2.4 Authentification (`apps/server/src/lib/auth.ts`)

**Configuration:**
- Better-Auth avec email/password
- Plugins: admin, customSession, organization
- 7 roles organisation: owner, super_admin, administrator, dean, teacher, staff, student
- Cookies: sameSite configurable, secure configurable, httpOnly toujours true
- Session enrichie avec domainProfiles et activeMembership a chaque requete

**Problemes:**
- `adminRoles = ["admin"]` dans Better-Auth vs roles domaine differents (administrator, super_admin) - confusion
- customSession hook fait des appels DB a chaque requete (performance)
- trustedOrigins depend de CORS_ORIGINS - si mal configure, auth silencieusement cassee
- Pas de validation que `BETTER_AUTH_COOKIE_SECURE=true` en production
- Pas de protection CSRF explicite

### 2.5 Autorisation et Roles (`apps/server/src/modules/authz/`)

**Hierarchie des roles:**
```
owner
  super_admin
    administrator
      dean
        teacher
          staff
            student
```

**Permissions calculees (PermissionSnapshot):**
```typescript
{
  canManageCatalog: boolean    // Admin+
  canManageStudents: boolean   // Admin+
  canGrade: boolean            // Teacher+
  canAccessAnalytics: boolean  // Admin+
}
```

**Problemes:**
- Roles hardcodes dans le code (pas dans la DB)
- ADMIN_ROLES inclut `dean` - discutable selon les institutions
- Seulement 4 permissions booleennes - pas de granularite fine
  - Pas de `canEditGrade` distinct de `canGrade`
  - Pas de `canViewStudent` (vie privee)
  - Pas de `canManageUsers`, `canManageWorkflows`
- Trois systemes de roles non alignes: Better-Auth admin, organization roles, domain roles

### 2.6 Jobs en Arriere-Plan (`apps/server/src/lib/jobs.ts`)

**Jobs definis (3):**
| Job | Frequence | Description |
|-----|-----------|-------------|
| `closeExpiredApprovedExams` | 5 min | Ferme les examens approuves expires |
| `sendPending` | 1 min | Envoie les notifications en attente |
| `markStaleJobs` | 5 min | Marque les batch jobs bloques |

**Problemes:**
- Intervalles hardcodes sans configuration possible
- Pas de try/catch dans les handlers (erreurs silencieuses)
- Logging console uniquement (pas structure/JSON)
- Pas de metriques ou monitoring
- Arret gracieux avec timeout hardcode de 10s
- pg-boss peut echouer silencieusement au demarrage

### 2.7 Connexion DB (`apps/server/src/db/index.ts`)

**Modes:**
- Test: PGlite in-memory
- Dev: PGlite fichier ou PostgreSQL (configurable)
- Prod: PostgreSQL (node-postgres pool)

**Problemes:**
- Pool PostgreSQL avec config par defaut (taille 10, pas de timeout/SSL)
- DATABASE_URL non validee
- Pas de listener `.on('error')` sur le pool
- Selection implicite PGlite/PostgreSQL basee sur l'environnement

---

## 3. Backend - Modules (Inventaire Complet)

### 3.1 Modules Institutionnels

#### institutions
- **Status**: COMPLET
- **Operations**: create, read (getById, list), update, delete, upsert
- **Auth**: adminProcedure (mutations), protectedProcedure (lectures)
- **Validations**: code min 1, type enum, noms bilingues requis, email/URL format

#### programs
- **Status**: COMPLET
- **Operations**: create, read (list, getById, getByCode, search), update, delete
- **Auth**: adminProcedure / protectedProcedure
- **Particularites**: Auto-creation d'une "Option par defaut" a la creation, normalisation du code, generation du slug

#### study-cycles (avec cycle-levels)
- **Status**: COMPLET
- **Operations CRUD cycles**: create, list, get, update, delete
- **Operations CRUD levels**: create, list, get, update, delete
- **Particularites**: Auto-generation des niveaux selon durationYears, distribution egale des credits

#### program-options
- **Status**: COMPLET
- **Operations**: CRUD standard

### 3.2 Modules Structure Academique

#### academic-years
- **Status**: COMPLET
- **Operations**: create, getById, list, update, delete + `setActive` (superAdmin)
- **Particularites**: setActive desactive les autres annees en transaction (singleton)

#### semesters
- **Status**: INCOMPLET - Lecture seule
- **Operations**: `listSemesters` uniquement
- **Manque**: CREATE, UPDATE, DELETE

#### teaching-units
- **Status**: COMPLET
- **Operations**: create, getById, list, update, delete
- **Validations**: Verifie que le programme existe avant creation

#### courses
- **Status**: COMPLET
- **Operations**: create, getById, getByCode, list, search, update, delete + assignDefaultTeacher
- **Validations**: Code/nom requis, heures > 0

#### classes
- **Status**: COMPLET
- **Operations**: create, getById, getByCode, list, search, update, delete + transferStudent
- **Auth**: tenantAdminProcedure / tenantProtectedProcedure
- **Particularites**: Auto-creation de cycle/level/option/semester par defaut si manquants, transfert etudiant atomique en transaction

#### class-courses
- **Status**: COMPLET
- **Operations**: create, getById, getByCode, list, search, update, delete + roster
- **Particularites**: Filtrage par role (admins: tout, teachers: propres + delegues), delegation avec audit, flag isDelegated

### 3.3 Modules Etudiants et Inscriptions

#### students
- **Status**: COMPLET
- **Operations**: create, admitExternal, getById, list, update + bulkCreateStudents
- **Particularites**: Admission externe avec credits transferes, import en masse

#### enrollments
- **Status**: COMPLET
- **Operations**: create, getById, list, update + updateStatus
- **Statuts**: pending, active, completed, withdrawn

#### student-course-enrollments
- **Status**: COMPLET
- **Operations**: Inscription en masse, auto-inscription par classe, fermeture d'inscription
- **Statuts**: planned, active, completed, failed, withdrawn

#### domain-users
- **Status**: INCOMPLET
- **Fichiers**: Seulement le repo (domain-users.repo.ts)
- **Manque**: Router, service, schemas Zod - utilise uniquement en interne

### 3.4 Modules Examens et Notes

#### exams
- **Status**: COMPLET (avance)
- **Operations**: create, getById, list, update, delete + submit, validate, lock
- **Auth**: tenantGradingProcedure (create/update/submit), tenantAdminProcedure (delete/validate/lock)
- **Workflow de statut**: draft -> scheduled -> submitted -> approved/rejected
- **Particularites**: Validation pourcentage (somme <= 100 par classCourse), systeme de rattrapage (parentExamId, sessionType), override eligibilite rattrapage

#### grades
- **Status**: COMPLET (avance)
- **Operations**: upsertNote, listByExam, listByStudent, listByClassCourse, updateNote, deleteNote
- **Analytics**: avgForExam, avgForCourse, avgForStudentInCourse
- **Import/Export**: importCsv, exportClassCourseCsv, consolidatedByStudent (releve)
- **Particularites**: Delegation avec audit logging, recalcul automatique du ledger de credits, releve avec moyennes ponderees

#### exam-grade-editors
- **Status**: COMPLET
- **Operations**: assignEditor, listEditors, revokeEditor
- **Particularites**: Gestion de la delegation de notation (teachers assignent des delegues)

#### exam-types
- **Status**: COMPLET
- **Operations**: CRUD standard

#### exam-scheduler
- **Status**: COMPLET
- **Operations**: preview, schedule, previewRetakes, scheduleRetakes, history, details
- **Particularites**: Planification en masse avec audit trail (examScheduleRuns)

### 3.5 Modules Workflow et Regles Metier

#### workflows
- **Status**: PARTIEL
- **Operations**: validateGrades, toggleEnrollmentWindow, listEnrollmentWindows, triggerAttendanceAlert
- **Manque**: Workflow de validation multi-niveaux complet, historique des approbations

#### promotion-rules
- **Status**: COMPLET
- **Operations**: CRUD rules + evaluation + execution
- **Particularites**: Integration json-rules-engine, student facts service, exemples de regles pre-configures

#### promotions
- **Status**: COMPLET
- **Operations**: evaluateStudentPromotion, listDefaultRules
- **Particularites**: Combine credit ledger + rules engine

#### rules-engine
- **Status**: COMPLET
- **Operations**: Evaluation de regles JSON, regles par defaut
- **Dependance**: json-rules-engine v7.3.1

#### student-credit-ledger
- **Status**: COMPLET
- **Operations**: summarizeStudent, recomputeForStudent + compute-ue-credits
- **Particularites**: Suivi des credits tentes/obtenus/en cours, validation des UE

### 3.6 Modules Administratifs

#### users
- **Status**: COMPLET
- **Operations**: create, list, update, delete
- **Filtres**: Par role, statut

#### notifications
- **Status**: COMPLET (structure)
- **Operations**: Router, service, repo, zod

#### batch-jobs
- **Status**: COMPLET
- **Operations**: preview, run, cancel, rollback, get, list
- **Types de jobs**: credit-ledger-recompute, student-facts-refresh
- **Particularites**: Registry pattern, preview avant execution, support rollback

#### registration-numbers
- **Status**: COMPLET
- **Operations**: CRUD formats + generation automatique
- **Particularites**: Formats configurables avec compteurs partitionnes

#### exports
- **Status**: COMPLET
- **Operations**: Export avec templates (CSV, PDF)

#### export-templates
- **Status**: COMPLET
- **Operations**: CRUD templates Handlebars

#### files
- **Status**: INCOMPLET
- **Fichiers**: Router uniquement
- **Manque**: Service, repo

### 3.7 Utilitaires Partages (`_shared/`)
- `auth-guards.ts` - Helpers d'authentification
- `db-transaction.ts` - Wrapper de transaction
- `errors.ts` - Factories d'erreurs (notFound, conflict)
- `pagination.ts` - Pagination cursor-based

---

## 4. Schema de Base de Donnees

### 4.1 Inventaire des Tables (40+ tables)

#### Tables Authentification (7)
| Table | Colonnes cles | FK |
|-------|---------------|-----|
| `user` | id, name, email, role, banned | - |
| `session` | id, token, userId, activeOrganizationId | user |
| `account` | id, accountId, providerId, userId | user |
| `verification` | id, identifier, value, expiresAt | - |
| `organization` | id, name, slug, logo | - |
| `member` | id, organizationId, userId, role | organization, user |
| `invitation` | id, organizationId, email, status, inviterId | organization, user |

#### Tables Domaine (33+)
| Table | Description | FK principales |
|-------|-------------|----------------|
| `institutions` | Etablissements (hierarchie self-ref) | parentInstitution, organization |
| `domainUsers` | Profils metier | user, member |
| `academicYears` | Annees academiques | institution |
| `studyCycles` | Cycles d'etudes (BTS, Licence...) | institution |
| `cycleLevels` | Niveaux dans un cycle (L1, L2...) | studyCycle |
| `semesters` | Semestres (catalogue global) | - |
| `programs` | Programmes | institution |
| `programOptions` | Options dans un programme | program, institution |
| `teachingUnits` | Unites d'enseignement | program |
| `courses` | Matieres | program, teachingUnit, defaultTeacher |
| `classes` | Promotions/cohortes | institution, program, academicYear, cycleLevel, programOption |
| `classCourses` | Affectation cours-classe-prof | class, course, teacher, institution |
| `examTypes` | Types d'examen (CC, TP...) | institution |
| `exams` | Examens | institution, classCourse, parentExam |
| `examScheduleRuns` | Audit planification en masse | institution, academicYear, examType |
| `students` | Etudiants | institution, domainUser, class |
| `enrollments` | Inscriptions etudiant-classe-annee | institution, student, class, academicYear |
| `studentCourseEnrollments` | Tentatives cours | student, classCourse, course, sourceClass, academicYear |
| `studentCreditLedgers` | Suivi credits agrege | student, academicYear |
| `enrollmentWindows` | Periodes d'inscription | class, academicYear |
| `grades` | Notes d'examen | student, exam |
| `coursePrerequisites` | Prerequis entre cours | course (x2) |
| `promotionRules` | Regles de promotion (json-rules) | institution, sourceClass, program, cycleLevel |
| `promotionExecutions` | Executions de promotion | rule, sourceClass, targetClass, academicYear, executedBy |
| `promotionExecutionResults` | Resultats par etudiant | execution, student |
| `studentPromotionSummaries` | Resumes promotion (cache) | student, academicYear, class, program |
| `examGradeEditors` | Delegues de notation | exam, editor, grantedBy |
| `gradeEditLogs` | Audit modifications notes | institution, exam, classCourse, student, grade, actor |
| `classCourseAccessLogs` | Audit acces delegue | institution, classCourse, actor |
| `notifications` | Notifications workflow | recipient |
| `registrationNumberFormats` | Formats de matricule | institution |
| `registrationNumberCounters` | Compteurs de matricule | format |
| `exportTemplates` | Templates d'export | institution, createdBy, updatedBy |
| `retakeOverrides` | Override eligibilite rattrapage | institution, exam, studentCourseEnrollment |
| `batchJobs` | Jobs en masse | institution, createdBy |
| `batchJobSteps` | Etapes de batch | job |
| `batchJobLogs` | Logs de batch | job, step |

### 4.2 Enums Definis
| Enum | Valeurs |
|------|---------|
| BusinessRole | super_admin, administrator, dean, teacher, staff, student |
| Gender | male, female, other |
| DomainUserStatus | active, inactive, suspended |
| TeachingUnitSemester | fall, spring, annual |
| EnrollmentStatus | pending, active, completed, withdrawn |
| EnrollmentWindowStatus | open, closed |
| StudentCourseEnrollmentStatus | planned, active, completed, failed, withdrawn |
| NotificationChannel | email, webhook |
| NotificationStatus | pending, sent, failed |
| ExamSessionType | normal, retake |
| RetakeScoringPolicy | replace, best_of |
| AdmissionType | normal, transfer, direct, equivalence |
| CoursePrerequisiteType | mandatory, recommended |
| InstitutionType | university, institution, faculty |
| ExportTemplateType | pv, evaluation, ue |
| GradeEditLogAction | write, delete, import |
| GradeEditActorRole | admin, teacher, delegate |
| BatchJobStatus | pending, previewed, running, completed, failed, cancelled, stale, rolled_back |
| BatchJobStepStatus | pending, running, completed, failed, skipped |
| BatchJobLogLevel | info, warn, error |

### 4.3 Champs JSONB (schema flexible)
| Table | Champ | Contenu |
|-------|-------|---------|
| institutions | metadata | export_config, signatures, exam_settings, watermark |
| enrollments | admissionMetadata | Donnees admission libre |
| notifications | payload | Contenu variable |
| promotionRules | ruleset | Format json-rules-engine |
| promotionExecutionResults | evaluationData, rulesMatched | Resultats d'evaluation |
| promotionExecutions | metadata | Metadonnees execution |
| registrationNumberFormats | definition | RegistrationNumberFormatDefinition |
| studentPromotionSummaries | averagesByTeachingUnit, averagesByCourse, facts | Moyennes detaillees |
| batchJobs | params, previewResult, executionResult, progress, suggestedActions | Donnees job |
| batchJobSteps | data | Donnees etape |
| batchJobLogs | data | Donnees log |
| gradeEditLogs | metadata | Metadonnees edit |
| examScheduleRuns | classIds | IDs des classes |

---

## 5. Frontend

### 5.1 Routes Definies

#### Auth (Publiques - 4 routes)
- `/auth/login`, `/auth/register`, `/auth/forgot`, `/auth/reset`

#### Admin (Protegees - 34 pages)
- `/admin` - Dashboard
- `/admin/institution` - Parametres institution
- `/admin/academic-years` - Annees academiques
- `/admin/faculties` - Facultes
- `/admin/study-cycles` - Cycles d'etudes
- `/admin/programs` - Programmes
- `/admin/teaching-units` - UE
- `/admin/teaching-units/:teachingUnitId` - Detail UE
- `/admin/classes` - Classes
- `/admin/courses` - Cours
- `/admin/class-courses` - Affectations cours-classes
- `/admin/enrollments` - Inscriptions
- `/admin/users` - Utilisateurs
- `/admin/students` - Etudiants
- `/admin/exams` - Examens
- `/admin/exam-types` - Types d'examens
- `/admin/exam-scheduler` - Planificateur d'examens
- `/admin/retake-eligibility` - Eligibilite rattrapages
- `/admin/grade-export` - Export de notes
- `/admin/export-templates` - Templates d'export
- `/admin/export-templates/:templateId` - Editeur de template
- `/admin/promotion-rules` - Dashboard regles de promotion
- `/admin/promotion-rules/rules` - Liste des regles
- `/admin/promotion-rules/evaluate` - Evaluation
- `/admin/promotion-rules/execute` - Execution
- `/admin/promotion-rules/history` - Historique
- `/admin/rules` - Gestion des regles
- `/admin/registration-numbers` - Formats matricules
- `/admin/registration-numbers/:formatId` - Detail format
- `/admin/monitoring` - Monitoring
- `/admin/notifications` - Centre de notifications
- `/admin/batch-jobs` - Dashboard batch jobs
- `/admin/batch-jobs/:jobId` - Detail batch job

#### Teacher (Protegees - 6 pages)
- `/teacher` - Dashboard
- `/teacher/courses` - Liste des cours
- `/teacher/grades` - Saisie de notes
- `/teacher/grades/:courseId` - Notes pour un cours
- `/teacher/attendance` - Alertes de presence
- `/teacher/workflows` - Gestionnaire workflows

#### Dean (Protegees - 2 pages)
- `/dean` - Monitoring
- `/dean/workflows` - Approbations

#### Student (Protegee - 1 page)
- `/student` - Tableau de bord performance

### 5.2 Etat Global (Zustand)
```typescript
Store:
  user: { profileId, authUserId, email, role, firstName, lastName, permissions, domainProfiles }
  sidebarOpen: boolean
  activeOrganizationSlug: string | null
Persistance: localStorage (key: "academic-management-store")
```

### 5.3 i18n
- 2 langues: EN (~2928 lignes), FR (~2919 lignes)
- Parite quasi-complete entre les deux fichiers
- Sections: common, navigation, auth, teacher, admin, dean, student, components

### 5.4 Composants
- **Layouts**: AuthLayout, DashboardLayout
- **Navigation**: Header (breadcrumbs, langue, notifications, profil), Sidebar (menu par role), Redirector
- **Modals**: FormModal, ConfirmModal
- **Inputs**: AcademicYearSelect, ClassSelect, SemesterSelect, DebouncedSearchField
- **Forms**: coded-entity-select (select generique)
- **UI**: 60+ composants shadcn/ui

### 5.5 Alignement Frontend-Backend
Tous les routers backend sont utilises cote frontend. Aucun endpoint manquant detecte.

---

## 6. Tests et Couverture

### 6.1 Infrastructure de Test
- **Runner**: Bun test (natif)
- **DB de test**: PGlite in-memory
- **Utilitaires**: `test-utils.ts` avec factories (makeTestContext, asAdmin, asSuperAdmin, createRecapFixture, etc.)
- **Pattern**: `appRouter.createCaller(context)` pour tests d'integration

### 6.2 Modules AVEC Tests (22)
academic-years, batch-jobs, class-courses, classes, courses, enrollments, exam-grade-editors, exam-scheduler, exam-types, exams, exports, grades, institutions, programs, promotion-rules, registration-numbers, semesters, student-course-enrollments, students, study-cycles, teaching-units, users

### 6.3 Modules SANS Tests (12)
authz, domain-users, export-templates, files, notifications, program-options, promotions, rules-engine, student-credit-ledger, workflows, _shared

### 6.4 Tests Frontend
**AUCUN TEST FRONTEND** - Vitest et Cypress sont configures dans package.json mais aucun fichier de test n'existe.

### 6.5 Tests HTTP
- `routers/__tests__/workflows.http.test.ts` - Tests HTTP workflows
- `routers/__tests__/e2e.http.test.ts` - Tests E2E HTTP

---

## 7. Systeme de Seeding

### 7.1 Architecture 3 couches
1. **Foundation** (`00-foundation.yaml`) - Organisations, exam types, institutions, cycles, semestres, annees
2. **Academics** (`10-academics.yaml`) - Programmes, UE, cours, classes, class-courses, examens
3. **Users** (`20-users.yaml`) - Auth users, domain users, etudiants, inscriptions

### 7.2 Donnees d'exemple (INSES)
- 1 organisation
- Plusieurs cycles (BTS, Licence, Master, CQP)
- 7+ programmes
- 30+ unites d'enseignement
- 10+ cours
- 3 classes
- 7 utilisateurs (admin, 4 teachers, 2 students)
- 2 etudiants avec inscriptions
- 2 examens en draft

### 7.3 Scaffold System
`seed/sample-data.ts` (1074 lignes) genere les templates YAML dans `seed/local/`

---

## 8. Configuration et DevOps

### 8.1 Variables d'Environnement
```
CORS_ORIGINS          # Origines CORS
BETTER_AUTH_SECRET    # Secret auth
BETTER_AUTH_URL       # URL base auth
DATABASE_URL          # Connexion PostgreSQL
STORAGE_DRIVER        # local, s3
BETTER_AUTH_COOKIE_SECURE  # true/false
BETTER_AUTH_COOKIE_SAMESITE  # none, lax, strict
STORAGE_LOCAL_ROOT    # Chemin uploads
SERVER_PUBLIC_URL     # URL publique serveur
```

### 8.2 Scripts Disponibles
| Script | Description |
|--------|-------------|
| `bun dev` | Tout lancer en dev |
| `bun dev:server` | Backend seul |
| `bun dev:web` | Frontend seul |
| `bun check` | Biome format + lint |
| `bun check-types` | TypeScript check |
| `bun db:push` | Push schema |
| `bun db:studio` | Drizzle Studio |
| `bun db:generate` | Generer migrations |
| `bun db:migrate` | Lancer migrations |
| `bun test` | Tests backend |
| `bun build` | Build tout |

### 8.3 CI/CD
**AUCUN PIPELINE CI/CD CONFIGURE** - Pas de GitHub Actions, pas de workflow automatise.

---

## 9. Incoherences Identifiees

### INC-01: Triple systeme de roles non aligne
- **Better-Auth**: `adminRoles = ["admin"]`
- **Organization roles**: owner, super_admin, administrator, dean, teacher, staff, student
- **Domain roles (authz)**: super_admin, administrator, dean, teacher, staff, student

Le role `"admin"` de Better-Auth ne correspond a aucun role domaine. Le role `"owner"` existe dans l'organisation mais pas dans les roles domaine.

### INC-02: Nommage inconsistant des FK dans le schema
Certaines FK suivent la convention `xxxId`, d'autres non:
| Convention correcte | Convention cassee |
|---------------------|-------------------|
| `teachingUnitId` | `courses.program` (au lieu de `programId`) |
| `semesterId` | `courses.defaultTeacher` (au lieu de `defaultTeacherId`) |
| `cycleLevelId` | `classes.program` (au lieu de `programId`) |
| `classCourseId` | `classes.academicYear` (au lieu de `academicYearId`) |
| | `grades.student` (au lieu de `studentId`) |
| | `grades.exam` (au lieu de `examId`) |
| | `exams.classCourse` (au lieu de `classCourseId`) |
| | `classCourses.class` (au lieu de `classId`) |
| | `classCourses.course` (au lieu de `courseId`) |
| | `classCourses.teacher` (au lieu de `teacherId`) |

### INC-03: Procedures inconsistantes entre modules
- Les modules `classes`, `class-courses`, `exams`, `grades` utilisent les procedures `tenant*`
- Les modules `institutions`, `programs`, `courses`, `academic-years` utilisent les procedures globales (`adminProcedure`, `protectedProcedure`)
- Pas de logique claire sur quand utiliser tenant vs global

### INC-04: Gestion d'erreurs heterogene
- Certains modules utilisent `TRPCError` directement
- D'autres utilisent les helpers `notFound()` et `conflict()` de `_shared/errors.ts`
- Pas de standard uniforme

### INC-05: ADMIN_ROLES inclut "dean"
```typescript
const ADMIN_ROLES = ["administrator", "dean", "super_admin", "owner"]
```
Le `dean` est considere comme admin, ce qui peut ne pas correspondre a toutes les institutions. C'est une politique metier hardcodee.

### INC-06: Enums sans contraintes DB
Les champs de type "statut" sont des `text` sans CHECK constraint en base. Des valeurs invalides peuvent etre inserees directement en DB.

### INC-07: Cascading deletes generalises sans soft delete
Toutes les FK utilisent `ON DELETE CASCADE`. Supprimer une institution supprime en cascade TOUS les programmes, classes, etudiants, notes, etc. Aucun mecanisme de soft delete.

### INC-08: Redundance academicYearId
- `classes.academicYear` lie une classe a une annee
- `enrollments.academicYearId` lie une inscription a une annee
- Si un etudiant est inscrit dans une classe d'une annee X, l'enrollment devrait correspondre. Mais rien n'empeche un enrollment avec une annee Y differente de celle de la classe.

### INC-09: Code erreur tenantMiddleware
Le `tenantMiddleware` lance `INTERNAL_SERVER_ERROR` quand l'institution est manquante dans le contexte. C'est une erreur de precondition client, pas une erreur serveur. Devrait etre `PRECONDITION_FAILED` ou `BAD_REQUEST`.

### INC-10: Pas de route "/staff" dans le frontend
Le role `staff` existe dans le systeme de roles mais aucune route frontend n'est definie pour ce role. Le sidebar ne montre rien pour un utilisateur `staff`.

### INC-11: MonitoringDashboard avec donnees hardcodees
La page `MonitoringDashboard.tsx` affiche des metriques fixes (3 grade windows, 5 pending alerts) au lieu de donnees reelles.

### INC-12: Procedure identique pour roles differents
Dans `organization-roles.ts`, dean, teacher, staff et student ont exactement les memes permissions Better-Auth (`memberAc`). La differenciation se fait uniquement au niveau domaine, rendant le systeme de roles Better-Auth inutile pour ces roles.

### INC-13: `@ts-nocheck` dans TeachingUnitCoursesTable
Le fichier `TeachingUnitCoursesTable.tsx` a une directive `@ts-nocheck` qui desactive le type-checking TypeScript, masquant potentiellement des erreurs.

### INC-14: Scores sans contrainte de plage dans grades
La table `grades` utilise `numeric(5,2)` sans CHECK constraint sur la plage. Theoriquement, une note de 999.99 ou -100.00 pourrait etre inseree.

---

## 10. Manquements Identifies

### MNQ-01: Aucun test frontend
Malgre la configuration de Vitest et Cypress dans `package.json`, il n'existe aucun fichier de test frontend. Zero couverture.

### MNQ-02: 12 modules backend sans tests
authz, domain-users, export-templates, files, notifications, program-options, promotions, rules-engine, student-credit-ledger, workflows, _shared - aucun test.

### MNQ-03: Pas de CI/CD
Aucun pipeline GitHub Actions ou equivalent. Les tests, le linting et le build ne sont pas automatises.

### MNQ-04: Module semesters incomplet
Le module `semesters` est en lecture seule. Pas de CREATE, UPDATE, DELETE. Les semestres ne peuvent etre geres que par seed.

### MNQ-05: Module domain-users incomplet
Seul le fichier `repo` existe. Pas de router, service ou schemas Zod. Le module est utilise uniquement en interne.

### MNQ-06: Module files incomplet
Seul le router existe. Pas de service ni de repo.

### MNQ-07: Pas de soft delete
Aucune table n'a de colonne `deletedAt`. Les suppressions sont permanentes et irreversibles. Pas de corbeille, pas de recuperation.

### MNQ-08: Pas de verrouillage optimiste
Aucune table n'a de champ `version` ou `rowVersion`. Risque de conditions de course sur les mises a jour concurrentes de notes, inscriptions, etc.

### MNQ-09: Permissions trop grossieres
Seulement 4 permissions booleennes (canManageCatalog, canManageStudents, canGrade, canAccessAnalytics). Manquent:
- `canEditGrade` (distinct de `canGrade`)
- `canViewStudentData` (vie privee)
- `canManageUsers`
- `canManageWorkflows`
- `canExportData`
- `canManageExamSchedule`

### MNQ-10: Pas de validation des champs JSONB
17 champs JSONB dans le schema sans validation de structure en base. La validation est uniquement cote application.

### MNQ-11: Index manquants en base
Indexes critiques absents:
- `domainUsers.status`, `domainUsers.primaryEmail`
- `enrollments` composite `(student, academicYear)`, index sur `status`
- `studentCourseEnrollments` composite `(student, academicYear)`, index sur `status`
- `exams.status`
- `classes` composite `(institution, program)`
- `courses` composite `(program, teachingUnit)`
- `institutions.type`

### MNQ-12: Pas de contrainte de plage sur les scores
La table `grades` permet n'importe quelle valeur numeric(5,2). Pas de CHECK score >= 0 AND score <= 20 (ou 100).

### MNQ-13: Pas de prevention des prerequis circulaires
La table `coursePrerequisites` ne previent pas les cycles: A requiert B, B requiert A. Pas non plus de contrainte empechant A -> A.

### MNQ-14: Pas d'audit "updatedBy" sur les tables principales
Les tables comme `institutions`, `programs`, `courses` ont `updatedAt` mais pas `updatedBy`. Impossible de savoir qui a modifie.

### MNQ-15: Pas de page frontend pour exam-grade-editors
Le systeme de delegation de notation existe en backend mais n'a pas d'interface dediee en frontend.

### MNQ-16: Pas de page frontend pour program-options et cycle-levels
Ces entites sont selectionnees dans des dropdowns mais n'ont pas de pages CRUD dediees.

### MNQ-17: Pas de monitoring reel
Le `MonitoringDashboard` est un placeholder avec des donnees hardcodees. Pas de health check reel, pas de metriques systeme.

### MNQ-18: Pas de page "staff"
Le role `staff` n'a pas de vue frontend dediee. Un utilisateur staff serait redirige nulle part.

### MNQ-19: Pas de gestion des erreurs globale cote frontend
Pas d'Error Boundary React observe. Les erreurs non gerees peuvent provoquer un crash blanc.

### MNQ-20: Pool PostgreSQL non configure
Connexion DB avec config par defaut (pool size 10, pas de timeout, pas de SSL). Insuffisant pour multi-tenant en production.

### MNQ-21: Pas de donnees de seed pour les notes
Le jeu de donnees d'exemple ne contient aucune note. Les examens sont en statut `draft`, pas de grades seedees.

### MNQ-22: Pas de scenario multi-institution dans le seed
Le seed ne contient qu'une seule institution. Pas de test du multi-tenant reel.

### MNQ-23: Pas de contrainte creditsEarned <= creditsAttempted
La table `studentCourseEnrollments` et `studentCreditLedgers` ne verifient pas que les credits obtenus ne depassent pas les credits tentes.

### MNQ-24: Pas de duree d'examen dans le schema
La table `exams` ne contient pas de champ `duration` (en minutes), ni `room` ou `location`.

### MNQ-25: Pas de capacite de classe
La table `classes` ne contient pas de champ `capacity` pour limiter les inscriptions.

### MNQ-26: Pas de statut de paiement
Aucune table ne gere les frais de scolarite ou le statut de paiement des etudiants.

### MNQ-27: AttendanceAlerts est un placeholder
La page `AttendanceAlerts.tsx` du teacher est un placeholder incomplet.

---

## 11. Zones d'Ombre et Incomprehensions

### ZO-01: Relation Organisation <-> Institution
La relation entre les `organizations` de Better-Auth et les `institutions` du domaine n'est pas evidente. Une organisation peut-elle avoir plusieurs institutions? Le code semble supposer un mapping 1:1 (via `institutions.organizationId`), mais la structure permet le 1:N.

### ZO-02: Role "owner" - quand est-il attribue?
Le role `owner` existe dans la hierarchie mais il n'est jamais mentionne dans les interfaces utilisateur ni dans les flux de creation. Comment un utilisateur obtient-il ce role?

### ZO-03: Auto-creation des domainUsers
Quand un utilisateur authentifie n'a pas de domain user, un profil est auto-cree avec `lastName: ""`. Quelle est la strategie pour completer ce profil par la suite? Pas de flux visible.

### ZO-04: Workflow de validation de grades - flux complet
Le workflow est: draft -> scheduled -> submitted -> approved/rejected. Mais qui approuve? Le dean? L'admin? Comment la notification est-elle envoyee? Le flux de bout en bout n'est pas clairement documente.

### ZO-05: Multi-tenant - isolation des donnees
Les procedures `tenant*` injectent `institutionId` dans le contexte. Mais les procedures non-tenant (`adminProcedure`) n'isolent pas les donnees par institution. Quelles procedures sont censees etre multi-tenant et lesquelles sont globales?

### ZO-06: Retake system - politique configurable?
Le systeme de rattrapage (exams retake) utilise un `passingGrade` et des overrides. Mais d'ou vient le `passingGrade` par defaut? Est-ce configurable par institution? Un commentaire TODO mentionne "centralize academic policy resolution".

### ZO-07: Credit computation - quand est-elle declenchee?
La recomputation des credits (`recomputeForStudent`) est appelee apres les changements de notes. Mais est-elle automatique dans tous les cas? Les batch jobs `credit-ledger-recompute` et `student-facts-refresh` suggerent qu'il faut parfois lancer manuellement.

### ZO-08: Registration numbers - format vs generation
Le systeme de `registrationNumberFormats` est configurable (templates avec segments). Mais la generation se fait comment? Au moment de la creation de l'etudiant? Automatiquement ou manuellement?

### ZO-09: Notifications - quels evenements declenchent quoi?
Le module `notifications` existe mais quels evenements declenchent quelles notifications? Les seules references sont dans le job `sendPending` et le workflow `triggerAttendanceAlert`. Les autres declencheurs ne sont pas clairs.

### ZO-10: Export templates - Handlebars
Les templates d'export utilisent Handlebars. Quelle est la surface des variables disponibles dans chaque type de template (pv, evaluation, ue)? Pas de documentation des helpers.

### ZO-11: Semesters vs TeachingUnit.semester
La table `semesters` definit un catalogue global (S1, S2...), mais `teachingUnits.semester` utilise un enum (fall, spring, annual). Comment ces deux concepts se relient?

### ZO-12: Class auto-creation defaults
Le service `classes` auto-cree des cycles, niveaux, options et semestres par defaut si ils sont manquants. Cela signifie que la creation d'une classe peut avoir des effets de bord non attendus. Quelle est la strategie?

### ZO-13: StudentPromotionSummaries - cache ou source de verite?
La table `studentPromotionSummaries` contient 48 colonnes de donnees calculees. Est-ce un cache recalcule par batch job ou la source de verite pour les decisions de promotion?

### ZO-14: Batch jobs - prevention de doublons
Deux types de batch jobs existent: `credit-ledger-recompute` et `student-facts-refresh`. Rien ne semble empecher de lancer le meme job en parallele.

### ZO-15: PGlite en dev - differences de comportement
Le code utilise PGlite en dev/test et PostgreSQL en prod. PGlite ne supporte pas toutes les fonctionnalites PostgreSQL (extensions, pg-boss). Les jobs sont desactives en PGlite. Quelles autres differences de comportement existent?

---

## 12. Resume Synthetique

### Ce qui fonctionne bien
- Architecture modulaire claire et consistante (module pattern)
- Type-safety end-to-end avec tRPC
- Systeme de gestion des examens avance (workflow, retakes, delegation)
- Credit ledger avec recalcul automatique
- Moteur de regles de promotion configurable (json-rules-engine)
- Audit logging pour les operations sensibles (notes, acces)
- i18n complet EN/FR
- Seed system structure en couches
- Batch jobs framework complet

### Chiffres Cles
| Metrique | Valeur |
|----------|--------|
| Tables en base | 40+ |
| Modules backend | 33+ |
| Modules complets | 31 (94%) |
| Modules avec tests | 22 (67%) |
| Modules sans tests | 12 (33%) |
| Pages frontend | 47 |
| Tests frontend | 0 |
| Incoherences | 14 |
| Manquements | 27 |
| Zones d'ombre | 15 |
| Pipeline CI/CD | 0 |

### Priorites Suggerees (non correctives, juste indicatives)

**Critique:**
- INC-07 (cascading deletes sans soft delete)
- MNQ-01 (zero tests frontend)
- MNQ-03 (pas de CI/CD)
- MNQ-11 (index manquants)
- MNQ-20 (pool DB non configure)

**Important:**
- INC-01 (triple systeme de roles)
- INC-02 (nommage FK inconsistant)
- INC-03 (procedures tenant vs global)
- MNQ-08 (pas de verrouillage optimiste)
- MNQ-09 (permissions trop grossieres)

**Amelioration:**
- INC-06 (enums sans contraintes)
- MNQ-04 (semesters incomplet)
- MNQ-14 (pas d'audit updatedBy)
- MNQ-21/22 (seed incomplet)
- ZO-04 (workflow grade documente)
