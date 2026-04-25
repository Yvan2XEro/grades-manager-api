export type HelpItem = {
	q: string;
	a: string;
};

export type HelpSection = {
	title: string;
	items: HelpItem[];
};

type LangContent = {
	[route: string]: HelpSection[];
};

const content: Record<"en" | "fr", LangContent> = {
	en: {
		// ─── Admin: index = Dashboard ────────────────────────────────
		"/admin": [
			{
				title: "Dashboard",
				items: [
					{
						q: "What do the stats at the top show?",
						a: "Live counts of students, enrollments, exams, and institutions in your organization.",
					},
					{
						q: "Why does a stat show zero?",
						a: "No records of that type exist yet. Start by creating an academic year, then faculties and programs.",
					},
					{
						q: "What is the recent activity feed?",
						a: "The latest actions in the system — new students, grade submissions, enrollment changes, and more.",
					},
				],
			},
		],

		// ─── Students ────────────────────────────────────────────────
		"/admin/students": [
			{
				title: "Students",
				items: [
					{
						q: "How do I add a new student?",
						a: 'Click "Add student" and fill in the form. A registration number is generated automatically.',
					},
					{
						q: "Can I import students in bulk?",
						a: "Yes — use the import button to upload a CSV. Download the template first for the required format.",
					},
					{
						q: "How do I filter by gender or status?",
						a: "Use the filter bar above the table. You can combine filters and search by name or registration number.",
					},
					{
						q: "How do I delete a student?",
						a: "Right-click the row and choose Delete. A student with active enrollments cannot be deleted.",
					},
				],
			},
		],

		// ─── Enrollments ─────────────────────────────────────────────
		"/admin/enrollments": [
			{
				title: "Enrollments",
				items: [
					{
						q: "What is an enrollment?",
						a: "An enrollment links a student to a class for a specific academic year and tracks their status.",
					},
					{
						q: "How do I enroll a student?",
						a: 'Click "Add enrollment", select the student, the class, and the academic year.',
					},
					{
						q: "What do the statuses mean?",
						a: "Active: currently enrolled. Pending: awaiting confirmation. Completed: finished. Withdrawn: left mid-year.",
					},
				],
			},
		],

		// ─── Exams ───────────────────────────────────────────────────
		"/admin/exams": [
			{
				title: "Exams",
				items: [
					{
						q: "How do I create an exam?",
						a: 'Click "Add exam", choose the course and exam type, then set the date and coefficient.',
					},
					{
						q: "What is a coefficient?",
						a: "The weight of the exam in the final grade. Higher coefficient = bigger impact on the result.",
					},
					{
						q: "Can I filter exams by date?",
						a: "Yes — use the date range filters in the filter bar.",
					},
				],
			},
		],

		// ─── Exam types ──────────────────────────────────────────────
		"/admin/exam-types": [
			{
				title: "Exam types",
				items: [
					{
						q: "What are exam types?",
						a: "Exam types define categories like Midterm, Final, or Continuous Assessment. They are reused across courses.",
					},
					{
						q: "Can I delete an exam type that is in use?",
						a: "No. Remove all exams using that type first.",
					},
				],
			},
		],

		// ─── Exam scheduler ──────────────────────────────────────────
		"/admin/exam-scheduler": [
			{
				title: "Exam scheduler",
				items: [
					{
						q: "What does the exam scheduler do?",
						a: "It lets you plan exam sessions for a class, assigning dates and rooms across multiple courses at once.",
					},
					{
						q: "Can I export the schedule?",
						a: "Yes — use the export button to download the schedule as a document.",
					},
				],
			},
		],

		// ─── Retake eligibility ──────────────────────────────────────
		"/admin/retake-eligibility": [
			{
				title: "Retake eligibility",
				items: [
					{
						q: "What is retake eligibility?",
						a: "Students who failed a course may be eligible for a retake exam. This page shows their current eligibility status.",
					},
					{
						q: "Can I manually override eligibility?",
						a: "Yes — right-click a student row to force-eligible or force-ineligible, or to remove the override.",
					},
				],
			},
		],

		// ─── Faculties ───────────────────────────────────────────────
		"/admin/faculties": [
			{
				title: "Faculties",
				items: [
					{
						q: "What is the academic structure?",
						a: "Faculty → Program → Study Cycle → Class. Courses are attached to Teaching Units inside a program.",
					},
					{
						q: "How do I add a faculty?",
						a: 'Click "Add faculty", enter the name and code. You can then create programs inside it.',
					},
					{
						q: "Can I delete a faculty that has programs?",
						a: "No. Remove all programs and their sub-items first.",
					},
				],
			},
		],

		// ─── Programs (admin) ────────────────────────────────────────
		"/admin/programs": [
			{
				title: "Programs",
				items: [
					{
						q: "What is a program?",
						a: "A program (e.g. Bachelor in CS) belongs to a faculty and contains one or more study cycles.",
					},
					{
						q: "How do study cycles relate to programs?",
						a: "A study cycle is a level within the program (e.g. Year 1, Year 2). Each cycle has semesters and classes.",
					},
				],
			},
		],

		// ─── Study cycles ────────────────────────────────────────────
		"/admin/study-cycles": [
			{
				title: "Study cycles",
				items: [
					{
						q: "What is a study cycle?",
						a: "A study cycle represents one year or level inside a program. It contains the semesters for that level.",
					},
					{
						q: "How many cycles can a program have?",
						a: "As many as needed — typically one per year of study (e.g. 3 cycles for a 3-year bachelor).",
					},
				],
			},
		],

		// ─── Courses (admin) ─────────────────────────────────────────
		"/admin/courses": [
			{
				title: "Courses",
				items: [
					{
						q: "What is a course?",
						a: "A course is a subject taught within a teaching unit. It has a coefficient and is assigned to a teacher.",
					},
					{
						q: "How do I assign a teacher to a course?",
						a: "Edit the course and select the teacher from the dropdown. Only users with the teacher role appear.",
					},
				],
			},
		],

		// ─── Teaching units ──────────────────────────────────────────
		"/admin/teaching-units": [
			{
				title: "Teaching units",
				items: [
					{
						q: "What is a teaching unit?",
						a: "A teaching unit (UE) groups related courses within a program. It has its own coefficient that contributes to the semester grade.",
					},
					{
						q: "Can a teaching unit span multiple semesters?",
						a: "No — each teaching unit belongs to a single semester.",
					},
				],
			},
		],

		// ─── Classes ─────────────────────────────────────────────────
		"/admin/classes": [
			{
				title: "Classes",
				items: [
					{
						q: "What is a class?",
						a: "A class is a group of students enrolled in a specific study cycle for a given academic year.",
					},
					{
						q: "How do I create a class?",
						a: 'Click "Add class", select the academic year, program, and study cycle.',
					},
				],
			},
		],

		// ─── Class courses ───────────────────────────────────────────
		"/admin/class-courses": [
			{
				title: "Class courses",
				items: [
					{
						q: "What are class courses?",
						a: "They link specific courses to a class for a given semester, allowing teachers to be assigned per class.",
					},
					{
						q: "Why is a course not showing for a class?",
						a: "The course must first be linked to the class via a class-course entry.",
					},
				],
			},
		],

		// ─── Academic years ──────────────────────────────────────────
		"/admin/academic-years": [
			{
				title: "Academic years",
				items: [
					{
						q: "How do I create an academic year?",
						a: 'Click "Add academic year", set the label and dates. Only one year can be active at a time.',
					},
					{
						q: "What does activating an academic year do?",
						a: "It marks that year as current, enabling enrollments and grade entry for it.",
					},
					{
						q: "Why can't I delete an academic year?",
						a: "An academic year cannot be deleted if it has classes linked to it. Remove the classes first.",
					},
				],
			},
		],

		// ─── Users ───────────────────────────────────────────────────
		"/admin/users": [
			{
				title: "Users",
				items: [
					{
						q: "What roles are available?",
						a: "super_admin, administrator, dean, teacher, staff, student — each with different permissions.",
					},
					{
						q: "How do I invite a new user?",
						a: 'Click "Invite user", enter their email and assign a role. They receive an invitation email.',
					},
					{
						q: "Can I change a user's role?",
						a: "Yes — right-click the row and select Edit.",
					},
				],
			},
		],

		// ─── Deliberations ───────────────────────────────────────────
		"/admin/deliberations": [
			{
				title: "Deliberations",
				items: [
					{
						q: "What is a deliberation?",
						a: "The formal process of reviewing a class's results to decide outcomes: pass, fail, or retake.",
					},
					{
						q: "How do I start a deliberation?",
						a: 'Create one for the desired class and year, then click "Open" to begin reviewing results.',
					},
					{
						q: "Can I undo a deliberation?",
						a: "Draft deliberations can be deleted. Once finalized, contact an administrator.",
					},
				],
			},
		],

		// ─── Promotion rules ─────────────────────────────────────────
		"/admin/promotion-rules": [
			{
				title: "Promotion rules",
				items: [
					{
						q: "What are promotion rules?",
						a: "Configurable rules that determine whether a student is promoted, held back, or referred for a retake based on their grades.",
					},
					{
						q: "How do I run a promotion evaluation?",
						a: 'Go to "Evaluate", select the class and academic year, then run the evaluation to preview results before executing.',
					},
				],
			},
		],

		// ─── Monitoring ──────────────────────────────────────────────
		"/admin/monitoring": [
			{
				title: "Monitoring",
				items: [
					{
						q: "What does the monitoring dashboard show?",
						a: "System health metrics, background job statuses, and performance indicators for the platform.",
					},
				],
			},
		],

		// ─── Batch jobs ──────────────────────────────────────────────
		"/admin/batch-jobs": [
			{
				title: "Batch jobs",
				items: [
					{
						q: "What are batch jobs?",
						a: "Asynchronous tasks running in the background, such as bulk exports, grade recalculations, or data imports.",
					},
					{
						q: "How do I cancel a running job?",
						a: "Right-click the job row and choose Cancel. Only pending or running jobs can be cancelled.",
					},
				],
			},
		],

		// ─── Notifications ───────────────────────────────────────────
		"/admin/notifications": [
			{
				title: "Notifications",
				items: [
					{
						q: "What kind of notifications appear here?",
						a: "System alerts, grade approval requests, workflow updates, and administrative messages.",
					},
					{
						q: "How do I clear notifications?",
						a: "Click Acknowledge on each notification, or use the bulk-acknowledge action.",
					},
				],
			},
		],

		// ─── Institution settings ────────────────────────────────────
		"/admin/institution": [
			{
				title: "Institution settings",
				items: [
					{
						q: "What can I configure here?",
						a: "Institution name, logo, contact details, and branding information shown on documents and login pages.",
					},
					{
						q: "Can I change the institution's slug?",
						a: "No — the slug is set at creation time and cannot be changed. Contact support if needed.",
					},
				],
			},
		],

		// ─── Grade export ────────────────────────────────────────────
		"/admin/grade-export": [
			{
				title: "Grade export",
				items: [
					{
						q: "What formats can I export grades in?",
						a: "PDF and Excel (XLSX), using customizable export templates.",
					},
					{
						q: "How do I create a custom export template?",
						a: "Go to Export Templates, create a new template, and use the editor to define the layout.",
					},
				],
			},
		],

		// ─── Export templates ────────────────────────────────────────
		"/admin/export-templates": [
			{
				title: "Export templates",
				items: [
					{
						q: "What are export templates?",
						a: "Reusable document layouts for generating grade reports. You can customize headers, columns, and formatting.",
					},
				],
			},
		],

		// ─── Registration numbers ────────────────────────────────────
		"/admin/registration-numbers": [
			{
				title: "Registration numbers",
				items: [
					{
						q: "What are registration number formats?",
						a: "Rules that define how student and exam registration numbers are auto-generated (prefix, year, sequence, etc.).",
					},
					{
						q: "Can I change the format after students are registered?",
						a: "Existing numbers are not changed. The new format applies only to future registrations.",
					},
				],
			},
		],

		// ─── Dean: workflows ─────────────────────────────────────────
		"/dean/workflows": [
			{
				title: "Workflow approvals",
				items: [
					{
						q: "What are workflow approvals?",
						a: "Grade change requests submitted by teachers that require dean-level review and approval.",
					},
					{
						q: "How do I approve a grade change?",
						a: "Open the request, review the old and new values, then click Approve or Reject.",
					},
				],
			},
		],

		// ─── Teacher: dashboard ──────────────────────────────────────
		"/teacher": [
			{
				title: "Teacher dashboard",
				items: [
					{
						q: "What does the teacher dashboard show?",
						a: "A summary of your assigned courses, upcoming exams, and pending grade submissions.",
					},
					{
						q: "How do I find my courses?",
						a: 'Go to "Courses" in the sidebar to see all courses assigned to you for the current year.',
					},
				],
			},
		],

		// ─── Teacher: courses ────────────────────────────────────────
		"/teacher/courses": [
			{
				title: "My courses",
				items: [
					{
						q: "Where do I enter grades?",
						a: "Click on a course to open the grade entry view for that course's exams.",
					},
					{
						q: "Why is a course not in my list?",
						a: "You must be assigned to the course by an administrator via the class-course assignment.",
					},
				],
			},
		],

		// ─── Teacher: grades ─────────────────────────────────────────
		"/teacher/grades": [
			{
				title: "Grade entry",
				items: [
					{
						q: "How do I enter grades?",
						a: "Select the course and exam, then enter a score for each student. Click Save when done.",
					},
					{
						q: "Can I change a grade after saving?",
						a: "Yes, but changes require approval from a dean or administrator and go through a workflow.",
					},
					{
						q: "What does a grade of — mean?",
						a: "The grade has not been entered yet for that student.",
					},
				],
			},
		],

		// ─── Teacher: attendance ─────────────────────────────────────
		"/teacher/attendance": [
			{
				title: "Attendance alerts",
				items: [
					{
						q: "What are attendance alerts?",
						a: "Notifications about students who have missed too many sessions and may be at risk.",
					},
				],
			},
		],

		// ─── Teacher: workflows ──────────────────────────────────────
		"/teacher/workflows": [
			{
				title: "My grade change requests",
				items: [
					{
						q: "How do I request a grade change?",
						a: "Submit a change request from the grade entry view. It is sent to the dean for approval.",
					},
					{
						q: "What statuses can a request have?",
						a: "Pending: waiting for review. Approved: change applied. Rejected: change denied.",
					},
				],
			},
		],

		// ─── Student: dashboard ──────────────────────────────────────
		"/student": [
			{
				title: "My performance",
				items: [
					{
						q: "What does this page show?",
						a: "Your grades, averages, and credit accumulation for the current and past academic years.",
					},
					{
						q: "What does the credit column mean?",
						a: "Credits are earned by passing courses. They reflect your academic progression toward the degree.",
					},
				],
			},
		],

		// ─── Settings ────────────────────────────────────────────────
		"/settings": [
			{
				title: "Account settings",
				items: [
					{
						q: "How do I change my password?",
						a: 'Go to the "Security" tab and enter your current password, then your new one.',
					},
					{
						q: "How do I change the display language?",
						a: 'Open the "Preferences" tab and select your language. The change applies immediately.',
					},
					{
						q: "Can I change my email address?",
						a: "Contact your administrator to update your email, as it is linked to your organization account.",
					},
				],
			},
		],

		// ─── General (always shown) ──────────────────────────────────
		default: [
			{
				title: "General",
				items: [
					{
						q: "How is the app organized?",
						a: "The sidebar has sections for Admin, Teacher, Dean, or Student depending on your role. Use it to navigate between modules.",
					},
					{
						q: "How do I switch language?",
						a: "Click your profile icon in the top-right corner and select your preferred language.",
					},
					{
						q: "I see a permission error — what does it mean?",
						a: "Your role does not have access to that action. Contact your administrator.",
					},
					{
						q: "Where do I change my password?",
						a: "Open your profile from the top-right icon and go to Settings → Security.",
					},
				],
			},
		],
	},

	fr: {
		// ─── Admin: index = Dashboard ────────────────────────────────
		"/admin": [
			{
				title: "Tableau de bord",
				items: [
					{
						q: "Que montrent les statistiques en haut ?",
						a: "Le nombre en temps réel d'étudiants, d'inscriptions, d'examens et d'institutions dans votre organisation.",
					},
					{
						q: "Pourquoi une statistique affiche zéro ?",
						a: "Aucun enregistrement de ce type n'existe encore. Commencez par créer une année académique, puis des facultés et programmes.",
					},
					{
						q: "Qu'est-ce que le fil d'activité récente ?",
						a: "Les dernières actions dans le système — nouveaux étudiants, soumissions de notes, changements d'inscription, etc.",
					},
				],
			},
		],

		// ─── Students ────────────────────────────────────────────────
		"/admin/students": [
			{
				title: "Étudiants",
				items: [
					{
						q: "Comment ajouter un nouvel étudiant ?",
						a: 'Cliquez sur "Ajouter un étudiant" et remplissez le formulaire. Un numéro d\'inscription est généré automatiquement.',
					},
					{
						q: "Puis-je importer des étudiants en masse ?",
						a: "Oui — utilisez le bouton d'import pour téléverser un CSV. Téléchargez d'abord le modèle.",
					},
					{
						q: "Comment filtrer par genre ou statut ?",
						a: "Utilisez la barre de filtres. Vous pouvez combiner les filtres et rechercher par nom ou numéro d'inscription.",
					},
					{
						q: "Comment supprimer un étudiant ?",
						a: "Clic droit sur la ligne → Supprimer. Un étudiant avec des inscriptions actives ne peut pas être supprimé.",
					},
				],
			},
		],

		// ─── Enrollments ─────────────────────────────────────────────
		"/admin/enrollments": [
			{
				title: "Inscriptions",
				items: [
					{
						q: "Qu'est-ce qu'une inscription ?",
						a: "Une inscription relie un étudiant à une classe pour une année académique et suit son statut.",
					},
					{
						q: "Comment inscrire un étudiant ?",
						a: "Cliquez sur \"Ajouter une inscription\", sélectionnez l'étudiant, la classe et l'année académique.",
					},
					{
						q: "Que signifient les statuts ?",
						a: "Actif : inscrit. En attente : confirmation requise. Terminé : année validée. Retiré : a quitté en cours d'année.",
					},
				],
			},
		],

		// ─── Exams ───────────────────────────────────────────────────
		"/admin/exams": [
			{
				title: "Examens",
				items: [
					{
						q: "Comment créer un examen ?",
						a: 'Cliquez sur "Ajouter un examen", choisissez le cours et le type, définissez la date et le coefficient.',
					},
					{
						q: "Qu'est-ce qu'un coefficient ?",
						a: "Le poids de l'examen dans la note finale. Plus le coefficient est élevé, plus l'impact est important.",
					},
					{
						q: "Peut-on filtrer les examens par date ?",
						a: "Oui — utilisez les filtres de plage de dates dans la barre de filtres.",
					},
				],
			},
		],

		// ─── Exam types ──────────────────────────────────────────────
		"/admin/exam-types": [
			{
				title: "Types d'examen",
				items: [
					{
						q: "Que sont les types d'examen ?",
						a: "Des catégories réutilisables comme Examen partiel, Examen final, ou Contrôle continu.",
					},
					{
						q: "Peut-on supprimer un type utilisé par des examens ?",
						a: "Non. Supprimez d'abord tous les examens utilisant ce type.",
					},
				],
			},
		],

		// ─── Exam scheduler ──────────────────────────────────────────
		"/admin/exam-scheduler": [
			{
				title: "Planificateur d'examens",
				items: [
					{
						q: "À quoi sert le planificateur ?",
						a: "Il permet de planifier des sessions d'examens pour une classe, en attribuant dates et salles sur plusieurs cours à la fois.",
					},
					{
						q: "Peut-on exporter le planning ?",
						a: "Oui — utilisez le bouton d'export pour télécharger le planning en document.",
					},
				],
			},
		],

		// ─── Retake eligibility ──────────────────────────────────────
		"/admin/retake-eligibility": [
			{
				title: "Éligibilité au rattrapage",
				items: [
					{
						q: "Qu'est-ce que l'éligibilité au rattrapage ?",
						a: "Les étudiants ayant échoué à un cours peuvent être éligibles à un examen de rattrapage. Cette page affiche leur statut.",
					},
					{
						q: "Puis-je modifier manuellement l'éligibilité ?",
						a: "Oui — clic droit sur un étudiant pour forcer l'éligibilité, la forcer inéligible, ou supprimer le forçage.",
					},
				],
			},
		],

		// ─── Faculties ───────────────────────────────────────────────
		"/admin/faculties": [
			{
				title: "Facultés",
				items: [
					{
						q: "Quelle est la structure académique ?",
						a: "Faculté → Programme → Cycle d'études → Classe. Les cours sont rattachés à des UE dans un programme.",
					},
					{
						q: "Comment ajouter une faculté ?",
						a: 'Cliquez sur "Ajouter une faculté", entrez le nom et le code. Vous pourrez ensuite créer des programmes.',
					},
					{
						q: "Peut-on supprimer une faculté avec des programmes ?",
						a: "Non. Supprimez d'abord tous les programmes et leurs sous-éléments.",
					},
				],
			},
		],

		// ─── Programs ────────────────────────────────────────────────
		"/admin/programs": [
			{
				title: "Programmes",
				items: [
					{
						q: "Qu'est-ce qu'un programme ?",
						a: "Un programme (ex. Licence Informatique) appartient à une faculté et contient un ou plusieurs cycles d'études.",
					},
					{
						q: "Quel est le lien entre cycles et programmes ?",
						a: "Un cycle représente un niveau dans le programme (ex. Année 1, Année 2). Chaque cycle a des semestres et des classes.",
					},
				],
			},
		],

		// ─── Study cycles ────────────────────────────────────────────
		"/admin/study-cycles": [
			{
				title: "Cycles d'études",
				items: [
					{
						q: "Qu'est-ce qu'un cycle d'études ?",
						a: "Un cycle représente une année ou un niveau à l'intérieur d'un programme. Il contient les semestres de ce niveau.",
					},
					{
						q: "Combien de cycles un programme peut-il avoir ?",
						a: "Autant que nécessaire — généralement un par année d'études (ex. 3 cycles pour une licence en 3 ans).",
					},
				],
			},
		],

		// ─── Courses (admin) ─────────────────────────────────────────
		"/admin/courses": [
			{
				title: "Cours",
				items: [
					{
						q: "Qu'est-ce qu'un cours ?",
						a: "Un cours est une matière enseignée dans une unité d'enseignement. Il a un coefficient et est assigné à un enseignant.",
					},
					{
						q: "Comment assigner un enseignant à un cours ?",
						a: "Modifiez le cours et sélectionnez l'enseignant dans la liste. Seuls les utilisateurs avec le rôle enseignant apparaissent.",
					},
				],
			},
		],

		// ─── Teaching units ──────────────────────────────────────────
		"/admin/teaching-units": [
			{
				title: "Unités d'enseignement",
				items: [
					{
						q: "Qu'est-ce qu'une unité d'enseignement (UE) ?",
						a: "Une UE regroupe des cours liés dans un programme. Elle a son propre coefficient qui contribue à la moyenne du semestre.",
					},
					{
						q: "Une UE peut-elle couvrir plusieurs semestres ?",
						a: "Non — chaque UE appartient à un seul semestre.",
					},
				],
			},
		],

		// ─── Classes ─────────────────────────────────────────────────
		"/admin/classes": [
			{
				title: "Classes",
				items: [
					{
						q: "Qu'est-ce qu'une classe ?",
						a: "Un groupe d'étudiants inscrits dans un cycle d'études pour une année académique donnée.",
					},
					{
						q: "Comment créer une classe ?",
						a: 'Cliquez sur "Ajouter une classe", sélectionnez l\'année académique, le programme et le cycle.',
					},
				],
			},
		],

		// ─── Class courses ───────────────────────────────────────────
		"/admin/class-courses": [
			{
				title: "Cours de classe",
				items: [
					{
						q: "Que sont les cours de classe ?",
						a: "Ils lient des cours spécifiques à une classe pour un semestre donné, permettant d'assigner un enseignant par classe.",
					},
					{
						q: "Pourquoi un cours n'apparaît-il pas pour une classe ?",
						a: "Le cours doit d'abord être lié à la classe via une entrée cours-classe.",
					},
				],
			},
		],

		// ─── Academic years ──────────────────────────────────────────
		"/admin/academic-years": [
			{
				title: "Années académiques",
				items: [
					{
						q: "Comment créer une année académique ?",
						a: 'Cliquez sur "Ajouter une année académique", définissez le libellé et les dates.',
					},
					{
						q: "Qu'est-ce qu'activer une année académique ?",
						a: "Cela la marque comme courante, permettant les inscriptions et la saisie des notes.",
					},
					{
						q: "Pourquoi ne puis-je pas supprimer une année académique ?",
						a: "Elle ne peut pas être supprimée si des classes y sont rattachées. Supprimez les classes d'abord.",
					},
				],
			},
		],

		// ─── Users ───────────────────────────────────────────────────
		"/admin/users": [
			{
				title: "Utilisateurs",
				items: [
					{
						q: "Quels rôles sont disponibles ?",
						a: "super_admin, administrator, dean, teacher, staff, student — chacun avec des permissions différentes.",
					},
					{
						q: "Comment inviter un nouvel utilisateur ?",
						a: 'Cliquez sur "Inviter un utilisateur", entrez son email et assignez un rôle.',
					},
					{
						q: "Peut-on changer le rôle d'un utilisateur ?",
						a: "Oui — clic droit sur la ligne → Modifier.",
					},
				],
			},
		],

		// ─── Deliberations ───────────────────────────────────────────
		"/admin/deliberations": [
			{
				title: "Délibérations",
				items: [
					{
						q: "Qu'est-ce qu'une délibération ?",
						a: "Le processus formel d'examen des résultats d'une classe pour décider des issues : admis, ajourné, rattrapage.",
					},
					{
						q: "Comment démarrer une délibération ?",
						a: 'Créez-en une pour la classe et l\'année souhaitées, puis cliquez sur "Ouvrir".',
					},
					{
						q: "Peut-on annuler une délibération ?",
						a: "Les brouillons peuvent être supprimés. Une fois finalisées, contactez un administrateur.",
					},
				],
			},
		],

		// ─── Promotion rules ─────────────────────────────────────────
		"/admin/promotion-rules": [
			{
				title: "Règles de promotion",
				items: [
					{
						q: "Que sont les règles de promotion ?",
						a: "Des règles configurables qui déterminent si un étudiant est promu, redoublant ou en rattrapage selon ses notes.",
					},
					{
						q: "Comment lancer une évaluation de promotion ?",
						a: "Allez dans \"Évaluer\", sélectionnez la classe et l'année, puis lancez l'évaluation pour prévisualiser avant d'exécuter.",
					},
				],
			},
		],

		// ─── Monitoring ──────────────────────────────────────────────
		"/admin/monitoring": [
			{
				title: "Surveillance",
				items: [
					{
						q: "Que montre le tableau de surveillance ?",
						a: "Les métriques de santé du système, les statuts des tâches en arrière-plan et les indicateurs de performance.",
					},
				],
			},
		],

		// ─── Batch jobs ──────────────────────────────────────────────
		"/admin/batch-jobs": [
			{
				title: "Tâches planifiées",
				items: [
					{
						q: "Que sont les tâches planifiées ?",
						a: "Des tâches asynchrones s'exécutant en arrière-plan : exports en masse, recalculs de notes, imports de données.",
					},
					{
						q: "Comment annuler une tâche en cours ?",
						a: "Clic droit sur la tâche → Annuler. Seules les tâches en attente ou en cours peuvent être annulées.",
					},
				],
			},
		],

		// ─── Notifications ───────────────────────────────────────────
		"/admin/notifications": [
			{
				title: "Notifications",
				items: [
					{
						q: "Quel type de notifications apparaît ici ?",
						a: "Alertes système, demandes d'approbation de notes, mises à jour de workflows et messages administratifs.",
					},
					{
						q: "Comment effacer les notifications ?",
						a: "Cliquez sur Acquitter sur chaque notification, ou utilisez l'action d'acquittement groupé.",
					},
				],
			},
		],

		// ─── Institution settings ────────────────────────────────────
		"/admin/institution": [
			{
				title: "Paramètres de l'institution",
				items: [
					{
						q: "Que peut-on configurer ici ?",
						a: "Le nom, le logo, les coordonnées et les informations de marque affichés sur les documents et les pages de connexion.",
					},
					{
						q: "Peut-on changer le slug de l'institution ?",
						a: "Non — le slug est défini à la création et ne peut pas être modifié. Contactez le support si nécessaire.",
					},
				],
			},
		],

		// ─── Grade export ────────────────────────────────────────────
		"/admin/grade-export": [
			{
				title: "Export des notes",
				items: [
					{
						q: "Quels formats d'export sont disponibles ?",
						a: "PDF et Excel (XLSX), en utilisant des modèles d'export personnalisables.",
					},
					{
						q: "Comment créer un modèle d'export personnalisé ?",
						a: "Allez dans Modèles d'export, créez un nouveau modèle et utilisez l'éditeur pour définir la mise en page.",
					},
				],
			},
		],

		// ─── Export templates ────────────────────────────────────────
		"/admin/export-templates": [
			{
				title: "Modèles d'export",
				items: [
					{
						q: "Que sont les modèles d'export ?",
						a: "Des mises en page réutilisables pour générer des bulletins de notes. Vous pouvez personnaliser les en-têtes, colonnes et la mise en forme.",
					},
				],
			},
		],

		// ─── Registration numbers ────────────────────────────────────
		"/admin/registration-numbers": [
			{
				title: "Numéros d'inscription",
				items: [
					{
						q: "Que sont les formats de numéros d'inscription ?",
						a: "Des règles définissant comment les numéros d'inscription sont générés automatiquement (préfixe, année, séquence, etc.).",
					},
					{
						q: "Peut-on changer le format après l'inscription des étudiants ?",
						a: "Les numéros existants ne sont pas modifiés. Le nouveau format s'applique uniquement aux futures inscriptions.",
					},
				],
			},
		],

		// ─── Dean: workflows ─────────────────────────────────────────
		"/dean/workflows": [
			{
				title: "Approbations de workflows",
				items: [
					{
						q: "Que sont les approbations de workflows ?",
						a: "Des demandes de modification de notes soumises par des enseignants qui nécessitent une validation du doyen.",
					},
					{
						q: "Comment approuver une modification de note ?",
						a: "Ouvrez la demande, vérifiez l'ancienne et la nouvelle valeur, puis cliquez sur Approuver ou Rejeter.",
					},
				],
			},
		],

		// ─── Teacher: dashboard ──────────────────────────────────────
		"/teacher": [
			{
				title: "Tableau de bord enseignant",
				items: [
					{
						q: "Que montre le tableau de bord enseignant ?",
						a: "Un résumé de vos cours assignés, des examens à venir et des saisies de notes en attente.",
					},
					{
						q: "Comment trouver mes cours ?",
						a: 'Allez dans "Cours" dans la barre latérale pour voir tous les cours qui vous sont assignés pour l\'année en cours.',
					},
				],
			},
		],

		// ─── Teacher: courses ────────────────────────────────────────
		"/teacher/courses": [
			{
				title: "Mes cours",
				items: [
					{
						q: "Où saisir les notes ?",
						a: "Cliquez sur un cours pour ouvrir la vue de saisie des notes pour les examens de ce cours.",
					},
					{
						q: "Pourquoi un cours n'est-il pas dans ma liste ?",
						a: "Vous devez être assigné au cours par un administrateur via l'affectation cours-classe.",
					},
				],
			},
		],

		// ─── Teacher: grades ─────────────────────────────────────────
		"/teacher/grades": [
			{
				title: "Saisie des notes",
				items: [
					{
						q: "Comment saisir des notes ?",
						a: "Sélectionnez le cours et l'examen, puis entrez une note pour chaque étudiant. Cliquez sur Enregistrer.",
					},
					{
						q: "Peut-on modifier une note après enregistrement ?",
						a: "Oui, mais les modifications nécessitent l'approbation d'un doyen ou administrateur via un workflow.",
					},
					{
						q: "Que signifie une note — ?",
						a: "La note n'a pas encore été saisie pour cet étudiant.",
					},
				],
			},
		],

		// ─── Teacher: attendance ─────────────────────────────────────
		"/teacher/attendance": [
			{
				title: "Alertes de présence",
				items: [
					{
						q: "Que sont les alertes de présence ?",
						a: "Des notifications concernant des étudiants ayant manqué trop de séances et pouvant être en difficulté.",
					},
				],
			},
		],

		// ─── Teacher: workflows ──────────────────────────────────────
		"/teacher/workflows": [
			{
				title: "Mes demandes de modification",
				items: [
					{
						q: "Comment demander une modification de note ?",
						a: "Soumettez une demande depuis la vue de saisie des notes. Elle est envoyée au doyen pour approbation.",
					},
					{
						q: "Quels statuts peut avoir une demande ?",
						a: "En attente : en cours d'examen. Approuvée : modification appliquée. Rejetée : modification refusée.",
					},
				],
			},
		],

		// ─── Student: dashboard ──────────────────────────────────────
		"/student": [
			{
				title: "Mes résultats",
				items: [
					{
						q: "Que montre cette page ?",
						a: "Vos notes, moyennes et crédits accumulés pour l'année académique en cours et les précédentes.",
					},
					{
						q: "Que signifie la colonne crédits ?",
						a: "Les crédits sont obtenus en validant des cours. Ils reflètent votre progression académique vers le diplôme.",
					},
				],
			},
		],

		// ─── Settings ────────────────────────────────────────────────
		"/settings": [
			{
				title: "Paramètres du compte",
				items: [
					{
						q: "Comment changer mon mot de passe ?",
						a: 'Allez dans l\'onglet "Sécurité" et entrez votre mot de passe actuel, puis le nouveau.',
					},
					{
						q: "Comment changer la langue d'affichage ?",
						a: "Ouvrez l'onglet \"Préférences\" et sélectionnez votre langue. Le changement s'applique immédiatement.",
					},
					{
						q: "Puis-je changer mon adresse email ?",
						a: "Contactez votre administrateur pour mettre à jour votre email, car il est lié à votre compte d'organisation.",
					},
				],
			},
		],

		// ─── General (always shown) ──────────────────────────────────
		default: [
			{
				title: "Général",
				items: [
					{
						q: "Comment l'application est-elle organisée ?",
						a: "La barre latérale comporte des sections Admin, Enseignant, Doyen ou Étudiant selon votre rôle.",
					},
					{
						q: "Comment changer de langue ?",
						a: "Cliquez sur votre icône de profil en haut à droite et sélectionnez la langue souhaitée.",
					},
					{
						q: "Je vois une erreur de permission — qu'est-ce que cela signifie ?",
						a: "Votre rôle ne vous donne pas accès à cette action. Contactez votre administrateur.",
					},
					{
						q: "Où changer mon mot de passe ?",
						a: "Ouvrez votre profil depuis l'icône en haut à droite → Paramètres → Sécurité.",
					},
				],
			},
		],
	},
};

export function getHelpSections(
	pathname: string,
	lang: "en" | "fr",
): HelpSection[] {
	const langContent = content[lang] ?? content.en;

	// Find the best matching route key (longest prefix match, excluding "default")
	const routeKeys = Object.keys(langContent).filter((k) => k !== "default");
	const matched = routeKeys
		.filter((key) => pathname === key || pathname.startsWith(`${key}/`))
		.sort((a, b) => b.length - a.length)[0];

	const pageSections = matched ? (langContent[matched] ?? []) : [];
	const defaultSections = langContent.default ?? [];

	return [...pageSections, ...defaultSections];
}
