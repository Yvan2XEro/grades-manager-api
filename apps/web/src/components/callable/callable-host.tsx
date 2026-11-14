import { Confirm } from "@/components/callable/confirm";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { AcademicYearFormDialog } from "@/modules/academic-years/AcademicYearFormDialog";
import { AcademicYearSetupDialog } from "@/modules/academic-years/AcademicYearSetupDialog";
import {
	CreateApiKeyDialog,
	EditWebhookDialog,
	RawApiKeyDialog,
} from "@/modules/api-keys/ApiKeyDialogs";
import { CreateAttendanceSessionDialog } from "@/modules/attendance/components/create-attendance-session-dialog";
import { ExcuseAbsenceDialog } from "@/modules/attendance/components/excuse-absence-dialog";
import { CreateBatchJobDialog } from "@/modules/batch-jobs/CreateBatchJobDialog";
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
import { RenameTemplateDialog } from "@/modules/documents/ExportTemplatesManagement";
import { BulkClassExportDialog } from "@/modules/documents/editor/BulkClassExportDialog";
import { ExportStudentListDialog } from "@/modules/documents/editor/ExportStudentListButton";
import { GenerateDocumentDialog } from "@/modules/documents/editor/GenerateDocumentButton";
import {
	BulkEnrollClassesDialog,
	EnrollEntireClassDialog,
	StudentCourseRosterDialog,
} from "@/modules/enrollments/EnrollmentManagement";
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
import { CourseFormDialog } from "@/modules/programs/CourseFormDialog";
import { ProgramFormDialog } from "@/modules/programs/ProgramFormDialog";
import { DuplicateProgramsDialog } from "@/modules/programs/ProgramManagement";
import { ProgramOptionFormDialog } from "@/modules/programs/ProgramOptionFormDialog";
import { UeCourseFormDialog } from "@/modules/programs/TeachingUnitCoursesTable";
import { TeachingUnitFormDialog } from "@/modules/programs/TeachingUnitFormDialog";
import { ExecutionDetailsDialog } from "@/modules/promotion-rules/execution-history";
import { PromotionRuleFormDialog } from "@/modules/promotion-rules/rules-list";
import { AvatarCropModal } from "@/modules/settings/AccountTab";
import { CopyTimetableDialog } from "@/modules/timetable/CopyTimetableDialog";
import { RoomFormDialog } from "@/modules/timetable/RoomFormDialog";
import { TimetableImportDialog } from "@/modules/timetable/TimetableImportDialog";
import { TimetableSessionDialog } from "@/modules/timetable/TimetableSessionDialog";
import { DeanRejectExamDialog } from "@/modules/workflows/ExamApprovals";

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
