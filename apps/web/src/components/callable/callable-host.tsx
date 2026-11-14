import { Confirm } from "@/components/callable/confirm";
import { DocumentPreviewDialog } from "@/components/callable/DocumentPreviewDialog";
import { AcademicYearFormDialog } from "@/modules/academic-years/AcademicYearFormDialog";
import { AcademicYearSetupDialog } from "@/modules/academic-years/AcademicYearSetupDialog";
import {
	CreateApiKeyDialog,
	EditWebhookDialog,
	RawApiKeyDialog,
} from "@/modules/api-keys/ApiKeyDialogs";
import {
	CreateAttendanceSessionDialog,
	ExcuseAbsenceDialog,
} from "@/modules/attendance/AttendanceDialogs";
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
import { AddInstallmentDialog } from "@/modules/fees/components/add-installment-dialog";
import { AssignStudentDialog } from "@/modules/fees/components/assign-student-dialog";
import { BankImportDialog } from "@/modules/fees/components/bank-import-dialog";
import { BulkAssignDialog } from "@/modules/fees/components/bulk-assign-dialog";
import { ConfirmOrderDialog } from "@/modules/fees/components/confirm-order-dialog";
import { CreateOrderDialog } from "@/modules/fees/components/create-order-dialog";
import { CreateStructureDialog } from "@/modules/fees/components/create-structure-dialog";
import { EditInstallmentDialog } from "@/modules/fees/components/edit-installment-dialog";
import { ExemptWithNotesDialog } from "@/modules/fees/components/exempt-with-notes-dialog";
import { RecordPaymentDialog } from "@/modules/fees/components/record-payment-dialog";
import { UpdateDiscountDialog } from "@/modules/fees/components/update-discount-dialog";
import { AssignDelegateDialog } from "@/modules/grades/AssignDelegateDialog";
import { GrantGradeAccessDialog } from "@/modules/grades/GradeAccessGrants";
import { BulkExportReportDialog } from "@/modules/grades/GradeExport";
import { AddGuardianDialog } from "@/modules/guardians/components/add-guardian-dialog";
import { GuardianPreferencesSheet } from "@/modules/guardians/components/guardian-preferences-sheet";
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
