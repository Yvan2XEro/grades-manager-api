interface Resources {
	translation: {
		"components": {
			"codedEntitySelect": {
				"placeholder": "Select an item";
				"searchPlaceholder": "Search by code or name...";
				"noResults": "No items found. Try a different search.";
				"resultsCount_one": "{{count}} result";
				"resultsCount_other": "{{count}} results";
				"loading": "Loading...";
			};
		};
		"common": {
			"actions": {
				"cancel": "Cancel";
				"create": "Create";
				"update": "Update";
				"delete": "Delete";
				"save": "Save";
				"saveChanges": "Save Changes";
				"close": "Close";
				"confirm": "Confirm";
				"search": "Search";
				"saving": "Saving...";
				"reset": "Reset";
				"open": "Open";
				"back": "Back";
			};
			"fields": {
				"email": "Email";
				"password": "Password";
				"confirmPassword": "Confirm Password";
				"firstName": "First Name";
				"lastName": "Last Name";
			};
			"status": {
				"active": "Active";
				"inactive": "Inactive";
			};
			"table": {
				"actions": "Actions";
			};
			"labels": {
				"notAvailable": "Not available";
			};
			"clipboard": {
				"copied": "Copied to clipboard";
				"copiedValue": "{{value}} copied";
				"failed": "Unable to copy value";
				"copyAria": "Copy {{value}}";
			};
			"pagination": {
				"next": "Next";
				"previous": "Previous";
			};
			"errors": {
				"unknown": "Unknown error";
			};
			"gender": {
				"male": "M";
				"female": "F";
			};
			"invalidDate": "Invalid date";
			"loading": "Loading...";
		};
		"teacher": {
			"courses": {
				"title": "My Courses";
				"subtitle": "Manage your assigned courses and grades";
				"delegatedBadge": "Delegated";
				"actions": {
					"viewGrades": "View Grades";
				};
				"empty": {
					"title": "No courses assigned";
					"description": "You don't have any courses assigned for the active academic year.";
				};
			};
			"courses.manage": {
				"title": "Course Management";
				"actions": {
					"add": "Add Course";
				};
				"table": {
					"code": "Code";
					"name": "Name";
					"program": "Program";
					"hours": "Hours";
					"teacher": "Default Teacher";
					"cycleInfo": "Cycle: {{value}}";
				};
				"form": {
					"createTitle": "Add New Course";
					"editTitle": "Edit Course";
					"nameLabel": "Course name";
					"namePlaceholder": "Enter course name";
					"codeLabel": "Course code";
					"codePlaceholder": "INF111";
					"hoursLabel": "Hours";
					"hoursPlaceholder": "Enter hours";
					"programLabel": "Program";
					"programPlaceholder": "Select a program";
					"programCycleSummary": "Cycle: {{value}}";
					"teacherLabel": "Default teacher";
					"teacherPlaceholder": "Select a teacher";
					"submit": "Save course";
				};
				"toast": {
					"createSuccess": "Course created successfully";
					"createError": "Could not create the course";
					"updateSuccess": "Course updated successfully";
					"updateError": "Could not update the course";
					"deleteSuccess": "Course deleted successfully";
					"deleteError": "Could not delete the course";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
					"hours": "Hours must be at least 1";
					"code": "Code is required";
					"program": "Please select a program";
					"teacher": "Please select a teacher";
				};
				"delete": {
					"title": "Delete Course";
					"message": "Are you sure you want to delete this course? This action cannot be undone.";
				};
			};
			"dashboard": {
				"title": "Teacher Dashboard";
				"subtitle": "Welcome back, {{name}}";
				"stats": {
					"courses": "My Courses";
					"classes": "Classes";
					"students": "Students";
					"exams": "Exams";
				};
				"courses": {
					"title": "My Courses";
					"empty": {
						"title": "No courses found";
						"description": "You have no assigned courses for the active academic year.";
					};
					"view": "View →";
					"viewAll": "View all courses →";
				};
				"exams": {
					"title": "Upcoming Exams";
					"empty": {
						"title": "No upcoming exams";
						"description": "You have no scheduled exams coming up.";
					};
					"percentage": "{{value}}%";
				};
				"programStats": {
					"title": "Students per Program";
					"empty": "No program data available for the active academic year";
				};
				"activeYear": "Active Year: {{year}}";
				"noActiveYear": "No active year";
			};
			"gradeEntry": {
				"title": "Grade Entry";
				"selectCourse": {
					"label": "Select class course";
					"empty": "Choose a class course";
					"emptyState": "No class courses assigned. Contact an administrator.";
				};
				"selectExam": {
					"label": "Select exam";
					"empty": "No exams available";
					"lockedTag": "Locked";
					"prompt": "Select an exam to start entering grades.";
				};
				"lockedChip": "Grades locked";
				"actions": {
					"lock": "Lock grades";
					"save": "Save grades";
					"saving": "Saving...";
					"exportTemplate": "Export Template";
					"importGrades": "Import Grades";
				};
				"info": {
					"title": "Grading information";
					"description": "Grades should be entered on a scale of 0-20. Once grades are locked, they cannot be modified. Please review carefully before locking.";
				};
				"table": {
					"registration": "Registration #";
					"student": "Student name";
					"score": "Score (0-20)";
					"status": "Status";
				};
				"status": {
					"graded": "Graded";
					"notGraded": "Not graded";
				};
				"validation": {
					"min": "Minimum score is 0";
					"max": "Maximum score is 20";
				};
				"emptyStudents": {
					"title": "No students found";
					"description": "There are no students enrolled in this class.";
				};
				"readOnly": {
					"title": "Read-only mode";
					"description": "You can view this exam but cannot modify grades.";
				};
				"delegates": {
					"title": "Delegated editors";
					"description": "Manage who can edit grades for this exam.";
					"add": "Add editor";
					"dialogTitle": "Assign delegated editor";
					"dialogDescription": "Grant access to another teacher or staff member.";
					"selectLabel": "Editor profile";
					"selectPlaceholder": "Select a team member";
					"unknownEmail": "No email";
					"empty": "No delegated editors yet.";
					"grantedAt": "Granted on {{date}}";
					"grantedBy": "Granted by {{name}}";
					"revoke": "Revoke";
					"revokeSelf": "Leave delegation";
					"manageRestriction": "Only the course owner can manage other delegates.";
					"assignSuccess": "Delegate added successfully.";
					"assignError": "Unable to add delegate.";
					"revokeSuccess": "Delegate removed successfully.";
					"revokeError": "Unable to remove delegate.";
					"readOnlyToast": "You cannot edit this exam.";
				};
				"toast": {
					"fetchCourseError": "Could not load course information";
					"fetchGradesError": "Could not load grades";
					"saveSuccess": "Grades saved successfully";
					"saveError": "Could not save grades";
					"lockSuccess": "Exam locked successfully. Grades can no longer be modified.";
					"lockError": "Could not lock the exam";
					"exportError": "Please select an exam with students";
					"exportSuccess": "Template exported successfully";
					"importSuccess": "Imported {{count}} grades successfully";
					"importError": "Failed to import grades";
				};
			};
			"attendance": {
				"title": "Attendance alerts";
				"subtitle": "Flag at-risk cohorts and broadcast updates";
				"openAlerts": "Open alerts";
				"atRisk": "At-risk cohort";
				"atRiskDesc": "Absence rate exceeds threshold for week 6.";
				"lowEngagement": "Low engagement";
				"lowEngagementDesc": "Quiz participation dropped below 50%.";
				"broadcast": "Broadcast";
				"broadcastDesc": "Send automated reminders to students and advisors.";
				"latest": "Latest broadcast";
				"latestDesc": "Attendance reminders scheduled for tomorrow morning.";
				"none": "No alerts yet.";
				"placeholder": "Message";
				"send": "Send alert";
				"toast": {
					"sent": "Alert queued";
				};
			};
			"gradeExport": {
				"title": "Grade Export";
				"subtitle": "Export student grades by class and course";
				"filtersCard": {
					"title": "Configuration";
					"description": "Choose the academic year and class before exporting.";
				};
				"filters": {
					"academicYear": "Academic year";
					"academicYearPlaceholder": "Select academic year";
					"class": "Class";
					"classPlaceholder": "Select class";
				};
				"actions": {
					"label": "Export";
					"combinedLabel": "Combined grades";
					"combinedExport": "Download combined workbook";
					"pvLabel": "Verbal report";
					"pvExport": "Download PV (Excel)";
					"examGroup": {
						"label": "Per-exam exports ({{count}})";
						"sheetName": "Exam grades";
						"filePrefix": "exam-grades";
						"scoreColumn": "Score";
					};
				};
				"pv": {
					"sheetName": "Verbal report";
					"filePrefix": "pv-grades";
					"table": {
						"title": "Results table";
						"rank": "Rank";
						"fullName": "Full name";
						"average": "Average";
					};
					"stats": {
						"title": "Statistics";
						"students": "Students";
						"validated": "Passed";
						"notValidated": "Failed";
						"successRate": "Pass rate";
						"average": "Cohort average";
					};
					"legend": {
						"title": "Legend";
						"headers": {
							"course": "Course";
							"exam": "Exam";
							"weight": "Weight";
						};
					};
				};
				"exams": {
					"title": "Select exams to include";
					"emptyTitle": "No exams found";
					"emptyDescription": "There are no exams created for this class yet.";
				};
				"columns": {
					"lastName": "Last name";
					"firstName": "First name";
					"registration": "Registration number";
					"birthDate": "Birth date";
					"birthPlace": "Birth place";
					"gender": "Gender";
				};
				"sheetName": "Grades";
				"filePrefix": "grades";
				"unknownClass": "unknown-class";
			};
			"programs": {
				"title": "Program Management";
				"subtitle": "Manage academic programs";
				"actions": {
					"add": "Add Program";
				};
				"empty": {
					"title": "No programs found";
					"description": "Get started by adding your first program.";
				};
				"table": {
					"code": "Code";
					"name": "Name";
					"faculty": "Faculty";
					"description": "Description";
					"noDescription": "No description";
				};
				"form": {
					"createTitle": "Add New Program";
					"editTitle": "Edit Program";
					"nameLabel": "Program name";
					"namePlaceholder": "Enter program name";
					"codeLabel": "Program code";
					"codePlaceholder": "INF-LIC";
					"facultyLabel": "Faculty";
					"facultyPlaceholder": "Select a faculty";
					"descriptionLabel": "Description";
					"descriptionPlaceholder": "Optional description (objectives, focus)";
					"submit": "Save program";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
					"code": "Code is required";
					"faculty": "Please select a faculty";
				};
				"toast": {
					"createSuccess": "Program created successfully";
					"createError": "Could not create the program";
					"updateSuccess": "Program updated successfully";
					"updateError": "Could not update the program";
					"deleteSuccess": "Program deleted successfully";
					"deleteError": "Could not delete the program";
				};
				"delete": {
					"title": "Delete Program";
					"message": "Are you sure you want to delete this program? This action cannot be undone.";
				};
			};
			"faculties": {
				"title": "Faculty Management";
				"subtitle": "Create and manage academic faculties";
				"actions": {
					"add": "Add Faculty";
				};
				"empty": {
					"title": "No faculties found";
					"description": "Get started by adding your first faculty.";
				};
				"table": {
					"name": "Name";
					"description": "Description";
					"noDescription": "No description";
				};
				"form": {
					"createTitle": "Add New Faculty";
					"editTitle": "Edit Faculty";
					"nameLabel": "Faculty name";
					"namePlaceholder": "Enter faculty name";
					"descriptionLabel": "Description";
					"descriptionPlaceholder": "Enter faculty description";
					"submit": "Save faculty";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
				};
				"toast": {
					"createSuccess": "Faculty created successfully";
					"createError": "Could not create the faculty";
					"updateSuccess": "Faculty updated successfully";
					"updateError": "Could not update the faculty";
					"deleteSuccess": "Faculty deleted successfully";
					"deleteError": "Could not delete the faculty";
				};
				"delete": {
					"title": "Delete Faculty";
					"message": "Are you sure you want to delete this faculty? This action cannot be undone.";
				};
			};
			"classCourses": {
				"title": "Course Assignments";
				"subtitle": "Manage course assignments for classes";
				"validation": {
					"class": "Please select a class";
					"course": "Please select a course";
					"teacher": "Please select a teacher";
					"code": "Please provide a code";
				};
				"actions": {
					"add": "Assign Course";
				};
				"empty": {
					"title": "No course assignments";
					"description": "Get started by assigning a course to a class.";
				};
				"table": {
					"class": "Class";
					"code": "Code";
					"program": "Program";
					"course": "Course";
					"teacher": "Teacher";
				};
				"form": {
					"createTitle": "New Course Assignment";
					"editTitle": "Edit Course Assignment";
					"classLabel": "Class";
					"classPlaceholder": "Select a class";
					"courseLabel": "Course";
					"coursePlaceholder": "Select a course";
					"teacherLabel": "Teacher";
					"teacherPlaceholder": "Select a teacher";
					"semesterLabel": "Semester";
					"semesterPlaceholder": "Select a semester";
					"codeLabel": "Code";
					"codePlaceholder": "INF11-CLS24-01";
					"submit": "Save assignment";
				};
				"toast": {
					"createSuccess": "Course assignment created successfully";
					"createError": "Could not create the assignment";
					"updateSuccess": "Course assignment updated successfully";
					"updateError": "Could not update the assignment";
					"deleteSuccess": "Course assignment deleted successfully";
					"deleteError": "Could not delete the assignment";
				};
				"delete": {
					"title": "Delete Course Assignment";
					"message": "Are you sure you want to delete this course assignment? This action cannot be undone and will also delete all associated exams and grades.";
				};
			};
			"promotion": {
				"title": "Student Promotion";
				"subtitle": "Promote students to their next class";
				"unknownYear": "Unknown";
				"sourceClassLabel": "Source class ({{year}})";
				"sourceClassPlaceholder": "Select source class";
				"targetClassLabel": "Target class ({{year}})";
				"targetClassPlaceholder": "Select target class";
				"students": {
					"title": "Eligible students";
					"listTitle": "Students";
					"selectedCount": "({{count}} selected)";
					"autoSelect": "Select average ≥ 10";
					"average": "Average grade: {{value}}";
				};
				"summary": {
					"selected": "{{count}} selected";
					"hint": "Average ≥ 10 will be auto-selected";
				};
				"table": {
					"registration": "Registration #";
					"name": "Name";
					"courseAverages": "Course averages";
					"overallAverage": "Overall average";
				};
				"actions": {
					"promote": "Promote";
					"promoteSelected": "Promote selected";
				};
				"toast": {
					"missingSelection": "Please select students and a target class";
					"success": "Successfully promoted {{count}} students";
					"error": "Could not promote students";
				};
				"emptyStudents": {
					"title": "No students found";
					"description": "There are no students in this class.";
				};
			};
			"exams": {
				"title": "Exam Management";
				"subtitle": "Create and manage course exams";
				"actions": {
					"add": "Add Exam";
				};
				"empty": {
					"title": "No exams found";
					"description": "Get started by adding your first exam.";
				};
				"table": {
					"name": "Name";
					"course": "Course";
					"class": "Class";
					"type": "Type";
					"date": "Date";
					"percentage": "Percentage";
					"percentageValue": "{{value}}%";
					"status": "Status";
				};
				"status": {
					"locked": "Locked";
					"open": "Open";
				};
				"form": {
					"createTitle": "Add New Exam";
					"editTitle": "Edit Exam";
					"classCourseLabel": "Linked course";
					"classCoursePlaceholder": "Select a course";
					"nameLabel": "Exam name";
					"namePlaceholder": "Enter exam name";
					"typeLabel": "Type";
					"typePlaceholder": "e.g. Midterm, Final";
					"dateLabel": "Date";
					"percentageLabel": "Weight (1-100)";
					"percentagePlaceholder": "Enter percentage";
					"submit": "Save exam";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
					"type": "Type must be at least 2 characters";
					"date": "Date is required";
					"percentage": {
						"min": "Percentage must be at least 1";
						"max": "Percentage cannot exceed 100";
					};
					"classCourse": "Please select a course";
				};
				"toast": {
					"createSuccess": "Exam created successfully";
					"createError": "Could not create the exam";
					"updateSuccess": "Exam updated successfully";
					"updateError": "Could not update the exam";
					"deleteSuccess": "Exam deleted successfully";
					"deleteError": "Could not delete the exam";
				};
				"delete": {
					"title": "Delete Exam";
					"message": "Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades.";
				};
			};
			"workflow": {
				"title": "Exam workflow";
				"subtitle": "Submit exams for validation and monitor their status.";
				"selectCourse": "Select class course";
				"placeholder": "Choose a class course to view exams.";
				"empty": "No exams for this class course.";
				"actions": {
					"submit": "Submit";
					"lock": "Lock";
				};
				"toast": {
					"submitted": "Exam submitted";
					"locked": "Exam locked";
				};
			};
		};
		"navigation": {
			"header": {
				"adminDashboard": "Admin dashboard";
				"teacherDashboard": "Teacher dashboard";
				"notificationsAria": "Open notifications";
				"toggleSidebarAria": "Toggle sidebar";
				"languageSelectAria": "Change language";
				"languageSelectPlaceholder": "Select language";
				"profileMenuAria": "Open profile menu";
			};
			"sidebar": {
				"admin": {
					"dashboard": "Overview";
					"academicYears": "Academic years";
					"exams": "Exams";
					"users": "Users";
					"classCourses": "Class courses";
					"gradeExport": "Grade export";
					"exportTemplates": "Export templates";
					"monitoring": "Monitoring";
					"notifications": "Notifications";
					"students": "Students";
					"studentPromotion": "Student promotion";
					"courses": "Courses";
					"classes": "Classes";
					"faculties": "Faculties";
					"institution": "Institution";
					"studyCycles": "Study cycles";
					"programs": "Programs";
					"teachers": "Teachers";
					"courseAssignments": "Course assignments";
					"teachingUnits": "Teaching units";
					"enrollments": "Enrollments";
					"examTypes": "Exam types";
					"examScheduler": "Exam scheduler";
					"rules": "Rule center";
					"registrationNumbers": "Registration numbers";
					"promotionRules": "Promotion rules";
				};
				"groups": {
					"overview": "Overview";
					"structure": "Academic Structure";
					"users": "Users";
					"teaching": "Teaching";
					"evaluation": "Evaluation";
					"promotion": "Rules & Promotion";
					"system": "System";
				};
				"teacher": {
					"dashboard": "Overview";
					"exams": "Exams";
					"grades": "Grades";
					"courses": "Courses";
					"attendance": "Attendance alerts";
					"workflows": "Workflows";
				};
				"dean": {
					"dashboard": "Overview";
					"workflows": "Approvals";
				};
				"student": {
					"dashboard": "My performance";
				};
			};
			"roles": {
				"guest": "Guest";
				"student": "Student";
				"staff": "Staff";
				"dean": "Dean";
				"teacher": "Teacher";
				"administrator": "Administrator";
				"super_admin": "Super admin";
				"owner": "Owner";
			};
		};
		"auth": {
			"layout": {
				"title": "Welcome back";
				"subtitle": "Sign in to manage academic records and grades";
			};
			"login": {
				"title": "Sign in to your account";
				"emailPlaceholder": "you@example.com";
				"passwordPlaceholder": "Your password";
				"forgotPassword": "Forgot password?";
				"submit": "Sign in";
				"submitting": "Signing you in...";
				"success": "Signed in successfully";
				"error": "Unable to sign in. Check your credentials.";
				"noAccount": "Don't have an account?";
				"registerLink": "Create one";
			};
			"register": {
				"title": "Create your account";
				"success": "Account created successfully";
				"error": "Unable to create the account";
				"submit": "Sign up";
				"submitting": "Creating your account...";
				"haveAccount": "Already registered?";
				"loginLink": "Sign in";
				"placeholders": {
					"firstName": "First name";
					"lastName": "Last name";
					"email": "you@example.com";
					"password": "Choose a strong password";
					"confirmPassword": "Repeat your password";
				};
			};
			"forgot": {
				"title": "Reset your password";
				"emailPlaceholder": "you@example.com";
				"submit": "Send reset link";
				"submitting": "Sending email...";
				"success": "Password reset email sent";
				"error": "Unable to send the reset email";
				"backToLogin": "Back to sign in";
			};
			"reset": {
				"title": "Choose a new password";
				"newPassword": "New password";
				"passwordPlaceholder": "Enter a new password";
				"confirmPasswordPlaceholder": "Confirm your new password";
				"submit": "Update password";
				"submitting": "Updating password...";
				"success": "Password updated successfully";
				"error": "Unable to update the password";
				"backToLogin": "Return to sign in";
			};
			"logout": {
				"success": "Signed out successfully";
				"error": "Unable to sign out";
				"aria": "Sign out";
			};
			"validation": {
				"email": "Enter a valid email address";
				"firstName": "First name must be at least 2 characters";
				"lastName": "Last name must be at least 2 characters";
				"passwordMin": "Password must be at least {{count}} characters";
				"confirmPassword": "Confirm password is required";
				"passwordsMismatch": "Passwords do not match";
			};
		};
		"admin": {
			"dashboard": {
				"title": "Admin Dashboard";
				"activeYear": "Active Year: {{year}}";
				"noActiveYear": "No active year";
				"programStats": {
					"title": "Students per program";
					"empty": "No data available for the selected year";
				};
				"stats": {
					"faculties": "Faculties";
					"programs": "Programs";
					"courses": "Courses";
					"exams": "Exams";
					"students": "Students";
					"teachers": "Teachers";
				};
			};
			"monitoring": {
				"title": "Service monitoring";
				"subtitle": "Track workflows, notifications, and background jobs";
				"gradeWindows": "Open validation windows";
				"pendingAlerts": "Pending alerts";
				"jobs": "Background jobs";
				"jobsValue": "2 active";
				"compliance": "Compliance";
				"complianceValue": "MFA + RBAC";
				"workflows": "Workflow health";
				"workflowsDescription": "Validation, enrollments, and attendance checks are synchronized.";
				"healthy": "Healthy";
				"gradeValidation": "Grade validation";
				"gradeValidationDesc": "Approved exams are locked and broadcast to students.";
				"enrollments": "Enrollment windows";
				"enrollmentsDesc": "Classes respect open/close windows before accepting transfers.";
				"backgroundJobs": "Background jobs";
				"backgroundJobsDesc": "Recurring tasks run via Bun intervals to keep data fresh.";
				"jobExam": "Exam closure";
				"jobExamDesc": "Locks approved exams after session deadlines.";
				"jobNotifications": "Notification dispatcher";
				"jobNotificationsDesc": "Delivers pending email/webhook alerts.";
				"active": "Active";
			};
			"rules": {
				"title": "Promotion & Rule Center";
				"subtitle": "Curate study cycles, tune credit thresholds, and preview upcoming changes.";
				"actions": {
					"clone": "Clone defaults";
					"save": "Save override";
				};
				"studyCycles": "Study cycles";
				"faculty": "Faculty";
				"selectFaculty": "Select faculty";
				"cycle": "Study cycle";
				"selectCycle": "Select cycle";
				"totalCredits": "Total credits required: {{value}}";
				"duration": "Duration: {{value}} years";
				"levels": "Cycle levels";
				"promotionRules": "Promotion rules";
				"rulesHint": "Default rules come from the server. Clone them to craft faculty-level overrides.";
				"selectLevel": "Select level";
				"minCredits": "Required credits: {{value}}";
				"toast": {
					"saved": "Rule saved successfully";
				};
				"previewWarning": "Overrides are stored soon. For now, keep a note of exported JSON until persistence arrives.";
			};
			"registrationNumbers": {
				"title": "Registration number formats";
				"subtitle": "Design flexible matricule templates that pull context from classes, programs, and cohorts.";
				"actions": {
					"reset": "Reset form";
					"save": "Save format";
					"clear": "Clear form";
					"new": "New format";
				};
				"list": {
					"title": "Existing formats";
					"empty": "No formats yet. Start by creating one.";
					"active": "Active";
					"edit": "Edit";
					"activate": "Activate";
					"delete": "Delete";
					"confirmDelete": "Delete this format permanently?";
				};
				"form": {
					"title": "Format designer";
					"name": "Format name";
					"activeLabel": "Activate on save";
					"activeHelp": "When enabled, other templates will be deactivated.";
					"description": "Description";
				};
				"segments": {
					"title": "Segments";
					"addLiteral": "Add literal";
					"addField": "Add field";
					"addCounter": "Add counter";
					"empty": "Combine literals, fields, and counters to define your matricule format.";
					"segmentLabel": "Segment {{index}}";
					"typeLabel": "Segment type";
					"literal": "Literal text";
					"field": "Data field";
					"counter": "Counter";
					"literalValue": "Text value";
					"fieldSelect": "Select field";
					"transform": "Transform";
					"uppercase": "Uppercase";
					"lowercase": "Lowercase";
					"none": "Original";
					"length": "Max length";
					"fallback": "Fallback value";
					"counterWidth": "Width";
					"counterStart": "Start value";
					"counterPad": "Pad character";
					"counterScope": "Counter scope";
				};
				"preview": {
					"title": "Preview";
					"subtitle": "Select a class and optional student info to preview the output.";
					"class": "Class";
					"classPlaceholder": "Select class";
					"firstName": "First name";
					"lastName": "Last name";
					"nationality": "Nationality";
					"run": "Generate preview";
					"result": "Preview result";
				};
				"table": {
					"name": "Name";
					"description": "Description";
					"pattern": "Pattern";
				};
				"dialog": {
					"createTitle": "New format";
					"editTitle": "Edit format";
				};
				"toast": {
					"saved": "Format saved";
					"deleted": "Format deleted";
					"activated": "Format activated";
				};
				"errors": {
					"missingName": "Name is required";
					"missingSegments": "Add at least one segment";
					"previewClass": "Select a class to preview";
					"notFound": "Format not found";
				};
			};
			"notifications": {
				"title": "Notifications";
				"subtitle": "Workflow alerts sent to staff and students";
				"gradeValidated": "Grade validation complete";
				"gradeValidatedDesc": "An exam was validated and locked for publishing.";
				"windowOpened": "Enrollment window opened";
				"windowOpenedDesc": "Students can register for the selected class and academic year.";
				"justNow": "Just now";
				"queueTitle": "Latest notifications";
				"empty": "No notifications yet.";
				"actions": {
					"flush": "Flush pending";
					"ack": "Acknowledge";
				};
				"toast": {
					"flushed": "Pending notifications flushed";
				};
			};
			"academicYears": {
				"title": "Academic Year Management";
				"subtitle": "Create and manage academic years, and choose the active one";
				"actions": {
					"add": "Add academic year";
				};
				"confirmDelete": "Delete this academic year?";
				"empty": {
					"title": "No academic years yet";
					"description": "Start by creating an academic year for your institution.";
				};
				"modal": {
					"createTitle": "Add academic year";
					"editTitle": "Edit academic year";
					"startDate": "Start date";
					"endDate": "End date";
					"label": "Academic year label";
				};
				"table": {
					"name": "Name";
					"startDate": "Start date";
					"endDate": "End date";
					"status": "Status";
				};
				"toast": {
					"createSuccess": "Academic year created successfully";
					"createError": "Could not create the academic year";
					"updateSuccess": "Academic year updated successfully";
					"updateError": "Could not update the academic year";
					"deleteSuccess": "Academic year deleted successfully";
					"deleteError": "Could not delete the academic year";
					"statusSuccess": "Academic year status updated";
					"statusError": "Could not update the academic year status";
				};
				"validation": {
					"startDate": "Start date is required";
					"endDate": "End date is required";
					"name": "Name must be at least 2 characters";
					"order": "End date must be after start date";
				};
			};
			"classCourses": {
				"title": "Class course assignments";
				"subtitle": "Assign teachers and courses to classes";
				"actions": {
					"assign": "Assign course";
				};
				"empty": {
					"title": "No course assignments yet";
					"description": "Assign a course to a class to populate this list.";
				};
				"table": {
					"code": "Code";
					"class": "Class";
					"program": "Program";
					"course": "Course";
					"teacher": "Teacher";
					"semester": "Semester";
				};
				"form": {
					"createTitle": "New course assignment";
					"editTitle": "Edit course assignment";
					"classLabel": "Class";
					"classPlaceholder": "Select a class";
					"courseLabel": "Course";
					"coursePlaceholder": "Select a course";
					"teacherLabel": "Teacher";
					"teacherPlaceholder": "Select a teacher";
					"createSubmit": "Assign course";
				};
				"toast": {
					"createSuccess": "Course assignment created successfully";
					"createError": "Could not create the assignment";
					"updateSuccess": "Course assignment updated successfully";
					"updateError": "Could not update the assignment";
					"deleteSuccess": "Course assignment deleted successfully";
					"deleteError": "Could not delete the assignment";
				};
				"delete": {
					"title": "Delete course assignment";
					"message": "Deleting this assignment will also remove related exams and grades. Continue?";
				};
				"validation": {
					"class": "Please select a class";
					"course": "Please select a course";
					"teacher": "Please select a teacher";
				};
			};
			"classes": {
				"title": "Class management";
				"subtitle": "Create classes for each program and academic year";
				"actions": {
					"add": "Add class";
				};
				"empty": {
					"title": "No classes yet";
					"description": "Create classes to organise students by program and year.";
				};
				"table": {
					"name": "Class";
					"code": "Code";
					"program": "Program";
					"academicYear": "Academic year";
					"cycle": "Cycle / level";
					"option": "Option";
					"students": "Students";
				};
				"export": {
					"button": "Export student list (PDF)";
					"excelButton": "Export student list (Excel)";
					"title": "Student List";
					"totalStudents": "Total students";
					"page": "Page";
					"generatedOn": "Generated on";
					"success": "Student list exported successfully";
					"error": "Failed to export student list";
					"excelSuccess": "Student list exported successfully";
					"excelError": "Failed to export student list";
					"sheetName": "Students";
				};
				"form": {
					"createTitle": "Add class";
					"editTitle": "Edit class";
					"createSubmit": "Create class";
					"programLabel": "Program";
					"programPlaceholder": "Select a program";
					"programSummary": "Faculty: {{value}}";
					"cycleSummary": "Cycle: {{value}}";
					"academicYearLabel": "Academic year";
					"academicYearPlaceholder": "Select an academic year";
					"cycleLevelLabel": "Cycle level";
					"cycleLevelPlaceholder": "Select cycle level";
					"selectProgramFirst": "Select a program to load its cycle levels.";
					"emptyCycleLevels": "No cycle levels available for the selected faculty.";
					"programOptionLabel": "Program option";
					"programOptionPlaceholder": "Select option";
					"semesterLabel": "Semester";
					"semesterPlaceholder": "Select a semester";
					"codeLabel": "Code";
					"codePlaceholder": "INF11-S1-01";
					"labelLabel": "Generated class label";
				};
				"toast": {
					"createSuccess": "Class created successfully";
					"createError": "Could not create the class";
					"updateSuccess": "Class updated successfully";
					"updateError": "Could not update the class";
					"deleteSuccess": "Class deleted successfully";
					"deleteError": "Could not delete the class";
				};
				"delete": {
					"title": "Delete class";
					"message": "This action cannot be undone and may remove related assignments.";
				};
				"validation": {
					"program": "Please select a program";
					"academicYear": "Please select an academic year";
					"cycleLevel": "Please select a cycle level";
					"programOption": "Please select a program option";
					"semester": "Please select a semester";
					"code": "Please provide a class code";
					"name": "Name must be at least 2 characters";
				};
			};
			"institution": {
				"title": "Institution settings";
				"subtitle": "Store the bilingual identity, branding, and official contact information used in generated documents.";
				"actions": {
					"save": "Save institution";
				};
				"toast": {
					"saved": "Institution saved successfully";
				};
				"form": {
					"identity": "Identity & branding";
					"identityHint": "French and English fields are required to feed bilingual headers.";
					"code": "Sigle / Code";
					"shortName": "Abbreviation";
					"nameFr": "Official name (FR)";
					"nameEn": "Official name (EN)";
					"legalNameFr": "Legal name (FR)";
					"legalNameEn": "Legal name (EN)";
					"sloganFr": "Slogan (FR)";
					"sloganEn": "Slogan (EN)";
					"descriptionFr": "Description (FR)";
					"descriptionEn": "Description (EN)";
					"addressFr": "Address (FR)";
					"addressEn": "Address (EN)";
					"contactEmail": "Contact email";
					"contactPhone": "Phone";
					"fax": "Fax";
					"postalBox": "Postal box";
					"timezone": "Timezone";
					"website": "Website URL";
					"logoUrl": "Logo URL";
					"coverImageUrl": "Cover image URL";
					"logoUploadLabel": "Logo (PNG/JPG)";
					"logoUploadDescription": "Used on transcripts, attestations, and diplomas.";
					"logoUrlPlaceholder": "https://example.com/logo.png";
					"coverUploadLabel": "Banner / header";
					"coverUploadDescription": "Displayed on dashboards and PDF cover pages.";
					"coverImageUrlPlaceholder": "https://example.com/banner.jpg";
					"uploadCta": "Select or drop an image";
					"uploadHint": "PNG/JPG up to 5 MB";
					"uploading": "Uploading…";
					"uploadDescription": "You can also paste a public URL directly.";
					"clearImage": "Remove image";
					"previewPlaceholder": "No image yet";
					"uploadSuccess": "Image uploaded";
					"uploadError": "Upload failed";
					"defaultAcademicYear": "Default academic year";
					"defaultAcademicYearPlaceholder": "Select academic year";
					"registrationFormat": "Registration format";
					"registrationFormatPlaceholder": "Use active format";
				};
			};
			"studyCycles": {
				"title": "Study cycles";
				"subtitle": "Group programs by cycle and tune credit thresholds per level.";
				"actions": {
					"add": "Add cycle";
					"addLevel": "Add level";
				};
				"listTitle": "Cycles";
				"empty": "No study cycles yet.";
				"table": {
					"name": "Name";
					"faculty": "Faculty";
					"credits": "Credits";
					"duration": "Duration";
					"years": "{{value}} years";
					"actions": "Actions";
				};
				"levelsTitle": "Cycle levels for {{cycle}}";
				"levelsSubtitle": "Define how students progress across years.";
				"levelsEmpty": "No levels defined yet.";
				"levels": {
					"defaultName": "Level {{value}}";
				};
				"levelCredits": "Required credits: {{value}}";
				"form": {
					"faculty": "Faculty";
					"selectFaculty": "Select faculty";
					"name": "Name";
					"code": "Code";
					"description": "Description";
					"credits": "Credits required";
					"duration": "Duration (years)";
				};
				"toast": {
					"createSuccess": "Study cycle created";
					"deleteSuccess": "Study cycle deleted";
					"levelCreate": "Level added";
					"levelDelete": "Level removed";
				};
				"delete": {
					"title": "Delete study cycle";
					"message": "Deleting a cycle will require programs and classes to be reassigned.";
				};
			};
			"faculties": {
				"title": "Faculty management";
				"subtitle": "Create and manage academic faculties";
				"actions": {
					"add": "Add faculty";
				};
				"empty": {
					"title": "No faculties found";
					"description": "Get started by adding your first faculty.";
				};
				"table": {
					"name": "Name";
					"code": "Code";
					"description": "Description";
					"noDescription": "No description";
				};
				"form": {
					"createTitle": "Add new faculty";
					"editTitle": "Edit faculty";
					"nameLabel": "Faculty name";
					"namePlaceholder": "Enter faculty name";
					"codeLabel": "Code";
					"codePlaceholder": "SCI";
					"descriptionLabel": "Description";
					"descriptionPlaceholder": "Enter faculty description";
					"submit": "Save faculty";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
					"code": "Code is required";
				};
				"toast": {
					"createSuccess": "Faculty created successfully";
					"createError": "Could not create the faculty";
					"updateSuccess": "Faculty updated successfully";
					"updateError": "Could not update the faculty";
					"deleteSuccess": "Faculty deleted successfully";
					"deleteError": "Could not delete the faculty";
				};
				"delete": {
					"title": "Delete faculty";
					"message": "Are you sure you want to delete this faculty? This action cannot be undone.";
				};
			};
			"programs": {
				"title": "Program management";
				"subtitle": "Organize academic programs and link them to faculties.";
				"actions": {
					"add": "Add program";
				};
				"empty": {
					"title": "No programs available";
					"description": "Create a program to start organizing curricula.";
				};
				"table": {
					"code": "Code";
					"name": "Program";
					"faculty": "Faculty";
					"cycle": "Cycle";
					"description": "Description";
					"noDescription": "No description";
				};
				"form": {
					"createTitle": "Add new program";
					"editTitle": "Edit program";
					"nameLabel": "Program name";
					"namePlaceholder": "Enter program name";
					"codeLabel": "Program code";
					"codePlaceholder": "INF-LIC";
					"facultyLabel": "Faculty";
					"facultyPlaceholder": "Select a faculty";
					"cycleLabel": "Study cycle";
					"cyclePlaceholder": "Select cycle";
					"selectFacultyFirst": "Select a faculty to load available cycles.";
					"descriptionLabel": "Description";
					"descriptionPlaceholder": "Describe this program";
					"submit": "Save program";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
					"code": "Code is required";
					"faculty": "Please select a faculty";
					"cycle": "Please select a study cycle";
				};
				"toast": {
					"createSuccess": "Program created successfully";
					"createError": "Could not create the program";
					"updateSuccess": "Program updated successfully";
					"updateError": "Could not update the program";
					"deleteSuccess": "Program deleted successfully";
					"deleteError": "Could not delete the program";
				};
				"delete": {
					"title": "Delete program";
					"message": "Are you sure you want to delete this program? This action cannot be undone.";
				};
				"options": {
					"manage": "Manage options";
					"title": "Manage options for {{value}}";
					"subtitle": "Options represent the different tracks/specializations offered within this program.";
					"empty": "No options yet. Add one below.";
					"delete": "Delete option";
					"edit": "Edit option";
					"editing": "Editing option {{name}}";
					"cancelEdit": "Cancel edit";
					"form": {
						"name": "Option name";
						"code": "Code";
						"description": "Description";
						"submit": "Add option";
						"updateSubmit": "Save changes";
					};
					"toast": {
						"create": "Option added";
						"createError": "Could not add option";
						"delete": "Option deleted";
						"deleteError": "Could not delete option";
						"update": "Option updated";
						"updateError": "Could not update option";
					};
				};
			};
			"courses": {
				"title": "Course management";
				"subtitle": "Manage courses, workloads, and default teachers.";
				"actions": {
					"add": "Add course";
				};
				"table": {
					"code": "Code";
					"name": "Course";
					"program": "Program";
					"hours": "Hours";
					"teacher": "Default teacher";
					"facultyInfo": "Faculty: {{value}}";
				};
				"form": {
					"createTitle": "Add course";
					"editTitle": "Edit course";
					"createSubmit": "Create course";
					"nameLabel": "Course name";
					"namePlaceholder": "Enter course name";
					"codeLabel": "Course code";
					"codePlaceholder": "INF111";
					"hoursLabel": "Hours";
					"hoursPlaceholder": "Enter total hours";
					"programLabel": "Program";
					"programPlaceholder": "Select a program";
					"programFacultySummary": "Faculty: {{value}}";
					"teacherLabel": "Default teacher";
					"teacherPlaceholder": "Select a teacher";
				};
				"toast": {
					"createSuccess": "Course created successfully";
					"createError": "Could not create the course";
					"updateSuccess": "Course updated successfully";
					"updateError": "Could not update the course";
					"deleteSuccess": "Course deleted successfully";
					"deleteError": "Could not delete the course";
				};
				"delete": {
					"title": "Delete course";
					"message": "Deleting this course will remove related assignments and exams.";
				};
				"empty": {
					"title": "No courses available";
					"description": "Create a course to populate the catalog.";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
					"hours": "Hours must be at least 1";
					"code": "Code is required";
					"program": "Please select a program";
					"teacher": "Please select a teacher";
				};
			};
			"exams": {
				"title": "Exam management";
				"subtitle": "Create and manage exams for each class course";
				"actions": {
					"add": "Add exam";
				};
				"empty": {
					"title": "No exams yet";
					"description": "Create an exam to start collecting grades.";
				};
				"table": {
					"name": "Exam";
					"course": "Course";
					"class": "Class";
					"type": "Type";
					"date": "Date";
					"percentage": "Weight";
					"percentageValue": "{{value}}%";
					"status": "Status";
				};
				"status": {
					"locked": "Locked";
					"open": "Open";
				};
				"form": {
					"createTitle": "Add exam";
					"editTitle": "Edit exam";
					"classCourseLabel": "Linked course";
					"classCoursePlaceholder": "Select a class course";
					"nameLabel": "Exam name";
					"namePlaceholder": "Enter exam name";
					"typeLabel": "Type";
					"typePlaceholder": "e.g. Midterm, Final";
					"dateLabel": "Date";
					"percentageLabel": "Weight (1-100)";
					"percentagePlaceholder": "Enter weight";
					"courseLabel": "Course";
					"classLabel": "Class";
					"submit": "Save exam";
					"coursePlaceholder": "Select a course and class";
				};
				"toast": {
					"createSuccess": "Exam created successfully";
					"createError": "Could not create the exam";
					"updateSuccess": "Exam updated successfully";
					"updateError": "Could not update the exam";
					"deleteSuccess": "Exam deleted successfully";
					"deleteError": "Could not delete the exam";
				};
				"delete": {
					"title": "Delete exam";
					"message": "Deleting this exam will also remove related grades.";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
					"type": "Type must be at least 2 characters";
					"date": "Date is required";
					"percentage": {
						"min": "Weight must be at least 1";
						"max": "Weight cannot exceed 100";
					};
					"classCourse": "Please select a class course";
				};
			};
			"examTypes": {
				"title": "Exam types";
				"subtitle": "Create reusable categories such as CC, TP, or final session.";
				"actions": {
					"add": "Add type";
				};
				"table": {
					"title": "Available types";
					"description": "Description";
					"name": "Name";
				};
				"empty": "No exam types yet.";
				"form": {
					"createTitle": "Create exam type";
					"editTitle": "Edit exam type";
					"nameLabel": "Name";
					"descriptionLabel": "Description";
					"submit": "Save exam type";
				};
				"toast": {
					"createSuccess": "Exam type created";
					"createError": "Could not create exam type";
					"updateSuccess": "Exam type updated";
					"updateError": "Could not update exam type";
					"deleteSuccess": "Exam type deleted";
					"deleteError": "Could not delete exam type";
				};
				"delete": {
					"title": "Delete exam type";
					"message": "Are you sure you want to delete this exam type?";
				};
			};
			"exportTemplates": {
				"title": "Export templates";
				"subtitle": "Customize report layouts, columns, headers, and styling for grade exports.";
				"actions": {
					"setDefault": "Set as default";
					"edit": "Edit template";
					"rename": "Rename";
					"delete": "Delete";
				};
				"filter": {
					"all": "All types";
				};
				"table": {
					"title": "Available templates";
					"description": "All export operations can use these templates for formatting.";
					"name": "Name";
					"type": "Type";
					"status": "Status";
					"columns": "Columns";
					"columnsCount": "columns";
					"actions": "Actions";
					"default": "Default";
					"custom": "Custom";
				};
				"empty": {
					"title": "No templates yet";
					"description": "Create your first export template to customize your reports.";
				};
				"form": {
					"createTitle": "Create export template";
					"editTitle": "Edit export template";
					"renameTitle": "Rename template";
					"renameDescription": "Enter a new name for this template.";
					"description": "Define a template for customizing export outputs.";
					"name": "Template name";
					"namePlaceholder": "e.g., Standard PV Template";
					"type": "Export type";
					"typeDescription": "Type cannot be changed after creation.";
					"isDefault": "Set as default";
					"isDefaultDescription": "Use this template by default for this export type.";
				};
				"validation": {
					"name": "Name must be at least 2 characters";
				};
				"toast": {
					"createSuccess": "Export template created";
					"createError": "Could not create export template";
					"updateSuccess": "Export template updated";
					"updateError": "Could not update export template";
					"deleteSuccess": "Export template deleted";
					"deleteError": "Could not delete export template";
					"setDefaultSuccess": "Default template updated";
					"setDefaultError": "Could not set default template";
				};
				"delete": {
					"title": "Delete export template";
					"message": "Are you sure you want to delete \"{{name}}\"? This action cannot be undone.";
				};
				"editor": {
					"notFound": "Template not found";
					"createTitle": "Create New Export Template";
					"createDescription": "Enter a name and select the export type to get started.";
					"subtitle": "Editing {{type}} template";
					"tabs": {
						"columns": "Columns";
						"header": "Header";
						"style": "Style";
						"template": "Template";
					};
					"template": {
						"editorTitle": "HTML Template Editor";
						"editorDescription": "Write Handlebars template with custom HTML/CSS.";
						"placeholder": "Enter your custom Handlebars template here...";
						"generatePreview": "Generate Preview";
						"reset": "Reset to Default";
						"previewTitle": "Preview";
						"previewDescription": "Live preview with sample data";
						"download": "Download HTML";
						"noPreview": "No preview available";
						"clickGenerate": "Click 'Generate Preview' to see the rendered output";
						"helpTitle": "Template Help:";
						"helpHandlebars": "Use Handlebars syntax: {{variable}}, {{#if}}, {{#each}}";
						"helpVariables": "Available variables: students, headerConfig, styleConfig";
						"helpConfig": "Configurations are automatically applied to the template";
					};
					"columns": {
						"title": "Column Configuration";
						"description": "Define which columns to display, their order, and formatting.";
						"addColumn": "Add Column";
						"empty": "No columns configured yet. Add your first column to get started.";
						"addTitle": "Add Column";
						"editTitle": "Edit Column";
						"dialogDescription": "Configure the column properties.";
						"key": "Data Key";
						"label": "Label";
						"labelFr": "Label (FR)";
						"labelEn": "Label (EN)";
						"dataType": "Data Type";
						"alignment": "Alignment";
						"width": "Width (px)";
						"format": "Format";
						"formula": "Formula";
						"visible": "Visible";
					};
					"header": {
						"title": "Header Configuration";
						"description": "Customize the document header layout and information.";
						"titles": "Document Titles";
						"titleFr": "Title (FR)";
						"titleEn": "Title (EN)";
						"logoConfig": "Logo Configuration";
						"showLogo": "Show Logo";
						"logoPosition": "Logo Position";
						"displayOptions": "Display Options";
						"showInstitutionName": "Show Institution Name";
						"showFacultyName": "Show Faculty Name";
						"showAcademicYear": "Show Academic Year";
						"showSemester": "Show Semester";
						"showClassName": "Show Class Name";
					};
					"style": {
						"title": "Style Configuration";
						"description": "Customize fonts, colors, page settings, and watermark.";
						"typography": "Typography";
						"fontFamily": "Font Family";
						"fontSize": "Font Size";
						"headerFontSize": "Header Font Size";
						"colors": "Colors";
						"primaryColor": "Primary Color";
						"secondaryColor": "Secondary Color";
						"headerBackgroundColor": "Header Background";
						"headerTextColor": "Header Text";
						"tableBorderColor": "Table Border";
						"alternateRowColor": "Alternate Row";
						"pageSettings": "Page Settings";
						"pageSize": "Page Size";
						"pageOrientation": "Orientation";
						"tableBorderWidth": "Border Width";
						"margins": "Margins (mm)";
						"marginTop": "Top";
						"marginRight": "Right";
						"marginBottom": "Bottom";
						"marginLeft": "Left";
						"watermark": "Watermark";
						"watermarkEnabled": "Enable Watermark";
						"watermarkText": "Watermark Text";
						"watermarkOpacity": "Opacity";
						"watermarkFontSize": "Font Size";
						"watermarkRotation": "Rotation (degrees)";
					};
					"preview": {
						"success": "Preview generated successfully";
						"error": "Failed to generate preview";
					};
				};
			};
			"examScheduler": {
				"title": "Exam scheduler";
				"subtitle": "Plan exams for entire faculties and academic years in a single step.";
				"form": {
					"title": "Schedule parameters";
					"description": "Choose the faculty, academic year, exam type, weight, and time window.";
					"facultyLabel": "Faculty";
					"facultyPlaceholder": "Select faculty";
					"academicYearLabel": "Academic year";
					"academicYearPlaceholder": "Select academic year";
					"examTypeLabel": "Exam type";
					"examTypePlaceholder": "Select exam type";
					"semesterLabel": "Semester";
					"semesterPlaceholder": "Select semester";
					"percentageLabel": "Weight (%)";
					"dateStartLabel": "Start date";
					"dateEndLabel": "End date";
				};
				"classes": {
					"title": "Target classes";
					"description": "All classes for the selected year are preselected. Deselect any you wish to exclude.";
					"selectAll": "Select all classes";
				};
				"actions": {
					"schedule": "Schedule exams";
				};
				"toast": {
					"success": "Exams scheduled";
					"error": "Unable to schedule exams";
				};
				"history": {
					"title": "Scheduling history";
					"description": "Review recent bulk scheduling runs and their outcomes.";
					"emptyTitle": "No scheduling runs yet";
					"emptyDescription": "Submit the scheduling form to generate the first entry.";
					"table": {
						"classes": "Classes";
						"created": "Created";
						"skipped": "Skipped";
						"duplicates": "Duplicates";
						"conflicts": "Conflicts";
					};
					"actions": {
						"view": "View exams";
					};
					"details": {
						"title": "Scheduled exams";
						"subtitle": "Run executed on {{date}}";
						"table": {
							"exam": "Exam";
							"course": "Course";
							"class": "Class";
							"type": "Type";
							"date": "Date";
							"status": "Status";
							"locked": "Locked";
						};
					};
				};
			};
			"gradeExport": {
				"title": "Grade export";
				"subtitle": "Export student grades by class and exam";
				"filters": {
					"academicYear": "Academic year";
					"academicYearPlaceholder": "Select academic year";
					"class": "Class";
					"classPlaceholder": "Select class";
				};
				"actions": {
					"label": "Export";
					"export": "Export grades";
				};
				"exams": {
					"title": "Select exams to include";
					"emptyTitle": "No exams found";
					"emptyDescription": "There are no exams created for this class yet.";
				};
				"columns": {
					"lastName": "Last name";
					"firstName": "First name";
					"registration": "Registration number";
					"birthDate": "Birth date";
					"birthPlace": "Birth place";
					"gender": "Gender";
				};
				"sheetName": "Grades";
				"filePrefix": "grades";
				"unknownClass": "unknown-class";
			};
			"students": {
				"title": "Student management";
				"actions": {
					"openModal": "Add students";
				};
				"filters": {
					"allClasses": "All classes";
					"searchPlaceholder": "Search by name or registration number";
				};
				"empty": "No students found for this selection.";
				"table": {
					"name": "Student";
					"email": "Email";
					"registration": "Registration number";
					"gender": "Gender";
					"dateOfBirth": "Date of birth";
					"placeOfBirth": "Place of birth";
					"genderUnknown": "Not specified";
					"actions": "Actions";
					"viewLedger": "Credits";
				};
				"gender": {
					"male": "Male";
					"female": "Female";
					"other": "Other";
				};
				"modal": {
					"title": "Add students";
					"tabs": {
						"single": "Single student";
						"import": "Import file";
						"external": "External admission";
					};
				};
				"form": {
					"firstName": "First name";
					"lastName": "Last name";
					"email": "Email";
					"dateOfBirth": "Date of birth";
					"placeOfBirth": "Place of birth";
					"gender": "Gender";
					"genderPlaceholder": "Select gender";
					"nationality": "Nationality";
					"registration": "Registration number";
					"registrationHint": "Leave blank to auto-generate the next available matricule.";
					"registrationFormat": "Registration format";
					"registrationFormatHint": "Choose a specific template to override the active format.";
					"registrationFormatPlaceholder": "Use active format";
					"registrationSection": "Registration";
					"class": "Class";
					"classPlaceholder": "Select class";
					"submit": "Add student";
				};
				"import": {
					"classLabel": "Class for imported students";
					"formatLabel": "Registration format (optional)";
					"fileLabel": "Upload CSV or XLSX file";
					"downloadTemplate": "Download template";
					"invalidFormat": "Missing required fields in this row";
					"actions": {
						"import": "Import students";
					};
					"instructions": {
						"gender": "Gender accepts: {{values}}.";
						"admissionType": "Admission type accepts: {{values}}. Provide transfer columns for transfer/direct/equivalence admissions.";
						"date": "Dates must use the ISO format YYYY-MM-DD.";
					};
					"summary": {
						"created": "{{count}} students imported successfully";
						"conflicts": {
							"title": "Conflicts";
							"item": "Row {{row}}: {{reason}}";
						};
						"errors": {
							"title": "Errors";
							"item": "Row {{row}}: {{reason}}";
						};
					};
					"errors": {
						"invalidGender": "Invalid gender \"{{value}}\". Allowed values: {{values}}.";
						"invalidAdmissionType": "Invalid admission type \"{{value}}\". Allowed values: {{values}}.";
						"invalidTransferCredits": "Transfer credits must be a number between 0 and 300.";
						"invalidDate": "Invalid date for {{field}}.";
						"missingTransferData": "Missing required transfer data: {{fields}}.";
					};
					"fields": {
						"dateOfBirth": "Date of birth";
						"admissionDate": "Admission date";
						"transferInstitution": "Transfer institution";
						"transferCredits": "Transfer credits";
						"transferLevel": "Transfer level";
						"admissionJustification": "Admission justification";
					};
					"preview": {
						"ready": "{{count}} row(s) ready to import.";
						"errorsTitle": "Issues detected";
						"noValidRows": "No valid rows detected. Check the errors above.";
					};
				};
				"templates": {
					"sheetName": "Students";
					"filePrefix": "students-template";
				};
				"toast": {
					"createSuccess": "Student created successfully";
					"createError": "Could not create the student";
					"importError": "Could not import students";
				};
				"ledger": {
					"title": "Credit overview";
					"subtitle": "Tracking credits for {{student}}";
					"loading": "Fetching ledger…";
					"progressLabel": "Progress toward promotion";
					"credits": "credits";
					"required": "Required: {{required}}";
					"inProgress": "In progress: {{value}}";
					"ready": "Student is eligible for promotion 🎉";
					"notReady": "Keep going! You're almost ready for promotion.";
					"message": "Rules evaluated via json-rules-engine. Overrides will appear here once published.";
					"entry": "Earned {{earned}} • In progress {{progress}}";
				};
				"validation": {
					"firstName": "First name is required";
					"lastName": "Last name is required";
					"email": "Enter a valid email address";
					"registration": "Provide a registration number or leave the field blank";
					"class": "Please select a class";
				};
				"external": {
					"info": {
						"title": "External Student Admission";
						"description": "Admit students from other institutions with transfer credits or direct admission";
					};
					"form": {
						"admissionType": "Admission type";
						"admissionTypePlaceholder": "Select admission type";
						"admissionTypeHint": "Choose the type of admission for this external student";
						"transferInstitution": "Transfer institution";
						"transferCredits": "Transfer credits";
						"transferLevel": "Transfer level";
						"admissionDate": "Admission date";
						"admissionJustification": "Justification";
						"admissionJustificationPlaceholder": "Explain the reason for this admission (minimum 10 characters)";
						"admissionJustificationHint": "Provide a detailed justification for this external admission";
						"studentInfoSection": "Student Information";
						"submit": "Admit external student";
					};
					"admissionTypes": {
						"transfer": "Transfer";
						"direct": "Direct admission";
						"equivalence": "Equivalence";
					};
					"toast": {
						"success": "External student admitted successfully";
						"error": "Could not admit external student";
					};
					"validation": {
						"admissionType": "Admission type is required";
						"transferInstitution": "Transfer institution is required";
						"transferCredits": "Transfer credits must be a number";
						"transferLevel": "Transfer level is required (e.g., L1, L2, M1)";
						"admissionDate": "Admission date is required";
						"admissionJustification": "Justification must be at least 10 characters";
					};
				};
			};
			"users": {
				"title": "User management";
				"empty": "No users match the current filters.";
				"actions": {
					"create": "Create user";
					"edit": "Edit user";
					"ban": "Ban user";
					"unban": "Unban user";
				};
				"filters": {
					"searchPlaceholder": "Search by name or email";
					"roles": {
						"all": "All roles";
						"admin": "Administrators";
						"teacher": "Teachers";
					};
					"status": {
						"all": "All statuses";
						"active": "Active";
						"banned": "Banned";
					};
					"email": {
						"all": "All emails";
						"verified": "Verified";
						"unverified": "Unverified";
					};
				};
				"table": {
					"name": "Name";
					"email": "Email";
					"role": "Role";
					"emailVerified": "Email verified";
					"status": "Status";
				};
				"roles": {
					"admin": "Admin";
					"teacher": "Teacher";
				};
				"status": {
					"active": "Active";
					"inactive": "Inactive";
					"suspended": "Suspended";
					"banned": "Banned";
					"emailVerified": "Verified";
					"emailUnverified": "Pending verification";
				};
				"form": {
					"createTitle": "Create user";
					"editTitle": "Edit user";
					"firstNameLabel": "First name";
					"lastNameLabel": "Last name";
					"emailLabel": "Email address";
					"phoneLabel": "Phone number";
					"genderLabel": "Gender";
					"genderPlaceholder": "Select gender";
					"dateOfBirthLabel": "Date of birth";
					"placeOfBirthLabel": "Place of birth";
					"nationalityLabel": "Nationality";
					"statusLabel": "Status";
					"roleLabel": "Role";
					"passwordLabel": "Password";
					"newPasswordLabel": "New password";
					"passwordPlaceholder": "Leave blank to keep current password";
					"generatePassword": "Generate";
					"createSubmit": "Create user";
				};
				"gender": {
					"male": "Male";
					"female": "Female";
					"other": "Other";
				};
				"confirm": {
					"delete": {
						"title": "Delete user";
						"message": "Are you sure you want to delete this user? This action cannot be undone.";
					};
					"ban": {
						"title": "Ban user";
						"message": "The user will be blocked from signing in until unbanned. Continue?";
					};
					"unban": {
						"title": "Unban user";
						"message": "Allow this user to sign in again?";
					};
				};
				"ban": {
					"reason": "Banned by an administrator";
				};
				"toast": {
					"createSuccess": "User created successfully";
					"createError": "Could not create the user";
					"updateSuccess": "User updated successfully";
					"updateError": "Could not update the user";
					"deleteSuccess": "User deleted successfully";
					"deleteError": "Could not delete the user";
					"banSuccess": "User banned successfully";
					"banError": "Could not ban the user";
					"unbanSuccess": "User unbanned successfully";
					"unbanError": "Could not unban the user";
					"passwordCopied": "Password copied to clipboard";
				};
				"validation": {
					"firstName": "First name is required";
					"lastName": "Last name is required";
					"email": "Enter a valid email address";
					"role": "Please select a role";
					"passwordRequired": "Password is required";
				};
			};
			"enrollments": {
				"title": "Enrollment management";
				"subtitle": "Monitor cohorts and control enrollment windows.";
				"selectYear": "Select academic year";
				"selectClass": "Select class";
				"filters": {
					"year": "Academic year";
					"class": "Class";
					"summary": "Snapshot";
					"studentsCount": "Students: {{value}}";
					"cycle": "Cycle: {{value}}";
					"cycleLevel": "Cycle level: {{value}}";
					"option": "Option: {{value}}";
					"window": "Window: {{status}}";
				};
				"listTitle": "Enrollments";
				"fields": {
					"student": "Student";
					"status": "Status";
					"dates": "Dates";
					"actions": "Actions";
					"statusValue": "{{value}}";
					"enrolledAt": "Enrolled: {{value}}";
					"exitedAt": "Exited: {{value}}";
					"unknownStudent": "Unknown student";
					"registrationFallback": "ID: {{value}}";
				};
				"empty": "No enrollments for this selection.";
				"windowStatus": "Window: {{status}}";
				"windowMissing": "Window not configured";
				"windowOpen": "Students can enroll.";
				"windowClosed": "Window currently closed.";
				"actions": {
					"open": "Open window";
					"close": "Close window";
					"title": "Manual adjustments";
					"description": "Use the student management page to transfer or re-enroll students between classes.";
				};
				"autoEnroll": {
					"button": "Enroll entire class";
					"title": "Enroll every student?";
					"description": "This action enrolls {{students}} students into {{courses}} courses. Existing enrollments remain untouched.";
					"confirm": "Confirm enrollment";
				};
				"toast": {
					"updated": "Window updated";
					"courseEnrolled": "Student enrolled in course";
					"courseWithdrawn": "Enrollment updated";
					"courseReactivated": "Enrollment restored";
					"autoEnrollSuccess": "Class roster synced ({{count}} new records)";
				};
				"courseRoster": {
					"title": "Course roster (per student)";
					"subtitle": "Select a student to review enrollment attempts, retakes, and status per course.";
					"selected": "Managing: {{value}}";
					"students": "Students in class";
					"emptyStudents": "Select a class to view students.";
					"courses": "Class courses";
					"selectStudent": "Pick a student to manage course enrollments.";
					"openModalBtn": "Open roster";
					"teacher": "Teacher: {{value}}";
					"notEnrolled": "Not enrolled";
					"enrollBtn": "Enroll";
					"reactivateBtn": "Restore enrollment";
					"withdrawBtn": "Withdraw";
					"retakeBtn": "Retake";
					"noCourses": "This class has no courses assigned yet.";
				};
			};
			"teachingUnits": {
				"title": "Teaching units";
				"subtitle": "Manage UE catalog, semesters, and prerequisites.";
				"selectProgram": "Select program";
				"programFacultySummary": "Faculty: {{value}}";
				"new": "Create new UE";
				"fields": {
					"name": "Unit name";
					"code": "Code";
					"description": "Description";
					"credits": "ECTS";
					"programFaculty": "Faculty: {{value}}";
				};
				"semesters": {
					"annual": "Annual";
					"fall": "Fall";
					"spring": "Spring";
				};
				"actions": {
					"create": "Create UE";
					"delete": "Remove";
					"savePrereq": "Save prerequisites";
				};
				"list": "Units list";
				"listDescription": "Browse teaching units and open them to manage ECs.";
				"empty": "No units yet for this program.";
				"emptyDescription": "Create a teaching unit to start managing ECs.";
				"table": {
					"name": "Name";
					"code": "Code";
					"program": "Program";
					"semester": "Semester";
					"credits": "ECTS";
				};
				"deleteTitle": "Delete teaching unit";
				"deleteMessage": "This action permanently removes the teaching unit.";
				"prereqTitle": "Manage course prerequisites";
				"prereqSelectCourse": "Choose a course";
				"prereqHint": "Select prerequisite courses";
				"detail": {
					"createTitle": "Create teaching unit";
					"editTitle": "Edit {{name}}";
					"subtitle": "Update metadata and manage constitutive elements.";
					"formTitle": "Teaching unit details";
					"formSubtitle": "Edit code, semester, and description.";
				};
				"validation": {
					"name": "Unit name is required.";
					"code": "Unit code is required.";
					"credits": "Credits must be zero or positive.";
					"program": "Program is required.";
				};
				"courses": {
					"title": "Constitutive elements";
					"subtitle": "Manage ECs tied to this teaching unit.";
					"actions": {
						"add": "Add element";
					};
					"table": {
						"name": "Name";
						"code": "Code";
						"hours": "Hours";
						"teacher": "Default teacher";
					};
					"form": {
						"createTitle": "Add element";
						"editTitle": "Edit element";
						"nameLabel": "Element name";
						"namePlaceholder": "Enter the element name";
						"codeLabel": "Code";
						"codePlaceholder": "INF111";
						"hoursLabel": "Hours";
						"hoursPlaceholder": "Enter hours";
						"teacherLabel": "Default teacher";
						"teacherPlaceholder": "Select a teacher";
						"submit": "Save element";
					};
					"empty": "No elements yet.";
					"deleteTitle": "Delete element";
					"deleteMessage": "This action cannot be undone.";
					"validation": {
						"name": "Element name is required.";
						"code": "Course code is required.";
						"hours": "Hours must be positive.";
						"teacher": "A default teacher is required.";
					};
					"toast": {
						"createSuccess": "Element created";
						"updateSuccess": "Element updated";
						"deleteSuccess": "Element deleted";
					};
				};
				"toast": {
					"created": "Teaching unit created";
					"updated": "Teaching unit updated";
					"deleted": "Teaching unit deleted";
					"prereqSaved": "Prerequisites saved";
					"programRequired": "Select a program first";
				};
			};
			"promotionRules": {
				"title": "Promotion Rules";
				"subtitle": "Automated student promotion management system";
				"dashboard": {
					"title": "Promotion Rules";
					"subtitle": "Automated student promotion management system";
					"stats": {
						"activeRules": "Active Rules";
						"totalRules": "{{count}} total rules";
						"recentExecutions": "Recent Executions";
						"last30Days": "Last 30 days";
						"studentsPromoted": "Students Promoted";
						"acrossExecutions": "Across all executions";
					};
					"actions": {
						"manageRules": "Manage Rules";
						"manageRulesDesc": "Create, edit, and configure promotion criteria using flexible rule definitions";
						"viewRules": "View Rules";
						"evaluateExecute": "Evaluate & Execute";
						"evaluateExecuteDesc": "Preview eligible students and apply promotions to selected candidates";
						"startEvaluation": "Start Evaluation";
						"executionHistory": "Execution History";
						"executionHistoryDesc": "View detailed logs of past promotions, including student-level results and audit trails";
						"viewHistory": "View History";
					};
					"recentActivity": {
						"title": "Recent Activity";
						"studentsPromoted": "{{count}} students promoted";
						"unknownRule": "Unknown rule";
						"details": "Details";
					};
				};
				"rulesList": {
					"title": "Promotion Rules";
					"subtitle": "Manage promotion criteria and rule configurations";
					"actions": {
						"createRule": "Create Rule";
					};
					"emptyState": {
						"noRules": "No rules found";
						"createFirst": "Create your first rule";
					};
					"dialog": {
						"create": {
							"title": "Create Promotion Rule";
							"description": "Define criteria for automatic student promotion";
						};
						"edit": {
							"title": "Edit Promotion Rule";
							"description": "Update rule configuration";
						};
						"form": {
							"ruleName": "Rule Name";
							"ruleNamePlaceholder": "e.g., Standard L1 to L2 Promotion";
							"description": "Description";
							"descriptionPlaceholder": "Describe when this rule should be applied";
							"ruleset": "Ruleset (JSON)";
							"rulesetPlaceholder": "Enter JSON ruleset";
							"rulesetHelp": "Use json-rules-engine format. See documentation for available facts.";
						};
						"actions": {
							"cancel": "Cancel";
							"create": "Create Rule";
							"creating": "Creating...";
							"save": "Save Changes";
							"saving": "Saving...";
						};
						"deleteConfirm": "Are you sure you want to delete this rule?";
					};
					"toast": {
						"createSuccess": "Rule created successfully";
						"createError": "Failed to create rule: {{error}}";
						"updateSuccess": "Rule updated successfully";
						"updateError": "Failed to update rule: {{error}}";
						"deleteSuccess": "Rule deleted successfully";
						"deleteError": "Failed to delete rule: {{error}}";
						"invalidJson": "Invalid JSON in ruleset";
					};
				};
				"evaluate": {
					"title": "Evaluate Promotion";
					"subtitle": "Preview which students are eligible for promotion";
					"form": {
						"title": "Evaluation Parameters";
						"ruleLabel": "Promotion Rule";
						"rulePlaceholder": "Select a rule";
						"classLabel": "Source Class";
						"classPlaceholder": "Select class";
						"yearLabel": "Academic Year";
						"yearPlaceholder": "Select year";
						"refreshDescription": "Keep student facts up to date before evaluating. Refreshing recomputes all metrics for the selected class and year.";
					};
					"tabs": {
						"eligible": "Eligible ({{count}})";
						"notEligible": "Not Eligible ({{count}})";
					};
					"actions": {
						"evaluate": "Evaluate Students";
						"evaluating": "Evaluating...";
						"refreshFacts": "Refresh Student Facts";
						"refreshingFacts": "Refreshing...";
						"selectAll": "Select All Eligible";
						"deselectAll": "Deselect All";
						"proceed": "Proceed with {{count}} student(s)";
					};
					"summary": {
						"total": "Total Students";
						"eligible": "Eligible";
						"notEligible": "Not Eligible";
						"selected": "Selected";
					};
					"emptyState": {
						"noEligible": "No eligible students found";
						"allEligible": "All students are eligible!";
					};
					"toast": {
						"selectAll": "Please select all required fields";
						"selectStudent": "Please select at least one student";
						"refreshSuccess": "Student facts recalculated successfully";
						"refreshError": "Failed to refresh facts: {{error}}";
					};
				};
				"execute": {
					"title": "Execute Promotion";
					"subtitle": "Confirm and apply student promotions";
					"noData": {
						"message": "No promotion data found. Please start from the evaluation page.";
						"button": "Go to Evaluation";
					};
					"form": {
						"targetClassLabel": "Target Class";
						"targetClassPlaceholder": "Select target class";
						"executeButton": "Execute Promotion";
					};
					"summary": {
						"title": "Promotion Summary";
						"rule": "Rule";
						"sourceClass": "Source Class";
						"targetClass": "Target Class";
						"studentsToPromote": "Students to Promote";
						"studentCount": "{{count}} students";
					};
					"confirmation": {
						"title": "Confirm Promotion";
						"description": "This action will promote {{count}} student(s) from {{source}} to {{target}}. This cannot be undone.";
						"cancel": "Cancel";
						"confirm": "Confirm Promotion";
					};
					"process": {
						"title": "What will happen";
						"step1": "Current enrollments will be marked as completed";
						"step2": "New enrollments will be created in the target class";
						"step3": "Student class references will be updated";
						"step4": "Full audit trail will be recorded";
					};
					"toast": {
						"success": "Promotion applied successfully!";
						"error": "Failed to apply promotion: {{error}}";
						"missingInfo": "Missing required information";
					};
				};
				"history": {
					"title": "Execution History";
					"subtitle": "View past promotion executions and their results";
					"table": {
						"title": "Recent Executions";
						"date": "Date";
						"rule": "Rule";
						"classes": "Source → Target";
						"students": "Students";
						"successRate": "Success Rate";
						"executedBy": "Executed By";
						"actions": "Actions";
						"viewDetails": "Details";
						"user": "User";
					};
					"badges": {
						"evaluated": "{{count}} evaluated";
						"promoted": "{{count}} promoted";
					};
					"emptyState": "No executions found";
					"details": {
						"title": "Execution Details";
						"description": "Detailed results for this promotion execution";
						"stats": {
							"evaluated": "Evaluated";
							"promoted": "Promoted";
							"date": "Date";
							"rule": "Rule Used";
						};
						"studentResults": {
							"title": "Student Results";
							"studentId": "Student ID";
							"status": "Status";
							"average": "Average";
							"credits": "Credits";
							"successRate": "Success Rate";
							"promoted": "Promoted";
							"notPromoted": "Not Promoted";
						};
					};
				};
				"studentCard": {
					"eligible": "Eligible";
					"notEligible": "Not Eligible";
					"metrics": {
						"average": "Average";
						"credits": "Credits";
						"successRate": "Success Rate";
					};
					"progress": {
						"creditCompletion": "Credit Completion";
					};
					"details": {
						"title": "Detailed Metrics";
						"failedCourses": "Failed Courses";
						"requiredCredits": "Required Credits";
					};
					"actions": {
						"select": "Select";
						"deselect": "Deselect";
						"viewDetails": "View Details";
					};
				};
			};
		};
		"dean": {
			"workflows": {
				"title": "Workflow approvals";
				"subtitle": "Approve exams, open enrollment windows, and react to alerts";
				"queue": "Approval queue";
				"queueDesc": "Track submissions that require dean oversight.";
				"submitted": "Submitted";
				"submittedDesc": "Teachers submitted exams for validation.";
				"inReview": "In review";
				"inReviewDesc": "Review weights, schedules, and prerequisites.";
				"locked": "Locked";
				"lockedDesc": "Approved exams are locked and shared with students.";
				"notifications": "Workflow notifications";
				"notificationsDesc": "Alerts propagate automatically to teachers and students.";
				"gradeValidations": "Grade validations";
				"realTime": "Real-time";
				"enrollmentWindows": "Enrollment windows";
				"openClose": "Open/close";
				"alerts": "Attendance alerts";
				"escalations": "Escalations only";
				"empty": "No pending exams.";
				"actions": {
					"validate": "Approve & lock";
				};
				"toast": {
					"validated": "Exam approved";
				};
				"notificationsEmpty": "No notifications";
				"windows": "Enrollment windows";
			};
		};
		"student": {
			"performance": {
				"title": "Performance dashboard";
				"subtitle": "Track your averages, credits, and course progress";
				"cycleBadge": "Cycle: {{value}}";
				"levelBadge": "Level: {{value}}";
				"trendTitle": "Progression";
				"trendSubtitle": "Weighted averages across enrolled courses";
				"creditsProgress": "Credits earned";
				"inProgress": "In progress: {{value}} credits";
				"eligible": "Eligible for next level 🎉";
				"notEligible": "Keep going! You're almost ready for promotion.";
				"ruleNotice": "Evaluated with the promotion rules configured by your faculty.";
				"courseAverages": "Course averages";
				"courseSubtitle": "Latest scores for the active academic year";
				"coursePlaceholder": "Detailed course averages will appear once instructors publish grades for the current session.";
			};
		};
	};
}

export default Resources;
