interface Resources {
	translation: {
		common: {
			actions: {
				cancel: "Cancel";
				delete: "Delete";
				save: "Save";
				saveChanges: "Save Changes";
				close: "Close";
				confirm: "Confirm";
				search: "Search";
				saving: "Saving...";
				reset: "Reset";
				open: "Open";
				back: "Back";
			};
			fields: {
				email: "Email";
				password: "Password";
				confirmPassword: "Confirm Password";
				firstName: "First Name";
				lastName: "Last Name";
			};
			status: {
				active: "Active";
				inactive: "Inactive";
			};
			table: {
				actions: "Actions";
			};
			pagination: {
				next: "Next";
				previous: "Previous";
			};
			invalidDate: "Invalid date";
			loading: "Loading...";
		};
		teacher: {
			courses: {
				title: "My Courses";
				subtitle: "Manage your assigned courses and grades";
				actions: {
					viewGrades: "View Grades";
				};
				empty: {
					title: "No courses assigned";
					description: "You don't have any courses assigned for the active academic year.";
				};
			};
			courses.manage: {
				title: "Course Management";
				actions: {
					add: "Add Course";
				};
				table: {
					name: "Name";
					program: "Program";
					credits: "Credits";
					hours: "Hours";
					teacher: "Default Teacher";
				};
				form: {
					createTitle: "Add New Course";
					editTitle: "Edit Course";
					nameLabel: "Course name";
					namePlaceholder: "Enter course name";
					creditsLabel: "Credits";
					creditsPlaceholder: "Enter credits";
					hoursLabel: "Hours";
					hoursPlaceholder: "Enter hours";
					programLabel: "Program";
					programPlaceholder: "Select a program";
					teacherLabel: "Default teacher";
					teacherPlaceholder: "Select a teacher";
					submit: "Save course";
				};
				toast: {
					createSuccess: "Course created successfully";
					createError: "Could not create the course";
					updateSuccess: "Course updated successfully";
					updateError: "Could not update the course";
					deleteSuccess: "Course deleted successfully";
					deleteError: "Could not delete the course";
				};
				validation: {
					name: "Name must be at least 2 characters";
					credits: "Credits must be at least 1";
					hours: "Hours must be at least 1";
					program: "Please select a program";
					teacher: "Please select a teacher";
				};
				delete: {
					title: "Delete Course";
					message: "Are you sure you want to delete this course? This action cannot be undone.";
				};
			};
			dashboard: {
				title: "Teacher Dashboard";
				subtitle: "Welcome back, {{name}}";
				stats: {
					courses: "My Courses";
					classes: "Classes";
					students: "Students";
					exams: "Exams";
				};
				courses: {
					title: "My Courses";
					empty: {
						title: "No courses found";
						description: "You have no assigned courses for the active academic year.";
					};
					view: "View →";
					viewAll: "View all courses →";
				};
				exams: {
					title: "Upcoming Exams";
					empty: {
						title: "No upcoming exams";
						description: "You have no scheduled exams coming up.";
					};
					percentage: "{{value}}%";
				};
				programStats: {
					title: "Students per Program";
					empty: "No program data available for the active academic year";
				};
				activeYear: "Active Year: {{year}}";
				noActiveYear: "No active year";
			};
			gradeEntry: {
				title: "Grade Entry";
				selectExam: {
					label: "Select exam";
					empty: "No exams available";
					lockedTag: "Locked";
				};
				lockedChip: "Grades locked";
				actions: {
					lock: "Lock grades";
					save: "Save grades";
					saving: "Saving...";
				};
				info: {
					title: "Grading information";
					description: "Grades should be entered on a scale of 0-20. Once grades are locked, they cannot be modified. Please review carefully before locking.";
				};
				table: {
					registration: "Registration #";
					student: "Student name";
					score: "Score (0-20)";
					status: "Status";
				};
				status: {
					graded: "Graded";
					notGraded: "Not graded";
				};
				validation: {
					min: "Minimum score is 0";
					max: "Maximum score is 20";
				};
				emptyStudents: {
					title: "No students found";
					description: "There are no students enrolled in this class.";
				};
				toast: {
					fetchCourseError: "Could not load course information";
					fetchGradesError: "Could not load grades";
					saveSuccess: "Grades saved successfully";
					saveError: "Could not save grades";
					lockSuccess: "Exam locked successfully. Grades can no longer be modified.";
					lockError: "Could not lock the exam";
				};
			};
			attendance: {
				title: "Attendance alerts";
				subtitle: "Flag at-risk cohorts and broadcast updates";
				openAlerts: "Open alerts";
				atRisk: "At-risk cohort";
				atRiskDesc: "Absence rate exceeds threshold for week 6.";
				lowEngagement: "Low engagement";
				lowEngagementDesc: "Quiz participation dropped below 50%.";
				broadcast: "Broadcast";
				broadcastDesc: "Send automated reminders to students and advisors.";
				latest: "Latest broadcast";
				latestDesc: "Attendance reminders scheduled for tomorrow morning.";
				none: "No alerts yet.";
				placeholder: "Message";
				send: "Send alert";
				toast: {
					sent: "Alert queued";
				};
			};
			gradeExport: {
				title: "Grade Export";
				subtitle: "Export student grades by class and course";
				filters: {
					academicYear: "Academic year";
					academicYearPlaceholder: "Select academic year";
					class: "Class";
					classPlaceholder: "Select class";
				};
				actions: {
					label: "Export";
					export: "Export grades";
				};
				exams: {
					title: "Select exams to include";
					emptyTitle: "No exams found";
					emptyDescription: "There are no exams created for this class yet.";
				};
				columns: {
					lastName: "Last name";
					firstName: "First name";
					registration: "Registration number";
					birthDate: "Birth date";
					birthPlace: "Birth place";
					gender: "Gender";
				};
				sheetName: "Grades";
				filePrefix: "grades";
				unknownClass: "unknown-class";
			};
			programs: {
				title: "Program Management";
				subtitle: "Manage academic programs";
				actions: {
					add: "Add Program";
				};
				empty: {
					title: "No programs found";
					description: "Get started by adding your first program.";
				};
				table: {
					name: "Name";
					faculty: "Faculty";
					description: "Description";
					noDescription: "No description";
				};
				form: {
					createTitle: "Add New Program";
					editTitle: "Edit Program";
					nameLabel: "Program name";
					namePlaceholder: "Enter program name";
					facultyLabel: "Faculty";
					facultyPlaceholder: "Select a faculty";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Optional description (objectives, focus)";
					submit: "Save program";
				};
				validation: {
					name: "Name must be at least 2 characters";
					faculty: "Please select a faculty";
				};
				toast: {
					createSuccess: "Program created successfully";
					createError: "Could not create the program";
					updateSuccess: "Program updated successfully";
					updateError: "Could not update the program";
					deleteSuccess: "Program deleted successfully";
					deleteError: "Could not delete the program";
				};
				delete: {
					title: "Delete Program";
					message: "Are you sure you want to delete this program? This action cannot be undone.";
				};
			};
			faculties: {
				title: "Faculty Management";
				subtitle: "Create and manage academic faculties";
				actions: {
					add: "Add Faculty";
				};
				empty: {
					title: "No faculties found";
					description: "Get started by adding your first faculty.";
				};
				table: {
					name: "Name";
					description: "Description";
					noDescription: "No description";
				};
				form: {
					createTitle: "Add New Faculty";
					editTitle: "Edit Faculty";
					nameLabel: "Faculty name";
					namePlaceholder: "Enter faculty name";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Enter faculty description";
					submit: "Save faculty";
				};
				validation: {
					name: "Name must be at least 2 characters";
				};
				toast: {
					createSuccess: "Faculty created successfully";
					createError: "Could not create the faculty";
					updateSuccess: "Faculty updated successfully";
					updateError: "Could not update the faculty";
					deleteSuccess: "Faculty deleted successfully";
					deleteError: "Could not delete the faculty";
				};
				delete: {
					title: "Delete Faculty";
					message: "Are you sure you want to delete this faculty? This action cannot be undone.";
				};
			};
			classCourses: {
				title: "Course Assignments";
				subtitle: "Manage course assignments for classes";
				validation: {
					class: "Please select a class";
					course: "Please select a course";
					teacher: "Please select a teacher";
				};
				actions: {
					add: "Assign Course";
				};
				empty: {
					title: "No course assignments";
					description: "Get started by assigning a course to a class.";
				};
				table: {
					class: "Class";
					program: "Program";
					course: "Course";
					teacher: "Teacher";
				};
				form: {
					createTitle: "New Course Assignment";
					editTitle: "Edit Course Assignment";
					classLabel: "Class";
					classPlaceholder: "Select a class";
					courseLabel: "Course";
					coursePlaceholder: "Select a course";
					teacherLabel: "Teacher";
					teacherPlaceholder: "Select a teacher";
					submit: "Save assignment";
				};
				toast: {
					createSuccess: "Course assignment created successfully";
					createError: "Could not create the assignment";
					updateSuccess: "Course assignment updated successfully";
					updateError: "Could not update the assignment";
					deleteSuccess: "Course assignment deleted successfully";
					deleteError: "Could not delete the assignment";
				};
				delete: {
					title: "Delete Course Assignment";
					message: "Are you sure you want to delete this course assignment? This action cannot be undone and will also delete all associated exams and grades.";
				};
			};
			promotion: {
				title: "Student Promotion";
				subtitle: "Promote students to their next class";
				unknownYear: "Unknown";
				sourceClassLabel: "Source class ({{year}})";
				sourceClassPlaceholder: "Select source class";
				targetClassLabel: "Target class ({{year}})";
				targetClassPlaceholder: "Select target class";
				students: {
					title: "Eligible students";
					listTitle: "Students";
					selectedCount: "({{count}} selected)";
					autoSelect: "Select average ≥ 10";
					average: "Average grade: {{value}}";
				};
				summary: {
					selected: "{{count}} selected";
					hint: "Average ≥ 10 will be auto-selected";
				};
				table: {
					registration: "Registration #";
					name: "Name";
					courseAverages: "Course averages";
					overallAverage: "Overall average";
				};
				actions: {
					promote: "Promote";
					promoteSelected: "Promote selected";
				};
				toast: {
					missingSelection: "Please select students and a target class";
					success: "Successfully promoted {{count}} students";
					error: "Could not promote students";
				};
				emptyStudents: {
					title: "No students found";
					description: "There are no students in this class.";
				};
			};
			exams: {
				title: "Exam Management";
				subtitle: "Create and manage course exams";
				actions: {
					add: "Add Exam";
				};
				empty: {
					title: "No exams found";
					description: "Get started by adding your first exam.";
				};
				table: {
					name: "Name";
					course: "Course";
					class: "Class";
					type: "Type";
					date: "Date";
					percentage: "Percentage";
					percentageValue: "{{value}}%";
					status: "Status";
				};
				status: {
					locked: "Locked";
					open: "Open";
				};
				form: {
					createTitle: "Add New Exam";
					editTitle: "Edit Exam";
					classCourseLabel: "Linked course";
					classCoursePlaceholder: "Select a course";
					nameLabel: "Exam name";
					namePlaceholder: "Enter exam name";
					typeLabel: "Type";
					typePlaceholder: "e.g. Midterm, Final";
					dateLabel: "Date";
					percentageLabel: "Weight (1-100)";
					percentagePlaceholder: "Enter percentage";
					submit: "Save exam";
				};
				validation: {
					name: "Name must be at least 2 characters";
					type: "Type must be at least 2 characters";
					date: "Date is required";
					percentage: {
						min: "Percentage must be at least 1";
						max: "Percentage cannot exceed 100";
					};
					classCourse: "Please select a course";
				};
				toast: {
					createSuccess: "Exam created successfully";
					createError: "Could not create the exam";
					updateSuccess: "Exam updated successfully";
					updateError: "Could not update the exam";
					deleteSuccess: "Exam deleted successfully";
					deleteError: "Could not delete the exam";
				};
				delete: {
					title: "Delete Exam";
					message: "Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades.";
				};
			};
			workflow: {
				title: "Exam workflow";
				subtitle: "Submit exams for validation and monitor their status.";
				selectCourse: "Select class course";
				placeholder: "Choose a class course to view exams.";
				empty: "No exams for this class course.";
				actions: {
					submit: "Submit";
					lock: "Lock";
				};
				toast: {
					submitted: "Exam submitted";
					locked: "Exam locked";
				};
			};
		};
		navigation: {
			header: {
				adminDashboard: "Admin dashboard";
				teacherDashboard: "Teacher dashboard";
				notificationsAria: "Open notifications";
				toggleSidebarAria: "Toggle sidebar";
				languageSelectAria: "Change language";
				languageSelectPlaceholder: "Select language";
				profileMenuAria: "Open profile menu";
			};
			sidebar: {
				admin: {
					dashboard: "Overview";
					academicYears: "Academic years";
					exams: "Exams";
					users: "Users";
					classCourses: "Class courses";
					gradeExport: "Grade export";
					monitoring: "Monitoring";
					notifications: "Notifications";
					students: "Students";
					studentPromotion: "Student promotion";
					courses: "Courses";
					classes: "Classes";
					faculties: "Faculties";
					programs: "Programs";
					teachers: "Teachers";
					courseAssignments: "Course assignments";
					teachingUnits: "Teaching units";
					enrollments: "Enrollments";
				};
				teacher: {
					dashboard: "Overview";
					exams: "Exams";
					grades: "Grades";
					courses: "Courses";
					attendance: "Attendance alerts";
					workflows: "Workflows";
				};
				dean: {
					dashboard: "Overview";
					workflows: "Approvals";
				};
				student: {
					dashboard: "My performance";
				};
			};
			roles: {
				guest: "Guest";
				student: "Student";
				staff: "Staff";
				dean: "Dean";
				teacher: "Teacher";
				administrator: "Administrator";
				super_admin: "Super admin";
			};
		};
		auth: {
			layout: {
				title: "Welcome back";
				subtitle: "Sign in to manage academic records and grades";
			};
			login: {
				title: "Sign in to your account";
				emailPlaceholder: "you@example.com";
				passwordPlaceholder: "Your password";
				forgotPassword: "Forgot password?";
				submit: "Sign in";
				submitting: "Signing you in...";
				success: "Signed in successfully";
				error: "Unable to sign in. Check your credentials.";
				noAccount: "Don't have an account?";
				registerLink: "Create one";
			};
			register: {
				title: "Create your account";
				success: "Account created successfully";
				error: "Unable to create the account";
				submit: "Sign up";
				submitting: "Creating your account...";
				haveAccount: "Already registered?";
				loginLink: "Sign in";
				placeholders: {
					firstName: "First name";
					lastName: "Last name";
					email: "you@example.com";
					password: "Choose a strong password";
					confirmPassword: "Repeat your password";
				};
			};
			forgot: {
				title: "Reset your password";
				emailPlaceholder: "you@example.com";
				submit: "Send reset link";
				submitting: "Sending email...";
				success: "Password reset email sent";
				error: "Unable to send the reset email";
				backToLogin: "Back to sign in";
			};
			reset: {
				title: "Choose a new password";
				newPassword: "New password";
				passwordPlaceholder: "Enter a new password";
				confirmPasswordPlaceholder: "Confirm your new password";
				submit: "Update password";
				submitting: "Updating password...";
				success: "Password updated successfully";
				error: "Unable to update the password";
				backToLogin: "Return to sign in";
			};
			logout: {
				success: "Signed out successfully";
				error: "Unable to sign out";
				aria: "Sign out";
			};
			validation: {
				email: "Enter a valid email address";
				firstName: "First name must be at least 2 characters";
				lastName: "Last name must be at least 2 characters";
				passwordMin: "Password must be at least {{count}} characters";
				confirmPassword: "Confirm password is required";
				passwordsMismatch: "Passwords do not match";
			};
		};
		admin: {
			dashboard: {
				title: "Admin Dashboard";
				activeYear: "Active Year: {{year}}";
				noActiveYear: "No active year";
				programStats: {
					title: "Students per program";
					empty: "No data available for the selected year";
				};
				stats: {
					faculties: "Faculties";
					programs: "Programs";
					courses: "Courses";
					exams: "Exams";
					students: "Students";
					teachers: "Teachers";
				};
			};
			monitoring: {
				title: "Service monitoring";
				subtitle: "Track workflows, notifications, and background jobs";
				gradeWindows: "Open validation windows";
				pendingAlerts: "Pending alerts";
				jobs: "Background jobs";
				jobsValue: "2 active";
				compliance: "Compliance";
				complianceValue: "MFA + RBAC";
				workflows: "Workflow health";
				workflowsDescription: "Validation, enrollments, and attendance checks are synchronized.";
				healthy: "Healthy";
				gradeValidation: "Grade validation";
				gradeValidationDesc: "Approved exams are locked and broadcast to students.";
				enrollments: "Enrollment windows";
				enrollmentsDesc: "Classes respect open/close windows before accepting transfers.";
				backgroundJobs: "Background jobs";
				backgroundJobsDesc: "Recurring tasks run via Bun intervals to keep data fresh.";
				jobExam: "Exam closure";
				jobExamDesc: "Locks approved exams after session deadlines.";
				jobNotifications: "Notification dispatcher";
				jobNotificationsDesc: "Delivers pending email/webhook alerts.";
				active: "Active";
			};
			notifications: {
				title: "Notifications";
				subtitle: "Workflow alerts sent to staff and students";
				gradeValidated: "Grade validation complete";
				gradeValidatedDesc: "An exam was validated and locked for publishing.";
				windowOpened: "Enrollment window opened";
				windowOpenedDesc: "Students can register for the selected class and academic year.";
				justNow: "Just now";
				queueTitle: "Latest notifications";
				empty: "No notifications yet.";
				actions: {
					flush: "Flush pending";
					ack: "Acknowledge";
				};
				toast: {
					flushed: "Pending notifications flushed";
				};
			};
			academicYears: {
				title: "Academic Year Management";
				subtitle: "Create and manage academic years, and choose the active one";
				actions: {
					add: "Add academic year";
				};
				confirmDelete: "Delete this academic year?";
				empty: {
					title: "No academic years yet";
					description: "Start by creating an academic year for your institution.";
				};
				modal: {
					createTitle: "Add academic year";
					editTitle: "Edit academic year";
					startDate: "Start date";
					endDate: "End date";
					label: "Academic year label";
				};
				table: {
					name: "Name";
					startDate: "Start date";
					endDate: "End date";
					status: "Status";
				};
				toast: {
					createSuccess: "Academic year created successfully";
					createError: "Could not create the academic year";
					updateSuccess: "Academic year updated successfully";
					updateError: "Could not update the academic year";
					deleteSuccess: "Academic year deleted successfully";
					deleteError: "Could not delete the academic year";
					statusSuccess: "Academic year status updated";
					statusError: "Could not update the academic year status";
				};
				validation: {
					startDate: "Start date is required";
					endDate: "End date is required";
					name: "Name must be at least 2 characters";
					order: "End date must be after start date";
				};
			};
			classCourses: {
				title: "Class course assignments";
				subtitle: "Assign teachers and courses to classes";
				actions: {
					assign: "Assign course";
				};
				empty: {
					title: "No course assignments yet";
					description: "Assign a course to a class to populate this list.";
				};
				table: {
					class: "Class";
					program: "Program";
					course: "Course";
					teacher: "Teacher";
				};
				form: {
					createTitle: "New course assignment";
					editTitle: "Edit course assignment";
					classLabel: "Class";
					classPlaceholder: "Select a class";
					courseLabel: "Course";
					coursePlaceholder: "Select a course";
					teacherLabel: "Teacher";
					teacherPlaceholder: "Select a teacher";
					createSubmit: "Assign course";
				};
				toast: {
					createSuccess: "Course assignment created successfully";
					createError: "Could not create the assignment";
					updateSuccess: "Course assignment updated successfully";
					updateError: "Could not update the assignment";
					deleteSuccess: "Course assignment deleted successfully";
					deleteError: "Could not delete the assignment";
				};
				delete: {
					title: "Delete course assignment";
					message: "Deleting this assignment will also remove related exams and grades. Continue?";
				};
				validation: {
					class: "Please select a class";
					course: "Please select a course";
					teacher: "Please select a teacher";
				};
			};
			classes: {
				title: "Class management";
				subtitle: "Create classes for each program and academic year";
				actions: {
					add: "Add class";
				};
				empty: {
					title: "No classes yet";
					description: "Create classes to organise students by program and year.";
				};
				table: {
					name: "Class";
					program: "Program";
					academicYear: "Academic year";
					students: "Students";
				};
				form: {
					createTitle: "Add class";
					editTitle: "Edit class";
					createSubmit: "Create class";
					programLabel: "Program";
					programPlaceholder: "Select a program";
					academicYearLabel: "Academic year";
					academicYearPlaceholder: "Select an academic year";
					labelLabel: "Generated class label";
				};
				toast: {
					createSuccess: "Class created successfully";
					createError: "Could not create the class";
					updateSuccess: "Class updated successfully";
					updateError: "Could not update the class";
					deleteSuccess: "Class deleted successfully";
					deleteError: "Could not delete the class";
				};
				delete: {
					title: "Delete class";
					message: "This action cannot be undone and may remove related assignments.";
				};
				validation: {
					program: "Please select a program";
					academicYear: "Please select an academic year";
					name: "Name must be at least 2 characters";
				};
			};
			faculties: {
				title: "Faculty management";
				subtitle: "Create and manage academic faculties";
				actions: {
					add: "Add faculty";
				};
				empty: {
					title: "No faculties found";
					description: "Get started by adding your first faculty.";
				};
				table: {
					name: "Name";
					description: "Description";
					noDescription: "No description";
				};
				form: {
					createTitle: "Add new faculty";
					editTitle: "Edit faculty";
					nameLabel: "Faculty name";
					namePlaceholder: "Enter faculty name";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Enter faculty description";
					submit: "Save faculty";
				};
				validation: {
					name: "Name must be at least 2 characters";
				};
				toast: {
					createSuccess: "Faculty created successfully";
					createError: "Could not create the faculty";
					updateSuccess: "Faculty updated successfully";
					updateError: "Could not update the faculty";
					deleteSuccess: "Faculty deleted successfully";
					deleteError: "Could not delete the faculty";
				};
				delete: {
					title: "Delete faculty";
					message: "Are you sure you want to delete this faculty? This action cannot be undone.";
				};
			};
			programs: {
				title: "Program management";
				subtitle: "Organize academic programs and link them to faculties.";
				actions: {
					add: "Add program";
				};
				empty: {
					title: "No programs available";
					description: "Create a program to start organizing curricula.";
				};
				table: {
					name: "Program";
					faculty: "Faculty";
					description: "Description";
					noDescription: "No description";
				};
				form: {
					createTitle: "Add new program";
					editTitle: "Edit program";
					nameLabel: "Program name";
					namePlaceholder: "Enter program name";
					facultyLabel: "Faculty";
					facultyPlaceholder: "Select a faculty";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Describe this program";
					submit: "Save program";
				};
				validation: {
					name: "Name must be at least 2 characters";
					faculty: "Please select a faculty";
				};
				toast: {
					createSuccess: "Program created successfully";
					createError: "Could not create the program";
					updateSuccess: "Program updated successfully";
					updateError: "Could not update the program";
					deleteSuccess: "Program deleted successfully";
					deleteError: "Could not delete the program";
				};
				delete: {
					title: "Delete program";
					message: "Are you sure you want to delete this program? This action cannot be undone.";
				};
			};
			courses: {
				title: "Course management";
				subtitle: "Manage courses, workloads, and default teachers.";
				actions: {
					add: "Add course";
				};
				table: {
					name: "Course";
					program: "Program";
					credits: "Credits";
					hours: "Hours";
					teacher: "Default teacher";
				};
				form: {
					createTitle: "Add course";
					editTitle: "Edit course";
					createSubmit: "Create course";
					nameLabel: "Course name";
					namePlaceholder: "Enter course name";
					creditsLabel: "Credits";
					creditsPlaceholder: "Enter credits";
					hoursLabel: "Hours";
					hoursPlaceholder: "Enter total hours";
					programLabel: "Program";
					programPlaceholder: "Select a program";
					teacherLabel: "Default teacher";
					teacherPlaceholder: "Select a teacher";
				};
				toast: {
					createSuccess: "Course created successfully";
					createError: "Could not create the course";
					updateSuccess: "Course updated successfully";
					updateError: "Could not update the course";
					deleteSuccess: "Course deleted successfully";
					deleteError: "Could not delete the course";
				};
				delete: {
					title: "Delete course";
					message: "Deleting this course will remove related assignments and exams.";
				};
				empty: {
					title: "No courses available";
					description: "Create a course to populate the catalog.";
				};
				validation: {
					name: "Name must be at least 2 characters";
					credits: "Credits must be at least 1";
					hours: "Hours must be at least 1";
					program: "Please select a program";
					teacher: "Please select a teacher";
				};
			};
			exams: {
				title: "Exam management";
				subtitle: "Create and manage exams for each class course";
				actions: {
					add: "Add exam";
				};
				empty: {
					title: "No exams yet";
					description: "Create an exam to start collecting grades.";
				};
				table: {
					name: "Exam";
					course: "Course";
					class: "Class";
					type: "Type";
					date: "Date";
					percentage: "Weight";
					percentageValue: "{{value}}%";
					status: "Status";
				};
				status: {
					locked: "Locked";
					open: "Open";
				};
				form: {
					createTitle: "Add exam";
					editTitle: "Edit exam";
					classCourseLabel: "Linked course";
					classCoursePlaceholder: "Select a class course";
					nameLabel: "Exam name";
					namePlaceholder: "Enter exam name";
					typeLabel: "Type";
					typePlaceholder: "e.g. Midterm, Final";
					dateLabel: "Date";
					percentageLabel: "Weight (1-100)";
					percentagePlaceholder: "Enter weight";
					courseLabel: "Course";
					classLabel: "Class";
					submit: "Save exam";
					coursePlaceholder: "Select a course and class";
				};
				toast: {
					createSuccess: "Exam created successfully";
					createError: "Could not create the exam";
					updateSuccess: "Exam updated successfully";
					updateError: "Could not update the exam";
					deleteSuccess: "Exam deleted successfully";
					deleteError: "Could not delete the exam";
				};
				delete: {
					title: "Delete exam";
					message: "Deleting this exam will also remove related grades.";
				};
				validation: {
					name: "Name must be at least 2 characters";
					type: "Type must be at least 2 characters";
					date: "Date is required";
					percentage: {
						min: "Weight must be at least 1";
						max: "Weight cannot exceed 100";
					};
					classCourse: "Please select a class course";
				};
			};
			gradeExport: {
				title: "Grade export";
				subtitle: "Export student grades by class and exam";
				filters: {
					academicYear: "Academic year";
					academicYearPlaceholder: "Select academic year";
					class: "Class";
					classPlaceholder: "Select class";
				};
				actions: {
					label: "Export";
					export: "Export grades";
				};
				exams: {
					title: "Select exams to include";
					emptyTitle: "No exams found";
					emptyDescription: "There are no exams created for this class yet.";
				};
				columns: {
					lastName: "Last name";
					firstName: "First name";
					registration: "Registration number";
					birthDate: "Birth date";
					birthPlace: "Birth place";
					gender: "Gender";
				};
				sheetName: "Grades";
				filePrefix: "grades";
				unknownClass: "unknown-class";
			};
			students: {
				title: "Student management";
				actions: {
					openModal: "Add students";
				};
				filters: {
					allClasses: "All classes";
					searchPlaceholder: "Search by name or registration number";
				};
				empty: "No students found for this selection.";
				table: {
					name: "Student";
					email: "Email";
					registration: "Registration number";
					gender: "Gender";
					dateOfBirth: "Date of birth";
					placeOfBirth: "Place of birth";
					genderUnknown: "Not specified";
				};
				gender: {
					male: "Male";
					female: "Female";
					other: "Other";
				};
				modal: {
					title: "Add students";
					tabs: {
						single: "Single student";
						import: "Import file";
					};
				};
				form: {
					firstName: "First name";
					lastName: "Last name";
					email: "Email";
					registration: "Registration number";
					class: "Class";
					classPlaceholder: "Select class";
					submit: "Add student";
				};
				import: {
					classLabel: "Class for imported students";
					fileLabel: "Upload CSV or XLSX file";
					downloadTemplate: "Download template";
					invalidFormat: "Missing required fields in this row";
					actions: {
						import: "Import students";
					};
					summary: {
						created: "{{count}} students imported successfully";
						conflicts: {
							title: "Conflicts";
							item: "Row {{row}}: {{reason}}";
						};
						errors: {
							title: "Errors";
							item: "Row {{row}}: {{reason}}";
						};
					};
				};
				templates: {
					sheetName: "Students";
					filePrefix: "students-template";
				};
				toast: {
					createSuccess: "Student created successfully";
					createError: "Could not create the student";
					importError: "Could not import students";
				};
				validation: {
					firstName: "First name is required";
					lastName: "Last name is required";
					email: "Enter a valid email address";
					registration: "Registration number is required";
					class: "Please select a class";
				};
			};
			users: {
				title: "User management";
				empty: "No users match the current filters.";
				actions: {
					create: "Create user";
					edit: "Edit user";
					ban: "Ban user";
					unban: "Unban user";
				};
				filters: {
					searchPlaceholder: "Search by name or email";
					roles: {
						all: "All roles";
						admin: "Administrators";
						teacher: "Teachers";
					};
					status: {
						all: "All statuses";
						active: "Active";
						banned: "Banned";
					};
					email: {
						all: "All emails";
						verified: "Verified";
						unverified: "Unverified";
					};
				};
				table: {
					name: "Name";
					email: "Email";
					role: "Role";
					emailVerified: "Email verified";
					status: "Status";
				};
				roles: {
					admin: "Admin";
					teacher: "Teacher";
				};
				status: {
					active: "Active";
					inactive: "Inactive";
					suspended: "Suspended";
					banned: "Banned";
					emailVerified: "Verified";
					emailUnverified: "Pending verification";
				};
				form: {
					createTitle: "Create user";
					editTitle: "Edit user";
					firstNameLabel: "First name";
					lastNameLabel: "Last name";
					emailLabel: "Email address";
					phoneLabel: "Phone number";
					genderLabel: "Gender";
					genderPlaceholder: "Select gender";
					dateOfBirthLabel: "Date of birth";
					placeOfBirthLabel: "Place of birth";
					nationalityLabel: "Nationality";
					statusLabel: "Status";
					roleLabel: "Role";
					passwordLabel: "Password";
					newPasswordLabel: "New password";
					passwordPlaceholder: "Leave blank to keep current password";
					generatePassword: "Generate";
					createSubmit: "Create user";
				};
				gender: {
					male: "Male";
					female: "Female";
					other: "Other";
				};
				confirm: {
					delete: {
						title: "Delete user";
						message: "Are you sure you want to delete this user? This action cannot be undone.";
					};
					ban: {
						title: "Ban user";
						message: "The user will be blocked from signing in until unbanned. Continue?";
					};
					unban: {
						title: "Unban user";
						message: "Allow this user to sign in again?";
					};
				};
				ban: {
					reason: "Banned by an administrator";
				};
				toast: {
					createSuccess: "User created successfully";
					createError: "Could not create the user";
					updateSuccess: "User updated successfully";
					updateError: "Could not update the user";
					deleteSuccess: "User deleted successfully";
					deleteError: "Could not delete the user";
					banSuccess: "User banned successfully";
					banError: "Could not ban the user";
					unbanSuccess: "User unbanned successfully";
					unbanError: "Could not unban the user";
					passwordCopied: "Password copied to clipboard";
				};
				validation: {
					firstName: "First name is required";
					lastName: "Last name is required";
					email: "Enter a valid email address";
					role: "Please select a role";
					passwordRequired: "Password is required";
				};
			};
			enrollments: {
				title: "Enrollment management";
				subtitle: "Monitor cohorts and control enrollment windows.";
				selectYear: "Select academic year";
				selectClass: "Select class";
				listTitle: "Enrollments";
				fields: {
					student: "Student";
					status: "Status";
					dates: "Dates";
				};
				empty: "No enrollments for this selection.";
				windowStatus: "Window: {{status}}";
				windowMissing: "Window not configured";
				windowOpen: "Students can enroll.";
				windowClosed: "Window currently closed.";
				actions: {
					open: "Open window";
					close: "Close window";
					title: "Manual adjustments";
					description: "Use the student management page to transfer or re-enroll students between classes.";
				};
				toast: {
					updated: "Window updated";
				};
			};
			teachingUnits: {
				title: "Teaching units";
				subtitle: "Manage UE catalog, semesters, and prerequisites.";
				selectProgram: "Select program";
				new: "Create new UE";
				fields: {
					name: "Unit name";
					code: "Code";
					description: "Description";
					credits: "ECTS";
				};
				semesters: {
					annual: "Annual";
					fall: "Fall";
					spring: "Spring";
				};
				actions: {
					create: "Create UE";
					delete: "Remove";
					savePrereq: "Save prerequisites";
				};
				list: "Units list";
				listDescription: "Browse teaching units and open them to manage ECs.";
				empty: "No units yet for this program.";
				emptyDescription: "Create a teaching unit to start managing ECs.";
				table: {
					name: "Name";
					code: "Code";
					program: "Program";
					semester: "Semester";
					credits: "ECTS";
				};
				deleteTitle: "Delete teaching unit";
				deleteMessage: "This action permanently removes the teaching unit.";
				prereqTitle: "Manage course prerequisites";
				prereqSelectCourse: "Choose a course";
				prereqHint: "Select prerequisite courses";
				detail: {
					createTitle: "Create teaching unit";
					editTitle: "Edit {{name}}";
					subtitle: "Update metadata and manage constitutive elements.";
					formTitle: "Teaching unit details";
					formSubtitle: "Edit code, semester, and description.";
				};
				validation: {
					name: "Unit name is required.";
					code: "Unit code is required.";
					credits: "Credits must be zero or positive.";
					program: "Program is required.";
				};
				courses: {
					title: "Constitutive elements";
					subtitle: "Manage ECs tied to this teaching unit.";
					actions: {
						add: "Add element";
					};
					table: {
						name: "Name";
						hours: "Hours";
						credits: "Credits";
						teacher: "Default teacher";
					};
					form: {
						createTitle: "Add element";
						editTitle: "Edit element";
						nameLabel: "Element name";
						namePlaceholder: "Enter the element name";
						creditsLabel: "Credits";
						creditsPlaceholder: "Enter credits";
						hoursLabel: "Hours";
						hoursPlaceholder: "Enter hours";
						teacherLabel: "Default teacher";
						teacherPlaceholder: "Select a teacher";
						submit: "Save element";
					};
					empty: "No elements yet.";
					deleteTitle: "Delete element";
					deleteMessage: "This action cannot be undone.";
					validation: {
						name: "Element name is required.";
						credits: "Credits must be positive.";
						hours: "Hours must be positive.";
						teacher: "A default teacher is required.";
					};
					toast: {
						createSuccess: "Element created";
						updateSuccess: "Element updated";
						deleteSuccess: "Element deleted";
					};
				};
				toast: {
					created: "Teaching unit created";
					updated: "Teaching unit updated";
					deleted: "Teaching unit deleted";
					prereqSaved: "Prerequisites saved";
					programRequired: "Select a program first";
				};
			};
		};
		dean: {
			workflows: {
				title: "Workflow approvals";
				subtitle: "Approve exams, open enrollment windows, and react to alerts";
				queue: "Approval queue";
				queueDesc: "Track submissions that require dean oversight.";
				submitted: "Submitted";
				submittedDesc: "Teachers submitted exams for validation.";
				inReview: "In review";
				inReviewDesc: "Review weights, schedules, and prerequisites.";
				locked: "Locked";
				lockedDesc: "Approved exams are locked and shared with students.";
				notifications: "Workflow notifications";
				notificationsDesc: "Alerts propagate automatically to teachers and students.";
				gradeValidations: "Grade validations";
				realTime: "Real-time";
				enrollmentWindows: "Enrollment windows";
				openClose: "Open/close";
				alerts: "Attendance alerts";
				escalations: "Escalations only";
				empty: "No pending exams.";
				actions: {
					validate: "Approve & lock";
				};
				toast: {
					validated: "Exam approved";
				};
				notificationsEmpty: "No notifications";
				windows: "Enrollment windows";
			};
		};
		student: {
			performance: {
				title: "Performance dashboard";
				subtitle: "Track your averages, credits, and course progress";
				trendTitle: "Progression";
				trendSubtitle: "Weighted averages across enrolled courses";
				overallAverage: "Overall average";
				credits: "Earned credits";
				courseAverages: "Course averages";
				courseSubtitle: "Latest scores for the active academic year";
			};
		};
	};
}

export default Resources;
