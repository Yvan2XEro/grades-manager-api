import { PeopleDirectory } from "../components/people-directory";

/** Users: the staff of the institution (students have their own list). */
export default function PeoplePage() {
	return <PeopleDirectory audience="staff" />;
}
