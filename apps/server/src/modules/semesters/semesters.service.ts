import * as repo from "./semesters.repo";

export async function listSemesters() {
	return repo.list();
}
