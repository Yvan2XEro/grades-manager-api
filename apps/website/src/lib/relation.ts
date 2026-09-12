/**
 * Normalisation des champs de relation Payload.
 *
 * Un champ de relation vaut soit l'identifiant brut, soit le document complet
 * lorsque la requête a été faite avec `depth > 0`. Le code de ce dépôt avait
 * été écrit pour MongoDB, où cet identifiant est une chaîne, et extrayait donc
 * la valeur avec des `as { id: string }` disséminés.
 *
 * La base réelle du site est PostgreSQL : les identifiants Payload y sont des
 * entiers issus d'une séquence (`nextval('pages_id_seq')`). Ces casts étaient
 * donc faux dans les deux sens — ils masquaient le type réel et empêchaient le
 * compilateur de signaler les assignations invalides.
 *
 * Ces deux fonctions remplacent tous ces casts par une extraction typée.
 */

/** Un champ de relation Payload : l'identifiant, le document, ou rien. */
export type Relation<T> = T | number | null | undefined;

/**
 * Renvoie l'identifiant numérique d'une relation, ou `null` si elle est vide.
 *
 * ```ts
 * const clientId = relationId(invoice.client); // number | null
 * ```
 */
export function relationId<T extends { id: number }>(
	value: Relation<T>,
): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "object") return value.id;
	return value;
}

/**
 * Variante pour les cas où l'appelant a déjà établi que la relation est
 * renseignée. Lève si ce n'est pas le cas, plutôt que de propager un
 * identifiant absent jusqu'à une requête.
 */
export function requireRelationId<T extends { id: number }>(
	value: Relation<T>,
	label: string,
): number {
	const id = relationId(value);
	if (id === null) {
		throw new Error(`Relation « ${label} » attendue mais absente.`);
	}
	return id;
}
