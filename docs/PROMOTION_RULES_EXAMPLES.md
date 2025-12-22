# Guide des Règles de Passage et Admission d'Étudiants Externes

## Vue d'ensemble du système

Le système utilise **json-rules-engine** pour évaluer automatiquement les étudiants selon des critères configurables. Chaque règle est définie en JSON et peut combiner plusieurs conditions.

## Facts disponibles pour l'évaluation

Chaque étudiant est évalué avec les données suivantes:

### Identification
- `studentId`: ID unique de l'étudiant
- `registrationNumber`: Numéro de matricule
- `classId`: Classe actuelle
- `programCode`: Code du programme
- `academicYearId`: Année académique

### Moyennes académiques
- `overallAverage`: Moyenne générale pondérée (0-20)
- `overallAverageUnweighted`: Moyenne non pondérée
- `lowestScore`: Note la plus basse
- `highestScore`: Note la plus haute
- `lowestUnitAverage`: Moyenne UE la plus basse

### Répartition des notes
- `scoresAbove10`: Nombre de cours réussis (≥10)
- `scoresBelow10`: Nombre d'échecs (<10)
- `scoresBelow8`: Nombre d'échecs éliminatoires (<8)
- `failedCoursesCount`: Total de cours échoués
- `validatedCoursesCount`: Total de cours validés

### Crédits ECTS
- `creditsEarned`: Crédits acquis (total)
- `creditsEarnedThisYear`: Crédits acquis cette année
- `creditsInProgress`: Crédits en cours
- `requiredCredits`: Crédits requis pour le cycle
- `creditDeficit`: Déficit de crédits
- `creditCompletionRate`: Taux de complétion (0-1)

### Taux de réussite
- `successRate`: Taux de réussite global (0-1)
- `unitValidationRate`: Taux de validation des UE (0-1)
- `firstAttemptSuccessRate`: Réussite en première tentative
- `performanceIndex`: Indice de performance composite (0-100)

### Échecs et compensation
- `compensableFailures`: Échecs compensables (8-10)
- `eliminatoryFailures`: Échecs éliminatoires (<8)
- `failedTeachingUnitsCount`: Nombre d'UE échouées

### Tentatives et parcours
- `coursesWithMultipleAttempts`: Cours avec plusieurs tentatives
- `maxAttemptCount`: Nombre max de tentatives
- `previousEnrollmentsCount`: Nombre d'inscriptions précédentes
- `completedYears`: Années complétées
- `isOnTrack`: Étudiant dans les temps (boolean)

---

## Exemples de Règles Standard

### 1. Règle de Passage Standard (Licence 1 → Licence 2)

**Critères:**
- Moyenne générale ≥ 10
- Taux de réussite ≥ 70%
- Maximum 2 UE échouées
- Pas d'échec éliminatoire (<8)

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 10
      },
      {
        "fact": "successRate",
        "operator": "greaterThanInclusive",
        "value": 0.7
      },
      {
        "fact": "failedTeachingUnitsCount",
        "operator": "lessThanInclusive",
        "value": 2
      },
      {
        "fact": "eliminatoryFailures",
        "operator": "equal",
        "value": 0
      }
    ]
  },
  "event": {
    "type": "student-promoted",
    "params": {
      "message": "Étudiant admis au niveau supérieur"
    }
  }
}
```

### 2. Règle avec Compensation (Passage avec dettes)

**Critères:**
- Moyenne ≥ 10
- Maximum 15 crédits de déficit
- Pas plus de 1 échec éliminatoire
- Taux de complétion ≥ 75%

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 10
      },
      {
        "fact": "creditDeficit",
        "operator": "lessThanInclusive",
        "value": 15
      },
      {
        "fact": "eliminatoryFailures",
        "operator": "lessThanInclusive",
        "value": 1
      },
      {
        "fact": "creditCompletionRate",
        "operator": "greaterThanInclusive",
        "value": 0.75
      }
    ]
  },
  "event": {
    "type": "student-promoted-with-debt",
    "params": {
      "message": "Admis avec dette (max 15 crédits à rattraper)"
    }
  }
}
```

### 3. Règle Excellence (Passage avec Mention)

**Critères:**
- Moyenne ≥ 14
- Taux de réussite = 100%
- Tous les crédits acquis
- Performance index ≥ 80

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 14
      },
      {
        "fact": "successRate",
        "operator": "equal",
        "value": 1
      },
      {
        "fact": "creditCompletionRate",
        "operator": "greaterThanInclusive",
        "value": 0.95
      },
      {
        "fact": "performanceIndex",
        "operator": "greaterThanInclusive",
        "value": 80
      }
    ]
  },
  "event": {
    "type": "student-promoted-excellence",
    "params": {
      "message": "Admis avec mention - Excellent parcours"
    }
  }
}
```

### 4. Règle de Redoublement Autorisé

**Critères:**
- Moyenne entre 8 et 10
- Maximum 2 redoublements précédents
- Pas d'abandon de cours
- Déficit de crédits < 30

```json
{
  "conditions": {
    "all": [
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 8
      },
      {
        "fact": "overallAverage",
        "operator": "lessThan",
        "value": 10
      },
      {
        "fact": "previousEnrollmentsCount",
        "operator": "lessThanInclusive",
        "value": 2
      },
      {
        "fact": "creditDeficit",
        "operator": "lessThan",
        "value": 30
      }
    ]
  },
  "event": {
    "type": "student-repeat-year",
    "params": {
      "message": "Redoublement autorisé"
    }
  }
}
```

### 5. Règle Basée sur les Crédits (Système LMD)

**Critères:**
- Au moins 45 crédits acquis (sur 60)
- Moyenne ≥ 10
- Maximum 1 UE échouée

```json
{
  "conditions": {
    "all": [
      {
        "fact": "creditsEarned",
        "operator": "greaterThanInclusive",
        "value": 45
      },
      {
        "fact": "overallAverage",
        "operator": "greaterThanInclusive",
        "value": 10
      },
      {
        "fact": "failedTeachingUnitsCount",
        "operator": "lessThanInclusive",
        "value": 1
      }
    ]
  },
  "event": {
    "type": "student-promoted-lmd",
    "params": {
      "message": "Admis - Crédits LMD validés"
    }
  }
}
```

---

## Gestion des Étudiants Externes (Admission directe)

### Problématique

Les étudiants venant d'autres établissements:
- N'ont pas d'historique de notes dans le système
- N'ont pas de crédits enregistrés
- Sont admis directement à un niveau spécifique
- Ne doivent pas être bloqués par les règles de passage standard

### Solution 1: Champ de Transfert (Recommandé)

**Modification nécessaire au schéma:**

Ajouter un champ `isTransferStudent` ou `admissionType` à la table `students`:

```typescript
// Dans apps/server/src/db/schema/app-schema.ts
export const students = pgTable("students", {
  // ... autres champs
  admissionType: text("admission_type").default("normal"), // "normal", "transfer", "direct"
  transferInstitution: text("transfer_institution"), // Nom de l'établissement d'origine
  transferCredits: integer("transfer_credits").default(0), // Crédits transférés
  transferLevel: text("transfer_level"), // Niveau d'admission (L1, L2, M1, etc.)
});
```

**Modifier le service de facts:**

```typescript
// Dans student-facts.service.ts, ajouter au début de computeStudentFacts:
const student = await db.query.students.findFirst({
  where: eq(schema.students.id, studentId),
  // ...
});

// Ajouter aux facts:
const facts: StudentPromotionFacts = {
  // ... autres facts

  // Nouveaux champs pour étudiants externes
  isTransferStudent: student.admissionType === "transfer",
  admissionType: student.admissionType,
  transferCredits: student.transferCredits ?? 0,
  hasAcademicHistory: transcript.overallAverage > 0, // Indicateur si l'étudiant a des notes
};
```

**Règle spéciale pour étudiants externes:**

```json
{
  "conditions": {
    "any": [
      {
        "all": [
          {
            "fact": "isTransferStudent",
            "operator": "equal",
            "value": true
          },
          {
            "fact": "transferCredits",
            "operator": "greaterThanInclusive",
            "value": 30
          }
        ]
      },
      {
        "all": [
          {
            "fact": "admissionType",
            "operator": "equal",
            "value": "direct"
          }
        ]
      }
    ]
  },
  "event": {
    "type": "external-student-admitted",
    "params": {
      "message": "Étudiant externe admis sur dossier"
    }
  }
}
```

### Solution 2: Inscription Manuelle Sans Règle

Pour les admissions exceptionnelles, créer une procédure administrative:

1. **Créer l'étudiant** avec `admissionType = "direct"`
2. **L'inscrire directement** dans la classe cible
3. **Enregistrer les crédits transférés** manuellement
4. **Ne pas utiliser** le système de promotion automatique

**Code exemple:**

```typescript
// Endpoint spécial pour admission directe
admitExternalStudent: adminProcedure
  .input(z.object({
    studentData: z.object({
      firstName: z.string(),
      lastName: z.string(),
      // ...
    }),
    targetClassId: z.string(),
    transferCredits: z.number().optional(),
    transferInstitution: z.string().optional(),
    justification: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    return db.transaction(async (tx) => {
      // Créer l'étudiant
      const student = await tx.insert(schema.students).values({
        ...input.studentData,
        admissionType: "direct",
        transferCredits: input.transferCredits,
        transferInstitution: input.transferInstitution,
        class: input.targetClassId,
      }).returning();

      // Créer l'inscription directement
      await tx.insert(schema.enrollments).values({
        studentId: student[0].id,
        classId: input.targetClassId,
        academicYearId: ctx.academicYear.id,
        status: "active",
        metadata: {
          admissionType: "direct",
          justification: input.justification,
        }
      });

      return student[0];
    });
  })
```

### Solution 3: Règle de Passage "Bypass" pour Admissions Directes

Créer une règle spéciale qui s'applique uniquement aux étudiants sans historique:

```json
{
  "conditions": {
    "all": [
      {
        "fact": "hasAcademicHistory",
        "operator": "equal",
        "value": false
      },
      {
        "fact": "admissionType",
        "operator": "in",
        "value": ["transfer", "direct"]
      }
    ]
  },
  "event": {
    "type": "bypass-promotion-external",
    "params": {
      "message": "Admission directe - Pas de vérification de notes requise"
    }
  },
  "priority": 100
}
```

**Note:** Cette règle doit avoir une priorité élevée pour être évaluée en premier.

---

## Règles Complexes avec Conditions Multiples

### Règle avec Conditions OU (ANY)

Admettre si l'une des conditions suivantes est remplie:
- Moyenne ≥ 12 ET aucun échec
- OU Crédits acquis ≥ 55/60 ET moyenne ≥ 10

```json
{
  "conditions": {
    "any": [
      {
        "all": [
          {
            "fact": "overallAverage",
            "operator": "greaterThanInclusive",
            "value": 12
          },
          {
            "fact": "failedCoursesCount",
            "operator": "equal",
            "value": 0
          }
        ]
      },
      {
        "all": [
          {
            "fact": "creditsEarned",
            "operator": "greaterThanInclusive",
            "value": 55
          },
          {
            "fact": "overallAverage",
            "operator": "greaterThanInclusive",
            "value": 10
          }
        ]
      }
    ]
  },
  "event": {
    "type": "student-promoted-flexible",
    "params": {
      "message": "Admis selon critères flexibles"
    }
  }
}
```

---

## Recommandations d'Implémentation

### 1. Hiérarchie des Règles

Créer plusieurs règles avec différentes priorités:

1. **Règle d'excellence** (priority: 100) - Pour les meilleurs étudiants
2. **Règle standard** (priority: 50) - Passage normal
3. **Règle avec dette** (priority: 30) - Passage conditionnel
4. **Règle externe** (priority: 90) - Admissions directes
5. **Règle de redoublement** (priority: 10) - Dernière chance

### 2. Workflow Suggéré

```
1. Évaluer l'étudiant avec toutes les règles actives
2. Appliquer la règle de priorité la plus élevée qui match
3. Enregistrer l'exécution avec justification
4. Créer la nouvelle inscription
5. Notifier l'étudiant et l'administration
```

### 3. Interface Utilisateur

Ajouter dans la page `/admin/promotion-rules`:

- ✅ **Liste des règles** avec statut actif/inactif
- ✅ **Éditeur JSON** avec validation en temps réel
- ✅ **Testeur de règle** avec simulation sur un étudiant
- ✅ **Templates** de règles pré-configurées
- ✅ **Filtre par type** d'admission (normale, externe, excellence)

### 4. Audit et Traçabilité

Toutes les promotions doivent enregistrer:
- La règle appliquée
- Les facts de l'étudiant au moment de l'évaluation
- L'utilisateur qui a déclenché l'action
- La date et l'heure
- Les étudiants concernés

---

## FAQ

**Q: Comment tester une règle avant de l'appliquer?**

R: Utiliser l'endpoint `evaluateClassForPromotion` qui retourne les étudiants éligibles sans les promouvoir.

**Q: Peut-on combiner plusieurs règles?**

R: Oui, le système évalue toutes les règles actives et applique celle avec la priorité la plus élevée.

**Q: Comment gérer les cas particuliers?**

R: Créer une règle spécifique avec une priorité élevée ou utiliser l'admission manuelle directe.

**Q: Les crédits transférés sont-ils pris en compte?**

R: Oui, si vous ajoutez le champ `transferCredits` aux facts et l'additionnez à `creditsEarned`.

---

## Prochaines Étapes

1. ✅ Ajouter les champs `admissionType` et `transferCredits` au schéma
2. ✅ Mettre à jour le service de facts
3. ✅ Créer les règles standard dans l'interface
4. ✅ Tester avec des données réelles
5. ✅ Former les administrateurs
6. ✅ Documenter les règles spécifiques à votre établissement
