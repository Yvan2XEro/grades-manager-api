# Audit complet — Fonctionnalités manquantes et incomplètes

## Résumé exécutif

L'application grades-manager-api dispose d'une base solide (architecture modulaire, schéma DB riche, exports PDF existants, gestion des rattrapages), mais présente **des lacunes significatives** pour un système de gestion des notes complet. Ce document inventorie tout ce qui manque, est incomplet ou nécessite une correction.

### Tableau de synthèse

| Sévérité | Nombre | Description |
|----------|--------|-------------|
| 🔴 Critique | 6 | Fonctions de base absentes ou cassées |
| 🟠 Important | 11 | Fonctions attendues incomplètes |
| 🟡 Moyen | 10 | Améliorations significatives manquantes |
| 🔵 Mineur | 8 | Nice-to-have et polish |

> **Note** : La génération de documents académiques officiels (relevés de notes, attestations de réussite, diplômes) est gérée par l'application **DIPLOMATION** (système externe). grades-manager-api fournit uniquement les données via des exports Excel. Voir `docs/integration-diplomation.md` pour les détails.

---

## Table des matières

1. [Backend — Modules manquants](#1-backend--modules-manquants)
2. [Backend — Modules incomplets](#2-backend--modules-incomplets)
3. [Backend — Problèmes de schéma DB](#3-backend--problèmes-de-schéma-db)
4. [Backend — Logique métier manquante](#4-backend--logique-métier-manquante)
5. [Backend — Tests](#5-backend--tests)
6. [Backend — Code à corriger](#6-backend--code-à-corriger)
7. [Frontend — Pages manquantes](#7-frontend--pages-manquantes)
8. [Frontend — Pages incomplètes](#8-frontend--pages-incomplètes)
9. [Configuration et infrastructure](#9-configuration-et-infrastructure)
10. [Sécurité et autorisations](#10-sécurité-et-autorisations)
11. [Performance](#11-performance)
12. [Plan de résolution priorisé](#12-plan-de-résolution-priorisé)

---

## 1. Backend — Modules manquants

### 1.1 🔴 Module Délibérations — ABSENT

**Statut** : Non implémenté
**Impact** : Critique — C'est le processus central de validation officielle des résultats

Le système ne dispose d'aucun mécanisme de délibération. Les PV sont générés directement depuis les notes brutes sans passage par un jury.

**Ce qui manque** :
- Pas de table `deliberations` ni de gestion du cycle de vie (draft → open → closed → signed)
- Pas de décisions officielles par étudiant (admis, ajourné, redoublant, exclu)
- Pas de décisions par UE avec validation/compensation du jury
- Pas de composition du jury ni de signatures
- Pas d'audit trail des surcharges manuelles
- Pas de mentions officielles validées par le jury

**Référence** : Un design complet existe dans `docs/deliberations-design.md`

---

### 1.2 🔴 Module Présence/Assiduité — ABSENT

**Statut** : Stub frontend uniquement
**Fichier frontend** : `apps/web/src/pages/teacher/AttendanceAlerts.tsx`

**Ce qui existe** :
- Un endpoint `workflows.attendanceAlert` dans le router (envoi d'alertes)
- Une page frontend basique qui appelle cet endpoint

**Ce qui manque** :
- Aucune table `student_attendance` dans le schéma
- Aucun enregistrement de présence/absence par séance
- Aucun calcul de taux de présence
- Aucun impact de l'assiduité sur les notes ou la validation
- Aucune feuille d'appel ou émargement
- Le frontend utilise un `classCourseId` hardcodé à `""` (cassé)

---

### 1.3 ℹ️ Documents académiques officiels — HORS PÉRIMÈTRE

> **Relevés de notes, attestations de réussite, diplômes** : Ces documents sont générés par l'application externe **DIPLOMATION** (SGN-Notes). grades-manager-api exporte les données au format Excel attendu par DIPLOMATION.
>
> Voir `docs/integration-diplomation.md` pour le mapping complet des colonnes et le plan d'export.
>
> La fonction `grades.service.getStudentTranscript()` reste utile pour **l'affichage interne** des notes dans le frontend (dashboard étudiant), mais la génération de PDF officiels n'est pas dans le périmètre de cette application.

---

### 1.4 🔴 Module Statistiques et Analytiques — ABSENT

**Statut** : Non implémenté
**Impact** : Pas de visibilité sur les performances des classes/programmes

**Ce qui manque** :
- Pas de calcul de moyenne de classe
- Pas de distribution des notes (histogramme)
- Pas de classement des étudiants (rang)
- Pas de taux de réussite par cours/UE/classe
- Pas de comparaison inter-classes ou inter-années
- Pas de tableau de bord analytique
- Pas d'indicateurs de performance clés (KPI) par programme

---

### 1.5 🟠 Module Prérequis de cours — TABLE INUTILISÉE

**Statut** : Table DB définie, aucune implémentation
**Fichier** : `apps/server/src/db/schema/app-schema.ts` (lignes 728-751)

**Ce qui existe** :
- Table `coursePrerequisites` avec champs `courseId`, `prerequisiteCourseId`, `type`, `minGrade`

**Ce qui manque** :
- Aucun router, service, ou repo
- Aucune validation lors de l'inscription aux cours
- Aucune vérification que l'étudiant a validé le prérequis avant de s'inscrire
- Aucune UI pour configurer les prérequis

---

### 1.6 🟠 Module Calendrier académique — MINIMAL

**Statut** : Seules les dates start/end des années académiques existent

**Ce qui manque** :
- Pas de périodes d'examens définies
- Pas de jours fériés/vacances
- Pas d'événements académiques (rentrée, fin de cours, délibérations)
- Pas de coordination des plannings d'examens (conflits horaires)
- Pas de gestion des salles/lieux d'examen

---

## 2. Backend — Modules incomplets

### 2.1 🔴 `domain-users` — Service et router manquants

**Statut** : Seul le `.repo.ts` existe
**Fichier** : `apps/server/src/modules/domain-users/`

**Ce qui existe** :
- `domain-users.repo.ts` — Requêtes DB de base

**Ce qui manque** :
- `domain-users.router.ts` — Aucun endpoint API
- `domain-users.service.ts` — Aucune logique métier
- `domain-users.zod.ts` — Aucune validation
- Conséquence : la gestion des profils utilisateurs (enseignants, étudiants, personnel) n'a pas d'API complète

---

### 2.2 🔴 `grades` — Transcript incomplet

**Fichier** : `apps/server/src/modules/grades/grades.service.ts` (ligne 381+)

**Problème** : La fonction `getStudentTranscript()` est coupée/incomplète dans le code source.

**Ce qui manque dans le service grades** :
- Calcul de GPA (Grade Point Average) non pondéré et pondéré
- Validation des plages de notes (devrait être 0-20 mais pas vérifié partout)
- Arrondi/précision des notes non standardisé
- Pas de statut "Incomplet" pour une note (seulement `null` ou valeur numérique)

---

### 2.3 🟠 `exams` — Politiques académiques hardcodées

**Fichier** : `apps/server/src/modules/exams/exams.service.ts` (ligne 367)

**TODO dans le code** :
```typescript
// TODO(INST-SETTINGS): centralize academic policy resolution
// (passing threshold, retake attempts, etc.)
```

**Problème** : Les valeurs sont hardcodées :
- `DEFAULT_PASSING_GRADE = 10` — utilisé partout au lieu de lire la config institution
- `DEFAULT_REQUIRED_CREDITS = 60` — devrait dépendre du cycle/niveau
- Nombre max de tentatives de rattrapage — hardcodé à 2
- Pas de configuration par programme ou par cycle

---

### 2.4 🟠 `workflows` — Flux de validation incomplet

**Fichier** : `apps/server/src/modules/workflows/`

**Ce qui existe** :
- `validateGrades` — Approuve un examen et le verrouille
- `enrollmentWindow` — Ouvre/ferme les inscriptions
- `attendanceAlert` — Envoie une alerte (stub)

**Ce qui manque** :
- Pas de workflow multi-niveaux (enseignant → chef de département → doyen → registraire)
- Pas de rejet avec commentaire/feedback
- Pas de cycle de révision (soumission → rejet → correction → re-soumission)
- Pas de suivi de l'état du workflow
- Pas d'escalade automatique (timeout)

---

### 2.5 🟠 `notifications` — N'envoie rien

**Fichier** : `apps/server/src/modules/notifications/`

**Ce qui existe** :
- Table `notifications` dans le schéma
- File d'attente (`sendPending()` toutes les 1 minute dans les background jobs)
- Statut `pending` → `sent`

**Ce qui manque** :
- **Aucun envoi réel d'email** — le statut passe à "sent" sans rien envoyer
- Pas de configuration SMTP
- Pas d'envoi de SMS ou webhook
- Pas de templates d'email
- Pas de retry en cas d'échec
- Pas d'historique de délivrance
- Pas de préférences de notification par utilisateur

---

### 2.6 🟠 `export-templates` — Pas de validation des templates

**Ce qui existe** :
- CRUD complet pour les templates Handlebars
- Templates par défaut pour PV, Evaluation, UE

**Ce qui manque** :
- Aucune validation syntaxique du Handlebars à la sauvegarde
- Pas de preview avec données de test avant activation
- Pas d'export Excel (seulement PDF/HTML)

> Note : Les templates pour bulletins individuels, attestations et diplômes ne sont pas dans le périmètre — ces documents sont générés par DIPLOMATION.

---

### 2.7 🟠 `batch-jobs` — Framework incomplet

**Ce qui existe** :
- Infrastructure de jobs avec création, exécution, rollback
- 2 types de jobs : `credit-ledger-recompute`, `student-facts-refresh`

**Ce qui manque** :
- Pas d'interface pour voir la progression des jobs
- Pas de planification automatique (cron)
- Pas de retry en cas d'échec
- Pas de timeout des jobs bloqués
- Pas de notifications de fin/échec de job

---

### 2.8 🟡 `registration-numbers` — Risque de race condition

**Fichier** : `apps/server/src/modules/registration-numbers/`

**Problème** : L'incrémentation du compteur (`registrationNumberCounters`) n'est pas protégée contre les accès concurrents. Deux inscriptions simultanées pourraient obtenir le même numéro.

**Ce qui manque** :
- Lock optimiste ou `SELECT ... FOR UPDATE`
- Pas de régénération en lot si le format change
- Pas de validation que les numéros existants respectent le format

---

### 2.9 🟡 `student-promotion-summaries` — Pas de mise à jour automatique

**Problème** : Les résumés de promotion (`studentPromotionSummaries`) ne sont **pas recalculés automatiquement** quand une note change. Il faut un refresh manuel via `refreshClassSummaries`.

**Impact** :
- Les données de promotion peuvent être obsolètes
- Les exports DIPLOMATION utilisent des données potentiellement périmées
- Le calcul de crédits peut ne pas refléter les dernières notes

**Ce qui manque** :
- Trigger automatique après modification de note
- Invalidation du cache quand une note change
- Indicateur de fraîcheur des données

---

### 2.10 🟡 `rules-engine` — Implémentation minimale

**Fichier** : `apps/server/src/modules/rules-engine/` (3 fichiers, ~382 lignes)

**Ce qui existe** :
- Wrapper basique autour de json-rules-engine
- Quelques règles d'exemple

**Ce qui manque** :
- Pas d'interface pour créer des règles personnalisées
- Pas de validation complète des rulesets
- Pas de simulation/test de règles avec des données fictives
- Pas de documentation des facts disponibles

---

## 3. Backend — Problèmes de schéma DB

### 3.1 Tables définies mais inutilisées

| Table | Localisation dans le schéma | Problème |
|-------|---------------------------|----------|
| `coursePrerequisites` | lignes 728-751 | Aucun module ne l'utilise |
| `classCourseAccessLogs` | — | Logging minimal, pas exploité |

### 3.2 Champs manquants dans les tables existantes

| Table | Champ manquant | Raison |
|-------|---------------|--------|
| `courses` | `isActive` (boolean) | Impossible de désactiver un cours sans le supprimer |
| `courses` | `nameEn` (text) | Pas de traduction anglaise pour l'export DIPLOMATION |
| `programs` | `nameEn` (text) | Idem |
| `programOptions` | `nameEn` (text) | Idem |
| `studyCycles` | `nameEn` (text) | Idem |
| `classes` | `capacity` (integer) | Pas de limite d'inscription par classe |
| `classes` | `status` (text) | Pas de statut ouvert/fermé/archivé |
| `domainUsers` | `middleName` (text) | Pas de deuxième prénom |
| `students` | `photoUrl` (text) | Pas de photo d'étudiant |
| `enrollmentWindows` | `notes` (text) | Pas de raison pour l'ouverture/fermeture |
| `exams` | `room` (text) | Pas de salle d'examen |
| `exams` | `duration` (integer) | Pas de durée d'examen (seulement dans la config institution) |

### 3.3 Index manquants

| Table | Index manquant | Impact |
|-------|---------------|--------|
| `students` | `registrationNumber` | Recherche lente par matricule |
| `grades` | `(student, exam, createdAt)` | Performance des requêtes de notes |
| `enrollments` | `(classId, academicYearId, status)` | Filtrage des inscriptions actives |
| `classCourses` | `(classId, semesterId)` | Requêtes fréquentes dans les exports |

### 3.4 Données redondantes

| Redondance | Tables impliquées | Problème |
|-----------|-------------------|----------|
| Données d'admission | `enrollments.admissionType` + `enrollments.admissionMetadata` | Les mêmes infos sont stockées en colonne ET en JSONB |
| Nom de classe | `studentPromotionSummaries.className` + `classes.name` | Snapshot dupliqué qui peut diverger |
| Code programme | `studentPromotionSummaries.programCode` + `programs.code` | Idem |

### 3.5 Champs JSONB non typés/non indexés

| Table | Champ JSONB | Problème |
|-------|-------------|----------|
| `studentPromotionSummaries.facts` | Blob de 50+ KB par enregistrement | Pas d'index GIN, requêtes lentes |
| `studentPromotionSummaries.averagesByTeachingUnit` | Record non indexé | Impossible de filtrer par UE |
| `examScheduleRuns.classIds` | Array de class IDs | Pas d'intégrité référentielle |
| `promotionExecutionResults.rulesMatched` | Array de strings | Pas de validation |
| `batchJobs.metadata` | Arbitraire | Pas de typage |

---

## 4. Backend — Logique métier manquante

### 4.1 🔴 Accès étudiant à ses propres notes

**Statut** : Non implémenté

Aucun endpoint ne permet à un étudiant de :
- Voir ses notes par examen
- Voir ses moyennes par cours et par UE
- Voir son relevé de notes
- Voir son classement dans la classe
- Voir ses crédits obtenus et restants

Le frontend a un `PerformanceDashboard` mais il utilise des données de placeholder.

---

### 4.2 🟠 Calcul de moyennes incomplet

**Ce qui existe** :
- Moyenne par UE dans `student-facts.service` (pondérée par coefficients)
- Moyenne générale dans `studentPromotionSummaries` (pondérée par crédits)

**Ce qui manque** :
- Pas de moyenne semestrielle explicite
- Pas de moyenne annuelle distincte (combinant S1 + S2)
- Pas de GPA cumulatif sur plusieurs années
- Pas de distinction moyenne pondérée / non pondérée dans les exports
- Pas de gestion des bonus/malus (assiduité, projet, etc.)

---

### 4.3 🟠 Compensation entre UE — Non implémenté

**Contexte** : Dans le système LMD, une UE avec une moyenne < 10 peut être "compensée" si la moyenne générale est ≥ 10 et que la note de l'UE est au-dessus d'un seuil minimum (ex: 8/20).

**Statut** : Le concept existe dans le design des délibérations mais pas dans le code actuel. Les exports PV marquent simplement "Nac" sans vérifier si une compensation est possible.

---

### 4.4 🟡 Gestion des examens de substitution/report

**Ce qui manque** :
- Pas de notion d'examen reporté (étudiant absent pour raison valable)
- Pas de distinction entre absence justifiée et injustifiée
- Pas de note "ABI" (Absent Injustifié = 0) vs "ABJ" (Absent Justifié = report)

---

### 4.5 🟡 Validation des notes à la saisie

**Ce qui manque** :
- Pas de vérification que la note est dans l'échelle de l'institution (0-20 par défaut, mais certains cours pourraient être sur 40 ou 100)
- Pas de vérification de cohérence (un CC à 18 et un examen à 2 est suspect)
- Pas d'alerte pour les notes anormalement hautes ou basses
- Pas de blocage de saisie après la date limite

---

### 4.6 🟡 Gestion du redoublement

**Ce qui manque** :
- Pas de suivi du nombre de redoublements consécutifs
- Pas de règle d'exclusion automatique après N redoublements
- Pas de report des UE validées d'une année précédente (capitalisation)
- Pas de gestion des dettes (UE à repasser)

---

### 4.7 🟡 Capitalisation des UE

**Contexte** : Dans le LMD, un étudiant qui redouble conserve les UE déjà validées. Il ne repasse que les UE non acquises.

**Statut** : Non implémenté. Aucun mécanisme ne permet de :
- Marquer une UE comme "capitalisée" (validée l'année précédente)
- Exclure les UE capitalisées du calcul de la moyenne de l'année en cours
- Reporter automatiquement les crédits capitalisés

---

## 5. Backend — Tests

### 5.1 Modules sans aucun test

Les modules suivants n'ont **aucun fichier de test** :

| Module | Criticité | Impact |
|--------|-----------|--------|
| `cycle-levels` | 🟡 | CRUD basique, risque faible |
| `domain-users` | 🟠 | Module incomplet de toute façon |
| `institutions` | 🟠 | Config critique (export_config) |
| `notifications` | 🟠 | Aucune vérification du système de notification |
| `program-options` | 🟡 | CRUD basique |
| `promotion-rules` | 🔴 | Logique complexe de promotion non testée |
| `rules-engine` | 🟠 | Moteur de règles non testé |
| `student-credit-ledger` | 🔴 | Calcul de crédits non testé |
| `study-cycles` | 🟡 | CRUD basique |
| `workflows` | 🟠 | Flux de validation non testé |
| `batch-jobs` | 🟡 | Framework de jobs non testé |
| `export-templates` | 🟡 | Gestion de templates non testée |
| `exam-scheduler` | 🟠 | Planification non testée |
| `exam-types` | 🟡 | CRUD basique |
| `files` | 🟡 | Gestion de fichiers non testée |

### 5.2 Tests manquants critiques

| Scénario non testé | Module | Risque |
|-------------------|--------|--------|
| Soumission de notes concurrentes | `grades` | Données corrompues |
| Import CSV avec données invalides | `grades` | Erreurs silencieuses |
| Transition de statut d'examen invalide | `exams` | État incohérent |
| Calcul de crédits avec rattrapages | `student-credit-ledger` | Crédits erronés |
| Évaluation de règle avec edge cases | `promotion-rules` | Mauvaises décisions de promotion |
| Rollback de job en erreur | `batch-jobs` | Jobs bloqués |
| Race condition sur les numéros d'inscription | `registration-numbers` | Doublons |
| Export PV avec notes manquantes | `exports` | PDF incorrect |

---

## 6. Backend — Code à corriger

### 6.1 🔴 Console.log de debug en production

**Fichier** : `apps/server/src/modules/exam-scheduler/exam-scheduler.service.ts`
**Lignes** : 46, 52

```typescript
console.log("[DEBUG preview] input:", input, "institutionId:", institutionId);
console.log("[DEBUG preview] Found classes:", classes.length);
```

**Action** : Supprimer ces lignes ou les remplacer par un logger structuré.

---

### 6.2 🟠 TODO non résolu — Politique académique centralisée

**Fichier** : `apps/server/src/modules/exams/exams.service.ts`
**Ligne** : 367

```typescript
// TODO(INST-SETTINGS): centralize academic policy resolution
// (passing threshold, retake attempts, etc.)
```

**Impact** : Les seuils de réussite et limites de tentatives sont hardcodés dans tout le codebase au lieu d'utiliser la config institution.

---

### 6.3 🟠 TODO non résolu — Seed et organisations

**Fichier** : `apps/server/src/seed/runner.ts`
**Ligne** : 439

```typescript
// TODO (Phase 3b): This should eventually require organizations
// to be defined in seed YAML.
```

---

### 6.4 🟡 Frontend — classCourseId hardcodé

**Fichier** : `apps/web/src/pages/teacher/AttendanceAlerts.tsx`

```typescript
classCourseId: "" // hardcodé vide, ne fonctionnera jamais
```

---

## 7. Frontend — Pages manquantes

### 7.1 Pages qui n'existent pas

| Page manquante | Pour qui | Criticité | Description |
|---------------|----------|-----------|-------------|
| **Dashboard notes étudiant** | Étudiant | 🔴 | Voir ses notes, moyennes, crédits par semestre/année (affichage interne, pas de PDF — les documents officiels sont gérés par DIPLOMATION) |
| **Statistiques de classe** | Admin/Enseignant | 🟠 | Moyennes, distributions, taux de réussite |
| **Gestion de présence** | Enseignant | 🟠 | Saisie de présence, émargement |
| **Prérequis de cours** | Admin | 🟠 | Configuration des prérequis |
| **Calendrier académique** | Tous | 🟡 | Vue calendrier des événements |
| **Délibérations** | Admin/Jury | 🔴 | Tout le module (voir `docs/deliberations-design.md`) |
| **Gestion des facultés complète** | Admin | 🟠 | Le frontend existe mais pas le backend complet |
| **Page de profil utilisateur** | Tous | 🟡 | Modification du profil, photo, mot de passe |
| **Historique des modifications de notes** | Admin | 🟡 | Audit trail visuel |

---

## 8. Frontend — Pages incomplètes

### 8.1 🟠 Dashboard Étudiant — Placeholder

**Fichier** : `apps/web/src/pages/student/PerformanceDashboard.tsx` (lignes 172-201)

**Problème** : La section "Moyennes par cours" affiche un cadre en pointillés avec un message statique au lieu de données réelles.

```
┌ - - - - - - - - - - - - - - - ┐
  Detailed course averages will
  appear once instructors publish
  grades
└ - - - - - - - - - - - - - - - ┘
```

**Ce qui manque** :
- Appel tRPC pour récupérer les notes de l'étudiant connecté
- Affichage des moyennes par cours, par UE, par semestre
- Graphique de progression

---

### 8.2 🟠 Dashboard Monitoring — Données fictives

**Fichier** : `apps/web/src/pages/admin/MonitoringDashboard.tsx`

**Problème** : Les métriques affichées sont hardcodées ("3", "5") au lieu d'être récupérées depuis le backend.

---

### 8.3 🟡 Gestion des classes — N+1 Query

**Fichier** : `apps/web/src/pages/admin/ClassManagement.tsx`

**TODO dans le code** :
```
TODO: N+1 Query Problem - This fetches students for each class separately
```

**Impact** : Performance dégradée quand il y a beaucoup de classes.

---

### 8.4 🟡 Export de notes (GradeExport) — Texte français hardcodé

**Fichier** : `apps/web/src/pages/admin/GradeExport.tsx` (2135 lignes)

**Problème** : Du texte en français est hardcodé dans le composant au lieu d'utiliser le système i18n. Exemples : "Procès-Verbal", "Relevé de Notes", noms de colonnes dans les exports Excel.

---

## 9. Configuration et infrastructure

### 9.1 🟠 Variables d'environnement manquantes

Le fichier `.env` actuel ne contient que le minimum :

```env
CORS_ORIGINS=
BETTER_AUTH_SECRET=
DATABASE_URL=
```

**Configurations manquantes** :

| Variable | Usage | Impact |
|----------|-------|--------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envoi d'emails | Les notifications ne sont jamais envoyées |
| `LOG_LEVEL` | Niveau de logging | Pas de contrôle sur les logs |
| `REDIS_URL` | Cache | Pas de cache, tout frappe la DB |
| `PDF_TIMEOUT_MS` | Timeout Puppeteer | Risque de timeout sur gros PV |
| `MAX_UPLOAD_SIZE_MB` | Limite upload | Pas de protection |
| `RATE_LIMIT_*` | Rate limiting | Pas de protection contre les abus |
| `DEFAULT_LOCALE` | Langue par défaut | Hardcodé |

### 9.2 🟡 Valeurs hardcodées à externaliser

| Valeur | Localisation | Valeur actuelle | Devrait être |
|--------|-------------|-----------------|-------------|
| Note de passage | Multiples fichiers | `10` | `institution.metadata.export_config.grading.passing_grade` |
| Crédits requis | `student-credit-ledger` | `60` | `studyCycles.totalCreditsRequired` |
| Pagination par défaut | Multiples routers | `50` | Variable d'environnement |
| Max tentatives rattrapage | `exams.service.ts` | `2` | Config institution |
| Intervalle jobs de fond | `lib/jobs.ts` | `5 min` / `1 min` | Variables d'environnement |

### 9.3 🟡 Feature flags manquants

Seul le feature flag "retakes" existe (`isRetakesFeatureEnabled()`). Il manque :

| Feature flag | Usage |
|-------------|-------|
| `ENABLE_BATCH_JOBS` | Activer/désactiver les jobs de fond |
| `ENABLE_NOTIFICATIONS` | Activer/désactiver les notifications |
| `ENABLE_PREREQUISITES` | Activer la vérification des prérequis |
| `ENABLE_ATTENDANCE` | Activer le module présence |
| `ENABLE_ANALYTICS` | Activer les statistiques avancées |
| `ENABLE_DELIBERATIONS` | Activer le module délibérations |

---

## 10. Sécurité et autorisations

### 10.1 🟠 Scope des délégués non limité

**Problème** : Un délégué (`examGradeEditors`) qui a accès à un examen peut potentiellement accéder à des données d'autres examens du même cours si le contrôle de scope est insuffisant.

**Ce qui manque** :
- Vérification que le délégué n'accède qu'aux examens qui lui sont explicitement attribués
- Audit des accès délégués

### 10.2 🟡 Filtrage institution incomplet

**Problème** : Certaines requêtes ne filtrent pas systématiquement par `institutionId`, ce qui pourrait exposer des données d'autres institutions en contexte multi-tenant.

### 10.3 🟡 Pas de validation de rôle par classe/cours

**Problème** : Un enseignant avec `canGrade` peut potentiellement voir les notes de cours qui ne lui sont pas assignés. Le filtrage par `classCourses.teacher` existe dans le listing mais pas dans tous les endpoints de détail.

---

## 11. Performance

### 11.1 🟡 `studentPromotionSummaries.facts` — JSONB massif

**Problème** : Le champ `facts` stocke un objet JSON de 50+ KB par étudiant par année. Pour une classe de 100 étudiants, c'est ~5 MB chargé en mémoire à chaque requête de promotion.

**Solution** : Indexer les champs les plus requêtés ou séparer les facts dans une table dédiée.

### 11.2 🟡 Pas de couche de cache

**Problème** : Toutes les requêtes frappent directement PostgreSQL. Les données rarement modifiées (programmes, cours, UE) pourraient être cachées.

### 11.3 🟡 N+1 queries

**Localisations identifiées** :
- `ClassManagement.tsx` — Charge les étudiants par classe individuellement
- `exports.service.ts` — Charge les examens par cours individuellement dans la boucle PV
- `student-facts.service.ts` — Charge le transcript par étudiant dans la boucle de refresh

---

## 12. Plan de résolution priorisé

### Priorité 1 — Corrections immédiates (bugs/sécurité)

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 1.1 | Supprimer les `console.log` de debug | `exam-scheduler.service.ts` | 5 min |
| 1.2 | Fixer le `classCourseId` hardcodé | `AttendanceAlerts.tsx` | 15 min |
| 1.3 | Ajouter les index DB manquants | `app-schema.ts` | 30 min |
| 1.4 | Centraliser `DEFAULT_PASSING_GRADE` depuis la config institution | Multiples fichiers | 2h |

### Priorité 2 — Fonctionnalités critiques manquantes

| # | Action | Module | Effort |
|---|--------|--------|--------|
| 2.1 | Implémenter le module Délibérations | Nouveau module | 5-7 jours |
| 2.2 | Implémenter l'accès étudiant à ses notes (dashboard interne) | `grades` + frontend | 2-3 jours |
| 2.3 | Compléter `domain-users` (service + router) | `domain-users` | 1 jour |
| 2.4 | Implémenter l'export Excel pour DIPLOMATION | `diplomation-export` (nouveau) | 2-3 jours |
| 2.5 | Implémenter les statistiques de classe | Nouveau module ou extension `exports` | 2-3 jours |

### Priorité 3 — Modules à compléter

| # | Action | Module | Effort |
|---|--------|--------|--------|
| 3.1 | Ajouter les champs `nameEn` aux tables programmes/options/cycles | Schéma + migration | 1 jour |
| 3.2 | Implémenter la compensation entre UE | `exports` + `student-credit-ledger` | 2 jours |
| 3.3 | Activer l'envoi réel de notifications (email) | `notifications` | 2 jours |
| 3.4 | Implémenter le module présence/assiduité | Nouveau module | 3-4 jours |
| 3.5 | Activer les prérequis de cours | `coursePrerequisites` | 2 jours |
| 3.6 | Protéger les numéros d'inscription contre les race conditions | `registration-numbers` | 1 jour |
| 3.7 | Mettre à jour automatiquement les summaries après modification de note | `student-promotion-summaries` | 1 jour |

### Priorité 4 — Tests et qualité

| # | Action | Effort |
|---|--------|--------|
| 4.1 | Tests pour `promotion-rules` (logique critique) | 1 jour |
| 4.2 | Tests pour `student-credit-ledger` (calculs critiques) | 1 jour |
| 4.3 | Tests pour `exports` (PV avec edge cases) | 1 jour |
| 4.4 | Tests pour `workflows` | 0.5 jour |
| 4.5 | Tests pour `notifications` | 0.5 jour |

### Priorité 5 — Améliorations

| # | Action | Effort |
|---|--------|--------|
| 5.1 | Ajouter le feature flag system | 1 jour |
| 5.2 | Externaliser les valeurs hardcodées | 1 jour |
| 5.3 | Ajouter un layer de cache (Redis) | 2 jours |
| 5.4 | Workflow multi-niveaux de validation | 3-4 jours |
| 5.5 | Calendrier académique | 2-3 jours |
| 5.6 | Capitalisation des UE (redoublants) | 2 jours |
| 5.7 | Gestion du redoublement et exclusion | 2 jours |

---

## Annexe — Tableau récapitulatif par module

| Module | Router | Service | Repo | Zod | Tests | Statut |
|--------|--------|---------|------|-----|-------|--------|
| `academic-years` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `authz` | ✅ | ✅ | — | — | — | Complet (middleware) |
| `batch-jobs` | ✅ | ✅ | ✅ | ✅ | ❌ | Incomplet |
| `classes` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `courses` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `cycle-levels` | ✅ | ✅ | ✅ | ✅ | ❌ | Complet (non testé) |
| `domain-users` | ❌ | ❌ | ✅ | ❌ | ❌ | **Incomplet** |
| `enrollments` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `exam-scheduler` | ✅ | ✅ | ✅ | ✅ | ❌ | Fonctionnel (debug logs) |
| `exam-types` | ✅ | ✅ | ✅ | ✅ | ❌ | Complet (non testé) |
| `exams` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet (TODO hardcoded) |
| `export-templates` | ✅ | ✅ | ✅ | ✅ | ❌ | Fonctionnel |
| `exports` | ✅ | ✅ | ✅ | ✅ | ❌ | Fonctionnel (pas d'Excel) |
| `faculties` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `files` | ✅ | ✅ | — | — | ❌ | Fonctionnel |
| `grades` | ✅ | ✅ | ✅ | ✅ | ✅ | **Transcript incomplet** |
| `institutions` | ✅ | ✅ | ✅ | ✅ | ❌ | Complet (non testé) |
| `notifications` | ✅ | ✅ | ✅ | ✅ | ❌ | **N'envoie rien** |
| `program-options` | ✅ | ✅ | ✅ | ✅ | ❌ | Complet (non testé) |
| `programs` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `promotion-rules` | ✅ | ✅ | ✅ | ✅ | ❌ | Fonctionnel (non testé) |
| `registration-numbers` | ✅ | ✅ | ✅ | ✅ | ✅ | **Race condition** |
| `rules-engine` | — | ✅ | — | — | ❌ | Minimal |
| `semesters` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `student-course-enrollments` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `student-credit-ledger` | ✅ | ✅ | ✅ | — | ❌ | Fonctionnel (non testé) |
| `student-promotion-summaries` | ✅ | ✅ | ✅ | — | ❌ | **Pas de refresh auto** |
| `students` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `study-cycles` | ✅ | ✅ | ✅ | ✅ | ❌ | Complet (non testé) |
| `teaching-units` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `users` | ✅ | ✅ | ✅ | ✅ | ✅ | Complet |
| `workflows` | ✅ | ✅ | ✅ | ✅ | ❌ | **Incomplet** |
| **deliberations** | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| **attendance** | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| **statistics** | ❌ | ❌ | ❌ | ❌ | ❌ | **ABSENT** |
| **bulletin** | — | — | — | — | — | Hors périmètre (DIPLOMATION) |
