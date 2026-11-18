# TKAMS Secondary launch

Internal maintenance notes. This file is not served by the website.

## Positioning and scope

TKAMS retains its higher education origins while introducing a dedicated secondary school offering at `/secondaire` (with a permanent redirect from `/solutions/secondaire`). LMD features and existing pricing remain explicitly associated with higher education. Marketing copy is available in French and English through the website's existing dictionaries.

The registration forms direct secondary schools to assisted setup because the current provisioning workflow still uses the higher education image. These changes do not provision secondary instances.

## Verified product sources

- The user-provided test walkthrough informed the workflow inventory. System administration, test accounts and fictional school data are excluded from public content.
- `apps/secondary/src/modules/report-cards/report-cards.service.ts`: weighted averages, rankings, individual and class PDF generation.
- `apps/secondary/src/modules/class-councils/class-councils.service.ts`: decisions recorded by the teaching team.
- `apps/secondary/src/modules/official-exams/official-exams.service.ts`: sessions, candidate registrations and candidate lists.
- Attendance and finance modules: attendance records, recorded payments and outstanding balances. Public content does not promise online payment collection.
- Client onboarding, student, assignment and grade workflows: guided setup, CSV templates and teacher grade entry.

The walkthrough marked some features as pending that are now present in code, including PDF report cards. Copy makes no claims about regulatory certification, ministry synchronisation or automated pedagogical decisions.

## Payload articles

`src/content/secondary-articles.ts` contains three French articles with Lexical content and SEO metadata. The current Posts collection is not localised.

Run from `apps/website`:

```sh
# Offline JSON preview
bun src/content/seed-secondary-articles.ts

# Create drafts in the CMS configured through DATABASE_URL
bun src/content/seed-secondary-articles.ts --write
```

The importer skips existing slugs, preserves editorial changes and never publishes articles. All three drafts were created and verified in the configured local database. No production deployment or publication was performed.

The local Docker replica set advertises the hostname `mongodb`, which is not resolvable from the host. A temporary `directConnection=true` override allowed the import through the exposed local MongoDB port. No `.env` file was changed.

Find the drafts under **Payload → Posts**, using these slugs:

- `tkams-secondaire-disponible-colleges-lycees`
- `notes-bulletins-conseils-classe-tkams-secondaire`
- `preparer-rentree-tkams-secondaire`

## Validation

- Website TypeScript check passed.
- Biome checks passed for the changed source files.
- Browser checks returned HTTP 200 with no horizontal overflow for the homepage and secondary page in French and English at 375, 768, 1024 and 1440 pixels. Mobile secondary navigation was exercised in both languages.
- The three CMS records were verified as drafts.

## Redesign integration

The redesign keeps the MongoDB adapter, package and string document IDs from `dev`. PostgreSQL-specific migrations from the design branch are excluded. The website must keep a MongoDB `DATABASE_URL`; this merge does not migrate or reset CMS data. The existing article importer remains adapter-independent through the Payload Local API.

The redesigned homepage and `/secondaire` page include the availability announcement. Existing article links to `/solutions/secondaire` continue to work through the permanent redirect. The registration forms retain the assisted secondary setup path.
