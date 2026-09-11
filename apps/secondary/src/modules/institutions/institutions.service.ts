import * as repo from "./institutions.repo";

export async function update(
	institutionId: string,
	data: {
		name?: string;
		minesecCode?: string;
		type?: string;
		address?: string;
		city?: string;
		phone?: string;
		email?: string;
		assessmentMode?: string;
		logoUrl?: string;
	},
) {
	return repo.updateById(institutionId, data);
}
