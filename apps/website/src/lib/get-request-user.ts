import type { NextRequest } from "next/server";
import type { User } from "@/payload-types";
import { getServerSideURL } from "@/utilities/getURL";

export async function getRequestUser(req: NextRequest): Promise<User | null> {
	const token = req.cookies.get("payload-token")?.value;
	if (!token) return null;
	try {
		const res = await fetch(`${getServerSideURL()}/api/users/me`, {
			headers: { Authorization: `JWT ${token}` },
			cache: "no-store",
		});
		if (!res.ok) return null;
		const data = await res.json();
		return (data.user as User) ?? null;
	} catch {
		return null;
	}
}
