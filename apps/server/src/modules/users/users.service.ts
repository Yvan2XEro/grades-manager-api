import * as repo from "./users.repo";

export async function listUsers(opts: Parameters<typeof repo.list>[0]) {
	return repo.list(opts);
}
