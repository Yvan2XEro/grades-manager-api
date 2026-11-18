import { PeopleDirectory } from "../components/people-directory";

/** Students: people with a student record, by year, class and enrollment status. */
export default function StudentsPage() {
	return <PeopleDirectory audience="students" />;
}
