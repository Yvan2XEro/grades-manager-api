import { useNavigate } from "react-router";
import { StudentFormDialog } from "./student-form-dialog";

export function StudentNew() {
	const navigate = useNavigate();
	return (
		<StudentFormDialog
			open={true}
			onOpenChange={(open) => {
				if (!open) navigate("/students");
			}}
			onSuccess={() => navigate("/students")}
		/>
	);
}
