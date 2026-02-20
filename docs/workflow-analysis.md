# Analyse Complète du Workflow — Grades Manager

> Généré le 2026-02-19. Analyse exhaustive du backend et du frontend sans modifications du code.

---

## Table des matières

1. [Vue d'ensemble de l'application](#1-vue-densemble-de-lapplication)
2. [Ce qui est en place](#2-ce-qui-est-en-place)
3. [Workflows métier analysés](#3-workflows-métier-analysés)
4. [Incohérences critiques](#4-incohérences-critiques)
5. [Manquements fonctionnels](#5-manquements-fonctionnels)
6. [Problèmes de sécurité et d'autorisation](#6-problèmes-de-sécurité-et-dautorisation)
7. [Problèmes de cohérence du schéma](#7-problèmes-de-cohérence-du-schéma)
8. [Désynchronisation Frontend / Backend](#8-désynchronisation-frontend--backend)
9. [Problèmes de performance](#9-problèmes-de-performance)
10. [Code incomplet ou temporaire](#10-code-incomplet-ou-temporaire)
11. [Dette technique](#11-dette-technique)
12. [Synthèse et priorités](#12-synthèse-et-priorités)

---

## 1. Vue d'ensemble de l'application

### Architecture générale

| Couche | Technologie | Statut |
|--------|-------------|--------|
| Backend API | Hono + tRPC + Drizzle ORM + PostgreSQL | En place |
| Frontend | React + Vite + TailwindCSS v4 + shadcn/ui | En place |
| Auth | Better-Auth (email/password + organisation) | En place |
| Multi-tenant | Organisations Better-Auth + institutions personnalisées | Partiel |
| Background jobs | Bun timers (no queue) | En place mais limité |
| Notifications | Table DB + job de flush | En place mais non fonctionnel |
| Export | Handlebars templates + PDF | En place |
| Règles de promotion | json-rules-engine | Partiellement branché |

### Rôles utilisateurs

```
owner > super_admin > administrator > dean > teacher > staff > student
```

| Rôle | Portail | Accès principal |
|------|---------|-----------------|
| super_admin / administrator | /admin | Tout |
| dean | /dean | Validation, monitoring |
| teacher | /teacher | Cours, notes, workflows |
| student | /student | Tableau de bord personnel |

---

## 2. Ce qui est en place

### Backend — Modules existants (30+)

- `academic-years` — CRUD + activation (superAdmin)
- `authz` — Hiérarchie de rôles, snapshots de permissions
- `class-courses` — Affectation cours/classe/enseignant
- `classes` — Cohortes (promotion/classe)
- `courses` — Catalogue de cours
- `cycle-levels` — Niveaux de cycle (L1, L2, M1...)
- `domain-users` — Profils métier liés aux comptes Better-Auth
- `enrollments` — Inscriptions annuelles des étudiants
- `exam-grade-editors` — Délégation de saisie de notes
- `exam-scheduler` — Planification en masse des examens
- `exam-types` — Catalogue des types (CC, TP, DS...)
- `exams` — Examens planifiés par class-course
- `export-templates` — Templates Handlebars pour PV, évaluations, UE
- `exports` — Génération de documents (PV, évaluations, UE)
- `files` — Upload/suppression (local ou cloud)
- `grades` — Notes : saisie, import CSV, calculs
- `institutions` — Métadonnées d'établissement (multilingue)
- `notifications` — File de notifications (email/webhook)
- `program-options` — Options au sein des programmes
- `programs` — Programmes d'études
- `promotion-rules` — Règles de promotion configurables en BDD
- `promotions` — Évaluation d'éligibilité à la promotion
- `registration-numbers` — Formats de numéros d'immatriculation
- `rules-engine` — Moteur de règles json-rules-engine
- `semesters` — Catalogue des semestres
- `student-course-enrollments` — Inscriptions aux cours
- `student-credit-ledger` — Suivi des crédits
- `students` — Gestion des étudiants
- `study-cycles` — Cycles d'études (Licence, Master)
- `teaching-units` — UE (Unités d'enseignement)
- `users` — Gestion des comptes utilisateurs
- `workflows` — Validation de notes, fenêtres d'inscription, alertes

### Frontend — Pages existantes (47 pages)

**Admin (26 routes) :**
- Dashboard, AcademicYears, Classes, ClassCourses, Courses, Students
- Exams, ExamTypes, ExamScheduler
- ExportTemplates, ExportTemplateEditor, GradeExport
- Programs, StudyCycles, TeachingUnits, TeachingUnitDetail
- Users, Enrollments, Institution, RegistrationNumbers
- MonitoringDashboard, Notifications
- StudentPromotion, PromotionRules (5 sous-routes), RuleManagement

**Teacher (7 routes) :**
- Dashboard, CourseList, GradeEntry, GradeEntry(/:courseId)
- AttendanceAlerts, WorkflowManager

**Dean (2 routes) :**
- MonitoringDashboard, WorkflowApprovals

**Student (1 route) :**
- PerformanceDashboard

---

## 3. Workflows métier analysés

### 3.1 Workflow de création d'un étudiant

**Étapes attendues :**
1. Admin crée un compte utilisateur (Better-Auth)
2. Admin crée un profil domaine (`domain-users`)
3. Admin crée l'étudiant (`students.create`) → génère numéro d'immatriculation
4. Admin inscrit l'étudiant à une classe pour l'année académique (`enrollments.create`)
5. Auto-inscription aux cours de la classe (`student-course-enrollments.autoEnrollClass`)
6. Mise à jour du ledger de crédits

**Ce qui fonctionne :** Étapes 3 à 5 en partie.

**Ce qui manque :**
- L'étape 1 (création du compte) et l'étape 2 (profil domaine) ne sont pas liées automatiquement lors de la création d'un étudiant via `students.create`. L'étudiant est créé avec un `domainUserId` qui doit exister en amont, mais aucun flux ne guide l'admin pour créer d'abord le compte auth.
- L'auto-inscription aux cours (étape 5) est une action séparée, non déclenchée automatiquement après l'inscription annuelle.
- La mise à jour du ledger (étape 6) est appelée depuis `students.service.ts` mais **en dehors de la transaction** Drizzle — si elle échoue, l'étudiant existe sans crédits.

---

### 3.2 Workflow de saisie de notes

**Étapes attendues :**
1. Enseignant sélectionne un class-course (son cours affecté à une classe)
2. Enseignant crée un examen (ou utilise un examen planifié)
3. Enseignant saisit les notes pour chaque étudiant inscrit
4. Enseignant soumet l'examen (`exams.submit`)
5. Doyen/Admin valide (`exams.validate`)
6. Examen verrouillé (`exams.lock`) — manuellement ou par job auto

**Ce qui fonctionne :** Étapes 1–6 partiellement.

**Incohérences et manquements :**
- **Étape 2 :** Tout enseignant avec la permission `canGrade` peut créer un examen pour N'IMPORTE quel class-course, pas seulement les siens. Le service ne valide pas que le `classCourse.teacher === acteur`.
- **Étape 3 :** La vérification d'autorisation pour `upsertNote` / `updateNote` / `deleteNote` est entièrement dans la couche service (`ensureActorCanEditExam()`), pas dans le router. Si un appelant contourne le router (appel direct au service), l'autorisation est absente.
- **Étape 4 :** `submitExam()` valide que le statut est `draft` ou `scheduled`. Mais si l'examen est `rejected` après une première soumission, il peut être re-soumis sans correction obligatoire.
- **Étape 6 :** Le job `closeExpiredApprovedExams()` ne verrouille que les examens en statut `approved`. Si un examen est encore `submitted` à la date d'échéance, il n'est jamais fermé automatiquement. Un enseignant peut continuer à saisir des notes après la date d'examen.

---

### 3.3 Workflow de promotion

**Étapes attendues :**
1. Admin/règles configurent des règles de promotion (`promotionRules`)
2. Admin lance l'évaluation de la classe (`promotionRules.evaluateClass`)
3. Système évalue chaque étudiant selon les règles
4. Admin applique la promotion (`promotionRules.applyPromotion`)
5. Les étudiants promus passent au niveau supérieur

**Ce qui fonctionne :** Étapes 2 et 4 partiellement.

**Incohérences critiques :**
- Les règles stockées en base (`promotionRules.ruleset` en JSONB) ne sont **jamais chargées ni utilisées** lors de l'évaluation. Le moteur de règles (`rules-engine.ts`) utilise des règles hard-codées dans `default-rules.ts`.
- La page frontend `/admin/promotion-rules` affiche et édite les règles en base, mais ces règles n'ont aucun effet réel sur les promotions.
- `promotions.evaluateStudent` (utilisé sur le portail étudiant) appelle un service différent de `promotionRules.evaluateClass` (admin). Les deux coexistent sans convergence claire.
- L'étape 5 (mouvement réel de l'étudiant vers une nouvelle classe) n'est pas implémentée dans `applyPromotion`. La table `promotionExecutionResults` existe mais l'action de transfert de classe n'est pas exécutée.

---

### 3.4 Workflow d'inscription aux cours

**Étapes attendues :**
1. Admin ouvre une fenêtre d'inscription (`workflows.enrollmentWindow`)
2. Étudiants s'inscrivent aux cours (ou auto-inscription par admin)
3. Admin ferme la fenêtre
4. Les inscriptions aux cours génèrent des entrées dans `studentCourseEnrollments`

**Ce qui fonctionne :** Fenêtre d'inscription admin partielle.

**Manquements :**
- Il n'y a pas de portail étudiant pour que les étudiants s'inscrivent eux-mêmes aux cours pendant la fenêtre d'inscription. Seul un admin peut exécuter `autoEnrollClass`.
- `enrollmentWindows` est géré par le module `workflows`, mais le module `student-course-enrollments` n'y fait aucune référence. Il n'y a pas de validation que la fenêtre est ouverte avant d'inscrire un étudiant.
- Le changement de statut d'une inscription (`studentCourseEnrollments.updateStatus`) ne met **pas à jour** le ledger de crédits (`student-credit-ledger`). Les deux sont totalement décorrélés.

---

### 3.5 Workflow d'export (PV, évaluations)

**Ce qui fonctionne :** Templates Handlebars, génération PDF/HTML.

**Manquements :**
- La page frontend `GradeExport` côté admin et côté teacher existent toutes les deux. Les procédures backend qu'elles appellent (`exports.generatePV`, etc.) utilisent `gradingProcedure` sans filtre tenant. Si un enseignant appelle ces endpoints avec un `classCourseId` qui n'est pas le sien, il peut obtenir les données d'un autre.
- Aucun log d'export : on ne sait pas qui a exporté quoi et quand.

---

### 3.6 Workflow de notifications

**Ce qui fonctionne :** Création d'entrées en base, job de flush toutes les minutes.

**Problème critique :**
La fonction `sendPending()` dans `notifications.service.ts` **ne fait rien d'autre que marquer les notifications comme envoyées**. Il n'y a aucun appel à un service email (SMTP, SendGrid, etc.) ni à un webhook. Les notifications sont créées, "envoyées" immédiatement (statut = sent), mais personne ne les reçoit jamais.

---

## 4. Incohérences critiques

### 4.1 Rôles Better-Auth vs rôles domaine

- Better-Auth est configuré avec `adminRoles = ["admin"]` (lib/auth.ts ligne 21).
- Le système métier utilise : `super_admin`, `administrator`, `dean`, `teacher`, `staff`, `student`.
- Il n'y a **aucun mapping explicite** entre le rôle Better-Auth (`admin`) et les rôles domaine. L'autorisation réelle repose sur le champ `businessRole` du domaine utilisateur et le rôle de membre de l'organisation. Les deux coexistent sans pont documenté.

### 4.2 Le module `faculties` n'existe pas

- `CLAUDE.md` et plusieurs documents dans `/docs/` mentionnent des "faculties" comme entité hiérarchique (faculties → programs → studyCycles → classes).
- Il n'existe **aucun module `faculties`** dans `apps/server/src/modules/`.
- La hiérarchie réelle est : `institutions` → `programs` → `studyCycles` → `cycleLevels` → `classes`.
- La documentation est en décalage avec le code réel.

### 4.3 Deux évaluations de promotion indépendantes

- `promotions.evaluateStudent` : utilisé sur le dashboard étudiant, évalue un seul étudiant.
- `promotionRules.evaluateClass` : utilisé côté admin, évalue tous les étudiants d'une classe.
- Les deux appellent des chemins de code différents (services différents, moteurs différents). Il est possible qu'un étudiant soit éligible selon un chemin et non éligible selon l'autre.

### 4.4 Deux pages de gestion des examens pour les enseignants

- `apps/web/src/pages/teacher/ExamManagement.tsx` existe.
- `apps/web/src/pages/admin/ExamManagement.tsx` existe également.
- La route teacher pour les examens n'est **pas déclarée dans `App.tsx`**. Elle existe comme fichier mais n'est référencée dans aucune route. La page enseignant pour les examens est inaccessible.

### 4.5 Deux pages de gestion des programmes côté enseignant

- `apps/web/src/pages/teacher/ProgramManagement.tsx` (860 lignes) existe et gère CRUD de programmes, cours, facultés.
- Les enseignants ne devraient pas avoir accès à la gestion du catalogue (seuls admin/dean ont `canManageCatalog`).
- Cette page n'est pas dans les routes de `App.tsx` mais son existence témoigne d'une confusion sur les responsabilités des rôles.

### 4.6 Pages teacher non routées

Les fichiers suivants existent dans `apps/web/src/pages/teacher/` mais **n'ont aucune route déclarée** dans `App.tsx` :
- `ExamManagement.tsx`
- `ProgramManagement.tsx`
- `StudentManagement.tsx` (466 lignes)
- `ClassCourseManagement.tsx`
- `GradeExport.tsx`

Ces pages sont soit du code mort, soit des fonctionnalités prévues mais non intégrées.

### 4.7 `users.ban` et `users.unban` appelés depuis le frontend mais absents du router

- `UserManagement.tsx` appelle `users.ban.mutate()` et `users.unban.mutate()`.
- Le router `users.router.ts` expose : `list`, `createProfile`, `updateProfile`, `deleteProfile`.
- Il n'y a **pas de procédure `ban` ou `unban`** dans le router users. Ces appels échoueront à l'exécution. La fonctionnalité de bannissement est fournie par le plugin `admin` de Better-Auth mais n'est pas exposée via tRPC.

### 4.8 `grades.upsertMultiple` appelé depuis le frontend mais absent du router

- `GradeEntry.tsx` (teacher) appelle `grades.upsertMultiple`.
- `grades.router.ts` expose : `upsertNote`, `updateNote`, `deleteNote`, `importCsv`, `exportClassCourseCsv`, `listByExam`, `listByStudent`, `listByClassCourse`, `avgForExam`, `avgForCourse`, `avgForStudentInCourse`, `consolidatedByStudent`.
- Il n'y a **pas de procédure `upsertMultiple`**. La saisie de notes en masse (le cas d'usage principal de GradeEntry) n'existe pas côté backend.

### 4.9 `exams.lockGrades` et `exams.validateGrades` appelés depuis le frontend mais absent du router

- `GradeEntry.tsx` appelle `exams.lockGrades`.
- `WorkflowApprovals.tsx` (dean) appelle `workflows.validateGrades`.
- `exams.router.ts` expose `lock` (pas `lockGrades`) et `validate` (pas `validateGrades`).
- `workflows.router.ts` expose `validateGrades` — celui-là correspond. Mais `exams.lockGrades` ne correspond pas à `exams.lock`.

### 4.10 `examGradeEditors.add` et `examGradeEditors.remove` appelés depuis le frontend mais absents

- `GradeEntry.tsx` appelle `examGradeEditors.add` et `examGradeEditors.remove`.
- `exam-grade-editors.router.ts` expose : `list`, `assign`, `revoke`.
- Les noms ne correspondent pas (`add` ≠ `assign`, `remove` ≠ `revoke`). Ces appels échoueront.

### 4.11 `classCourses.search` — Résultats fusionnés sans ordre garanti

- `classCourses.search` fusionne les cours "propres" à l'enseignant et les cours délégués.
- Aucun tri garanti sur le résultat fusionné. L'UI peut afficher les cours dans un ordre aléatoire.

---

## 5. Manquements fonctionnels

### 5.1 Portail étudiant quasi-vide

Le portail `/student` ne comporte qu'**une seule page** (`PerformanceDashboard`), qui affiche :
- Progression des crédits (barre de progression)
- Éligibilité à la promotion (badge)
- Informations de classe/cycle

Ce qui **manque totalement** :
- Relevé de notes de l'étudiant (notes par cours, par examen)
- Emploi du temps / liste des cours
- Calendrier des examens
- Inscription aux cours (auto-service)
- Historique des promotions
- Documents téléchargeables (relevés, attestations)
- Messagerie ou notifications reçues
- Profil personnel (modification de données)

### 5.2 Suppression d'entités

Plusieurs entités n'ont **pas de route DELETE** :
- `students` — Pas de procédure delete côté router (ni service)
- `enrollments` — Pas de delete, uniquement `updateStatus`
- `studentCourseEnrollments` — Pas de delete directement exposé
- `grades` — `deleteNote` existe mais n'est pas invocable par bulk

Est-ce volontaire (soft-delete sémantique via statut) ou un oubli ? Aucun commentaire dans le code ne l'explique.

### 5.3 Annulation d'examen

La machine à états des examens est : `draft → scheduled → submitted → approved/rejected → locked`.

Il n'existe **pas d'état `cancelled`**. Un examen mal créé ne peut pas être annulé proprement. La seule option est la suppression (`exams.delete`), qui est réservée aux admins, et qui supprime les notes associées en cascade.

### 5.4 Réinscription / deuxième tentative d'un cours

Le schéma prévoit un champ `attempt` dans `studentCourseEnrollments` pour gérer les redoublements.

- Ce champ n'est **jamais incrémenté** automatiquement lors d'une réinscription.
- L'import CSV de notes ne vérifie pas le numéro de tentative : si un étudiant est inscrit deux fois au même cours (deux tentatives), les notes peuvent être importées sur la mauvaise tentative.
- Aucune interface dans le frontend ne permet de voir ou gérer les tentatives multiples.

### 5.5 Prérequis des cours non validés à l'inscription

Le schéma `coursePrerequisites` stocke les dépendances entre cours. Mais :
- `student-course-enrollments.service.ts` n'inclut **aucune vérification** des prérequis lors de l'inscription d'un étudiant à un cours.
- `class-courses.service.ts` valide que les cours prérequis sont affectés à la classe, mais pas que les chaînes de prérequis sont respectées (A → B → C : affecter C sans B passe).
- Pas de validation côté frontend non plus.

### 5.6 Alertes d'assiduité sans données réelles

La page `AttendanceAlerts.tsx` (teacher) est présente et affiche une interface. Le router `workflows.attendanceAlert` existe. Mais :
- Il n'y a **pas de module de suivi de présence** (pas de table `attendance` dans le schéma).
- L'alerte est envoyée dans le vide (notification sans données réelles de présence).
- Les données d'assiduité ne sont jamais collectées.

### 5.7 Import d'étudiants depuis CSV/XLSX

La page `StudentManagement.tsx` (admin) permet d'importer des étudiants depuis un fichier. Mais :
- La procédure `students.bulkCreate` existe, mais `students.import` (appelé dans l'UI) **n'existe pas** dans le router.
- L'import via fichier ne fonctionnera pas tel qu'implémenté.

### 5.8 Tableau de bord du doyen

Le doyen a accès à `/dean/workflows` uniquement. Il n'a **pas de vue dédiée** pour :
- Statistiques de sa faculté/programmes supervisés
- Vue globale des examens soumis à validation
- Alertes système (examen expiré, assiduité critique)

La page de monitoring existe (`/admin/monitoring`) mais n'est pas accessible au doyen depuis son portail.

### 5.9 Transfert d'étudiant entre classes

`classes.transferStudent` existe. Mais :
- Quand un étudiant est transféré, ses inscriptions aux cours (`studentCourseEnrollments`) de l'ancienne classe ne sont **pas migrées** vers la nouvelle.
- Les notes obtenues dans les cours de l'ancienne classe restent liées à l'ancienne `classCourseId`. Elles seront invisibles dans le nouveau contexte.
- Aucun mécanisme de gestion des crédits transférés lors du changement de classe interne.

---

## 6. Problèmes de sécurité et d'autorisation

### 6.1 [CRITIQUE] Autorisation des notes dans la couche service uniquement

- Les procédures `grades.upsertNote`, `grades.updateNote`, `grades.deleteNote` utilisent toutes `tenantProtectedProcedure`.
- N'importe quel utilisateur authentifié membre de l'organisation peut appeler ces endpoints au niveau router.
- La vérification réelle (est-ce que l'acteur peut éditer cet examen ?) est faite dans `grades.service.ts` via `ensureActorCanEditExam()`.
- Si un développeur appelle le service directement (dans un test, un job, un autre service), cette vérification est bypassée.
- Recommandé : déplacer la guard au niveau `tenantGradingProcedure` au minimum.

### 6.2 [CRITIQUE] Tout enseignant peut créer des examens pour tout class-course

- `exams.create` utilise `tenantGradingProcedure` (permission `canGrade`).
- Tous les enseignants ont `canGrade = true`.
- Le service `exams.service.ts` ne valide pas que `classCourse.teacherId === ctx.profile.id`.
- Un enseignant A peut créer des examens pour le cours d'un enseignant B.

### 6.3 [CRITIQUE] Isolation multi-tenant par filtres manuels uniquement

- Il n'y a **aucune Row Level Security (RLS)** sur la base PostgreSQL.
- Chaque repo doit manuellement filtrer par `institutionId`.
- Exemple : `grades.service.ts` appelle `examsRepo.findById(examId)` sans filtre d'institution. Si l'examId appartient à une autre institution, les données sont retournées. La validation arrive après.
- Un seul oubli dans un repo peut exposer des données cross-tenant.

### 6.4 [ÉLEVÉ] Exports PV/évaluations sans vérification de propriété

- `exports.generatePV`, `exports.generateEvaluation`, `exports.generateUE` utilisent `gradingProcedure`.
- Ces procédures reçoivent un `classCourseId` en paramètre.
- Aucune vérification que le `classCourseId` appartient bien à l'enseignant qui fait la requête.
- Un enseignant peut générer le PV des cours d'un autre enseignant.

### 6.5 [ÉLEVÉ] Profil domaine non scopé par organisation

- `domainUsersRepo.findByAuthUserId()` retourne le **premier** profil domaine trouvé.
- Si un utilisateur est membre de deux organisations (multi-tenant), son profil de la mauvaise organisation pourrait être utilisé.
- Pas de filtre `organizationId` dans la recherche de profil domaine lors de la création du contexte.

### 6.6 [MOYEN] Validation de l'organisation non vérifiée dans la relation institution

- `institutions.organizationId` est nullable et `ON DELETE SET NULL`.
- Si l'organisation Better-Auth est supprimée, l'institution perd sa référence organisation.
- Le contexte (`lib/context.ts`) cherche l'institution par `organizationId` — si null, aucune institution n'est trouvée.
- Toute l'API tenant devient inaccessible sans erreur claire.

### 6.7 [MOYEN] Logs d'audit des notes incomplets

- `gradeEditLogs` enregistre les modifications de notes.
- Mais seules les modifications faites par un **délégué** sont loggées (service grades.service.ts ligne ~437 : `if (access === "delegate")`).
- Les modifications faites par l'enseignant principal ou un admin ne sont **pas loggées**.
- Le schéma prévoit `gradeEditActorRoles = ["admin", "teacher", "delegate"]` mais le service n'utilise que "delegate".

---

## 7. Problèmes de cohérence du schéma

### 7.1 Cascade restrictive sur students → domainUsers

- `students.domainUserId` a `onDelete: "restrict"`.
- **Conséquence :** Supprimer un profil domaine échoue si l'utilisateur est un étudiant.
- Supprimer un compte Better-Auth → supprime le profil domaine ? → bloqué par l'étudiant → orphelin auth.
- Pas de flux de désinscription propre documenté.

### 7.2 Cascade restrictive sur students → classes

- `students.classId` a `onDelete: "restrict"`.
- **Conséquence :** Supprimer une classe échoue si des étudiants y sont encore affectés.
- Mais il n'y a pas de procédure "archiver une classe" qui déplacerait les étudiants d'abord.

### 7.3 `institutions.organizationId` nullable avec SET NULL

- Si l'organisation est supprimée, l'institution perd son `organizationId`.
- Toutes les données (étudiants, notes, examens) restent en base mais sont inaccessibles car le contexte tenant ne peut plus être résolu.
- Données orphelines sans mécanisme de récupération.

### 7.4 `enrollmentStatuses` ne contient pas `suspended`

- `domainStatuses` (pour les utilisateurs) inclut `suspended`.
- `enrollmentStatuses` inclut : `pending`, `active`, `completed`, `withdrawn` — **pas de `suspended`**.
- Incohérence avec la gestion des utilisateurs, impossible de suspendre une inscription sans la retirer.

### 7.5 Statut `planned` dans `studentCourseEnrollmentStatuses`

- Le statut `planned` est la valeur par défaut à la création.
- Aucune logique de transition de `planned` → `active` n'est implémentée dans le service.
- Les rapports et calculs de moyennes ne filtrent pas sur le statut de l'inscription : un cours `planned` est traité comme un cours `active`.
- Un étudiant planifié pour un cours futur apparaît dans les relevés de notes avec une note vide.

### 7.6 Validation du pourcentage d'examens sans contrainte base

- La règle métier est : la somme des pourcentages des examens d'un class-course = 100%.
- Cette validation est uniquement faite dans le service (`assertPercentageLimit()`).
- Il n'y a **pas de CHECK constraint** en base de données sur cette règle.
- Deux inserts simultanés peuvent chacun passer la validation de 100% et créer un total de 110%+.

### 7.7 Champ `attempt` dans `studentCourseEnrollments` jamais incrémenté

- Le champ `attempt` (integer, défaut 1) est prévu pour les redoublements.
- Les services `bulkCreateStudents`, `autoEnrollClass`, et `createEnrollment` ne le gèrent jamais.
- La valeur reste toujours à 1 même lors d'une réinscription.

### 7.8 `enrollments.exitedAt` mis à jour pour tout changement de statut

- `enrollments.service.ts` → `updateStatus()` : `exitedAt: new Date()` est set pour **tout** changement de statut, y compris passer à `active`.
- `exitedAt` devrait uniquement être set pour les statuts de fin (`completed`, `withdrawn`).
- Bug logique : une inscription active a une date de sortie.

### 7.9 Prérequis circulaires possibles

- `coursePrerequisites` : contrainte unique sur `(courseId, prerequisiteCourseId)`.
- Pas de check pour les cycles : A requiert B, B requiert A est possible en base.
- Pas de détection dans les services lors de la création d'un prérequis.

### 7.10 Enseignant par défaut (`courses.defaultTeacherId`) inutilisé

- `courses.defaultTeacherId` existe en schema (nullable).
- Les services `exams` et `class-courses` utilisent `classCourses.teacherId`.
- `courses.defaultTeacherId` n'est **jamais lu** dans la logique métier.
- Sa présence confuse laisse penser que l'affectation par défaut se propage, ce qui n'est pas le cas.

---

## 8. Désynchronisation Frontend / Backend

### 8.1 Procédures appelées depuis le frontend mais inexistantes côté backend

| Appel frontend | Fichier | Procédure backend existante ? |
|----------------|---------|-------------------------------|
| `users.ban` | UserManagement.tsx | ❌ Non |
| `users.unban` | UserManagement.tsx | ❌ Non |
| `grades.upsertMultiple` | GradeEntry.tsx | ❌ Non |
| `exams.lockGrades` | GradeEntry.tsx | ❌ (existe `exams.lock`) |
| `examGradeEditors.add` | GradeEntry.tsx | ❌ (existe `assign`) |
| `examGradeEditors.remove` | GradeEntry.tsx | ❌ (existe `revoke`) |
| `students.import` | StudentManagement.tsx | ❌ (existe `bulkCreate`) |

### 8.2 Pages existantes mais non routées dans App.tsx

| Fichier page | Route déclarée ? |
|--------------|-----------------|
| `teacher/ExamManagement.tsx` | ❌ Non |
| `teacher/ProgramManagement.tsx` | ❌ Non |
| `teacher/StudentManagement.tsx` | ❌ Non |
| `teacher/ClassCourseManagement.tsx` | ❌ Non |
| `teacher/GradeExport.tsx` | ❌ Non |

### 8.3 Sélecteur de cours dans GradeEntry — dépendance circulaire potentielle

- `GradeEntry.tsx` utilise deux refs : `autoSelectExam` et `manualCourseSelection` pour gérer la sélection automatique vs manuelle.
- Quand un `courseId` arrive via l'URL (`/teacher/grades/:courseId`), il auto-sélectionne le cours et le premier examen.
- Si la liste des examens change pendant que l'auto-sélection se produit, une boucle de re-render est possible (ref guard contre ça, mais fragile).

### 8.4 Dashboard admin — N+1 queries non résolues

```
Dashboard.tsx :
  institutions.list → ok
  programs.list → ok
  courses.list → ok
  exams.list → ok
  students.list → ok
  academicYears.list → ok
  Pour chaque programme avec l'année active :
    classes.list(programId) → N requêtes
    students.list(classId) → N×M requêtes
```

Un tableau de bord avec 10 programmes et 5 classes par programme génère **50+ requêtes** au chargement.

### 8.5 Dashboard enseignant — N+1 queries

```
teacher/Dashboard.tsx :
  classCourses.list → ok
  Pour chaque classCourse :
    classes.getById → N requêtes
    courses.getById → N requêtes
    programs.getById → N requêtes
    students.list(classId) → N requêtes
    exams.list(classCourseId) → N requêtes
```

Un enseignant avec 5 cours génère **25+ requêtes** au chargement.

### 8.6 Tri des rôles dans UserManagement.tsx

- L'UI propose un filtre par rôle avec options `admin` et `teacher`.
- Le système métier a 7 rôles : `super_admin`, `administrator`, `dean`, `teacher`, `staff`, `student`, `owner`.
- Le filtre ne couvre pas `dean`, `staff`, `student`, `super_admin`. Ces utilisateurs ne peuvent pas être trouvés par filtre de rôle.

### 8.7 Enregistrement après inscription (Register.tsx)

- Après un signup réussi, l'utilisateur est redirigé vers `/teacher`.
- Hardcodé : un nouvel inscrit est supposé être enseignant.
- Si un admin se crée un compte, il est redirigé vers `/teacher` alors qu'il devrait aller vers `/admin`.
- La redirection devrait se baser sur le rôle réel de l'utilisateur.

---

## 9. Problèmes de performance

### 9.1 Pas de backend pagination pour `semesters.list`

- `semesters.router.ts` retourne une liste sans pagination.
- Si les semestres prolifèrent, tous sont retournés en une seule requête.
- L'UI les charge dans des `<select>` — peut bloquer le rendu.

### 9.2 Pas de debounce systématique sur les recherches

- Plusieurs pages ont des champs de recherche.
- Certains debounce l'input (ClassManagement), d'autres non.
- Les recherches sans debounce déclenchent une requête par frappe.

### 9.3 Job background sans queue

- Les deux jobs (`closeExpiredApprovedExams`, `sendPending`) tournent sur des `setInterval` simples dans `lib/jobs.ts`.
- Si un job plante (exception non catchée), il s'arrête silencieusement.
- Pas de monitoring, pas d'alerting, pas de retry.
- Pas de queue pour garantir que les opérations sont exécutées exactement une fois.

### 9.4 `promotionRules.refreshClassSummaries` — opération lourde sans protection

- Cette procédure (`adminProcedure`) recalcule tous les résumés de promotion pour toutes les classes.
- Pas de limitation de débit, pas de lock distribué.
- Appels concurrents ou répétés peuvent saturer la base.

---

## 10. Code incomplet ou temporaire

### 10.1 Console.log de debug en production

**Fichier :** `apps/server/src/modules/exam-scheduler/exam-scheduler.service.ts`

```typescript
// Ligne ~44
console.log("[DEBUG preview] input:", input, "institutionId:", institutionId);
// Ligne ~50
console.log("[DEBUG preview] Found classes:", classes.length);
```

Expose des IDs d'institution et des données internes dans les logs serveur.

### 10.2 TODOs non résolus dans le frontend

**`apps/web/src/components/ui/dropzone.tsx` ligne ~450 :**
```typescript
// TODO: test if this actually works?
```

**`apps/web/src/components/ui/dropzone.tsx` ligne ~812 :**
```typescript
// TODO: add proper done transition
```

**`apps/web/src/pages/admin/ClassManagement.tsx` ligne ~149 :**
```typescript
// TODO: N+1 Query Problem - This fetches students for each class separately
// Better solution: Modify backend classes.list to include studentCount
// or create a batch endpoint that returns classes with student counts
```

### 10.3 Avertissements dans l'interface utilisateur sur des fonctionnalités non persistées

- La page des règles de promotion affiche un message indiquant que les surcharges de règles ne sont pas encore persistées et conseille d'exporter le JSON manuellement.
- Cette fonctionnalité est présentée comme disponible mais est incomplète.

### 10.4 Notifications jamais envoyées

- `notifications.service.ts` → `sendPending()` : marque les notifications comme envoyées sans les envoyer.
- Aucune configuration SMTP ou webhook dans `lib/auth.ts` ou `index.ts`.
- Les webhooks dans le schéma (`notificationChannels: ["email", "webhook"]`) ne sont jamais traités différemment.

### 10.5 Moteur de règles hard-codé

- `modules/rules-engine/rules-engine.ts` charge des règles depuis `default-rules.ts`.
- `default-rules.ts` contient des règles statiques (crédits minimum, moyenne minimum).
- `promotionRules` en base de données n'est jamais injecté dans le moteur.
- La fonctionnalité de personnalisation des règles est une UI sans effet.

---

## 11. Dette technique

### 11.1 Schémas Zod dupliqués entre frontend et backend

- Le backend définit des schémas Zod dans `*.zod.ts` par module.
- Le frontend re-définit ses propres schémas Zod inline dans chaque composante de page.
- Les deux ensembles divergent : par exemple, les validations de longueur minimale peuvent différer.
- Pas de package partagé `packages/shared-schemas` pour unifier.

### 11.2 Types tRPC non générés / non partagés

- Le client frontend utilise `trpcClient.resource.method.query()` avec les types inférés depuis `AppRouter`.
- Mais `trpc.ts` côté frontend définit `trpc` comme options proxy et `trpcClient` comme client pur, créant deux façons d'appeler la même API.
- Certaines pages utilisent `useQuery({ ...trpc.resource.list.queryOptions() })`, d'autres `trpcClient.resource.list.query()` directement. Pas de pattern unifié.

### 11.3 Mutations sans invalidation de cache systématique

- Certaines mutations invalidant leur cache (`queryClient.invalidateQueries(...)`), d'autres non.
- Exemple dans GradeEntry : après sauvegarde des notes, le cache de `grades.listByExam` peut ne pas être invalidé correctement, laissant des données stales à l'écran.

### 11.4 i18n — Clés manquantes avec fallback hardcodé

- Plusieurs composants utilisent `t("key", { defaultValue: "Fallback text" })`.
- Cela masque les clés de traduction manquantes au lieu de les signaler.
- Exemples : `t("teacher.courses.delegatedBadge", { defaultValue: "Delegated" })`.
- Le français peut ne pas avoir ces clés de fallback, rendant l'UI en anglais dans une session française.

### 11.5 Authentification : session utilisateur doublon entre Zustand et Better-Auth

- La session Better-Auth est maintenue par le cookie httpOnly.
- Le store Zustand persiste aussi `user` en localStorage.
- Si le cookie expire (session expirée), le store Zustand a encore l'utilisateur → l'UI pense que l'utilisateur est connecté mais les requêtes API échoueront avec 401.
- Pas de gestion globale de l'erreur 401 qui forcerait un logout et nettoyage du store.

### 11.6 Erreurs tRPC non catchées globalement

- `trpc.ts` a un `onError` sur le QueryClient, mais uniquement pour les queries.
- Les mutations n'ont pas d'handler global d'erreur.
- Chaque mutation doit définir son propre `onError`, ce qui n'est pas toujours fait.

### 11.7 Pas d'Error Boundaries React

- Aucune page n'utilise de `ErrorBoundary` React.
- Si une query retourne une erreur inattendue, le composant peut crasher silencieusement ou afficher un écran blanc.

---

## 12. Synthèse et priorités

### Problèmes bloquants (fonctionnalité cassée)

| # | Problème | Fichiers concernés |
|---|----------|--------------------|
| B1 | `grades.upsertMultiple` n'existe pas — saisie de notes enseignant cassée | `GradeEntry.tsx`, `grades.router.ts` |
| B2 | `users.ban` / `users.unban` n'existent pas — UI UserManagement cassée | `UserManagement.tsx`, `users.router.ts` |
| B3 | `examGradeEditors.add/remove` n'existent pas — délégation cassée | `GradeEntry.tsx`, `exam-grade-editors.router.ts` |
| B4 | `students.import` n'existe pas — import CSV étudiant cassé | `StudentManagement.tsx`, `students.router.ts` |
| B5 | Notifications jamais envoyées | `notifications.service.ts` |
| B6 | Règles de promotion en BDD jamais utilisées | `rules-engine.ts`, `default-rules.ts` |

### Problèmes de sécurité critiques

| # | Problème | Fichiers concernés |
|---|----------|--------------------|
| S1 | Tout enseignant peut créer des examens pour tous les cours | `exams.service.ts`, `exams.router.ts` |
| S2 | Autorisation notes dans service uniquement, bypassable | `grades.service.ts`, `grades.router.ts` |
| S3 | Exports sans vérification propriété du class-course | `exports.service.ts`, `exports.router.ts` |
| S4 | Pas de RLS en base — isolation manuelle uniquement | Tous les repos |
| S5 | Console.log d'IDs institution en production | `exam-scheduler.service.ts` |

### Incohérences majeures

| # | Problème | Impact |
|---|----------|--------|
| I1 | Pages teacher non routées (5 fichiers) | Code mort ou fonctionnalités manquantes |
| I2 | Deux systèmes d'évaluation de promotion indépendants | Résultats potentiellement contradictoires |
| I3 | `enrollments.exitedAt` set sur tout changement de statut | Données corrompues |
| I4 | Champ `attempt` jamais incrémenté | Redoublements non tracés |
| I5 | Statut `planned` traité comme `active` dans les rapports | Calculs de moyennes faussés |
| I6 | Redirection hardcodée vers `/teacher` après inscription | Mauvaise redirection pour admins |

### Fonctionnalités manquantes à haute valeur

| # | Manquement | Effort estimé |
|---|------------|---------------|
| M1 | Portail étudiant : relevé de notes | Moyen |
| M2 | Portail étudiant : calendrier examens | Faible |
| M3 | Auto-inscription aux cours lors de l'inscription annuelle | Faible |
| M4 | État `cancelled` pour les examens | Faible |
| M5 | Gestion des tentatives multiples (redoublement) | Élevé |
| M6 | Logs d'audit complets (admin + teacher + delegate) | Faible |
| M7 | Alertes de session expirée + logout automatique | Faible |
| M8 | Vérification des prérequis à l'inscription | Moyen |

---

*Fin de l'analyse. Ce document recense l'état actuel du code sans apporter de modifications. Toutes les références à des lignes de code sont approximatives et basées sur l'exploration statique.*
