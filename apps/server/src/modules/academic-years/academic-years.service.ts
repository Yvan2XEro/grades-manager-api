import * as repo from "./academic-years.repo";
import * as schema from "../../db/schema/app-schema";
import { eq } from "drizzle-orm";
import { notFound } from "../_shared/errors";
import { transaction } from "../_shared/db-transaction";

export async function createAcademicYear(data: Parameters<typeof repo.create>[0]) {
  return repo.create(data);
}

export async function updateAcademicYear(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw notFound();
  return repo.update(id, data);
}

export async function deleteAcademicYear(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw notFound();
  await repo.remove(id);
}

export async function listAcademicYears(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getAcademicYearById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw notFound();
  return item;
}

export async function setActive(id: string, isActive: boolean) {
  await transaction(async (tx) => {
    if (isActive) {
      await tx
        .update(schema.academicYears)
        .set({ isActive: false })
        .where(eq(schema.academicYears.isActive, true));
    }
    await tx
      .update(schema.academicYears)
      .set({ isActive })
      .where(eq(schema.academicYears.id, id));
  });
  return repo.findById(id);
}
