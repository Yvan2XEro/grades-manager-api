# Liste des captures d'écran à réaliser

Ce document liste toutes les captures d'écran nécessaires pour compléter le guide d'utilisation du Système de Gestion des Notes.

## Section 02 - Installation et Configuration

### Installation

1. **Écran de connexion** (`fig:login-screen`)
   - Interface de connexion avec champs email/password
   - Bouton "Se connecter" et lien "Mot de passe oublié?"
   - Chemin : URL racine de l'application

## Section 03 - Structure Académique

### Gestion de la hiérarchie

2. **Interface années académiques** (`fig:academic-years`)
   - Liste des années avec statut (active/inactive)
   - Bouton "Nouvelle année" et "Activer"
   - Chemin : Menu → Années académiques

3. **Interface facultés** (`fig:faculties`)
   - Liste des facultés avec codes
   - Formulaire de création
   - Chemin : Menu → Facultés

4. **Interface programmes** (`fig:programs`)
   - Liste des programmes par faculté
   - Informations : nom, code, durée
   - Chemin : Menu → Programmes

5. **Interface classes** (`fig:classes`)
   - Liste des classes avec cycles
   - Affichage capacité et nombre d'étudiants
   - Chemin : Menu → Classes

## Section 04 - Gestion des Étudiants

### Enregistrement et inscriptions

6. **Formulaire nouvel étudiant** (`fig:student-form`)
   - Champs : nom, prénom, date naissance, etc.
   - Génération automatique du matricule
   - Chemin : Étudiants → Nouvel étudiant

7. **Interface import Excel étudiants** (`fig:student-import`)
   - Zone de téléchargement du fichier
   - Rapport de validation avec compteurs
   - Bouton "Confirmer l'import"
   - Chemin : Étudiants → Importer

8. **Liste des étudiants** (`fig:student-list`)
   - Tableau avec colonnes : matricule, nom, classe
   - Filtres et recherche
   - Boutons d'action (modifier, supprimer)
   - Chemin : Menu → Étudiants

9. **Ledger de crédits** (`fig:credit-ledger`)
   - Affichage des crédits accumulés par étudiant
   - Détail par cours et semestre
   - Total cumulé
   - Chemin : Menu → Ledger de crédits → Sélectionner étudiant

## Section 05 - Gestion des Notes

### Examens et saisie

10. **Configuration types d'examens** (`fig:exam-types`)
    - Liste des types (CC, TP, EF)
    - Poids de chaque type
    - Chemin : Menu → Types d'examens

11. **Planification automatique examens** (`fig:exam-scheduling`)
    - Sélecteurs : semestre, classe
    - Génération automatique
    - Liste des examens créés
    - Chemin : Menu → Planification des examens

12. **Interface de saisie des notes** (`fig:grade-entry`)
    - Tableau avec liste des étudiants
    - Champs de saisie des notes (0-20)
    - Statistiques en temps réel
    - Bouton "Enregistrer"
    - Chemin : Menu → Saisie des notes

13. **Gestion des délégations** (`fig:delegations`)
    - Liste des délégations actives
    - Informations : enseignant, examen, dates
    - Boutons créer/révoquer
    - Chemin : Menu → Délégations

14. **Interface de workflow** (`fig:workflow`)
    - Formulaire de demande de modification
    - Champs : étudiant, cours, ancienne/nouvelle note
    - Justification
    - Chemin : Menu → Workflows → Nouvelle demande

15. **Liste des workflows** (`fig:workflow-list`)
    - Tableau avec état, demandeur, date
    - Filtres par état (pending L1, approved L1, etc.)
    - Boutons approuver/rejeter
    - Chemin : Menu → Workflows

## Section 06 - Utilisateurs et Autorisations

### Gestion des utilisateurs

16. **Liste des utilisateurs** (`fig:user-list`)
    - Tableau : nom, email, rôle, statut
    - Bouton "Nouvel utilisateur"
    - Actions : modifier, réinitialiser mot de passe
    - Chemin : Menu → Utilisateurs

17. **Formulaire profil de domaine** (`fig:domain-profile`)
    - Informations : nom, prénom, rôle
    - Sélecteur de rôle avec hiérarchie
    - Faculté de rattachement
    - Chemin : Menu → Profils de domaine

18. **Matrice de permissions** (`fig:permissions-matrix`)
    - Tableau des rôles et permissions
    - Visualization des droits par rôle
    - Note : Peut être une capture de documentation ou interface admin

## Section 07 - Exports et Publications

### Génération de documents

19. **Interface export relevés** (`fig:export-transcripts`)
    - Sélecteurs : classe, semestre, année
    - Options : logo, crédits, mentions
    - Format de sortie (ZIP, PDF unique)
    - Bouton "Générer"
    - Chemin : Menu → Exports → Relevés de notes

20. **Exemple de relevé de notes** (`fig:releve-notes`)
    - PDF généré complet
    - En-tête avec logo
    - Tableau des notes
    - Moyennes et crédits
    - Signatures

21. **Interface export attestations** (`fig:export-certificates`)
    - Filtrage automatique (moyenne ≥ 10)
    - Liste des étudiants admis
    - Options d'export
    - Chemin : Menu → Exports → Attestations

22. **Exemple d'attestation** (`fig:certificate-sample`)
    - Document PDF généré
    - Texte légal
    - Informations étudiant
    - Signatures et cachets

## Section 08 - Workflows et Notifications

### Système de notifications

23. **Centre de notifications** (`fig:notifications`)
    - Icône avec badge (nombre non lues)
    - Liste déroulante des notifications
    - Actions : marquer comme lu, archiver
    - Chemin : Barre de navigation → Icône cloche

24. **Détail d'une notification** (`fig:notification-detail`)
    - Titre et contenu de la notification
    - Lien vers l'élément concerné
    - Date et heure
    - Actions disponibles

## Section 09 - Configuration

### Administration système

25. **Paramètres établissement** (`fig:settings-institution`)
    - Formulaire avec nom, adresse, contacts
    - Upload de logo
    - Chemin : Menu → Configuration → Établissement

26. **Configuration matricules** (`fig:settings-matricules`)
    - Format du matricule configurable
    - Aperçu en temps réel
    - Composants : année, faculté, programme, séquentiel
    - Chemin : Menu → Configuration → Matricules

27. **Interface Drizzle Studio** (`fig:drizzle-studio`)
    - Visualisation des tables
    - Liste des colonnes et données
    - URL : https://local.drizzle.studio

## Section 10 - Dépannage

### Diagnostics

28. **Message d'erreur type** (`fig:error-message`)
    - Exemple de message d'erreur affiché
    - Code d'erreur et description
    - Actions suggérées

29. **Console développeur** (`fig:dev-console`)
    - Onglet Network avec requêtes
    - Onglet Console avec erreurs
    - Utile pour diagnostiquer problèmes

## Section 11 - Cas d'usage

### Scénarios complets

30. **Tableau de bord administrateur** (`fig:admin-dashboard`)
    - Vue d'ensemble : stats, indicateurs
    - Accès rapides aux fonctions principales
    - Notifications importantes
    - Chemin : Page d'accueil après connexion admin

31. **Vue enseignant** (`fig:teacher-view`)
    - Interface de saisie pour enseignant
    - Ses cours et examens
    - Délégations actives
    - Chemin : Page d'accueil après connexion enseignant

32. **Vue étudiant** (`fig:student-view`)
    - Relevés de notes personnels
    - Crédits accumulés
    - Historique académique
    - Chemin : Page d'accueil après connexion étudiant

## Informations complémentaires

### Format des captures

- **Format** : PNG recommandé (haute qualité)
- **Résolution** : Minimum 1920x1080 pour captures d'écran complètes
- **Qualité** : Haute qualité, pas de compression excessive
- **Annotations** : Utiliser des flèches/encadrés si nécessaire pour clarifier

### Nommage des fichiers

Les fichiers doivent être nommés exactement comme les labels des figures :
- `login-screen.png`
- `academic-years.png`
- `student-import.png`
- `grade-entry.png`
- etc.

### Emplacement

Placer toutes les images dans le dossier :
```
docs/guide/images/
```

### Conseils de capture

1. **Données de test** : Utilisez des données fictives mais réalistes
2. **Interface propre** : Pas de données personnelles réelles
3. **Cadrage** : Montrez uniquement la partie pertinente
4. **Lisibilité** : Le texte doit être net et lisible
5. **Cohérence** : Utilisez le même thème/langue pour toutes les captures
6. **État** : Capturez dans des états significatifs (formulaires remplis, listes avec données, etc.)

### Captures facultatives mais recommandées

- Logo de l'établissement (pour la page de titre)
- Diagrammes d'architecture (peuvent être créés séparément)
- Schémas de flux de travail
- Graphiques de statistiques

## Progression

Cochez au fur et à mesure :

### Installation et Configuration (2 captures)
- [ ] fig:login-screen

### Structure Académique (4 captures)
- [ ] fig:academic-years
- [ ] fig:faculties
- [ ] fig:programs
- [ ] fig:classes

### Gestion Étudiants (4 captures)
- [ ] fig:student-form
- [ ] fig:student-import
- [ ] fig:student-list
- [ ] fig:credit-ledger

### Gestion Notes (6 captures)
- [ ] fig:exam-types
- [ ] fig:exam-scheduling
- [ ] fig:grade-entry
- [ ] fig:delegations
- [ ] fig:workflow
- [ ] fig:workflow-list

### Utilisateurs (3 captures)
- [ ] fig:user-list
- [ ] fig:domain-profile
- [ ] fig:permissions-matrix

### Exports (4 captures)
- [ ] fig:export-transcripts
- [ ] fig:releve-notes
- [ ] fig:export-certificates
- [ ] fig:certificate-sample

### Workflows et Notifications (2 captures)
- [ ] fig:notifications
- [ ] fig:notification-detail

### Configuration (3 captures)
- [ ] fig:settings-institution
- [ ] fig:settings-matricules
- [ ] fig:drizzle-studio

### Dépannage (2 captures)
- [ ] fig:error-message
- [ ] fig:dev-console

### Cas d'usage (3 captures)
- [ ] fig:admin-dashboard
- [ ] fig:teacher-view
- [ ] fig:student-view

**Total : 32 captures d'écran principales**

## Notes

- Certaines figures peuvent être créées artificiellement (diagrammes, schémas)
- Les captures d'exemples de PDF (relevés, attestations) nécessitent d'abord que l'application soit fonctionnelle
- Priorisez les captures des interfaces principales et utilisez des placeholders pour les sections moins critiques
- Vous pouvez utiliser des outils comme Figma ou draw.io pour créer des schémas explicatifs supplémentaires
