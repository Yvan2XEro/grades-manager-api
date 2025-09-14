import { TRPCError } from "@trpc/server";
import * as classesRepo from "../classes/classes.repo";
import { transaction } from "../_shared/db-transaction";
import * as schema from "../../db/schema/app-schema";
import * as repo from "./students.repo";

export async function createStudent(data: Parameters<typeof repo.create>[0]) {
  try {
    return await repo.create(data);
  } catch (e) {
    throw new TRPCError({ code: "CONFLICT" });
  }
}

export async function bulkCreateStudents(
  data: {
    classId: string;
    students: Array<{
      firstName: string;
      lastName: string;
      email: string;
      registrationNumber: string;
    }>;
  },
) {
  const klass = await classesRepo.findById(data.classId);
  if (!klass) throw new TRPCError({ code: "NOT_FOUND" });

  const conflicts: Array<{
    row: number;
    email?: string;
    registrationNumber?: string;
    reason: string;
  }> = [];
  const errors: Array<{ row: number; reason: string }> = [];
  let createdCount = 0;

  await transaction(async (tx) => {
    for (let i = 0; i < data.students.length; i++) {
      const s = data.students[i];
      try {
        await tx.insert(schema.students).values({
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          registrationNumber: s.registrationNumber,
          class: data.classId,
        });
        createdCount++;
      } catch (e: any) {
        const message = String(e?.message ?? "");
        let reason = "Unknown error";
        if (message.includes("uq_students_email")) {
          reason = "Email already exists";
        } else if (message.includes("uq_students_registration")) {
          reason = "Registration number already exists";
        }
        conflicts.push({
          row: i + 1,
          email: s.email,
          registrationNumber: s.registrationNumber,
          reason,
        });
      }
    }
  });

  return { createdCount, conflicts, errors };
}

export async function updateStudent(id: string, data: Parameters<typeof repo.update>[1]) {
  const existing = await repo.findById(id);
  if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
  return repo.update(id, data);
}

export async function listStudents(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function getStudentById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new TRPCError({ code: "NOT_FOUND" });
  return item;
}
