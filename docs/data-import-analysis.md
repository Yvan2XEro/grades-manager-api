# Import des données — analyse (à valider avant tout code)

> Remplace la partie « années » de `data-import-redesign.md`. Rien de ce qui suit n'est implémenté, sauf les 3 étapes « Fondations ».

## 1. Pour qui, pour quoi

Le client type arrive avec **toutes ses données dans des fichiers** (Excel exportés d'un autre logiciel, PV de délibération, listes de classes) et plusieurs années d'historique. Il veut :

- importer **en masse**, année par année, sans ressaisir quoi que ce soit ;
- ne **jamais se perdre** : savoir à tout moment ce qui est fait, ce qui reste, ce qui bloque et pourquoi ;
- **voir avant d'enregistrer** ce qui sera créé, modifié ou rejeté, ligne par ligne ;
- pouvoir **corriger et réimporter** sans créer de doublons, et **annuler** un import raté.

La saisie manuelle n'a pas sa place dans ce parcours : elle existe déjà dans l'application.

## 2. Parcours proposé

```
Mise en route
├── 1. Profil de l'institution            (formulaire, une fois)
├── 2. Fondations                          (une fois, assistant en 3 étapes — existe)
│      Cycles & niveaux → Programmes & options → UE & EC
└── 3. Années académiques
       [ + Importer une année ]  → assistant d'import de l'année
       2023-2024  ██████████ terminée      [Reprendre] [Rapport]
       2024-2025  ██████░░░░ 6/9 étapes    [Reprendre]
       2025-2026  ░░░░░░░░░░ à faire       [Importer]
```

### 2.1 « Importer une année » — l'assistant

Un seul assistant plein écran par année, qui **range tout ce qui est importable en étapes**, dans l'ordre des dépendances. À gauche, la liste des étapes avec leur statut ; à droite, l'étape en cours.

**Étape 0 — Cadrage de l'année**

- Choisir l'année (existante) ou la créer : nom (2024-2025), dates, semestres.
- Type d'année :
  - **Année passée (historique)** : examens clos et verrouillés après import, aucune notification envoyée, la classe actuelle des étudiants n'est pas modifiée.
  - **Année en cours** : examens ouverts, workflow normal.
- Façon d'apporter les fichiers :
  - **un classeur par étape** (modèles pré-remplis à télécharger), ou
  - **un classeur unique de l'année** : le client dépose un seul fichier contenant toutes ses feuilles. L'assistant reconnaît chaque feuille par ses colonnes et la range dans la bonne étape. Les étapes déjà couvertes passent directement en « à vérifier ».

**Étapes 1 à 8 — même mécanique pour chacune**

1. **Ce que fait l'étape** : 2 lignes d'explication, plus ce qui existe déjà pour cette année (ex. « 12 classes déjà présentes »).
2. **Modèle** à télécharger, **pré-rempli** :
   - données existantes de l'année ;
   - listes déroulantes alimentées par les étapes précédentes (codes de classe, matricules, EC) ;
   - colonnes obligatoires marquées.
3. **Dépôt du fichier**, puis **prévisualisation dans une grande modale** :
   - tableau de toutes les lignes, avec un statut par ligne : *créer*, *mettre à jour*, *inchangée*, *erreur*, *avertissement* ;
   - filtres par statut et recherche ;
   - erreurs affichées sur la cellule fautive, avec le correctif attendu ;
   - pour une mise à jour, les valeurs avant et après ;
   - « Télécharger le fichier annoté » : le fichier du client, avec les erreurs en commentaires sur les cellules.
4. **Valider l'étape**. Seules les lignes valides sont enregistrées, et l'étape suivante devient disponible.

Une étape optionnelle peut être marquée « ne s'applique pas ». L'assistant **se reprend où on l'a laissé** : l'état est enregistré côté serveur.

**Étape finale — Clôture de l'année**

- Récapitulatif : nombre d'objets créés et mis à jour par étape, lignes rejetées, avec un lien vers chaque rapport.
- Traitements de fin, proposés et lancés en un clic :
  - calcul des crédits ;
  - bilans étudiants ;
  - pour une année passée : création des délibérations de chaque classe, calculées à partir des notes importées et laissées en brouillon pour vérification.
- **Comparaison avec les décisions officielles** (optionnelle) : si le client fournit les décisions de ses PV (admis, ajourné, redouble…), l'assistant liste les étudiants dont la décision calculée diffère. Les écarts révèlent une note manquante ou une règle mal configurée. Rien n'est écrasé en silence.

### 2.2 Les étapes d'une année

| # | Étape | Obligatoire | Le client fournit | Ce que l'assistant peut générer seul |
|---|-------|-------------|-------------------|--------------------------------------|
| 1 | Classes | oui | code, nom, programme, option, niveau | proposition : une classe par programme × niveau (comme « Génération en masse ») ; le client complète ou corrige |
| 2 | Enseignants | non | nom, e-mail, téléphone | — |
| 3 | Étudiants & inscriptions | oui | matricule, identité, classe de l'année, statut | — |
| 4 | Parents / tuteurs | non | étudiant (matricule), parent, lien | — |
| 5 | Cours des classes (affectations) | oui | exceptions seulement | **tous les EC de la maquette** pour chaque classe (programme, niveau, semestre de l'UE), coefficient par défaut ; le fichier sert seulement à donner les enseignants et à corriger des coefficients |
| 6 | Inscriptions aux cours | non | exceptions seulement (dispenses, rattrapages d'un EC d'une autre année) | **tous les étudiants inscrits × tous les cours de leur classe** |
| 7 | Examens | oui | exceptions seulement | à partir d'un **modèle d'évaluation** choisi une fois (ex. CC 40 % + Examen 60 % + Rattrapage qui remplace) : appliqué à tous les cours ; dates facultatives |
| 8 | Notes | oui | les notes | modèle en **grille façon PV** (voir 2.3), pré-rempli avec les étudiants et les examens des étapes 3 et 7 |

L'essentiel est là : pour une année standard, **le client fournit 3 fichiers** (classes, étudiants, notes) **et fait 2 choix** (modèle d'évaluation, maquette appliquée). Tout le reste est déduit, et reste modifiable par fichier.

### 2.3 Les notes : la grille PV

- **Un classeur par classe** (ou un seul classeur avec une feuille par couple classe/EC, au choix).
- Feuille « EC — Algorithmique (INF111) » :
  - lignes : les étudiants inscrits, pré-remplis (matricule, nom) ;
  - colonnes : les examens (CC, Examen, Rattrapage), avec leur pondération en en-tête.
- Valeurs acceptées :
  - une note de 0 au maximum du barème (virgule ou point) ;
  - `ABS` pour un absent (traité comme 0 ou ignoré, selon la règle d'absence de l'institution) ;
  - vide = pas de note.
- **Format long** aussi accepté, pour les exports d'autres logiciels : `matricule | classe | code EC | examen | note`.
- Rattachement d'une note : année + classe + EC + type d'examen. Jamais par le nom de l'examen seul.

## 3. Liaisons entre les données

### 3.1 Clés de rattachement (ce qui identifie une ligne dans un fichier)

| Donnée | Clé naturelle | Référence vers | Unicité en base |
|--------|---------------|----------------|-----------------|
| Cycle | code | — | (institution, code) |
| Niveau | code cycle + code niveau | cycle | (cycle, code) |
| Programme | code | cycle | (institution, code) |
| Option | code programme + code option | programme | (programme, code) |
| UE | code programme + code UE | programme | (programme, code) |
| EC (cours) | code programme + code EC | programme, UE | (programme, code) |
| Année | nom (2024-2025) | — | (institution, nom) |
| Classe | code + année | programme, option, niveau, année | (code, année) |
| Enseignant | e-mail | — | **aucune** (à garantir par l'import) |
| Étudiant | **matricule** | personne | matricule unique (global) |
| Inscription | matricule + année | étudiant, classe, année | **aucune** (à ajouter : étudiant + année) |
| Cours de classe | code classe + code EC (+ année) | classe, EC, enseignant | (classe, EC) |
| Inscription au cours | matricule + EC + année + tentative | étudiant, cours de classe | (étudiant, EC, année, tentative) |
| Examen | classe + EC + type (+ année) | cours de classe, examen parent si rattrapage | **aucune** (à garantir par l'import : un type par cours) |
| Note | matricule + examen | étudiant, examen | (étudiant, examen) |

### 3.2 Règles de résolution

- **Les codes sont normalisés** (majuscules, sans espaces, sans accents) avant comparaison. Les en-têtes de colonnes sont reconnus sans tenir compte de la casse ni des accents.
- **Une référence est résolue d'abord dans le fichier**, parmi les lignes valides d'une étape précédente du même assistant, **puis en base**. On peut donc tout déposer d'un coup dans le classeur unique : une classe créée dans la feuille « Classes » est reconnue par la feuille « Étudiants » avant même d'être enregistrée.
- **Référence introuvable** : erreur sur la cellule, avec la correction attendue (« Classe IGL-BTS1 inconnue pour 2024-2025 : ajoutez-la dans la feuille Classes »). La ligne est rejetée, les autres continuent.
- **Référence ambiguë** (ex. deux personnes avec le même nom et sans matricule) : erreur, jamais de choix arbitraire.
- **Rejet en cascade, mais visible** : si une classe est rejetée, ses étudiants sont rejetés avec le message « classe rejetée à la ligne 12 de la feuille Classes ». Le client remonte à la cause en un clic.
- **Réimport = mise à jour, jamais doublon** : la clé naturelle retrouve la ligne existante. Une ligne absente du fichier n'est **jamais supprimée**.

### 3.3 Principe : s'adapter au fichier, ligne par ligne

L'assistant ne fait jamais choisir un mode global. **Chaque ligne est traitée selon ce qu'elle contient**, et un même fichier peut mélanger les situations.

- **Matricule** :
  - fourni : il est conservé et sert de clé ;
  - absent : il est généré selon le format de matricule de l'institution ;
  - pour retrouver une personne déjà connue, l'assistant essaie dans l'ordre le matricule, l'e-mail, puis nom + prénom + date de naissance ;
  - en cas de doute (deux personnes possibles), la ligne passe en erreur avec les candidats proposés.
- **En-têtes** : synonymes reconnus (« Matricule », « N° matricule », « Registration number », « Mat. »…), sans tenir compte de la casse ni des accents. Les colonnes inconnues sont ignorées et signalées.
- **Valeurs** :
  - dates en `jj/mm/aaaa`, `aaaa-mm-jj` ou date Excel ;
  - notes avec virgule ou point, sur 20 ou sur le barème de l'institution (détecté) ;
  - codes tolérants aux espaces et à la casse.
- **Absences** : `ABS`, `Abs`, `absent` ou `AJ` sont reconnus. Ils sont enregistrés comme une absence (participation) et non comme une note. Le calcul suit ensuite la règle d'absence déjà configurée pour l'institution.
- **Décisions de jury des années passées** :
  - si le fichier en contient (colonne « Décision » ou feuille du PV), elles sont comparées aux décisions recalculées ; chaque écart peut être retenu comme décision officielle, ce qui crée une dérogation tracée ;
  - sinon, les décisions sont simplement calculées.
- **Enseignants** :
  - une fiche est créée, retrouvée par e-mail, ou par nom si l'e-mail manque ;
  - créer un compte reste une action séparée (« Inviter les enseignants importés »), jamais imposée.
- **Étudiant présent sur plusieurs années** : une seule personne et un seul dossier étudiant, avec une inscription par année. La classe actuelle n'est mise à jour que si l'année importée est la plus récente.
- **Redoublant ou transfert** : il s'agit simplement de deux inscriptions sur deux années. L'origine d'un transfert (établissement, crédits) se renseigne dans des colonnes facultatives.
- **Rattrapage** : il est rattaché à l'examen principal du même cours. La politique de calcul (remplace, meilleure note, moyenne) vient du modèle d'évaluation, et peut être précisée par cours.
- **Somme des pondérations** des examens d'un cours différente de 100 % : avertissement, pas une erreur.
- **Note sur un examen verrouillé** (réimport d'une année close) : refusée, sauf si l'admin rouvre explicitement l'année pour correction.

## 4. Ce que l'import fait autour (et ce qu'il ne fait pas)

- **Il écrit directement**, sans passer par le workflow de saisie (soumission puis approbation par le doyen). Les règles de validation restent les mêmes :
  - note dans le barème ;
  - étudiant inscrit au cours ;
  - pas d'examen verrouillé.
- **Année passée** : à la clôture, les examens passent en *approuvé + verrouillé* et aucune notification n'est envoyée.
- **Ne calcule pas** les décisions de jury à l'import. Elles sont recalculées par les délibérations, en fin d'assistant.
- **Ne lance pas** le passage d'année (promotion vers l'année suivante) : quand on importe l'historique, les inscriptions de l'année suivante viennent du fichier, pas d'une promotion calculée.
- **Les frais** (barèmes, paiements) : hors périmètre de la première version, à ajouter ensuite comme étape optionnelle.

## 5. Annuler un import

Chaque validation d'étape crée un **lot d'import**, qui garde la trace de chaque ligne créée et de chaque valeur modifiée (avec sa valeur d'avant). « Annuler ce lot » :

- supprime ce qu'il a créé ;
- restaure ce qu'il a modifié ;
- refuse si des données créées ensuite en dépendent (ex. annuler les classes alors que des notes y sont rattachées), en listant ces dépendances.

## 6. Écarts du code actuel à corriger pour que ça marche

| Constat | Conséquence | Correction |
|---------|-------------|------------|
| `autoEnrollClass` prend les étudiants par `students.class` (classe actuelle) | inscriptions aux cours fausses pour une année passée | se baser sur `enrollments` de l'année |
| `enrollments` sans unicité (étudiant, année) | doublons possibles à l'import | contrainte unique + migration de nettoyage |
| `grades.upsertNote` exige les droits du workflow d'examen | inutilisable en masse | service d'écriture de notes en lot (mêmes contrôles, sans le workflow) |
| examens sans unicité (cours, type) | rattachement des notes ambigu | l'import garantit un examen par type et par cours |
| enseignants : aucune unicité sur l'e-mail | doublons de personnes | rattachement par e-mail normalisé dans l'import |
| `semesters` globaux (S1/S2 pour toutes les institutions) | à vérifier avec la notion de semestre de l'année | utiliser les semestres existants, ne pas en créer à l'import |
| anciens imports (`import.people`, `import.gradesBulk`…) | rattachement par nom d'examen, lignes ignorées en silence | remplacés par l'assistant, puis supprimés |

## 7. Volumes et performance

Pour une institution moyenne sur une année : environ 2 000 étudiants, 60 classes, 1 500 cours de classe, 4 500 examens et 150 000 notes.

- **Prévisualisation** : calculée côté serveur, avec un tableau paginé et filtré. On n'envoie jamais 150 000 lignes au navigateur.
- **Validation** : traitement par lots en arrière-plan, avec avancement affiché dans l'assistant, par blocs de 500 lignes.
- **Notes** : écriture en masse, puis un seul recalcul des crédits par étudiant à la clôture, et pas un par note.

## 8. Livraison proposée

1. **Assistant d'année** (cadrage, liste des étapes, reprise) + **Classes** + **Étudiants & inscriptions**, avec prévisualisation en modale et fichier annoté.
2. **Cours des classes générés depuis la maquette** + **modèle d'évaluation** (examens générés) + **inscriptions aux cours générées**.
3. **Notes en grille PV** et format long, puis **clôture** : crédits, verrouillage, délibérations en brouillon.
4. **Classeur unique de l'année** (reconnaissance automatique des feuilles), **comparaison des décisions officielles**, **annulation d'un lot**.
5. Enseignants, parents, puis frais.

Chaque livraison est testée de bout en bout avec un jeu de fichiers réaliste : 3 années, 2 000 étudiants, avec redoublants, transferts et rattrapages.

## 9. Reste ouvert

- **Frais et paiements historiques** : prévus en étape optionnelle, livrés après les notes (livraison 5).
