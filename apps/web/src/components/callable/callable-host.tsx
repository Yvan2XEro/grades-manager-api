import { BulkClassExportDialog } from "@/components/admin/document-templates/BulkClassExportDialog";
import { ExportStudentListDialog } from "@/components/admin/document-templates/ExportStudentListButton";
import { GenerateDocumentDialog } from "@/components/admin/document-templates/GenerateDocumentButton";
import { UeCourseFormDialog } from "@/components/admin/TeachingUnitCoursesTable";
import { Confirm } from "@/components/callable/confirm";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { AcademicYearFormDialog } from "@/components/callable/forms/AcademicYearFormDialog";
import { ClassFormDialog } from "@/components/callable/forms/ClassFormDialog";
import { CourseFormDialog } from "@/components/callable/forms/CourseFormDialog";
import { CycleLevelFormDialog } from "@/components/callable/forms/CycleLevelFormDialog";
import { ExamTypeFormDialog } from "@/components/callable/forms/ExamTypeFormDialog";
import { InstitutionFormDialog } from "@/components/callable/forms/InstitutionFormDialog";
import { ProgramFormDialog } from "@/components/callable/forms/ProgramFormDialog";
import { ProgramOptionFormDialog } from "@/components/callable/forms/ProgramOptionFormDialog";
import { RoomFormDialog } from "@/components/callable/forms/RoomFormDialog";
import { StudyCycleFormDialog } from "@/components/callable/forms/StudyCycleFormDialog";
import { TeachingUnitFormDialog } from "@/components/callable/forms/TeachingUnitFormDialog";
import { AcademicYearSetupDialog } from "@/pages/admin/AcademicYearSetupDialog";
import {
	CreateApiKeyDialog,
	EditWebhookDialog,
	RawApiKeyDialog,
} from "@/pages/admin/api-keys/ApiKeyDialogs";
import {
	CreateAttendanceSessionDialog,
	ExcuseAbsenceDialog,
} from "@/pages/admin/attendance/AttendanceDialogs";
import { CreateBatchJobDialog } from "@/pages/admin/batch-jobs/CreateBatchJobDialog";
import { BulkGenerateClassesDialog } from "@/pages/admin/ClassManagement";
import {
	AssignTeachingUnitDialog,
	AutoEnrollClassDialog,
	ClassCourseFormDialog,
	CourseCatalogExportDialog,
} from "@/pages/admin/class-courses/ClassCourseDialogs";
import { CreateDeliberationDialog } from "@/pages/admin/deliberations/CreateDeliberationDialog";
import { DeliberationRuleFormDialog } from "@/pages/admin/deliberations/DeliberationRules";
import { OverrideDecisionDialog } from "@/pages/admin/deliberations/OverrideDecisionDialog";
import { PromoteAdmittedDialog } from "@/pages/admin/deliberations/PromoteAdmittedDialog";
import { ResolveItemSheet } from "@/pages/admin/deliberations/TransitionDetail";
import {
	BulkEnrollClassesDialog,
	EnrollEntireClassDialog,
	StudentCourseRosterDialog,
} from "@/pages/admin/EnrollmentManagement";
import { ParticipationOverrideDialog } from "@/pages/admin/ExamParticipationRoster";
import {
	RunDetailsDialog,
	ScheduleExamsDialog,
} from "@/pages/admin/ExamScheduler";
import { RenameTemplateDialog } from "@/pages/admin/ExportTemplatesManagement";
import {
	ExamFormDialog,
	RejectExamDialog,
	RetakeExamDialog,
} from "@/pages/admin/exams/ExamDialogs";
import { BankImportDialog } from "@/pages/admin/fee-clearance/BankImportDialog";
import {
	ConfirmOrderDialog,
	CreateOrderDialog,
	ExemptWithNotesDialog,
	RecordPaymentDialog,
	UpdateDiscountDialog,
} from "@/pages/admin/fee-clearance/FeeAssignmentDetail";
import {
	AssignStudentDialog,
	BulkAssignDialog,
} from "@/pages/admin/fee-clearance/FeeAssignmentsList";
import {
	AddInstallmentDialog,
	EditInstallmentDialog,
} from "@/pages/admin/fee-clearance/FeeStructureInstallmentsTab";
import { CreateStructureDialog } from "@/pages/admin/fee-clearance/FeeStructuresList";
import { GrantGradeAccessDialog } from "@/pages/admin/GradeAccessGrants";
import { BulkExportReportDialog } from "@/pages/admin/GradeExport";
import { ExecutionDetailsDialog } from "@/pages/admin/promotion-rules/execution-history";
import { PromotionRuleFormDialog } from "@/pages/admin/promotion-rules/rules-list";
import { RetakeOverrideDialog } from "@/pages/admin/RetakeEligibility";
import { CopyTimetableDialog } from "@/pages/admin/timetable/CopyTimetableDialog";
import { TimetableImportDialog } from "@/pages/admin/timetable/TimetableImportDialog";
import { TimetableSessionDialog } from "@/pages/admin/timetable/TimetableSessionDialog";
import {
	AddGuardianDialog,
	GuardianPreferencesSheet,
} from "@/pages/admin/users/GuardianDirectory";
import { CreatePersonDialog } from "@/pages/admin/users/PeopleManagement";
import { DeanRejectExamDialog } from "@/pages/dean/DeanDashboard";
import { AvatarCropModal } from "@/pages/settings/AccountTab";
import { AssignDelegateDialog } from "@/pages/teacher/AssignDelegateDialog";
import { DuplicateProgramsDialog } from "@/pages/teacher/ProgramManagement";

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
