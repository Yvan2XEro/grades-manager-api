import { Confirm } from "@/components/callable/confirm";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { AcademicYearFormDialog } from "@/modules/academic-years/components/academic-year-form-dialog";
import { AcademicYearSetupDialog } from "@/modules/academic-years/components/academic-year-setup-dialog";
import { CreateApiKeyDialog } from "@/modules/api-keys/components/create-api-key-dialog";
import { EditWebhookDialog } from "@/modules/api-keys/components/edit-webhook-dialog";
import { RawApiKeyDialog } from "@/modules/api-keys/components/raw-api-key-dialog";
import { CreateAttendanceSessionDialog } from "@/modules/attendance/components/create-attendance-session-dialog";
import { ExcuseAbsenceDialog } from "@/modules/attendance/components/excuse-absence-dialog";
import { CreateBatchJobDialog } from "@/modules/batch-jobs/components/create-batch-job-dialog";
import { AssignTeachingUnitDialog } from "@/modules/classes/components/assign-teaching-unit-dialog";
import { AutoEnrollClassDialog } from "@/modules/classes/components/auto-enroll-class-dialog";
import { BulkGenerateClassesDialog } from "@/modules/classes/components/bulk-generate-classes-dialog";
import { ClassCourseFormDialog } from "@/modules/classes/components/class-course-form-dialog";
import { ClassFormDialog } from "@/modules/classes/components/class-form-dialog";
import { CourseCatalogExportDialog } from "@/modules/classes/components/course-catalog-export-dialog";
import { CreateDeliberationDialog } from "@/modules/deliberations/CreateDeliberationDialog";
import { DeliberationRuleFormDialog } from "@/modules/deliberations/DeliberationRules";
import { OverrideDecisionDialog } from "@/modules/deliberations/OverrideDecisionDialog";
import { PromoteAdmittedDialog } from "@/modules/deliberations/PromoteAdmittedDialog";
import { ResolveItemSheet } from "@/modules/deliberations/TransitionDetail";
import { BulkClassExportDialog } from "@/modules/documents/components/bulk-class-export-dialog";
import { ExportStudentListDialog } from "@/modules/documents/components/export-student-list-dialog";
import { GenerateDocumentDialog } from "@/modules/documents/components/generate-document-dialog";
import { RenameTemplateDialog } from "@/modules/documents/components/rename-template-dialog";
import { BulkEnrollClassesDialog } from "@/modules/enrollments/components/bulk-enroll-classes-dialog";
import { EnrollEntireClassDialog } from "@/modules/enrollments/components/enroll-entire-class-dialog";
import { StudentCourseRosterDialog } from "@/modules/enrollments/components/student-course-roster-dialog";
import { ExamFormDialog } from "@/modules/exams/components/exam-form-dialog";
import { ExamTypeFormDialog } from "@/modules/exams/components/exam-type-form-dialog";
import { ParticipationOverrideDialog } from "@/modules/exams/components/participation-override-dialog";
import { RejectExamDialog } from "@/modules/exams/components/reject-exam-dialog";
import { RetakeExamDialog } from "@/modules/exams/components/retake-exam-dialog";
import { RetakeOverrideDialog } from "@/modules/exams/components/retake-override-dialog";
import { RunDetailsDialog } from "@/modules/exams/components/run-details-dialog";
import { ScheduleExamsDialog } from "@/modules/exams/components/schedule-exams-dialog";
import { BankImportDialog } from "@/modules/fees/BankImportDialog";
import {
	ConfirmOrderDialog,
	CreateOrderDialog,
	ExemptWithNotesDialog,
	RecordPaymentDialog,
	UpdateDiscountDialog,
} from "@/modules/fees/FeeAssignmentDetail";
import {
	AssignStudentDialog,
	BulkAssignDialog,
} from "@/modules/fees/FeeAssignmentsList";
import {
	AddInstallmentDialog,
	EditInstallmentDialog,
} from "@/modules/fees/FeeStructureInstallmentsTab";
import { CreateStructureDialog } from "@/modules/fees/FeeStructuresList";
import { AssignDelegateDialog } from "@/modules/grades/components/assign-delegate-dialog";
import { BulkExportReportDialog } from "@/modules/grades/components/bulk-export-report-dialog";
import { GrantGradeAccessDialog } from "@/modules/grades/components/grant-grade-access-dialog";
import {
	AddGuardianDialog,
	GuardianPreferencesSheet,
} from "@/modules/guardians/GuardianDirectory";
import { CycleLevelFormDialog } from "@/modules/institution/CycleLevelFormDialog";
import { InstitutionFormDialog } from "@/modules/institution/InstitutionFormDialog";
import { StudyCycleFormDialog } from "@/modules/institution/StudyCycleFormDialog";
import { CreatePersonDialog } from "@/modules/people/components/create-person-dialog";
import { CourseFormDialog } from "@/modules/programs/components/course-form-dialog";
import { DuplicateProgramsDialog } from "@/modules/programs/components/duplicate-programs-dialog";
import { ProgramFormDialog } from "@/modules/programs/components/program-form-dialog";
import { ProgramOptionFormDialog } from "@/modules/programs/components/program-option-form-dialog";
import { TeachingUnitFormDialog } from "@/modules/programs/components/teaching-unit-form-dialog";
import { UeCourseFormDialog } from "@/modules/programs/components/ue-course-form-dialog";
import { ExecutionDetailsDialog } from "@/modules/promotion-rules/execution-history";
import { PromotionRuleFormDialog } from "@/modules/promotion-rules/rules-list";
import { AvatarCropModal } from "@/modules/settings/components/avatar-crop-modal";
import { CopyTimetableDialog } from "@/modules/timetable/components/copy-timetable-dialog";
import { RoomFormDialog } from "@/modules/timetable/components/room-form-dialog";
import { TimetableImportDialog } from "@/modules/timetable/components/timetable-import-dialog";
import { TimetableSessionDialog } from "@/modules/timetable/components/timetable-session-dialog";
import { DeanRejectExamDialog } from "@/modules/workflows/components/dean-reject-exam-dialog";

/**
 * Mounts the single Root of every Callable. Rendered once inside the app
 * providers (React Query, router, theme, i18n) so Callables can use them and
 * be called — and nested — from anywhere.
 */
export function CallableHost() {
	return (
		<>
			<Confirm />
			<StudyCycleFormDialog />
			<ProgramFormDialog />
			<DuplicateProgramsDialog />
			<ProgramOptionFormDialog />
			<CycleLevelFormDialog />
			<AcademicYearSetupDialog />
			<AcademicYearFormDialog />
			<BulkClassExportDialog />
			<ClassFormDialog />
			<BulkGenerateClassesDialog />
			<CreatePersonDialog />
			<CourseFormDialog />
			<ClassCourseFormDialog />
			<AssignTeachingUnitDialog />
			<AutoEnrollClassDialog />
			<CourseCatalogExportDialog />
			<TeachingUnitFormDialog />
			<CreateDeliberationDialog />
			<OverrideDecisionDialog />
			<PromoteAdmittedDialog />
			<TimetableImportDialog />
			<CopyTimetableDialog />
			<BankImportDialog />
			<CreateBatchJobDialog />
			<BulkAssignDialog />
			<AssignStudentDialog />
			<RecordPaymentDialog />
			<UpdateDiscountDialog />
			<CreateStructureDialog />
			<EditInstallmentDialog />
			<AddInstallmentDialog />
			<ExemptWithNotesDialog />
			<CreateOrderDialog />
			<ConfirmOrderDialog />
			<ExamTypeFormDialog />
			<ExamFormDialog />
			<RetakeExamDialog />
			<RejectExamDialog />
			<CreateApiKeyDialog />
			<RawApiKeyDialog />
			<EditWebhookDialog />
			<AddGuardianDialog />
			<GuardianPreferencesSheet />
			<StudentCourseRosterDialog />
			<BulkEnrollClassesDialog />
			<EnrollEntireClassDialog />
			<PromotionRuleFormDialog />
			<DeliberationRuleFormDialog />
			<RetakeOverrideDialog />
			<ParticipationOverrideDialog />
			<DocumentPreviewDialog />
			<GenerateDocumentDialog />
			<ExportStudentListDialog />
			<RoomFormDialog />
			<TimetableSessionDialog />
			<InstitutionFormDialog />
			<UeCourseFormDialog />
			<GrantGradeAccessDialog />
			<RenameTemplateDialog />
			<CreateAttendanceSessionDialog />
			<ExcuseAbsenceDialog />
			<BulkExportReportDialog />
			<ScheduleExamsDialog />
			<RunDetailsDialog />
			<AvatarCropModal />
			<DeanRejectExamDialog />
			<AssignDelegateDialog />
			<ExecutionDetailsDialog />
			<ResolveItemSheet />
		</>
	);
}
