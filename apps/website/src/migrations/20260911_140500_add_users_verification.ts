import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-postgres";
import { sql } from "@payloadcms/db-postgres";

/**
 * Ajoute les colonnes de verification d email sur « users ».
 *
 * La collection Users active `auth.verify` (email de confirmation), ce qui
 * fait attendre a Payload les colonnes `_verified` et `_verificationtoken`.
 * Le schema Postgres avait ete cree avant l activation de cette option : tout
 * acces a la collection echouait sur « la colonne users._verified n existe pas ».
 *
 * Les colonnes sont nullables, conformement a ce que genere Payload.
 * IF [NOT] EXISTS garde la migration rejouable sur les bases deja a jour.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "_verified" boolean;
		ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "_verificationtoken" varchar;
	`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
		ALTER TABLE "users" DROP COLUMN IF EXISTS "_verified";
		ALTER TABLE "users" DROP COLUMN IF EXISTS "_verificationtoken";
	`);
}
