interface Resources {
	translation: {
		"components": {
			"codedEntitySelect": {
				"placeholder": "Select an item";
				"searchPlaceholder": "Search by code or name...";
				"noResults": "No items found. Try a different search.";
				"resultsCount": "{{count}} results";
				"resultsCount_one": "{{count}} result";
				"resultsCount_other": "{{count}} results";
				"loading": "Loading...";
			};
			"filterBar": {
				"label": "Filters";
				"reset": "Reset";
			};
			"datePicker": {
				"placeholder": "Choose a date";
			};
		};
		"common": {
			"actions": {
				"cancel": "Cancel";
				"create": "Create";
				"update": "Update";
				"delete": "Delete";
				"edit": "Edit";
				"save": "Save";
				"saveChanges": "Save Changes";
				"close": "Close";
				"confirm": "Confirm";
				"search": "Search";
				"saving": "Saving...";
				"reset": "Reset";
				"open": "Open";
				"back": "Back";
				"rename": "Rename (TODO)";
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
			"optional": "Optional";
			"bulkActions": {
				"clear": "Clear (TODO)";
				"confirmDelete": "Confirm Delete (TODO)";
				"deleteError": "Delete Error (TODO)";
				"deleteSuccess": "Delete Success (TODO)";
				"selectAll": "Select All (TODO)";
				"selected": "Selected (TODO)";
			};
			"noResults": "No Results (TODO)";
			"search": "Search (TODO)";
			"select": "Select (TODO)";
		};
		"teacher": {
			"courses": {
				"title": "My Courses";
				"subtitle": "Manage your assigned courses and grades";
				"delegatedBadge": "Delegated";
				"delegatedDashboardBadge": "Delegated";
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
				"subtitle": "Manage courses for programs and faculties";
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
			"exams": {
				"title": "Exam Management";
				"subtitle": "Create and manage course exams";
				"actions": {
					"add": "Add Exam";
					"reviewGrades": "Review grades";
				};
				"filters": {
					"academicYear": "Academic year";
					"search": "Search";
					"searchPlaceholder": "Search exams, classes, or courses...";
					"class": "Class";
					"classPlaceholder": "All classes";
					"semester": "Semester";
					"semesterPlaceholder": "All semesters";
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
					"approved": "Approved";
					"draft": "Draft";
					"rejected": "Rejected";
					"scheduled": "Scheduled";
					"submitted": "Submitted";
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
					"retakeSuccess": "Retake exam created successfully";
					"retakeError": "Could not create retake exam";
				};
				"delete": {
					"title": "Delete Exam";
					"message": "Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades.";
				};
				"pagination": {
					"loadMore": "Load more exams";
				};
				"sessionType": {
					"normal": "Normal";
					"retake": "Retake";
				};
				"scoringPolicy": {
					"replace": "Replace original";
					"best_of": "Keep best grade";
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
				"context": {
					"ue": "Teaching Unit (UE)";
					"ec": "Course (EC)";
				};
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
			"gradeAccessGrants": {
				"title": "Grade Delegation";
				"subtitle": "Grant institution-wide grade entry access to specific users";
				"info": "Users listed here can submit grades for any exam in this institution, regardless of course assignment.";
				"actions": {
					"add": "Add delegate";
					"grant": "Grant access";
					"revoke": "Revoke access";
				};
				"columns": {
					"user": "User";
					"email": "Email";
					"grantedBy": "Granted by";
					"since": "Since";
				};
				"empty": {
					"title": "No delegates";
					"description": "No users have been granted institution-wide grade access yet.";
				};
				"dialog": {
					"title": "Add grade delegate";
					"description": "Select a user to grant institution-wide grade entry access.";
					"selectLabel": "User";
					"selectPlaceholder": "Select a user...";
				};
				"revoke": {
					"title": "Revoke access";
					"message": "This user will no longer be able to submit grades unless they are the assigned teacher or have per-exam delegation.";
				};
				"toast": {
					"granted": "Grade access granted successfully.";
					"revoked": "Grade access revoked.";
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
					"export": "Export grades";
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
					"cycle": "Cycle";
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
					"cycleLabel": "Study cycle";
					"cyclePlaceholder": "Select cycle";
					"selectFacultyFirst": "Select a faculty to load available cycles.";
					"cloneFrom": "Cloner le curriculum depuis (optionnel) (TODO)";
					"cloneFromHint": "Les UE et EC du programme source seront copiés après la création. (TODO)";
					"cloneFromNone": "Aucun (TODO)";
					"cloneFromPlaceholder": "Sélectionner un programme source (TODO)";
					"submitWithClone": "Créer et cloner (TODO)";
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
					"cloneError": "Impossible de cloner le curriculum (TODO)";
					"cloneSuccess": "Curriculum cloné : {{units}} UE et {{courses}} EC copiés (TODO)";
				};
				"delete": {
					"title": "Delete Program";
					"message": "Are you sure you want to delete this program? This action cannot be undone.";
				};
				"options": {
					"cancelEdit": "Cancel edit";
					"delete": "Delete option";
					"edit": "Edit option";
					"editing": "Editing option {{name}}";
					"empty": "No options yet. Add one below.";
					"form": {
						"code": "Code";
						"description": "Description";
						"name": "Option name";
						"submit": "Add option";
						"updateSubmit": "Save changes";
					};
					"manage": "Manage options";
					"subtitle": "Options represent the different tracks/specializations offered within this program.";
					"title": "Manage options for {{value}}";
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
			"faculties": {
				"title": "Faculties";
				"subtitle": "Manage faculties and schools within the institution.";
				"actions": {
					"add": "Add faculty";
				};
				"empty": {
					"title": "No faculties yet";
					"description": "Create your first faculty to start organizing your academic structure.";
				};
				"table": {
					"title": "All faculties";
					"description": "List of all faculties and schools registered in the system.";
					"code": "Code";
					"nameFr": "Name (FR)";
					"nameEn": "Name (EN)";
					"shortName": "Short name";
					"name": "Nom (TODO)";
					"noDescription": "Aucune description (TODO)";
				};
				"form": {
					"createTitle": "Create faculty";
					"editTitle": "Edit faculty";
					"codeLabel": "Code";
					"shortNameLabel": "Short name";
					"nameFrLabel": "Name (French)";
					"nameEnLabel": "Name (English)";
					"descriptionFrLabel": "Description (French)";
					"descriptionEnLabel": "Description (English)";
					"nameFrRequired": "French name is required";
					"nameEnRequired": "English name is required";
					"codeRequired": "Code is required";
					"parentInstitutionLabel": "Parent institution";
					"noParentInstitution": "None (top-level)";
					"submit": "Create";
					"descriptionLabel": "Description (TODO)";
					"descriptionPlaceholder": "Description optionnelle (TODO)";
					"nameLabel": "Nom de la faculté (TODO)";
					"namePlaceholder": "Saisir le nom de la faculté (TODO)";
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
				"validation": {
					"name": "Le nom doit comporter au moins 2 caractères (TODO)";
				};
			};
			"institutions": {
				"title": "Institutions";
				"subtitle": "Manage universities, faculties and schools.";
				"actions": {
					"add": "Add institution";
				};
				"empty": {
					"title": "No institutions yet";
					"description": "Create your first institution to start organizing your academic structure.";
				};
				"table": {
					"code": "Code";
					"type": "Type";
					"nameFr": "Name (FR)";
					"nameEn": "Name (EN)";
					"shortName": "Short name";
				};
				"form": {
					"createTitle": "Create institution";
					"editTitle": "Edit institution";
					"submit": "Create";
				};
				"toast": {
					"createSuccess": "Institution created successfully";
					"createError": "Could not create the institution";
					"updateSuccess": "Institution updated successfully";
					"updateError": "Could not update the institution";
					"deleteSuccess": "Institution deleted successfully";
					"deleteError": "Could not delete the institution";
				};
				"delete": {
					"title": "Delete institution";
					"message": "Are you sure you want to delete this institution? This action cannot be undone.";
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
			"retake": {
				"title": "Retake Eligibility";
				"subtitle": "View and manage students eligible for retake exams";
				"selectExam": "Select an approved exam";
				"selectExamPlaceholder": "Choose an exam to view eligibility";
				"featureDisabled": "Retake feature is currently disabled";
				"eligible": "Eligible";
				"ineligible": "Not Eligible";
				"eligibleCount": "{{count}} eligible";
				"ineligibleCount": "{{count}} not eligible";
				"table": {
					"student": "Student";
					"registrationNumber": "Registration No.";
					"attempt": "Attempt";
					"grade": "Current Grade";
					"status": "Status";
					"reasons": "Reasons";
					"override": "Override";
				};
				"reasons": {
					"NO_GRADE": "No grade recorded";
					"FAILED_EXAM": "Failed exam";
					"PASSED_EXAM": "Passed exam";
					"ATTEMPT_LIMIT_REACHED": "Attempt limit reached";
					"OVERRIDE_FORCE_ELIGIBLE": "Forced eligible (override)";
					"OVERRIDE_FORCE_INELIGIBLE": "Forced ineligible (override)";
				};
				"override": {
					"forceEligible": "Force Eligible";
					"forceIneligible": "Block";
					"remove": "Remove Override";
					"reason": "Override reason";
					"reasonPlaceholder": "Enter reason for override...";
					"confirmTitle": "Confirm Override";
					"confirmMessage": "Are you sure you want to {{action}} this student for retake?";
				};
				"empty": {
					"title": "No students found";
					"description": "Select an approved exam to view student eligibility.";
				};
				"toast": {
					"overrideSuccess": "Override applied successfully";
					"overrideError": "Could not apply override";
					"removeSuccess": "Override removed";
					"removeError": "Could not remove override";
				};
				"actions": {
					"createRetake": "Create Retake Exam";
					"viewEligibility": "View Eligibility";
				};
				"createRetake": {
					"title": "Create Retake Exam";
					"subtitle": "Create a retake session linked to the original exam";
					"parentExam": "Original Exam";
					"date": "Retake Date";
					"scoringPolicy": "Scoring Policy";
					"scoringPolicyHelp": "How to calculate the final grade when retake is completed";
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
			"breadcrumbs": {
				"admin": "Administration";
				"teacher": "Teacher";
				"dean": "Dean";
				"student": "Student";
			};
			"command": {
				"placeholder": "Search a page…";
				"title": "Quick search";
				"description": "Quickly navigate to a page";
				"empty": "No results for \"{{query}}\"";
				"hint": {
					"navigate": "navigate";
					"open": "open";
					"close": "close";
				};
				"groups": {
					"main": "Main";
					"academic": "Academic";
					"tools": "Tools";
				};
			};
			"header": {
				"adminDashboard": "Admin dashboard";
				"teacherDashboard": "Teacher dashboard";
				"notificationsAria": "Open notifications";
				"toggleSidebarAria": "Toggle sidebar";
				"languageSelectAria": "Change language";
				"languageSelectPlaceholder": "Select language";
				"profileMenuAria": "Open profile menu";
				"search": "Search…";
				"language": "Language";
			};
			"sidebar": {
				"search": "Search...";
				"noResults": "No results";
				"admin": {
					"dashboard": "Overview";
					"academicYears": "Academic years";
					"exams": "Exams";
					"users": "Users";
					"classCourses": "Class courses";
					"gradeExport": "Grade export";
					"gradeAccess": "Grade delegation";
					"gradeEntry": "Grade entry";
					"exportTemplates": "Export templates";
					"monitoring": "Monitoring";
					"notifications": "Notifications";
					"batchJobs": "Batch Jobs";
					"students": "Students";
					"studentPromotion": "Student promotion";
					"courses": "Courses";
					"classes": "Classes";
					"faculties": "Institutions";
					"institution": "Institution";
					"studyCycles": "Study cycles";
					"programs": "Programs";
					"teachers": "Teachers";
					"courseAssignments": "Course assignments";
					"teachingUnits": "Teaching units";
					"enrollments": "Enrollments";
					"examTypes": "Exam types";
					"examScheduler": "Exam scheduler";
					"retakeEligibility": "Retake eligibility";
					"rules": "Rule center";
					"registrationNumbers": "Registration numbers";
					"promotionRules": "Promotion rules";
					"deliberations": "Deliberations";
					"deliberationRules": "Deliberation rules";
					"apiKeys": "API Keys";
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
				"grade_editor": "Grade Editor";
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
				"notMember": "You are not a member of this organization. Contact your administrator.";
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
				"subtitle": "Subtitle (TODO)";
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
				"subtitle": "Subtitle (TODO)";
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
					"subtitle": "Subtitle (TODO)";
				};
				"stats": {
					"faculties": "Faculties";
					"programs": "Programs";
					"courses": "Courses";
					"exams": "Exams";
					"students": "Students";
					"teachers": "Teachers";
					"institutions": "Institutions";
				};
				"subtitle": "Subtitle (TODO)";
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
					"attach": "View programs";
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
					"activate": "Activate (TODO)";
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
				"pendingBadge": "{{count}} pending";
				"viewAll": "View all notifications";
				"results": "{{count}} results";
				"selected": "{{count}} selected";
				"deselect": "Deselect";
				"selectAll": "Select all";
				"status": {
					"pending": "Pending";
					"sent": "Sent";
					"failed": "Failed";
				};
				"tabs": {
					"all": "All";
					"pending": "Pending";
					"sent": "Sent";
					"failed": "Failed";
				};
				"timeAgo": {
					"justNow": "Just now";
					"minutes": "{{count}} min ago";
					"hours": "{{count}}h ago";
					"days": "{{count}}d ago";
				};
				"actions": {
					"flush": "Flush pending";
					"ack": "Acknowledge";
				};
				"toast": {
					"flushed": "Pending notifications flushed";
				};
			};
			"apiKeys": {
				"title": "API Keys";
				"subtitle": "Manage API keys for the Diplomation integration";
				"actions": {
					"create": "New API Key";
					"generate": "Generate Key";
					"revoke": "Revoke";
					"editWebhook": "Edit Webhook";
				};
				"table": {
					"label": "Label";
					"status": "Status";
					"webhook": "Webhook URL";
					"lastUsed": "Last used";
					"created": "Created";
				};
				"status": {
					"revoked": "Revoked";
				};
				"form": {
					"createTitle": "Create API Key";
					"label": "Label";
					"labelPlaceholder": "e.g. Diplomation production";
					"webhookUrl": "Webhook URL (optional)";
					"webhookSecret": "Webhook Secret (optional)";
					"webhookSecretPlaceholder": "Leave empty to skip signing";
				};
				"rawKey": {
					"title": "Your new API Key";
					"warning": "Copy this key now — it will never be shown again.";
					"confirm": "I copied it";
				};
				"webhook": {
					"title": "Edit Webhook";
				};
				"revoke": {
					"title": "Revoke API Key";
					"message": "Are you sure you want to revoke this key? It will stop working immediately.";
				};
				"empty": {
					"title": "No API keys";
					"description": "Create an API key to allow Diplomation to fetch data from this system.";
				};
				"toast": {
					"createError": "Failed to create API key";
					"revokeSuccess": "Key revoked";
					"revokeError": "Failed to revoke key";
					"webhookUpdated": "Webhook updated";
					"webhookError": "Failed to update webhook";
					"copied": "Copied to clipboard";
				};
			};
			"batchJobs": {
				"title": "Batch Jobs";
				"subtitle": "Run and monitor mass operations across your institution";
				"fields": {
					"jobType": "Job type";
					"academicYear": "Academic year";
					"class": "Class";
				};
				"actions": {
					"create": "New batch job";
					"run": "Run";
					"cancel": "Cancel";
					"rollback": "Rollback";
					"preview": "Preview";
					"confirm": "Confirm & Run";
				};
				"empty": {
					"title": "No batch jobs yet";
					"description": "Create a batch job to perform mass operations like credit recomputation or student facts refresh.";
				};
				"columns": {
					"type": "Type";
					"status": "Status";
					"progress": "Progress";
					"createdBy": "Created by";
					"createdAt": "Created";
					"actions": "Actions";
				};
				"status": {
					"pending": "Pending";
					"previewed": "Previewed";
					"running": "Running";
					"completed": "Completed";
					"failed": "Failed";
					"cancelled": "Cancelled";
					"stale": "Stale";
					"rolled_back": "Rolled back";
				};
				"types": {
					"creditLedger.recompute": "Credit Ledger Recomputation";
					"studentFacts.refreshClass": "Student Facts Refresh (Class)";
					"academicYear.setup": "Academic Year Setup";
				};
				"preview": {
					"title": "Preview Batch Job";
					"steps": "Steps";
					"totalItems": "Total items";
					"summary": "Summary";
					"confirmRun": "Are you sure you want to execute this batch job? This operation may take several minutes.";
				};
				"detail": {
					"title": "Job Details";
					"steps": "Steps";
					"logs": "Logs";
					"progress": "Progress";
					"error": "Error";
					"result": "Result";
					"noLogs": "No logs yet";
				};
				"toast": {
					"previewSuccess": "Preview generated successfully";
					"runSuccess": "Batch job started";
					"cancelSuccess": "Batch job cancelled";
					"rollbackSuccess": "Rollback initiated";
				};
				"stepStatus": {
					"pending": "Pending";
					"running": "Running";
					"completed": "Completed";
					"failed": "Failed";
					"skipped": "Skipped";
				};
			};
			"academicYears": {
				"title": "Academic Year Management";
				"subtitle": "Create and manage academic years, and choose the active one";
				"actions": {
					"add": "Add academic year";
					"createNextYear": "Create next year";
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
					"createNextYearSuccess": "Next year created: {{name}}";
					"createNextYearError": "Failed to create next year";
				};
				"validation": {
					"startDate": "Start date is required";
					"endDate": "End date is required";
					"name": "Name must be at least 2 characters";
					"order": "End date must be after start date";
				};
				"setup": {
					"button": "Setup from year";
					"title": "Academic year setup";
					"description": "Copy classes and course assignments from a previous year into this one.";
					"sourceYear": "Source year";
					"sourceYearPlaceholder": "Select the year to copy from";
					"previewSummary": "{{classCount}} classes and {{classCourseCount}} course assignments will be copied from \"{{sourceYearName}}\" to \"{{targetYearName}}\".";
					"confirm": "Start setup";
					"success": "Academic year setup started";
					"noClasses": "No classes found in the selected year";
				};
			};
			"classCourses": {
				"title": "Class course assignments";
				"subtitle": "Assign teachers and courses to classes";
				"actions": {
					"assign": "Assign course";
					"assignUe": "Assign UE";
					"autoEnroll": "Enroll students";
				};
				"ueAssign": {
					"title": "Assign a teaching unit";
					"classLabel": "Class";
					"classPlaceholder": "Select a class";
					"ueLabel": "Teaching unit";
					"uePlaceholder": "Select a UE";
					"noUe": "No UE found for this program";
					"hint": "All ECs from this UE will be assigned to the class with their default teacher and coefficient. ECs without a default teacher will be skipped.";
					"submit": "Assign courses";
					"skippedTitle": "Some courses were not assigned";
					"skippedDesc": "The following courses have no default teacher and were skipped:";
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
					"coefficient": "Coef.";
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
					"semesterLabel": "Semester";
					"semesterPlaceholder": "Select a semester";
					"codeLabel": "Code";
					"codePlaceholder": "INF11-CLS24-01";
					"coefficientLabel": "Coefficient";
					"coefficientPlaceholder": "1.00";
					"coefficientHelp": "Weight for weighted average calculation within the Teaching Unit";
					"createSubmit": "Assign course";
					"autoEnrollOnCreate": "Auto-enroll class students after assigning this course";
				};
				"toast": {
					"createSuccess": "Course assignment created successfully";
					"createError": "Could not create the assignment";
					"updateSuccess": "Course assignment updated successfully";
					"updateError": "Could not update the assignment";
					"deleteSuccess": "Course assignment deleted successfully";
					"deleteError": "Could not delete the assignment";
					"bulkAssignSuccess": "{{count}} courses assigned successfully";
					"bulkAssignError": "Error during assignment";
					"autoEnrollSuccess": "{{count}} enrollment(s) created";
					"autoEnrollError": "Failed to auto-enroll students";
				};
				"delete": {
					"title": "Delete course assignment";
					"message": "Deleting this assignment will also remove related exams and grades. Continue?";
				};
				"validation": {
					"class": "Please select a class";
					"course": "Please select a course";
					"teacher": "Please select a teacher";
					"code": "Code is required";
				};
				"autoEnroll": {
					"title": "Auto-enroll students";
					"description": "Automatically enrolls all students of a class in their assigned courses for the selected academic year.";
					"classLabel": "Class";
					"classPlaceholder": "Select a class";
					"yearLabel": "Academic Year";
					"submit": "Enroll students";
				};
			};
			"classes": {
				"title": "Class management";
				"subtitle": "Create classes for each program and academic year";
				"actions": {
					"add": "Add class";
					"bulkGenerate": "Bulk Generate (TODO)";
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
					"optionSemester": "Option / Semester";
					"credits": "Credits";
					"students": "Students";
					"classProgram": "Class Program (TODO)";
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
					"totalCreditsLabel": "Total credits";
					"totalCreditsPlaceholder": "e.g. 30";
					"programCycleSummary": "Cycle : {{value}}";
				};
				"toast": {
					"createSuccess": "Class created successfully";
					"createError": "Could not create the class";
					"updateSuccess": "Class updated successfully";
					"updateError": "Could not update the class";
					"deleteSuccess": "Class deleted successfully";
					"deleteError": "Could not delete the class";
					"bulkGenerateSuccess": "Bulk Generate Success (TODO)";
				};
				"delete": {
					"title": "Delete class";
					"message": "This action cannot be undone and may remove related assignments.";
					"messageWithStudents": "This class has {{count}} enrolled student(s). They will be transferred to another class automatically. This action cannot be undone.";
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
				"filters": {
					"academicYear": "Academic Year";
					"semester": "Semester";
					"title": "Title (TODO)";
				};
				"columns": {
					"registration": "Reg. Number";
					"lastName": "Last Name";
					"firstName": "First Name";
					"birthDate": "Birth Date";
					"gender": "Gender";
				};
				"students": "students";
				"preview": {
					"button": "View student list";
				};
				"previewDescription": "List of students enrolled in this class";
				"searchStudents": "Search students...";
				"noStudents": "No students enrolled in this class";
				"bulkGenerate": {
					"description": "Description (TODO)";
					"submit": "Submit (TODO)";
					"title": "Title (TODO)";
					"yearLabel": "Year Label (TODO)";
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
					"defaultAcademicYearManagedHint": "Manage the active academic year from Academic Years.";
					"registrationFormat": "Registration format";
					"registrationFormatPlaceholder": "Use active format";
					"registrationFormatManagedHint": "Manage the active registration format from Registration Formats.";
					"type": "Type";
					"typeUniversity": "University";
					"typeFaculty": "Faculty/School";
					"typeInstitution": "Institution/Institute";
					"parentInstitution": "Parent Institution (University)";
					"noParentInstitution": "None (Top-level)";
					"supervisingFaculty": "Supervising Faculty/School";
					"noSupervisingFaculty": "None";
					"noDefaultYear": "No Default Year (TODO)";
					"noRegistrationFormat": "No Registration Format (TODO)";
				};
				"sections": {
					"contact": "Contact (TODO)";
					"contactHint": "Contact Hint (TODO)";
					"media": "Media (TODO)";
					"mediaHint": "Media Hint (TODO)";
					"names": "Names (TODO)";
					"namesHint": "Names Hint (TODO)";
					"system": "System configuration";
					"systemHint": "Active academic year and registration number format are managed in their dedicated modules.";
				};
			};
			"studyCycles": {
				"title": "Study cycles";
				"subtitle": "Group programs by cycle and tune credit thresholds per level.";
				"actions": {
					"add": "Add cycle";
					"addLevel": "Add level";
					"update": "Update cycle";
					"updateLevel": "Update level";
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
					"minCredits": "Minimum credits";
					"autoLevelsPreview": "Auto Levels Preview (TODO)";
				};
				"toast": {
					"createSuccess": "Study cycle created";
					"updateSuccess": "Study cycle updated";
					"deleteSuccess": "Study cycle deleted";
					"levelCreate": "Level added";
					"levelUpdate": "Level updated";
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
					"nameEn": "Nom (EN) (TODO)";
					"nameFr": "Nom (FR) (TODO)";
					"shortName": "Nom court (TODO)";
					"title": "Toutes les facultés (TODO)";
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
					"codeRequired": "Le code est requis (TODO)";
					"descriptionEnLabel": "Description (Anglais) (TODO)";
					"descriptionFrLabel": "Description (Français) (TODO)";
					"nameEnLabel": "Nom (Anglais) (TODO)";
					"nameEnRequired": "Le nom en anglais est requis (TODO)";
					"nameFrLabel": "Nom (Français) (TODO)";
					"nameFrRequired": "Le nom en français est requis (TODO)";
					"noParentInstitution": "Aucun (niveau racine) (TODO)";
					"parentInstitutionLabel": "Établissement parent (TODO)";
					"shortNameLabel": "Nom court (TODO)";
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
				"search": "Search programs...";
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
					"options": "Options";
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
					"cloneFrom": "Clone curriculum from (optional)";
					"cloneFromPlaceholder": "Select source program";
					"cloneFromNone": "None";
					"cloneFromHint": "Teaching units and courses from the source program will be copied after creation.";
					"submitWithClone": "Create and clone";
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
					"cloneSuccess": "Curriculum cloned: {{units}} units and {{courses}} courses copied";
					"cloneError": "Could not clone curriculum";
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
					"cycleInfo": "Cycle : {{value}}";
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
					"programCycleSummary": "Cycle : {{value}}";
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
					"submit": "Submit";
					"approve": "Approve";
					"reject": "Reject";
					"reviewGrades": "Grades";
					"retake": "Retake (TODO)";
				};
				"filters": {
					"academicYear": "Academic year";
					"class": "Class";
					"classPlaceholder": "All classes";
					"search": "Search";
					"searchPlaceholder": "Search exams, classes or courses...";
					"semester": "Semester";
					"semesterPlaceholder": "All semesters";
					"dateFrom": "Start date";
					"dateFromPlaceholder": "From...";
					"dateTo": "End date";
					"dateToPlaceholder": "Until...";
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
					"draft": "Draft";
					"scheduled": "Scheduled";
					"submitted": "Submitted";
					"approved": "Approved";
					"rejected": "Rejected";
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
					"submitSuccess": "Exam submitted for approval";
					"submitError": "Could not submit the exam";
					"approveSuccess": "Exam approved successfully";
					"rejectSuccess": "Exam rejected";
					"validateError": "Could not validate the exam";
					"retakeSuccess": "Retake exam created successfully";
					"retakeError": "Could not create retake exam";
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
				"pagination": {
					"loadMore": "Load more exams";
				};
				"scoringPolicy": {
					"best_of": "Keep best grade";
					"replace": "Replace original";
				};
				"sessionType": {
					"normal": "Normal";
					"retake": "Retake";
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
					"description": "All scheduled exams can reuse the following types.";
					"name": "Name";
					"descriptionColumn": "Description";
					"defaultPercentage": "Default weight";
				};
				"empty": "No exam types yet.";
				"form": {
					"createTitle": "Create exam type";
					"editTitle": "Edit exam type";
					"nameLabel": "Name";
					"descriptionLabel": "Description";
					"defaultPercentageLabel": "Default weight (%)";
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
				"actions": {
					"setDefault": "Set as default";
					"edit": "Edit template";
					"rename": "Rename";
					"add": "Add template";
					"delete": "Delete";
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
						"editorTitle": "Template source";
						"editorDescription": "Paste your Handlebars (.hbs) layout with static headers, logos, and styles.";
						"placeholder": "<!-- Paste your template here -->";
						"loadExample": "Load example";
						"exampleLoaded": "Example template loaded successfully";
						"generatePreview": "Generate preview";
						"helpTitle": "Tips";
						"helpHandlebars": "Handlebars helpers like {{formatNumber}} remain available.";
						"helpVariables": "Common variables: program, students, semester, academicYear, signatures.";
						"helpStatic": "Logos and headers should be part of your template (no dynamic builder).";
						"previewTitle": "Preview";
						"previewDescription": "Render the template with sample data.";
						"download": "Download HTML";
						"noPreview": "No preview yet";
						"clickGenerate": "Click \"Generate preview\" after providing template content.";
						"required": "Template content cannot be empty.";
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
				"sessionMode": {
					"label": "Scheduling type";
					"normal": "Exams";
					"normalDescription": "Schedule exams (CC, TP, SN, etc.) for class courses";
					"retake": "Retakes";
					"retakeDescription": "Schedule retakes for approved exams";
				};
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
					"scoringPolicyLabel": "Scoring policy";
					"scoringPolicyPlaceholder": "Select policy";
					"scoringPolicyReplace": "Replace original grade";
					"scoringPolicyBestOf": "Keep best grade";
					"classFilterLabel": "Filter by class";
					"classFilterPlaceholder": "All classes";
					"examTypeFilterLabel": "Filter by exam type";
					"examTypeFilterPlaceholder": "All types";
					"configSection": "Config Section (TODO)";
					"dateRangeSection": "Date Range Section (TODO)";
					"periodSection": "Period Section (TODO)";
				};
				"classes": {
					"title": "Target classes";
					"description": "All classes for the selected year are preselected. Deselect any you wish to exclude.";
					"selectAll": "Select all classes";
				};
				"retakeExams": {
					"title": "Exams eligible for retake";
					"description": "Approved exams without a scheduled retake. Select the exams to schedule retakes for.";
					"selectAll": "Select all exams";
					"noExams": "No approved exams found without retakes for the selected criteria.";
					"examCount": "{{count}} exams";
					"examCount_one": "{{count}} exam";
					"examCount_other": "{{count}} exams";
				};
				"actions": {
					"schedule": "Schedule exams";
					"scheduleRetakes": "Schedule retakes";
					"quickRetakes": "Quick retakes";
				};
				"toast": {
					"success": "Exams scheduled";
					"error": "Unable to schedule exams";
					"retakeSuccess": "Retakes scheduled ({{count}} created)";
					"retakeError": "Unable to schedule retakes";
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
				"filtersCard": {
					"description": "Choose the academic year and class before exporting.";
					"title": "Configuration";
				};
				"filters": {
					"academicYear": "Academic year";
					"academicYearPlaceholder": "Select academic year";
					"class": "Class";
					"classPlaceholder": "Select class";
				};
				"actions": {
					"label": "Export";
					"export": "Export grades";
					"combinedLabel": "Combined grades";
					"combinedExport": "Download combined workbook";
					"examGroup": {
						"filePrefix": "exam-grades";
						"label": "Per-exam exports ({{count}})";
						"scoreColumn": "Score";
						"sheetName": "Scores examen";
					};
					"pvLabel": "Grade report";
					"pvExport": "Download grade report (Excel)";
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
				"pv": {
					"filePrefix": "pv-grades";
					"legend": {
						"headers": {
							"course": "Course";
							"exam": "Exam";
							"weight": "Weight";
						};
						"title": "Legend";
					};
					"sheetName": "Verbal report";
					"stats": {
						"average": "Cohort average";
						"notValidated": "Failed";
						"students": "Students";
						"successRate": "Pass rate";
						"title": "Statistics";
						"validated": "Passed";
					};
					"table": {
						"average": "Average";
						"fullName": "Full name";
						"rank": "Rank";
						"title": "Results table";
					};
				};
			};
			"students": {
				"title": "Student management";
				"actions": {
					"openModal": "Add students";
				};
				"filters": {
					"allClasses": "All classes";
					"searchPlaceholder": "Search by name or registration number";
					"allGenders": "All genders";
					"academicYear": "Academic Year (TODO)";
					"class": "Class (TODO)";
					"search": "Search (TODO)";
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
					"firstName": "First Name";
					"lastName": "Last Name";
					"registrationNumber": "Reg. Number";
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
					"academicYearLabel": "Academic year (for auto-enrollment)";
					"autoEnrollToggle": "Auto-enroll students in courses after import";
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
					"autoEnrollError": "Auto Enroll Error (TODO)";
					"autoEnrollSuccess": "Auto Enroll Success (TODO)";
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
					"administrator": "Administrator";
					"dean": "Dean";
					"teacher": "Teacher";
					"grade_editor": "Grade Editor";
					"staff": "Staff";
					"student": "Student";
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
				"selectSemester": "Select semester";
				"allSemesters": "All semesters";
				"filters": {
					"year": "Academic year";
					"class": "Class";
					"summary": "Snapshot";
					"studentsCount": "Students: {{value}}";
					"cycle": "Cycle: {{value}}";
					"cycleLevel": "Cycle level: {{value}}";
					"option": "Option: {{value}}";
					"window": "Window: {{status}}";
					"semester": "Semester";
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
					"attemptBadge": "Attempt {{value}}";
					"retakeEligible": "Retake eligible";
				};
				"warnings": {
					"title": "Prerequisite warnings";
					"description": "Review these unmet prerequisites before confirming next steps.";
					"mandatory": "Mandatory gap";
					"recommended": "Recommended gap";
					"corequisite": "Co-requisite in progress";
					"courseFallback": "Course {{courseId}}";
					"courseLabel": "{{name}} ({{code}})";
					"appliesTo": "Required for {{course}}";
				};
				"status": {
					"all": "All statuses";
					"active": "Active";
					"pending": "Pending";
					"completed": "Completed";
					"withdrawn": "Withdrawn";
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
					"programCycle": "Cycle : {{value}}";
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
						"coefficient": "Coef.";
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
						"coefficientLabel": "Default coefficient";
						"coefficientPlaceholder": "1.00";
						"coefficientHelp": "Default weight when assigning to a class";
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
				"programCycleSummary": "Cycle : {{value}}";
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
			"retake": {
				"actions": {
					"createRetake": "Create Retake Exam";
					"viewEligibility": "View Eligibility";
				};
				"createRetake": {
					"date": "Retake Date";
					"parentExam": "Exam original";
					"scoringPolicy": "Scoring Policy";
					"scoringPolicyHelp": "How to calculate the final grade when retake is completed";
					"subtitle": "Create a retake session linked to the original exam";
					"title": "Create Retake Exam";
				};
				"eligible": "Eligible";
				"eligibleCount": "{{count}} eligible";
				"empty": {
					"description": "Select an approved exam to view student eligibility.";
					"title": "No students found";
				};
				"featureDisabled": "Retake feature is currently disabled";
				"ineligible": "Not Eligible";
				"ineligibleCount": "{{count}} not eligible";
				"override": {
					"confirmMessage": "Are you sure you want to {{action}} this student for retake?";
					"confirmTitle": "Confirm Override";
					"forceEligible": "Force Eligible";
					"forceIneligible": "Block";
					"reason": "Override reason";
					"reasonPlaceholder": "Enter reason for override...";
					"remove": "Remove Override";
				};
				"reasons": {
					"ATTEMPT_LIMIT_REACHED": "Attempt limit reached";
					"FAILED_EXAM": "Exam échoué";
					"NO_GRADE": "No grade recorded";
					"OVERRIDE_FORCE_ELIGIBLE": "Forced eligible (override)";
					"OVERRIDE_FORCE_INELIGIBLE": "Forced ineligible (override)";
					"PASSED_EXAM": "Exam réussi";
				};
				"selectExam": "Select an approved exam";
				"selectExamPlaceholder": "Choose an exam to view eligibility";
				"subtitle": "View and manage students eligible for retake exams";
				"table": {
					"attempt": "Attempt";
					"grade": "Score actuelle";
					"override": "Override";
					"reasons": "Reasons";
					"registrationNumber": "Registration No.";
					"status": "Status";
					"student": "Student";
				};
				"title": "Retake Eligibility";
				"toast": {
					"overrideError": "Could not apply override";
					"overrideSuccess": "Override appliquée avec succès";
					"removeError": "Could not remove override";
					"removeSuccess": "Override supprimée";
				};
			};
			"deliberations": {
				"title": "Deliberations";
				"subtitle": "Manage jury deliberations for classes";
				"actions": {
					"create": "New deliberation";
					"open": "Open";
					"close": "Close";
					"sign": "Sign";
					"reopen": "Reopen";
					"compute": "Compute results";
					"computing": "Computing...";
					"export": "Export diplomation";
					"exporting": "Exporting...";
					"override": "Override decision";
					"delete": "Delete";
				};
				"columns": {
					"class": "Class";
					"semester": "Semester";
					"year": "Academic year";
					"type": "Type";
					"status": "Status";
					"date": "Date";
					"actions": "Actions";
					"createdAt": "Created";
				};
				"status": {
					"draft": "Draft";
					"open": "Open";
					"closed": "Closed";
					"signed": "Signed";
				};
				"type": {
					"semester": "Semester";
					"annual": "Annual";
					"retake": "Retake";
				};
				"decision": {
					"admitted": "Admitted";
					"compensated": "Compensated";
					"deferred": "Deferred";
					"repeat": "Repeat";
					"excluded": "Excluded";
					"pending": "Pending";
				};
				"mention": {
					"passable": "Passable";
					"assez_bien": "Fairly good";
					"bien": "Good";
					"tres_bien": "Very good";
					"excellent": "Excellent";
				};
				"empty": {
					"title": "No deliberations yet";
					"description": "Create a deliberation to start evaluating student results for a class.";
				};
				"form": {
					"createTitle": "Create a deliberation";
					"editTitle": "Edit deliberation";
					"class": "Class";
					"classPlaceholder": "Select a class";
					"semester": "Semester";
					"semesterPlaceholder": "Leave empty for annual";
					"academicYear": "Academic year";
					"type": "Type";
					"typePlaceholder": "Select a type";
					"deliberationDate": "Deliberation date";
					"president": "President";
					"presidentPlaceholder": "Select a president";
					"juryMembers": "Jury members";
					"quickStart": "Quick start";
					"quickStartHint": "Creates the deliberation, opens it and computes results in one step";
					"quickStartSubmit": "Create & compute";
				};
				"detail": {
					"back": "Back to deliberations";
					"students": "Student results";
					"noResults": "No results computed yet. Open the deliberation and compute results.";
					"rank": "Rank";
					"student": "Student";
					"registrationNumber": "Reg. No.";
					"average": "General avg.";
					"credits": "Credits";
					"creditsFormat": "{{earned}}/{{total}}";
					"decision": "Decision";
					"mention": "Mention";
					"overridden": "Overridden";
					"jury": "Jury composition";
					"president": "President";
					"noPresident": "Not assigned";
					"stats": "Statistics";
					"successRate": "Success rate";
					"classAverage": "Class average";
					"totalStudents": "Total students";
					"lifecycle": "Lifecycle";
					"openedAt": "Opened at";
					"closedAt": "Closed at";
					"signedAt": "Signed at";
					"signedBy": "Signed by";
					"notYet": "Not yet";
				};
				"override": {
					"title": "Override decision";
					"currentDecision": "Current decision";
					"newDecision": "New decision";
					"reason": "Reason";
					"reasonPlaceholder": "Explain why you are overriding this decision...";
				};
				"logs": {
					"title": "Activity log";
					"created": "Deliberation created";
					"opened": "Deliberation opened";
					"computed": "Results computed";
					"override_decision": "Decision overridden";
					"closed": "Deliberation closed";
					"signed": "Deliberation signed";
					"reopened": "Deliberation reopened";
					"exported": "Diplomation exported";
					"promoted": "Students promoted";
				};
				"promote": {
					"button": "Promote admitted";
					"title": "Promote admitted students";
					"description": "{{count}} admitted/compensated students will be enrolled in the target class";
					"targetAcademicYear": "Target academic year";
					"targetAcademicYearPlaceholder": "Select the next academic year";
					"targetClass": "Target class";
					"targetClassPlaceholder": "Select destination class";
					"confirm": "Promote";
					"success": "{{count}} students promoted successfully";
					"noAdmitted": "No admitted students to promote";
				};
				"ueDecision": {
					"ADM": "Acquired";
					"CMP": "Compensated";
					"AJ": "Failed";
					"INC": "Incomplete";
				};
				"toast": {
					"createSuccess": "Deliberation created";
					"updateSuccess": "Deliberation updated";
					"deleteSuccess": "Deliberation deleted";
					"transitionSuccess": "Status updated";
					"computeSuccess": "Results computed successfully";
					"overrideSuccess": "Decision overridden";
					"exportSuccess": "Export ready";
					"error": "An error occurred";
					"initAndComputeSuccess": "Deliberation created and results computed";
				};
				"confirm": {
					"delete": "Are you sure you want to delete this deliberation?";
					"close": "Close this deliberation? Students will no longer be modifiable.";
					"sign": "Sign this deliberation? This marks it as officially validated.";
				};
				"rules": {
					"title": "Deliberation rules";
					"subtitle": "Configure rules that automatically determine student decisions";
					"create": "New rule";
					"name": "Rule name";
					"namePlaceholder": "e.g. Admission if average >= 10";
					"description": "Description";
					"category": "Category";
					"categoryPlaceholder": "Select a category";
					"categories": {
						"admission": "Admission";
						"compensation": "Compensation";
						"deferral": "Deferral";
						"repeat": "Repeat";
						"exclusion": "Exclusion";
						"other": "Other";
					};
					"decision": "Decision produced";
					"priority": "Priority";
					"priorityHelp": "Lower number = evaluated first within the category";
					"program": "Program scope";
					"programPlaceholder": "All programs";
					"cycleLevel": "Cycle level scope";
					"cycleLevelPlaceholder": "All levels";
					"deliberationType": "Deliberation type scope";
					"deliberationTypePlaceholder": "All types";
					"ruleset": "Rule definition (JSON)";
					"rulesetHelp": "json-rules-engine format";
					"active": "Active";
					"inactive": "Inactive";
					"invalidJson": "Invalid JSON ruleset";
					"empty": {
						"title": "No rules configured";
						"description": "Add rules to automatically compute decisions during deliberations.";
					};
					"toast": {
						"createSuccess": "Rule created";
						"updateSuccess": "Rule updated";
						"deleteSuccess": "Rule deleted";
						"error": "An error occurred";
					};
				};
				"filters": {
					"allStatuses": "All statuses";
					"allTypes": "All types";
					"allYears": "All years";
				};
			};
			"gradeAccessGrants": {
				"actions": {
					"add": "Add (TODO)";
					"grant": "Grant (TODO)";
					"revoke": "Revoke (TODO)";
				};
				"columns": {
					"email": "Email (TODO)";
					"grantedBy": "Granted By (TODO)";
					"since": "Since (TODO)";
					"user": "User (TODO)";
				};
				"dialog": {
					"description": "Description (TODO)";
					"selectLabel": "Select Label (TODO)";
					"selectPlaceholder": "Select Placeholder (TODO)";
					"title": "Title (TODO)";
				};
				"empty": {
					"description": "Description (TODO)";
					"title": "Title (TODO)";
				};
				"info": "Info (TODO)";
				"revoke": {
					"message": "Message (TODO)";
					"title": "Title (TODO)";
				};
				"subtitle": "Subtitle (TODO)";
				"title": "Title (TODO)";
				"toast": {
					"granted": "Granted (TODO)";
					"revoked": "Revoked (TODO)";
				};
			};
			"institutions": {
				"actions": {
					"add": "Add (TODO)";
				};
				"delete": {
					"message": "Message (TODO)";
					"title": "Title (TODO)";
				};
				"empty": {
					"description": "Description (TODO)";
					"title": "Title (TODO)";
				};
				"form": {
					"createTitle": "Create Title (TODO)";
					"editTitle": "Edit Title (TODO)";
					"submit": "Submit (TODO)";
				};
				"subtitle": "Subtitle (TODO)";
				"table": {
					"code": "Code (TODO)";
					"nameEn": "Name En (TODO)";
					"nameFr": "Name Fr (TODO)";
					"shortName": "Short Name (TODO)";
					"type": "Type (TODO)";
				};
				"title": "Title (TODO)";
				"toast": {
					"createSuccess": "Create Success (TODO)";
					"deleteSuccess": "Delete Success (TODO)";
					"updateSuccess": "Update Success (TODO)";
					"createError": "Impossible de créer l'institution (TODO)";
					"deleteError": "Impossible de supprimer l'institution (TODO)";
					"updateError": "Impossible de mettre à jour l'institution (TODO)";
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
					"bulkValidate": "Bulk Validate (TODO)";
				};
				"toast": {
					"validated": "Exam approved";
					"bulkValidated": "Bulk Validated (TODO)";
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
		"retakes": {
			"title": "Retake Eligibility";
			"subtitle": "Manage retake exam eligibility for students";
			"badge": {
				"retake": "Retake";
				"normal": "Normal";
			};
			"actions": {
				"createRetake": "Create Retake Exam";
			};
			"form": {
				"title": "Create Retake Exam";
				"parentExamLabel": "Original Exam";
				"nameLabel": "Retake Exam Name (optional)";
				"namePlaceholder": "Leave empty to auto-generate";
				"dateLabel": "Retake Date";
				"scoringPolicyLabel": "Scoring Policy";
				"submit": "Create Retake";
			};
			"scoringPolicy": {
				"replace": "Replace Original";
				"best_of": "Keep Best Grade";
				"replaceDescription": "The retake grade will replace the original grade";
				"best_ofDescription": "The higher grade between original and retake will be used";
			};
			"eligibility": {
				"title": "Eligibility Status";
				"eligible": "Eligible";
				"ineligible": "Not Eligible";
				"forced": "Forced";
				"tabs": {
					"eligible": "Eligible Students";
					"ineligible": "Ineligible Students";
				};
				"reasons": {
					"failed": "Failed the original exam";
					"noGrade": "No grade recorded";
					"limitReached": "Attempt limit reached";
					"passed": "Already passed";
					"forceEligible": "Manually set as eligible";
					"forceIneligible": "Manually set as ineligible";
				};
			};
			"override": {
				"title": "Override Eligibility";
				"forceEligible": "Force Eligible";
				"forceIneligible": "Force Ineligible";
				"clear": "Clear Override";
				"reason": "Reason";
				"reasonPlaceholder": "Enter reason for override...";
			};
			"empty": {
				"title": "No Exam Selected";
				"description": "Select an approved exam to view retake eligibility";
			};
			"toast": {
				"overrideSuccess": "Override applied successfully";
				"overrideError": "Failed to apply override";
			};
		};
		"settings": {
			"menuLabel": "Settings";
			"title": "Account Settings";
			"subtitle": "Manage your profile, password, and sessions";
			"tabs": {
				"account": "Account";
				"profile": "Profile";
				"preferences": "Preferences";
			};
			"account": {
				"title": "Account Details";
				"description": "Update your sign-in identity";
				"save": "Save account";
				"fields": {
					"name": "Display name";
					"email": "Email";
					"image": "Avatar URL";
					"imagePlaceholder": "https://example.com/avatar.png";
				};
				"validation": {
					"name": "Name is required";
					"image": "Please provide a valid URL";
				};
				"toast": {
					"success": "Account updated";
					"error": "Failed to update account";
				};
				"avatar": {
					"change": "Change avatar";
					"uploading": "Uploading...";
					"success": "Avatar updated";
					"error": "Failed to upload avatar";
				};
				"email": {
					"change": "Change email";
					"newLabel": "New email";
					"verificationSent": "A verification link has been sent to your new email";
					"error": "Failed to send verification email";
				};
			};
			"profile": {
				"title": "Profile Information";
				"description": "Update your personal details";
				"save": "Save changes";
				"fields": {
					"firstName": "First name";
					"lastName": "Last name";
					"email": "Email";
					"phone": "Phone";
					"dateOfBirth": "Date of birth";
					"dateOfBirthPlaceholder": "Select a date";
					"placeOfBirth": "Place of birth";
					"gender": "Gender";
					"genderPlaceholder": "Select gender";
					"nationality": "Nationality";
					"nationalityPlaceholder": "Select a country";
					"nationalitySearch": "Search countries...";
				};
				"gender": {
					"male": "Male";
					"female": "Female";
					"other": "Other";
				};
				"validation": {
					"firstName": "First name is required";
					"lastName": "Last name is required";
				};
				"toast": {
					"success": "Profile updated";
					"error": "Failed to update profile";
				};
			};
			"password": {
				"title": "Change Password";
				"description": "Update your login credentials";
				"save": "Update password";
				"fields": {
					"current": "Current password";
					"new": "New password";
					"confirm": "Confirm new password";
					"revokeOthers": "Sign out of all other sessions";
				};
				"validation": {
					"current": "Current password is required";
					"new": "Password must be at least 8 characters";
					"confirm": "Please confirm your password";
					"match": "Passwords do not match";
				};
				"toast": {
					"success": "Password updated";
					"error": "Failed to update password";
				};
			};
			"sessions": {
				"title": "Active Sessions";
				"description": "Manage your active devices";
				"current": "Current session";
				"revoke": "Revoke";
				"revokeAll": "Revoke all other sessions";
				"securityNote": "If you don't recognize a session, revoke it immediately.";
				"empty": "No active sessions found.";
				"unknownTime": "Unknown time";
				"unknownIp": "Unknown IP";
				"toast": {
					"revoked": "Session revoked";
					"revokedAll": "Other sessions revoked";
					"error": "Unable to load sessions";
				};
			};
			"preferences": {
				"title": "Preferences";
				"description": "Customize your experience";
				"languageLabel": "Language";
				"languageHint": "Language changes apply immediately across the app.";
				"languages": {
					"en": "English";
					"fr": "French";
				};
			};
		};
		"help": {
			"title": "Help";
			"openButton": "Help";
			"footer": "OverBrand · Grades Manager";
			"workflow": {
				"title": "Setup progression";
				"step": "Step";
				"next": "Next step";
				"done": "Setup complete";
			};
		};
	};
}

export default Resources;
