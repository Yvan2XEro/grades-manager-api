import { Confirm } from "@/components/callable/confirm";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { AcademicYearFormDialog } from "@/modules/academic-years/components/academic-year-form-dialog";
import { AcademicYearSetupDialog } from "@/modules/academic-years/components/academic-year-setup-dialog";
import {
	CreateApiKeyDialog,
	EditWebhookDialog,
	RawApiKeyDialog,
} from "@/modules/api-keys/ApiKeyDialogs";
import {
	CreateAttendanceSessionDialog,
	ExcuseAbsenceDialog,
} from "@/modules/attendance/AttendanceDialogs";
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
import { RenameTemplateDialog } from "@/modules/documents/components/rename-template-dialog";
import { BulkClassExportDialog } from "@/modules/documents/components/bulk-class-export-dialog";
import { ExportStudentListDialog } from "@/modules/documents/components/export-student-list-dialog";
import { GenerateDocumentDialog } from "@/modules/documents/components/generate-document-dialog";
import {
	BulkEnrollClassesDialog,
	EnrollEntireClassDialog,
	StudentCourseRosterDialog,
} from "@/modules/enrollments/EnrollmentManagement";
import {
	ExamFormDialog,
	RejectExamDialog,
	RetakeExamDialog,
} from "@/modules/exams/ExamDialogs";
import { ParticipationOverrideDialog } from "@/modules/exams/ExamParticipationRoster";
import {
	RunDetailsDialog,
	ScheduleExamsDialog,
} from "@/modules/exams/ExamScheduler";
import { ExamTypeFormDialog } from "@/modules/exams/ExamTypeFormDialog";
import { RetakeOverrideDialog } from "@/modules/exams/RetakeEligibility";
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
import { AssignDelegateDialog } from "@/modules/grades/AssignDelegateDialog";
import { GrantGradeAccessDialog } from "@/modules/grades/GradeAccessGrants";
import { BulkExportReportDialog } from "@/modules/grades/GradeExport";
import {
	AddGuardianDialog,
	GuardianPreferencesSheet,
} from "@/modules/guardians/GuardianDirectory";
import { CycleLevelFormDialog } from "@/modules/institution/CycleLevelFormDialog";
import { InstitutionFormDialog } from "@/modules/institution/InstitutionFormDialog";
import { StudyCycleFormDialog } from "@/modules/institution/StudyCycleFormDialog";
import { CreatePersonDialog } from "@/modules/people/PeopleManagement";
import { CourseFormDialog } from "@/modules/programs/components/course-form-dialog";
import { DuplicateProgramsDialog } from "@/modules/programs/components/duplicate-programs-dialog";
import { ProgramFormDialog } from "@/modules/programs/components/program-form-dialog";
import { ProgramOptionFormDialog } from "@/modules/programs/components/program-option-form-dialog";
import { TeachingUnitFormDialog } from "@/modules/programs/components/teaching-unit-form-dialog";
import { UeCourseFormDialog } from "@/modules/programs/components/ue-course-form-dialog";
import { ExecutionDetailsDialog } from "@/modules/promotion-rules/execution-history";
import { PromotionRuleFormDialog } from "@/modules/promotion-rules/rules-list";
import { AvatarCropModal } from "@/modules/settings/AccountTab";
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
