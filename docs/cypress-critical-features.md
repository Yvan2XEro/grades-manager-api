# Fonctionnalités Critiques à Tester avec Cypress

Ce document liste les fonctionnalités critiques du système de gestion des notes qui doivent être couvertes par des tests E2E Cypress.

## Priorité 1 - Fonctionnalités Core (Must Have)

### 1. Authentification et Autorisation
**Module**: `auth`
**Fichiers concernés**: `apps/web/src/pages/auth/`

#### Tests à implémenter:
- [ ] **Login administrateur**
  - Connexion réussie avec credentials valides
  - Redirection vers dashboard admin après connexion
  - Message d'erreur avec credentials invalides
  - Persistance de session après rafraîchissement

- [ ] **Login enseignant**
  - Connexion réussie
  - Redirection vers dashboard enseignant
  - Accès uniquement aux fonctionnalités autorisées

- [ ] **Login étudiant**
  - Connexion réussie
  - Accès uniquement au dashboard étudiant
  - Pas d'accès aux pages admin/enseignant

- [ ] **Déconnexion**
  - Logout correct
  - Redirection vers page de login
  - Session invalidée

### 2. Gestion des Notes (Grade Entry)
**Module**: `grades`, `exams`
**Fichiers concernés**: `apps/web/src/pages/teacher/GradeEntry.tsx`

#### Tests à implémenter:
- [ ] **Saisie de notes par l'enseignant**
  - Sélection d'un cours et d'un examen
  - Saisie de notes pour plusieurs étudiants
  - Validation des notes (0-20)
  - Sauvegarde réussie des notes
  - Message de confirmation

- [ ] **Modification de notes existantes**
  - Chargement des notes existantes
  - Modification d'une note
  - Sauvegarde de la modification
  - Vérification de la mise à jour

- [ ] **Verrouillage des notes**
  - Notes verrouillées après validation finale
  - Impossibilité de modifier des notes verrouillées
  - Message d'information approprié

### 3. Gestion des Étudiants
**Module**: `students`
**Fichiers concernés**: `apps/web/src/pages/admin/StudentManagement.tsx`

#### Tests à implémenter:
- [ ] **Création d'étudiant**
  - Remplissage du formulaire complet
  - Sélection d'une classe
  - Génération automatique du numéro d'enregistrement
  - Vérification de la création dans la liste

- [ ] **Importation en masse d'étudiants**
  - Upload d'un fichier CSV/Excel valide
  - Traitement et création de plusieurs étudiants
  - Rapport de succès/erreurs
  - Gestion des doublons

- [ ] **Modification d'étudiant**
  - Édition des informations personnelles
  - Changement de classe
  - Sauvegarde des modifications

- [ ] **Recherche et filtrage**
  - Recherche par nom
  - Recherche par numéro d'enregistrement
  - Filtrage par classe
  - Résultats corrects affichés

### 4. Gestion des Inscriptions (Enrollments)
**Module**: `enrollments`
**Fichiers concernés**: `apps/web/src/pages/admin/EnrollmentManagement.tsx`

#### Tests à implémenter:
- [ ] **Inscription individuelle**
  - Sélection d'un étudiant
  - Sélection d'une classe
  - Sélection d'une année académique
  - Création de l'inscription
  - Statut "active"

- [ ] **Inscription en masse d'une classe**
  - Sélection d'une classe entière
  - Inscription automatique de tous les étudiants
  - Vérification du nombre d'inscriptions créées
  - Gestion des conflits (déjà inscrits)

- [ ] **Clôture d'inscription**
  - Changement de statut vers "completed"
  - Historique préservé
  - Impossibilité de modifier une inscription clôturée

### 5. Gestion des Examens
**Module**: `exams`, `exam-scheduler`
**Fichiers concernés**:
- `apps/web/src/pages/admin/ExamManagement.tsx`
- `apps/web/src/pages/admin/ExamScheduler.tsx`

#### Tests à implémenter:
- [ ] **Création d'examen manuel**
  - Sélection d'un cours
  - Sélection d'un type d'examen
  - Définition de la date
  - Définition du coefficient
  - Création réussie

- [ ] **Planification automatique d'examens**
  - Configuration des paramètres de planification
  - Sélection de classes multiples
  - Lancement de la génération
  - Vérification de la création des examens
  - Rapport de planification

- [ ] **Gestion des conflits de planning**
  - Détection de conflits de date
  - Message d'alerte approprié
  - Résolution des conflits

## Priorité 2 - Fonctionnalités Métier Importantes

### 6. Règles de Passage (Promotion Rules)
**Module**: `promotion-rules`
**Fichiers concernés**: `apps/web/src/pages/admin/promotion-rules/`

#### Tests à implémenter:
- [ ] **Création de règle de passage**
  - Remplissage du formulaire
  - Définition du JSON de règle valide
  - Activation de la règle
  - Vérification dans la liste

- [ ] **Évaluation des étudiants**
  - Sélection d'une règle
  - Sélection d'une classe source
  - Lancement de l'évaluation
  - Visualisation des étudiants éligibles/non-éligibles
  - Vérification des critères (moyenne, crédits, etc.)

- [ ] **Exécution du passage**
  - Sélection des étudiants éligibles
  - Sélection de la classe cible
  - Confirmation de l'opération
  - Vérification du changement de classe
  - Historique d'exécution créé

- [ ] **Consultation de l'historique**
  - Liste des exécutions passées
  - Détails d'une exécution
  - Statistiques (taux de réussite, etc.)

### 7. Numéros d'Enregistrement (Registration Numbers)
**Module**: `registration-numbers`
**Fichiers concernés**:
- `apps/web/src/pages/admin/RegistrationNumberFormats.tsx`
- `apps/web/src/pages/admin/RegistrationNumberFormatDetail.tsx`

#### Tests à implémenter:
- [ ] **Création de format**
  - Définition de segments (literal, counter, field)
  - Prévisualisation du format
  - Activation du format
  - Désactivation automatique des autres formats

- [ ] **Génération automatique**
  - Création d'étudiant sans numéro manuel
  - Vérification de la génération automatique
  - Incrémentation correcte du compteur
  - Unicité des numéros générés

### 8. Export de Notes
**Module**: `grades`
**Fichiers concernés**: `apps/web/src/pages/admin/GradeExport.tsx`

#### Tests à implémenter:
- [ ] **Export Excel par classe**
  - Sélection d'une classe
  - Sélection d'examens spécifiques
  - Téléchargement du fichier Excel
  - Vérification du contenu (noms, notes, moyennes)

- [ ] **Export procès-verbal**
  - Génération du PV pour une classe
  - Inclusion de toutes les notes
  - Calculs de moyennes corrects
  - Téléchargement réussi

### 9. Gestion des Classes
**Module**: `classes`
**Fichiers concernés**: `apps/web/src/pages/admin/ClassManagement.tsx`

#### Tests à implémenter:
- [ ] **Création de classe**
  - Sélection d'un programme
  - Sélection d'un niveau de cycle
  - Sélection d'une option
  - Définition du code et nom
  - Création réussie

- [ ] **Attribution de cours à une classe**
  - Sélection d'une classe
  - Ajout de cours multiples
  - Définition des heures hebdomadaires
  - Attribution d'enseignants
  - Vérification des assignations

## Priorité 3 - Workflows et Notifications

### 10. Workflows d'Approbation
**Module**: `workflows`
**Fichiers concernés**:
- `apps/web/src/pages/teacher/WorkflowManager.tsx`
- `apps/web/src/pages/dean/WorkflowApprovals.tsx`

#### Tests à implémenter:
- [ ] **Création de demande d'approbation (enseignant)**
  - Soumission d'une demande de modification de note
  - Statut "pending"
  - Notification au doyen

- [ ] **Approbation/Rejet (doyen)**
  - Consultation des demandes en attente
  - Approbation d'une demande
  - Application automatique de la modification
  - Notification à l'enseignant

### 11. Notifications
**Module**: `notifications`
**Fichiers concernés**: `apps/web/src/pages/admin/NotificationsCenter.tsx`

#### Tests à implémenter:
- [ ] **Réception de notifications**
  - Création d'événement déclencheur
  - Notification apparaît dans le centre
  - Badge de compteur mis à jour

- [ ] **Marquage comme lue**
  - Clic sur notification
  - Notification marquée comme lue
  - Badge mis à jour

## Structure des Tests

### Organisation recommandée:
```
apps/web/cypress/e2e/
├── auth/
│   ├── login.cy.ts
│   └── logout.cy.ts
├── grades/
│   ├── grade-entry.cy.ts
│   ├── grade-modification.cy.ts
│   └── grade-export.cy.ts
├── students/
│   ├── student-creation.cy.ts
│   ├── student-bulk-import.cy.ts
│   └── student-search.cy.ts
├── enrollments/
│   ├── individual-enrollment.cy.ts
│   ├── bulk-enrollment.cy.ts
│   └── enrollment-closure.cy.ts
├── exams/
│   ├── exam-creation.cy.ts
│   ├── exam-scheduling.cy.ts
│   └── exam-conflicts.cy.ts
├── promotion-rules/
│   ├── rule-creation.cy.ts
│   ├── student-evaluation.cy.ts
│   ├── promotion-execution.cy.ts
│   └── execution-history.cy.ts
├── registration-numbers/
│   ├── format-creation.cy.ts
│   └── auto-generation.cy.ts
├── classes/
│   ├── class-creation.cy.ts
│   └── course-assignment.cy.ts
└── workflows/
    ├── approval-request.cy.ts
    └── approval-processing.cy.ts
```

## Données de Test

### Fixtures nécessaires:
- `students.json` - Liste d'étudiants types
- `classes.json` - Classes avec programmes et niveaux
- `exams.json` - Examens avec différents types
- `grades.json` - Notes échantillons
- `users.json` - Utilisateurs de test (admin, teacher, student)
- `promotion-rules.json` - Règles de passage types

### Seeds requis:
- Année académique active
- Programmes avec options
- Facultés et cycles d'études
- Types d'examens standards
- Formats de numéros d'enregistrement

## Commandes Cypress Personnalisées

### À implémenter dans `cypress/support/commands.ts`:

```typescript
// Authentification
cy.loginAsAdmin()
cy.loginAsTeacher()
cy.loginAsStudent()
cy.logout()

// Navigation
cy.visitAdminPage(pageName)
cy.visitTeacherPage(pageName)

// Données de test
cy.createStudent(data)
cy.createClass(data)
cy.createExam(data)
cy.enrollStudent(studentId, classId)

// Nettoyage
cy.resetDatabase()
cy.clearNotifications()
```

## Critères de Succès

Un test est considéré comme réussi si:
1. ✅ Il s'exécute de manière déterministe (pas de flakiness)
2. ✅ Il démarre d'un état connu (seeds/fixtures)
3. ✅ Il vérifie le comportement métier (pas juste l'UI)
4. ✅ Il nettoie après lui-même
5. ✅ Il échoue clairement avec un message explicite
6. ✅ Il s'exécute en moins de 30 secondes

## Métriques de Couverture Cibles

- **Priorité 1**: 100% de couverture requise
- **Priorité 2**: 80% de couverture recommandée
- **Priorité 3**: 50% de couverture acceptable

## Prochaines Étapes

1. [ ] Configurer Cypress selon `cypress-e2e-guide.md`
2. [ ] Implémenter les commandes personnalisées
3. [ ] Créer les fixtures de base
4. [ ] Commencer par les tests Priorité 1 (auth + grades)
5. [ ] Mettre en place CI pour exécution automatique
6. [ ] Documenter les patterns de test découverts

## Références

- [Guide d'installation Cypress](./cypress-e2e-guide.md)
- [Architecture du système](./architecture.md)
- [Guide de seeding](./seed-playbook.md)
