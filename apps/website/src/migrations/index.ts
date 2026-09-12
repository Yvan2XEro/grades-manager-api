import * as migration_20260911_140500_add_users_verification from "./20260911_140500_add_users_verification";

export const migrations = [
	{
		up: migration_20260911_140500_add_users_verification.up,
		down: migration_20260911_140500_add_users_verification.down,
		name: "20260911_140500_add_users_verification",
	},
];
