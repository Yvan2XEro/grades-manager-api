# Système de Templates d'Export Personnalisables

Date: 2025-12-22

## Vue d'ensemble

Le système de templates d'export permet de personnaliser complètement les entêtes, colonnes et styles des documents générés (PDF et Excel) pour les exports de notes.

## Types de Templates Supportés

1. **`pv`** - Procès-Verbal (PDF/HTML)
2. **`evaluation`** - Publication d'évaluation (PDF/HTML)
3. **`ue`** - Publication d'UE (PDF/HTML)
4. **`excel_combined`** - Export Excel combiné
5. **`excel_pv`** - Procès-Verbal Excel
6. **`excel_individual`** - Export Excel individuel par examen

## Structure d'un Template

Chaque template contient :

### 1. Configuration des Colonnes (`columns`)

```typescript
{
  id: string;              // Identifiant unique de la colonne
  key: string;             // Clé pour accéder aux données
  label: string;           // Label par défaut
  labelFr?: string;        // Label en français
  labelEn?: string;        // Label en anglais
  width?: number;          // Largeur de la colonne (pixels ou caractères)
  visible: boolean;        // Visibilité de la colonne
  order: number;           // Ordre d'affichage
  dataType?: "text" | "number" | "date" | "formula";
  formula?: string;        // Formule pour colonnes calculées (ex: "CC * 0.4 + EXAM * 0.6")
  format?: string;         // Format d'affichage (ex: "0.00", "DD/MM/YYYY")
  alignment?: "left" | "center" | "right";
}
```

### 2. Configuration de l'Entête (`headerConfig`)

```typescript
{
  showLogo?: boolean;
  logoPosition?: "left" | "center" | "right";
  title?: string;
  titleFr?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleFr?: string;
  subtitleEn?: string;
  showInstitutionName?: boolean;
  showFacultyName?: boolean;
  showAcademicYear?: boolean;
  showSemester?: boolean;
  showClassName?: boolean;
  customFields?: Array<{
    key: string;
    label: string;
    labelFr?: string;
    labelEn?: string;
    value?: string;
    visible: boolean;
    order: number;
  }>;
}
```

### 3. Configuration du Style (`styleConfig`)

```typescript
{
  // Police
  fontFamily?: string;
  fontSize?: number;
  headerFontSize?: number;

  // Couleurs
  primaryColor?: string;
  secondaryColor?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;

  // Tableau
  tableBorderColor?: string;
  tableBorderWidth?: number;
  alternateRowColor?: string;

  // Page
  pageSize?: "A4" | "A3" | "Letter";
  pageOrientation?: "portrait" | "landscape";
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Filigrane
  watermark?: {
    enabled: boolean;
    text: string;
    opacity?: number;
    fontSize?: number;
    rotation?: number;
  };
}
```

## API tRPC

### 1. Lister les Templates

```typescript
// Tous les templates de l'institution
const templates = await trpc.exportTemplates.list.query({});

// Templates d'un type spécifique
const pvTemplates = await trpc.exportTemplates.list.query({
  type: "pv"
});

// Seulement les templates par défaut
const defaults = await trpc.exportTemplates.list.query({
  isDefault: true
});
```

### 2. Obtenir un Template Spécifique

```typescript
const template = await trpc.exportTemplates.getById.query({
  id: "template-id"
});
```

### 3. Obtenir le Template par Défaut

```typescript
const defaultPVTemplate = await trpc.exportTemplates.getDefault.query({
  type: "pv"
});
```

### 4. Créer un Template

```typescript
const newTemplate = await trpc.exportTemplates.create.mutate({
  name: "Mon Template PV Personnalisé",
  type: "pv",
  isDefault: false,
  columns: [
    {
      id: "col1",
      key: "rank",
      label: "Rang",
      labelFr: "Rang",
      labelEn: "Rank",
      width: 50,
      visible: true,
      order: 1,
      dataType: "number",
      alignment: "center"
    },
    {
      id: "col2",
      key: "studentName",
      label: "Nom Complet",
      labelFr: "Nom Complet",
      labelEn: "Full Name",
      width: 200,
      visible: true,
      order: 2,
      dataType: "text",
      alignment: "left"
    },
    // ... autres colonnes
  ],
  headerConfig: {
    showLogo: true,
    logoPosition: "left",
    titleFr: "PROCÈS-VERBAL DE DÉLIBÉRATION",
    titleEn: "DELIBERATION MINUTES",
    showInstitutionName: true,
    showAcademicYear: true,
    showSemester: true,
    showClassName: true
  },
  styleConfig: {
    pageSize: "A4",
    pageOrientation: "landscape",
    fontFamily: "Arial",
    fontSize: 10,
    headerBackgroundColor: "#003366",
    headerTextColor: "#FFFFFF",
    watermark: {
      enabled: true,
      text: "ORIGINAL",
      opacity: 0.1
    }
  }
});
```

### 5. Mettre à Jour un Template

```typescript
const updated = await trpc.exportTemplates.update.mutate({
  id: "template-id",
  name: "Nouveau Nom",
  columns: [/* nouvelles colonnes */],
  headerConfig: {/* nouvelle config */}
});
```

### 6. Définir un Template par Défaut

```typescript
await trpc.exportTemplates.setDefault.mutate({
  id: "template-id",
  type: "pv"
});
```

### 7. Supprimer un Template

```typescript
await trpc.exportTemplates.delete.mutate({
  id: "template-id"
});
```

## Exemples de Colonnes Prédéfinies

### Pour un PV (Procès-Verbal)

```typescript
const pvColumns = [
  { id: "rank", key: "rank", label: "Rang", visible: true, order: 1, dataType: "number" },
  { id: "regNum", key: "registrationNumber", label: "Matricule", visible: true, order: 2 },
  { id: "name", key: "fullName", label: "Nom et Prénom(s)", visible: true, order: 3 },
  { id: "cc", key: "cc", label: "CC", visible: true, order: 4, dataType: "number", format: "0.00" },
  { id: "exam", key: "exam", label: "Examen", visible: true, order: 5, dataType: "number", format: "0.00" },
  {
    id: "avg",
    key: "average",
    label: "Moyenne",
    visible: true,
    order: 6,
    dataType: "formula",
    formula: "cc * 0.4 + exam * 0.6",
    format: "0.00"
  },
  { id: "decision", key: "decision", label: "Décision", visible: true, order: 7 },
  { id: "credits", key: "creditsEarned", label: "Crédits", visible: true, order: 8, dataType: "number" }
];
```

### Pour un Export Excel Individuel

```typescript
const excelColumns = [
  { id: "lastName", key: "lastName", label: "Nom", visible: true, order: 1, width: 150 },
  { id: "firstName", key: "firstName", label: "Prénom", visible: true, order: 2, width: 150 },
  { id: "regNum", key: "registrationNumber", label: "Matricule", visible: true, order: 3, width: 120 },
  { id: "birthDate", key: "birthDate", label: "Date de naissance", visible: true, order: 4, dataType: "date", format: "DD/MM/YYYY" },
  { id: "birthPlace", key: "birthPlace", label: "Lieu de naissance", visible: true, order: 5, width: 200 },
  { id: "gender", key: "gender", label: "Sexe", visible: true, order: 6, width: 60 }
];
```

## Utilisation dans le Service d'Export

Le service d'export va automatiquement :

1. Récupérer le template par défaut pour le type d'export demandé
2. Appliquer la configuration des colonnes
3. Appliquer la configuration de l'entête
4. Appliquer les styles définis
5. Générer le document selon ces paramètres

### Exemple d'intégration

```typescript
// Dans exports.service.ts
export async function generatePV(input, ctx) {
  // 1. Récupérer le template
  const template = await exportTemplatesService.getDefaultTemplate(
    ctx.db,
    institutionId,
    "pv"
  );

  // 2. Utiliser la configuration du template
  const columns = template?.columns || getDefaultPVColumns();
  const headerConfig = template?.headerConfig || getDefaultHeader();
  const styleConfig = template?.styleConfig || getDefaultStyles();

  // 3. Générer le document avec ces configurations
  const html = await renderTemplate({
    templatePath: "pv-template.html",
    data: processedData,
    columns,
    headerConfig,
    styleConfig
  });

  // 4. Convertir en PDF si nécessaire
  if (format === "pdf") {
    return await htmlToPdf(html, styleConfig.pageSize, styleConfig.pageOrientation);
  }

  return html;
}
```

## Migration depuis l'Ancien Système

L'ancien système utilise un fichier `export-config.json` statique. Pour migrer :

1. **Créer des templates pour chaque type d'export**
2. **Importer les configurations existantes** depuis `export-config.json`
3. **Définir les templates comme par défaut**
4. **Tester** chaque type d'export
5. **Déprécier** progressivement `export-config.json`

## Permissions Requises

- **Lister et consulter** : `canManageCatalog` (tous les administrateurs)
- **Créer, modifier, supprimer** : `adminProcedure` (administrateurs seulement)
- **Définir template par défaut** : `adminProcedure`

## Base de Données

La table `export_templates` stocke désormais uniquement :

- `id` : Identifiant unique
- `institution_id` : Institution propriétaire
- `name` : Nom du template
- `type` : Type d'export (`pv`, `evaluation`, `ue`)
- `is_default` : Indique si le template est celui utilisé par défaut
- `template_body` : Contenu Handlebars complet (.hbs) fourni par l'utilisateur
- `created_at`, `updated_at`, `created_by`, `updated_by` : Audit

### Contraintes

- **Unicité** : `(institution_id, name)` doit être unique
- **Default** : Un seul template `isDefault=true` par `(institution_id, type)`
- **Cascade** : Suppression en cascade si l'institution est supprimée

## Avantages du Système

1. **Flexibilité totale** : l'utilisateur colle son Handlebars complet (entêtes, logos, styles)
2. **Déploiement rapide** : pas d'éditeur graphique complexe ni de configuration de colonnes
3. **Compatibilité** : toujours rendu avec les helpers existants (`formatNumber`, `getObservation`, etc.)
4. **Personnalisation par institution** : chaque établissement peut conserver ses propres PDF statiques
5. **Versioning** : Plusieurs versions de templates possibles
6. **Audit** : Suivi de création/modification
7. **Réutilisabilité** : Templates partagés entre exports similaires

## Prochaines Étapes

1. ✅ Créer le schéma de base de données
2. ✅ Créer le module CRUD complet
3. ⏳ Adapter le service d'export pour utiliser les templates
4. ⏳ Créer l'interface UI pour gérer les templates
5. ⏳ Implémenter l'import/export de templates
6. ⏳ Créer des templates par défaut pour chaque type

## Support

Pour toute question ou problème, consultez :
- [Documentation de l'API tRPC](#api-trpc)
- [Exemples de Templates](#exemples-de-colonnes-prédéfinies)
- Code source : `apps/server/src/modules/export-templates/`
