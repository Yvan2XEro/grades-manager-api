# Plan d'Intégration Complet : Grades Manager API ↔ DIPLOMATION

> **Date de rédaction :** 2026-03-24
> **Périmètre :** Intégration automatisée et à la demande — tous les types de documents académiques
> **Approche :** Option C — Intégration profonde via API REST + webhooks

---

## Vue d'ensemble

DIPLOMATION génère **4 types de documents académiques** à partir de données structurées. Aujourd'hui ces données viennent de fichiers Excel. L'objectif est de remplacer / compléter cette source par grades-manager, avec déclenchement automatique selon les événements académiques.

| Document | Déclencheur | Source des données |
|---|---|---|
| Relevé de Notes | Fin de semestre (notes validées) | Inscriptions, notes, UE, cours |
| Attestation de Réussite | Délibération signée (admis) | Délibération, moyennes, mentions |
| Diplôme | Délibération de diplomation signée | Délibération, programme, jury |
| Attestation de Centre | À la demande | Centre de formation (hors scope grades-manager) |

---

## Analyse des Écarts de Données par Document

### 1. Relevé de Notes

| Champ DIPLOMATION | Source grades-manager | Statut |
|---|---|---|
| NOM, PRENOM, MATRICULE | `domainUsers`, `students` | ✅ |
| DATE / LIEU DE NAISSANCE | `domainUsers.dateOfBirth/placeOfBirth` | ✅ EXISTE, non exposé |
| NIVEAU | `studyCycles.level` ou `classes.name` | ✅ |
| SEMESTRE | `semesters.name/number` | ✅ |
| CYCLE | `studyCycles.name` | ✅ |
| FILIERE | `programs.name` | ✅ |
| ANNEE ACADEMIQUE | `academicYears.name` | ✅ |
| EC_CODE, INTITULE, NOTE | `courses.code/name`, `grades.value` | ✅ |
| UE_CREDIT, UE_AVERAGE | `teachingUnits.credits`, calculé | ✅ |
| SESSION (Normal/Rattrapage) | `examTypes` / `exams.session` | ✅ PARTIEL — à vérifier |
| TOTAL_CREDITS | calculé depuis inscriptions cours | ✅ |

**Manquant :** Aucun champ structurellement manquant — seulement à assembler/exposer.

---

### 2. Attestation de Réussite

| Champ DIPLOMATION | Source grades-manager | Statut |
|---|---|---|
| NOM, PRENOM, MATRICULE | `domainUsers`, `students` | ✅ |
| DATE / LIEU DE NAISSANCE | `domainUsers` | ✅ EXISTE, non exposé |
| MOYENNE | `deliberationStudentResults.generalAverage` | ✅ |
| MENTION | `deliberationStudentResults.mention` | ✅ |
| GRADE (lettre) | calculé depuis mention | ❌ À AJOUTER |
| ANNEE ACADEMIQUE | `academicYears.name` | ✅ |
| PARCOURS | `programs.name` | ✅ |
| SPECIALITE | `programOptions.name` | ✅ |
| DUREE_VALIDE | configuration institution | ❌ À AJOUTER |

---

### 3. Diplôme

| Champ DIPLOMATION | Source grades-manager | Statut |
|---|---|---|
| NOM, PRENOM, MATRICULE | `domainUsers`, `students` | ✅ |
| DATE / LIEU DE NAISSANCE | `domainUsers` | ✅ EXISTE, non exposé |
| PARCOURS, SPECIALITE | `programs`, `programOptions` | ✅ |
| ANNEE OBTENTION | `academicYears.name` | ✅ |
| MOYENNE, GRADE, MENTION | `deliberationStudentResults` | ✅ PARTIEL |
| TITRE DIPLOME FR/EN | `programs` | ❌ MANQUANT — colonnes à ajouter |
| DATE JURY ADMISSION | `deliberations.signedAt` | ✅ PARTIEL |
| DATE JURY DELIBERATION | `deliberations.deliberationDate` | ✅ |
| OPTION / OPTION_EN | `programOptions` | ✅ PARTIEL |
| MENTION_EN | mapping depuis mention | ❌ À AJOUTER |

---

### 4. Attestation de Centre
Utilisée pour les **centres de formation professionnelle** — données métier différentes (SESSION_EXAMEN, LIEU_DELIVRANCE, NUMERO_JURY...). Grades-manager ne gère pas ces centres actuellement.
→ **Hors périmètre de cette intégration** pour l'instant, sauf si grades-manager doit évoluer dans ce sens.

---

## Événements déclencheurs

```
grades-manager Events                    DIPLOMATION Actions
─────────────────────────────────────────────────────────────
deliberation.signed                  →   Diplôme (si type graduation)
  (type: graduation)                 →   Attestation de Réussite (tous admis)

deliberation.signed                  →   Attestation de Réussite (tous admis)
  (type: semestriel/annuel)

semester.grades_locked               →   Relevé de Notes (tous étudiants)
  (toutes les notes saisies)

[ON DEMAND]                          →   N'importe quel document
  user request in DIPLOMATION             pour un/des étudiants spécifiques
```

---

## Graphe de Dépendances des Phases

```
Phase 1 — Modèle de données
  └─► Phase 2 — API REST + Clés API
        ├─► Phase 3 — Webhooks (grades-manager)
        └─► Phase 4 — Module DIPLOMATION
              └─► Phase 5 — Pipelines de génération par type de document
                    └─► Phase 6 — Stockage, traçabilité, mode à la demande
```

---

## Phase 1 — Extensions du Modèle de Données

**Effort : 1.5 jours**
**Dépendance : aucune**

### 1.1 — Table `programs` : titres de diplôme et config attestation

**Fichier :** `apps/server/src/db/schema/app-schema.ts`

```typescript
// Ajouter dans la table programs :
diplomaTitleFr: text("diploma_title_fr"),
diplomaTitleEn: text("diploma_title_en"),
attestationValidityFr: text("attestation_validity_fr"), // ex: "l'année académique 2024-2025"
attestationValidityEn: text("attestation_validity_en"),
```

### 1.2 — Table `deliberations` : type de délibération

Vérifier si `deliberations.type` permet de distinguer `graduation` vs `semestriel`. Si non :

```typescript
// Ajouter dans la table deliberations (si absent) :
deliberationType: text("deliberation_type")
  .$type<"graduation" | "annual" | "semester">()
  .notNull().default("annual"),
```

### 1.3 — Table `diplomationApiKeys`

```typescript
export const diplomationApiKeys = pgTable("diplomation_api_keys", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: text("institution_id").notNull()
    .references(() => institutions.id, { onDelete: "cascade" }),
  keyHash: text("key_hash").notNull(),
  label: text("label").notNull(),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("idx_diplomation_api_keys_institution").on(t.institutionId),
  index("idx_diplomation_api_keys_hash").on(t.keyHash),
]);
```

### 1.4 — Extension de `DiplomationExportData` (pour Diplôme + Attestation)

**Fichier :** `apps/server/src/modules/deliberations/deliberations.types.ts`

```typescript
students: Array<{
  // ... champs existants ...
  dateOfBirth: string | null;       // NOUVEAU
  placeOfBirth: string | null;      // NOUVEAU
  gradeLetter: string | null;       // NOUVEAU — calculé depuis mention
  mentionEn: string | null;         // NOUVEAU — version anglaise
}>;

program: {                          // NOUVEAU bloc
  diplomaTitleFr: string | null;
  diplomaTitleEn: string | null;
  specialite: string | null;
  attestationValidityFr: string | null;
  attestationValidityEn: string | null;
};

deliberation: {
  // ... champs existants ...
  admissionDate: string | null;     // NOUVEAU
  deliberationType: string;         // NOUVEAU
};
```

### 1.5 — Nouveau type : `TranscriptExportData`

**Fichier :** `apps/server/src/modules/deliberations/deliberations.types.ts` (ou nouveau fichier `transcript.types.ts`)

```typescript
export interface TranscriptExportData {
  institution: { name: string; code: string; logoUrl: string | null };
  academicYear: { name: string };
  program: { name: string; cycle: string; level: string };
  semester: { name: string; number: number };
  students: Array<{
    registrationNumber: string;
    lastName: string;
    firstName: string;
    dateOfBirth: string | null;
    placeOfBirth: string | null;
    totalCredits: number;
    ues: Array<{
      code: string;
      name: string;
      credits: number;
      average: number | null;
      decision: string;
      courses: Array<{
        code: string;
        name: string;
        coefficient: number;
        grade: number | null;
        session: "normal" | "rattrapage";
      }>;
    }>;
  }>;
}
```

### 1.6 — Helpers de mapping

```typescript
// Mention → Grade lettre
const MENTION_TO_GRADE: Record<string, string> = {
  passable: "E", assez_bien: "D", bien: "C", tres_bien: "B", excellent: "A",
};

// Mention → version anglaise
const MENTION_TO_EN: Record<string, string> = {
  passable: "Satisfactory", assez_bien: "Fair", bien: "Good",
  tres_bien: "Very Good", excellent: "Excellent",
};
```

**Migrations :**
```bash
bun db:generate && bun db:migrate
```

**Fichiers à modifier :** `app-schema.ts`, `deliberations.types.ts`, `programs.zod.ts`, `programs.service.ts`, `programs.repo.ts`

---

## Phase 2 — API REST + Gestion des Clés API

**Effort : 2 jours**
**Dépendance : Phase 1**

### 2.1 — Middleware d'authentification par clé API

**Fichier à créer :** `apps/server/src/lib/api-key-auth.ts`

```typescript
export async function apiKeyMiddleware(c: HonoContext, next: Next) {
  const raw = c.req.header("X-Api-Key");
  if (!raw) return c.json({ error: "Missing X-Api-Key" }, 401);
  const hash = sha256hex(raw);
  const record = await db.query.diplomationApiKeys.findFirst({
    where: and(eq(diplomationApiKeys.keyHash, hash), eq(diplomationApiKeys.isActive, true)),
  });
  if (!record) return c.json({ error: "Invalid or inactive API key" }, 401);
  db.update(diplomationApiKeys).set({ lastUsedAt: new Date() })
    .where(eq(diplomationApiKeys.id, record.id)); // non-blocking
  c.set("apiKeyRecord", record);
  await next();
}
```

### 2.2 — Routes REST dédiées

**Fichier :** `apps/server/src/index.ts` — monter après les routes tRPC

```
# Délibération (Diplôme + Attestation de Réussite)
GET  /api/diplomation/deliberations/:id              → DiplomationExportData complet
GET  /api/diplomation/deliberations/:id/status       → { id, status, signedAt, type }

# Relevé de Notes
GET  /api/diplomation/transcripts/semester/:semesterId          → TranscriptExportData (tous)
GET  /api/diplomation/transcripts/semester/:semesterId/student/:studentId → un étudiant

# Mode à la demande
GET  /api/diplomation/students/:studentId/transcript?semesterId=...   → transcripts d'un étudiant
GET  /api/diplomation/students/:studentId/attestation?deliberationId= → attestation d'un étudiant

# Rapport de génération (depuis DIPLOMATION vers grades-manager)
POST /api/diplomation/documents                      → enregistrer les PDFs générés

# Liste des délibérations disponibles (pour UI DIPLOMATION)
GET  /api/diplomation/deliberations?status=signed&institutionId=...
GET  /api/diplomation/semesters?status=grades_locked
```

**Isolation multi-tenant :** garantie par la clé API — chaque clé est liée à une institution.

### 2.3 — Service de relevé de notes (`transcript-export`)

**Fichier à créer :** `apps/server/src/modules/exports/transcript-export.service.ts`

Assemble `TranscriptExportData` en joingnant :
- `semesters` → `classes` → `programs` → `studyCycles`
- `enrollments` → `students` → `domainUsers` (dateOfBirth, placeOfBirth)
- `studentCourseEnrollments` → `courses` → `teachingUnits`
- `grades` → `exams` → `examTypes`

### 2.4 — Module de gestion des clés API (tRPC)

**Répertoire :** `apps/server/src/modules/diplomation-keys/`

Procédures (`tenantAdminProcedure`) :
- `create` — génère une clé, stocke son hash, retourne la valeur brute **une seule fois**
- `list` — liste les clés sans valeur brute
- `revoke` — désactive une clé
- `updateWebhook` — configure `webhookUrl` et `webhookSecret`

---

## Phase 3 — Système de Webhooks (grades-manager)

**Effort : 2 jours**
**Dépendance : Phase 2**

### 3.1 — Événements webhook définis

```typescript
// apps/server/src/lib/webhook-dispatch.ts

export type WebhookEvent =
  | {
      event: "deliberation.signed";
      deliberationId: string;
      institutionId: string;
      deliberationType: "graduation" | "annual" | "semester";
      signedAt: string;
      classId: string;
      academicYearId: string;
    }
  | {
      event: "semester.grades_locked";
      semesterId: string;
      institutionId: string;
      classId: string;
      academicYearId: string;
      lockedAt: string;
    };
```

### 3.2 — Service de dispatch

```typescript
export async function dispatchWebhook(
  institutionId: string,
  payload: WebhookEvent,
): Promise<void> {
  const keys = await db.query.diplomationApiKeys.findMany({
    where: and(
      eq(diplomationApiKeys.institutionId, institutionId),
      eq(diplomationApiKeys.isActive, true),
      isNotNull(diplomationApiKeys.webhookUrl),
    ),
  });

  for (const key of keys) {
    const body = JSON.stringify(payload);
    const sig = "sha256=" + hmacSha256(body, key.webhookSecret ?? "");
    fetch(key.webhookUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Diplomation-Signature": sig,
        "X-Diplomation-Event": payload.event,
      },
      body,
      signal: AbortSignal.timeout(8000),
    }).catch(err => console.error(`[Webhook] Failed: ${err.message}`));
  }
}
```

### 3.3 — Points de déclenchement

**Délibération signée** — `deliberations.service.ts` dans `transition()` :
```typescript
if (targetStatus === "signed") {
  dispatchWebhook(institutionId, {
    event: "deliberation.signed",
    deliberationId: input.id,
    deliberationType: delib.deliberationType,
    institutionId,
    signedAt: new Date().toISOString(),
    classId: delib.classId,
    academicYearId: delib.academicYearId,
  });
}
```

**Notes de semestre verrouillées** — à identifier dans le service concerné (exams ou grades) :
```typescript
// Lorsque toutes les notes d'un semestre sont finalisées/verrouillées
dispatchWebhook(institutionId, {
  event: "semester.grades_locked",
  semesterId,
  institutionId,
  classId,
  academicYearId,
  lockedAt: new Date().toISOString(),
});
```

> **Note :** Si grades-manager n'a pas encore de mécanisme de verrouillage de semestre, ajouter une procédure tRPC `semesters.lock` déclenchée manuellement par un admin.

### 3.4 — Table de log des livraisons (optionnel)

```typescript
export const webhookDeliveries = pgTable("webhook_deliveries", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: text("api_key_id").references(() => diplomationApiKeys.id),
  event: text("event").notNull(),
  payload: jsonb("payload"),
  httpStatus: integer("http_status"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Fichiers à créer :** `apps/server/src/lib/webhook-dispatch.ts`
**Fichiers à modifier :** `deliberations.service.ts`, `semesters.service.ts` (ou équivalent)

---

## Phase 4 — Module d'Intégration dans DIPLOMATION

**Effort : 2.5 jours**
**Dépendance : Phase 2 (API REST accessible)**

### 4.1 — Configuration

**Fichier à créer :** `src/lib/grades-manager/config.ts`

```typescript
export interface GradesManagerConfig {
  apiBaseUrl: string;
  apiKey: string;
  webhookListenPort: number;        // défaut: 7842
  webhookSecret: string;
  autoGenerateTranscripts: boolean;
  autoGenerateAttestations: boolean;
  autoGenerateDiplomas: boolean;
  autoOutputDir: string;
  defaultExportFormat: "zip" | "individual";
}
```

### 4.2 — Client API

**Fichier à créer :** `src/lib/grades-manager/api-client.ts`

```typescript
const headers = (config: GradesManagerConfig) => ({ "X-Api-Key": config.apiKey });

export const GradesManagerClient = {
  // Délibération
  getDeliberation: (id: string, config: GradesManagerConfig) =>
    apiFetch<DiplomationExportData>(`/api/diplomation/deliberations/${id}`, config),

  getDeliberationStatus: (id: string, config: GradesManagerConfig) =>
    apiFetch<DeliberationStatus>(`/api/diplomation/deliberations/${id}/status`, config),

  // Relevés de notes
  getSemesterTranscripts: (semesterId: string, config: GradesManagerConfig) =>
    apiFetch<TranscriptExportData>(`/api/diplomation/transcripts/semester/${semesterId}`, config),

  getStudentTranscript: (semesterId: string, studentId: string, config: GradesManagerConfig) =>
    apiFetch<TranscriptExportData>(`/api/diplomation/transcripts/semester/${semesterId}/student/${studentId}`, config),

  // Mode à la demande
  getStudentAttestation: (deliberationId: string, studentId: string, config: GradesManagerConfig) =>
    apiFetch<StudentAttestationData>(`/api/diplomation/students/${studentId}/attestation?deliberationId=${deliberationId}`, config),

  // Listes (pour l'UI DIPLOMATION)
  listSignedDeliberations: (config: GradesManagerConfig) =>
    apiFetch<DeliberationSummary[]>(`/api/diplomation/deliberations?status=signed`, config),

  listLockedSemesters: (config: GradesManagerConfig) =>
    apiFetch<SemesterSummary[]>(`/api/diplomation/semesters?status=grades_locked`, config),

  // Rapport
  reportGeneratedDocument: (doc: GeneratedDocumentReport, config: GradesManagerConfig) =>
    apiPost(`/api/diplomation/documents`, doc, config),
};
```

### 4.3 — Mappers par type de document

**Fichier à créer :** `src/lib/grades-manager/data-mapper.ts`

```typescript
// → DiplomaStudentRecord[]
export function mapToDiplomaRecords(data: DiplomationExportData): DiplomaStudentRecord[];

// → AttestationStudentRecord[]
export function mapToAttestationRecords(data: DiplomationExportData): AttestationStudentRecord[];

// → TranscriptStudentRecord[]
export function mapToTranscriptRecords(data: TranscriptExportData): TranscriptStudentRecord[];
```

Chaque mapper filtre les étudiants éligibles (ex : `finalDecision === "admitted"` pour diplôme/attestation) et mappe les champs selon le format attendu par DIPLOMATION.

### 4.4 — Listener webhook HTTP (Electron main)

**Fichier à créer :** `electron/webhook-listener.ts`

```typescript
export function startWebhookListener(port: number, secret: string, win: BrowserWindow) {
  const server = http.createServer((req, res) => {
    if (req.method !== "POST" || req.url !== "/webhook") {
      res.writeHead(404); res.end(); return;
    }
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      // Vérification HMAC
      const sig = req.headers["x-diplomation-signature"] as string;
      const expected = "sha256=" + hmacSha256(body, secret);
      if (!timingSafeEqual(sig, expected)) {
        res.writeHead(401); res.end("Invalid signature"); return;
      }

      const payload = JSON.parse(body);

      switch (payload.event) {
        case "deliberation.signed":
          win.webContents.send("grades-manager:deliberation-signed", payload);
          break;
        case "semester.grades_locked":
          win.webContents.send("grades-manager:semester-locked", payload);
          break;
      }
      res.writeHead(200); res.end("OK");
    });
  });

  server.listen(port, "0.0.0.0");
  return server;
}
```

### 4.5 — Formulaire de configuration dans Settings

Nouvelle section dans la page Settings de DIPLOMATION :
- URL de l'API grades-manager
- Saisie et test de la clé API
- Port du listener webhook
- Toggles : génération auto par type de document
- Répertoire de sortie automatique

**Fichiers à modifier :**
- `electron/main.ts` — démarrer `webhookListener` après `createWindow()`
- `electron/preload.ts` — exposer les 2 nouveaux canaux IPC
- `src/components/pages/SettingsPage.tsx` — formulaire de configuration

---

## Phase 5 — Pipelines de Génération par Type de Document

**Effort : 3 jours**
**Dépendance : Phase 4**

### 5.1 — Orchestrateur par événement

**Fichier à créer :** `src/hooks/useGradesManagerIntegration.ts`

```typescript
export function useGradesManagerIntegration(config: GradesManagerConfig) {
  useEffect(() => {
    // Événement : délibération signée
    const unsubDeliberation = window.ipcRenderer.on(
      "grades-manager:deliberation-signed",
      async (payload: DeliberationSignedPayload) => {
        const data = await GradesManagerClient.getDeliberation(payload.deliberationId, config);

        if (config.autoGenerateAttestations) {
          await generationQueue.enqueue(() =>
            generateBatch("attestation", mapToAttestationRecords(data), data, config)
          );
        }

        if (config.autoGenerateDiplomas && payload.deliberationType === "graduation") {
          await generationQueue.enqueue(() =>
            generateBatch("diploma", mapToDiplomaRecords(data), data, config)
          );
        }
      }
    );

    // Événement : notes de semestre verrouillées
    const unsubSemester = window.ipcRenderer.on(
      "grades-manager:semester-locked",
      async (payload: SemesterLockedPayload) => {
        if (!config.autoGenerateTranscripts) return;
        const data = await GradesManagerClient.getSemesterTranscripts(payload.semesterId, config);
        await generationQueue.enqueue(() =>
          generateBatch("transcript", mapToTranscriptRecords(data), data, config)
        );
      }
    );

    return () => { unsubDeliberation(); unsubSemester(); };
  }, [config]);
}
```

### 5.2 — Fonction générique `generateBatch`

```typescript
async function generateBatch(
  type: "diploma" | "attestation" | "transcript",
  students: StudentRecord[],
  metadata: ExportMetadata,
  config: GradesManagerConfig,
): Promise<void> {
  const ipcHandler = IPC_HANDLERS[type]; // ex: "generate-diploma-pdf"
  const outputDir = buildOutputPath(config.autoOutputDir, type, metadata);

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      const pdfBytes = await window.ipcRenderer.invoke(ipcHandler, {
        student,
        settings: getSchoolSettings(),
        options: { theme: getThemeForType(type), outputPath: buildFilePath(outputDir, student) },
      });

      await reportSuccess(student, type, metadata, config);
      emitProgress({ type, current: i + 1, total: students.length, student });
    } catch (err) {
      emitError({ type, student, error: err });
    }
  }
}

const IPC_HANDLERS = {
  diploma: "generate-diploma-pdf",
  attestation: "generate-attestation-pdf",
  transcript: "generate-transcript-pdf",
};
```

### 5.3 — File d'attente de génération

**Fichier à créer :** `src/lib/grades-manager/generation-queue.ts`

```typescript
class GenerationQueue {
  private queue: Array<() => Promise<void>> = [];
  private running = false;

  enqueue(task: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(() => task().then(resolve).catch(reject));
      if (!this.running) this.drain();
    });
  }

  private async drain() {
    this.running = true;
    while (this.queue.length > 0) {
      await this.queue.shift()!().catch(console.error);
    }
    this.running = false;
  }
}

export const generationQueue = new GenerationQueue();
```

### 5.4 — Mode à la demande (UI DIPLOMATION)

Un nouveau panneau "Import depuis Grades Manager" doit être ajouté, permettant :
1. Sélectionner une délibération signée ou un semestre verrouillé (liste depuis l'API)
2. Choisir le type de document à générer
3. Optionnellement filtrer les étudiants
4. Lancer la génération manuellement

**Fichier à créer :** `src/components/organisms/grades-manager-import/GradesManagerImport.tsx`

---

## Phase 6 — Stockage, Traçabilité et Mode Hors Ligne

**Effort : 1.5 jours**
**Dépendance : Phase 5**

### 6.1 — Structure des répertoires de sortie

```
<autoOutputDir>/
  <institutionCode>/
    <academicYear>/
      releves/<semesterId>/
        <MATRICULE>_Releve_S<N>.pdf
        _manifest.json
      attestations/<deliberationId>/
        <MATRICULE>_Attestation.pdf
        _manifest.json
      diplomes/<deliberationId>/
        <MATRICULE>_Diplome.pdf
        _manifest.json
```

### 6.2 — Manifeste de génération

```json
{
  "type": "diploma",
  "sourceId": "<deliberationId ou semesterId>",
  "institutionCode": "FMSP",
  "academicYear": "2024-2025",
  "generatedAt": "2026-03-24T12:00:00Z",
  "totalStudents": 45,
  "successCount": 44,
  "errorCount": 1,
  "files": [
    { "matricule": "24M001", "fileName": "24M001_Diplome.pdf", "status": "ok" },
    { "matricule": "24M002", "fileName": "24M002_Diplome.pdf", "status": "error", "error": "..." }
  ]
}
```

### 6.3 — Intégration avec l'historique DIPLOMATION

Appeler `addDocumentRecord` (déjà dans `DiplomaGenerator.tsx`) avec `source: "auto-grades-manager"` pour distinguer les documents auto-générés.

### 6.4 — Rapport vers grades-manager

Après chaque batch, appeler `POST /api/diplomation/documents` pour que grades-manager sache quels documents ont été générés :

```typescript
// Table dans grades-manager (optionnel)
export const diplomationDocuments = pgTable("diplomation_documents", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: text("institution_id").notNull(),
  sourceId: text("source_id").notNull(), // deliberationId ou semesterId
  documentType: text("document_type").notNull(), // "diploma" | "attestation" | "transcript"
  studentId: text("student_id").references(() => students.id),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  fileReference: text("file_reference"),
  generatedByApiKeyId: text("generated_by_api_key_id").references(() => diplomationApiKeys.id),
});
```

Cela permet d'afficher dans grades-manager l'indicateur "Diplômes générés ✓" sur une délibération.

### 6.5 — Mode hors ligne / polling

Si le réseau entre grades-manager et DIPLOMATION est instable (cloud vs local) :
- Ajouter un mode polling dans DIPLOMATION : vérifier `GET /api/diplomation/deliberations?status=signed&since=<lastCheck>` toutes les 5 min
- Activer/désactiver depuis les settings

---

## Récapitulatif des Fichiers

### grades-manager — Fichiers à créer

| Fichier | Phase |
|---|---|
| `apps/server/src/lib/api-key-auth.ts` | 2 |
| `apps/server/src/lib/webhook-dispatch.ts` | 3 |
| `apps/server/src/modules/exports/transcript-export.service.ts` | 2 |
| `apps/server/src/modules/diplomation-keys/` (5 fichiers) | 2 |

### grades-manager — Fichiers à modifier

| Fichier | Changements | Phase |
|---|---|---|
| `apps/server/src/db/schema/app-schema.ts` | + titres diplôme dans `programs`, + `diplomationApiKeys`, + `webhookDeliveries`, + `diplomationDocuments` | 1,2,3,6 |
| `apps/server/src/modules/deliberations/deliberations.types.ts` | + champs dans `DiplomationExportData`, + `TranscriptExportData` | 1 |
| `apps/server/src/modules/deliberations/deliberations.service.ts` | étendre `exportDiplomation`, appeler `dispatchWebhook` | 1,3 |
| `apps/server/src/modules/programs/programs.zod.ts` | + `diplomaTitleFr/En`, `attestationValidity` | 1 |
| `apps/server/src/modules/programs/programs.service.ts` | persister nouveaux champs | 1 |
| `apps/server/src/modules/programs/programs.repo.ts` | inclure dans requêtes | 1 |
| `apps/server/src/index.ts` | monter toutes les routes `/api/diplomation/...` | 2 |
| `apps/server/src/routers/index.ts` | + `diplomationKeysRouter` | 2 |
| `apps/server/src/modules/semesters/semesters.service.ts` | appeler `dispatchWebhook` au verrouillage | 3 |

### DIPLOMATION — Fichiers à créer

| Fichier | Phase |
|---|---|
| `src/lib/grades-manager/config.ts` | 4 |
| `src/lib/grades-manager/api-client.ts` | 4 |
| `src/lib/grades-manager/data-mapper.ts` | 4,5 |
| `src/lib/grades-manager/types.ts` | 4 |
| `src/lib/grades-manager/generation-queue.ts` | 5 |
| `src/lib/grades-manager/output-manager.ts` | 6 |
| `src/hooks/useGradesManagerIntegration.ts` | 5 |
| `electron/webhook-listener.ts` | 4 |
| `src/components/organisms/grades-manager-import/GradesManagerImport.tsx` | 5 |

### DIPLOMATION — Fichiers à modifier

| Fichier | Changements | Phase |
|---|---|---|
| `electron/main.ts` | démarrer listener, émettre progress | 4,5 |
| `electron/preload.ts` | exposer 2 nouveaux canaux IPC | 4 |
| `src/App.tsx` | monter `useGradesManagerIntegration` | 5 |
| `src/components/pages/SettingsPage.tsx` | formulaire config | 4 |

---

## Récapitulatif des Efforts

| Phase | Description | Effort |
|---|---|---|
| 1 | Extensions modèle de données | 1.5 jours |
| 2 | API REST + clés + service transcripts | 2 jours |
| 3 | Webhooks (2 événements) | 2 jours |
| 4 | Module DIPLOMATION (config, client, listener) | 2.5 jours |
| 5 | Pipelines par type de document + mode à la demande | 3 jours |
| 6 | Stockage, traçabilité, mode hors ligne | 1.5 jours |
| **Total** | | **~12.5 jours développeur** |

---

## Décisions Architecturales

### Pourquoi 2 événements webhook distincts ?
`deliberation.signed` couvre Diplôme + Attestation de Réussite. `semester.grades_locked` couvre les Relevés de Notes. Ce sont deux cycles académiques différents avec des données sources différentes. Les mélanger dans un seul événement rendrait le mapping ambigu.

### Pourquoi ne pas pousser directement les PDFs depuis grades-manager ?
Grades-manager génère déjà des PDFs via Puppeteer (PV, publication d'évaluation), mais DIPLOMATION a une couche de personnalisation visuelle (40+ paramètres, 5 thèmes, QR codes chiffrés, logos multiples) que grades-manager ne reproduit pas. Il vaut mieux pousser les **données** et laisser DIPLOMATION générer les **documents**.

### Concernant l'Attestation de Centre
Ce type de document est lié aux centres de formation professionnelle avec des données spécifiques (SESSION_EXAMEN, LIEU_DELIVRANCE, NUMERO_JURY) qui ne font pas partie du modèle académique de grades-manager. À intégrer dans une **phase ultérieure** si grades-manager évolue pour gérer ces centres.

### Fallback polling si grades-manager est cloud-deployed
Si DIPLOMATION est sur une machine locale sans IP publique, le webhook entrant ne peut pas fonctionner. Implémenter le polling comme alternative configurable (Phase 6.5).
