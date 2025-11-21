import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import * as schema from "@/db/schema/app-schema";
import * as notifications from "../notifications/notifications.service";
import * as examsService from "../exams/exams.service";
import * as enrollmentsRepo from "../enrollments/enrollments.repo";
import * as windowsRepo from "./workflows.repo";

export async function validateGrades(examId: string, approverId?: string | null) {
        const updated = await examsService.validateExam(examId, approverId ?? null, "approved");
        await examsService.setLock(examId, true);
        await notifications.registerWorkflowAlert("grade_validated", { examId }, approverId);
        return updated;
}

export async function toggleEnrollmentWindow(
        classId: string,
        academicYearId: string,
        action: "open" | "close",
) {
        const { items } = await enrollmentsRepo.list({ classId, academicYearId, status: undefined });
        if (!items.length) {
                throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Class or academic year not found for enrollment window",
                });
        }
        const nextStatus: schema.EnrollmentWindowStatus = action === "open" ? "open" : "closed";
        const window = await windowsRepo.upsertWindow(classId, academicYearId, nextStatus);
        await notifications.registerWorkflowAlert(`enrollment_${nextStatus}`, {
                classId,
                academicYearId,
                status: nextStatus,
        });
        return window;
}

export async function listEnrollmentWindows() {
        return windowsRepo.listWindows();
}

export async function triggerAttendanceAlert(
        classCourseId: string,
        severity: "info" | "warning" | "critical",
        message: string,
        recipientId?: string,
) {
        await notifications.registerWorkflowAlert(
                "attendance_alert",
                { classCourseId, severity, message },
                recipientId,
        );
        return { status: "queued" };
}

export async function closeExpiredApprovedExams() {
        const staleExams = await db.query.exams.findMany({
                where: (t, { and, eq, lt }) =>
                        and(eq(t.status, "approved"), eq(t.isLocked, false), lt(t.date, new Date())),
                limit: 20,
        });
        for (const exam of staleExams) {
                await examsService.setLock(exam.id, true);
                await notifications.registerWorkflowAlert("exam_locked", { examId: exam.id });
        }
        return staleExams.length;
}
