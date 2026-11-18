import { Confirm } from "@/components/callable/confirm";
import { CsvImport } from "@/components/csv-import-dialog";
import { CreateSessionDialog } from "@/pages/attendance/attendance-overview";
import { AutoAssignDialog } from "@/pages/class-councils/council-detail";
import { CreateCouncilDialog } from "@/pages/class-councils/councils-list";
import { ClassFormDialog } from "@/pages/classes/class-form-dialog";
import { EnrollStudentDialog } from "@/pages/enrollments/enroll-student-dialog";
import {
	FeeScheduleDialog,
	QuickRecordPaymentDialog,
} from "@/pages/finance/finance-overview";
import {
	BulkImportDialog,
	RecordFeeDialog,
	RegisterCandidateDialog,
} from "@/pages/official-exams/tabs/candidates-tab";
import { StaffFormDialog } from "@/pages/staff-form-dialog";
import { StudentFormDialog } from "@/pages/students/student-form-dialog";
import { RecordPaymentDialog } from "@/pages/students/tabs/fees-tab";
import { AssignSubjectDialog } from "@/pages/subject-assignments/assign-subject-dialog";
import { SubjectFormDialog } from "@/pages/subject-form-dialog";
import { ContractDialog } from "@/pages/sysadmin/institution-billing";
import {
	AddMemberDialog,
	EditInstitutionDialog,
} from "@/pages/sysadmin/institution-detail";
import { CreateInstitutionDialog } from "@/pages/sysadmin/institutions";
import {
	AddToInstitutionDialog,
	BanUserDetailDialog,
	SetPasswordDialog,
	UpdateUserDialog,
} from "@/pages/sysadmin/user-detail";
import { BanUserDialog, CreateUserDialog } from "@/pages/sysadmin/users";
import { CreateTermDialog } from "@/pages/terms/terms-list";
import { TrackFormDialog } from "@/pages/tracks/track-form-dialog";

/**
 * Mounts the single Root of every Callable. Rendered once inside the app
 * providers (tRPC, React Query, router, i18n) so Callables can use them and
 * be called — and nested — from anywhere.
 */
export function CallableHost() {
	return (
		<>
			<Confirm />
			<CsvImport />
			<ClassFormDialog />
			<StudentFormDialog />
			<StaffFormDialog />
			<SubjectFormDialog />
			<AssignSubjectDialog />
			<EnrollStudentDialog />
			<CreateTermDialog />
			<TrackFormDialog />
			<RecordPaymentDialog />
			<QuickRecordPaymentDialog />
			<FeeScheduleDialog />
			<CreateSessionDialog />
			<AutoAssignDialog />
			<CreateCouncilDialog />
			<RegisterCandidateDialog />
			<BulkImportDialog />
			<RecordFeeDialog />
			<CreateUserDialog />
			<BanUserDialog />
			<CreateInstitutionDialog />
			<BanUserDetailDialog />
			<SetPasswordDialog />
			<UpdateUserDialog />
			<AddToInstitutionDialog />
			<AddMemberDialog />
			<EditInstitutionDialog />
			<ContractDialog />
		</>
	);
}
