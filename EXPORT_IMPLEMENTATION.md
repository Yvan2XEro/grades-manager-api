# Implémentation du Système d'Export de Notes et PV

## 📋 Résumé

Un système complet d'export de notes et de procès-verbaux a été implémenté avec les fonctionnalités suivantes :

✅ Export en PDF et prévisualisation HTML
✅ 3 types d'exports : PV, Évaluations, UE
✅ Calcul automatique des moyennes, crédits, et statistiques
✅ Configuration centralisée dans un fichier JSON
✅ API tRPC complète avec permissions
✅ Templates HTML prêts à être adaptés

## 🏗️ Architecture Implémentée

### 1. Modules créés

```
apps/server/src/
├── modules/exports/
│   ├── index.ts                  ✅ Point d'entrée
│   ├── exports.router.ts         ✅ 6 endpoints tRPC
│   ├── exports.service.ts        ✅ Logique métier complète
│   ├── exports.repo.ts           ✅ Requêtes DB optimisées
│   ├── exports.zod.ts            ✅ Validation des inputs
│   └── template-helper.ts        ✅ Helpers de calcul
├── config/
│   └── export-config.json        ✅ Configuration institutionnelle
└── routers/
    └── index.ts                  ✅ Router intégré dans appRouter
```

### 2. Dépendances installées

- ✅ **puppeteer** v24.32.1 : Génération de PDF
- ✅ **handlebars** v4.7.8 : Templating HTML

### 3. Configuration JSON

Le fichier `apps/server/src/config/export-config.json` contient :

- **Informations institutionnelles** : Université, Faculté, Institut (noms FR/EN, logos)
- **Système de notation** : Appréciations, seuils, échelle
- **Signatures** : Postes et noms pour PV, Évaluations, UE
- **Paramètres examens** : Durée, coefficients par type
- **Watermark** : Configuration du filigrane

## 🔧 API tRPC Créée

### Endpoints disponibles

#### 1. Prévisualisation (queries)
```typescript
// Prévisualiser un PV en HTML
trpc.exports.previewPV.query({ classId, semesterId, academicYearId })

// Prévisualiser une évaluation en HTML
trpc.exports.previewEvaluation.query({ examId, observations? })

// Prévisualiser une UE en HTML
trpc.exports.previewUE.query({ teachingUnitId, classId, semesterId, academicYearId })
```

#### 2. Génération (mutations)
```typescript
// Générer un PV en PDF ou HTML
trpc.exports.generatePV.mutate({ classId, semesterId, academicYearId, format: 'pdf' })

// Générer une évaluation en PDF ou HTML
trpc.exports.generateEvaluation.mutate({ examId, format: 'pdf', observations? })

// Générer une UE en PDF ou HTML
trpc.exports.generateUE.mutate({ teachingUnitId, classId, semesterId, academicYearId, format: 'pdf' })
```

#### 3. Configuration
```typescript
// Récupérer la configuration pour l'UI
trpc.exports.getConfig.query()
```

### Permissions
- Tous les endpoints utilisent `gradingProcedure`
- Accessible aux : enseignants, deans, administrateurs, super_admins

## 📊 Calculs Automatiques

Le service calcule automatiquement :

### Par étudiant
- ✅ Moyennes CC et Examen
- ✅ Moyenne par EC (pondération automatique)
- ✅ Moyenne par UE
- ✅ Décision Ac/Nac (selon seuil 10/20)
- ✅ Crédits obtenus
- ✅ Moyenne générale
- ✅ Décision finale ACQUIS/NON ACQUIS

### Statistiques globales
- ✅ Taux de réussite
- ✅ Nombre présents/absents
- ✅ Notes min/max/moyenne
- ✅ Appréciations (Excellent, Très Bien, etc.)

## 📝 Prochaines Étapes

### 1. Adaptation des Templates HTML (PRIORITAIRE)

Les templates HTML dans `modeles_html/` doivent être adaptés pour utiliser Handlebars :

**Avant :**
```html
<h1>UNIVERSITÉ DE [NOM]</h1>
<td>[NOM 1]</td>
<td>XX,X</td>
```

**Après :**
```html
<h1>{{university.name_fr}}</h1>
{{#each students}}
  <td>{{lastName}}</td>
  <td>{{formatNumber generalAverage}}</td>
{{/each}}
```

📖 **Référence complète** : Voir `docs/exports.md` pour toutes les variables disponibles

### 2. Personnalisation de la Configuration

Modifier `apps/server/src/config/export-config.json` :

```json
{
  "institution": {
    "university": {
      "name_fr": "VOTRE UNIVERSITÉ",
      "name_en": "YOUR UNIVERSITY",
      "logo_url": "/path/to/logo.png"
    },
    // ...
  }
}
```

### 3. Intégration Frontend

Utiliser les composants React exemples dans `docs/export-ui-example.tsx` :

```tsx
import { ExportPV, ExportEvaluation, ExportUE } from '@/components/exports';

// Dans votre page
<ExportPV
  classId="..."
  semesterId="..."
  academicYearId="..."
  className="L3 Médecine"
/>
```

### 4. Ajout des Logos

Placer les logos dans un dossier accessible :
```
apps/server/public/logos/
├── university.png
├── faculty.png
└── ipes.png
```

Puis mettre à jour les chemins dans `export-config.json`.

### 5. Tests

Créer des tests d'intégration :
```typescript
// apps/server/src/modules/exports/__tests__/exports.caller.test.ts
import { describe, test, expect } from "bun:test";
import { appRouter } from "@/routers";
import { makeTestContext } from "@/lib/test-utils";

describe("Exports", () => {
  test("should generate PV", async () => {
    const ctx = await makeTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.exports.generatePV({
      classId: "...",
      semesterId: "...",
      academicYearId: "...",
      format: "html"
    });

    expect(result.content).toContain("PROCÈS-VERBAL");
  });
});
```

## 📂 Fichiers Créés

### Code Backend
- ✅ `apps/server/src/modules/exports/index.ts`
- ✅ `apps/server/src/modules/exports/exports.router.ts`
- ✅ `apps/server/src/modules/exports/exports.service.ts`
- ✅ `apps/server/src/modules/exports/exports.repo.ts`
- ✅ `apps/server/src/modules/exports/exports.zod.ts`
- ✅ `apps/server/src/modules/exports/template-helper.ts`
- ✅ `apps/server/src/config/export-config.json`

### Documentation
- ✅ `docs/exports.md` - Documentation complète du système
- ✅ `docs/export-ui-example.tsx` - Exemples de composants React
- ✅ `EXPORT_IMPLEMENTATION.md` - Ce fichier

### Templates HTML (à adapter)
- ⏳ `modeles_html/pv template.html` - À convertir en Handlebars
- ⏳ `modeles_html/publication_evaluation.html` - À convertir en Handlebars
- ⏳ `modeles_html/publication_ue.html` - À convertir en Handlebars

## 🔄 Flux de Données

```
┌─────────────────────┐
│   Frontend React    │
│   (Bouton Export)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   tRPC Router       │
│   exports.generatePV│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ExportsService     │
│  - Load config      │
│  - Fetch data (repo)│
│  - Process data     │
│  - Compile template │
└──────────┬──────────┘
           │
           ├─────────────┐
           ▼             ▼
    ┌──────────┐  ┌─────────────┐
    │Handlebars│  │ Puppeteer   │
    │   HTML   │──│  PDF Gen    │
    └──────────┘  └─────────────┘
           │
           ▼
    ┌──────────────┐
    │ PDF base64   │
    │ ou HTML      │
    └──────────────┘
```

## ⚠️ Points d'Attention

1. **Templates HTML** : Les templates actuels utilisent des placeholders manuels `[XXX]`. Ils doivent être convertis en syntaxe Handlebars `{{variable}}`.

2. **Logos** : Les chemins des logos dans `export-config.json` doivent pointer vers des fichiers accessibles.

3. **Performance** : La génération de PDF avec Puppeteer peut prendre quelques secondes. Utiliser des indicateurs de chargement dans l'UI.

4. **Permissions** : Seuls les utilisateurs avec permission `canGrade` peuvent exporter.

5. **Données** : Les exports nécessitent que les données (notes, examens, etc.) existent en base de données.

## 🚀 Démarrage Rapide

### 1. Configurer l'institution
```bash
# Éditer le fichier de configuration
code apps/server/src/config/export-config.json
```

### 2. Tester l'API
```bash
# Démarrer le serveur
bun dev:server

# Dans un autre terminal, tester avec curl
curl -X POST http://localhost:3000/trpc/exports.previewPV \
  -H "Content-Type: application/json" \
  -d '{"classId":"...","semesterId":"...","academicYearId":"..."}'
```

### 3. Intégrer dans le frontend
```tsx
// Copier le code de docs/export-ui-example.tsx
// dans apps/web/src/components/exports/
```

## 📞 Support

Pour toute question sur l'implémentation :
- Consulter `docs/exports.md` pour la documentation complète
- Voir `docs/export-ui-example.tsx` pour des exemples d'utilisation
- Les templates Handlebars utilisent la syntaxe standard : https://handlebarsjs.com/

## ✨ Fonctionnalités Bonus Implémentées

- ✅ Helpers Handlebars personnalisés (`formatNumber`, `getAppreciation`)
- ✅ Support multi-langues (FR/EN) dans la configuration
- ✅ Watermark configurable sur les documents
- ✅ Calcul intelligent des taux de réussite
- ✅ Gestion des absences (notes null)
- ✅ Appréciations automatiques selon barème
