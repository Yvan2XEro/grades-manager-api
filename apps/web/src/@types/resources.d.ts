interface Resources {
	translation: {
		components: {
			codedEntitySelect: {
				placeholder: "Select an item";
				searchPlaceholder: "Search by code or name...";
				noResults: "No items found. Try a different search.";
				resultsCount: "{{count}} results";
				resultsCount_one: "{{count}} result";
				resultsCount_other: "{{count}} results";
				loading: "Loading...";
			};
			filterBar: {
				label: "Filters";
				reset: "Reset";
				activeCount_one: "{{count}} active";
				activeCount_other: "{{count}} active";
			};
			datePicker: {
				placeholder: "Choose a date";
			};
			gradingProgress: {
				missing_one: "{{count}} missing";
				missing_other: "{{count}} missing";
			};
			weeklyGrid: {
				days: {
					mon: "Mon";
					tue: "Tue";
					wed: "Wed";
					thu: "Thu";
					fri: "Fri";
					sat: "Sat";
					sun: "Sun";
				};
			};
			loadingScreen: {
				label: "Loading";
			};
		};
		common: {
			actions: {
				cancel: "Cancel";
				create: "Create";
				update: "Update";
				delete: "Delete";
				edit: "Edit";
				save: "Save";
				saveChanges: "Save Changes";
				close: "Close";
				confirm: "Confirm";
				search: "Search";
				saving: "Saving...";
				reset: "Reset";
				open: "Open";
				back: "Back";
				rename: "Rename";
				deselectAll: "Deselect all";
				selectAll: "Select all";
				clear: "Clear";
				clearFilters: "Clear filters";
				followJob: "Follow the job";
				apply: "Apply";
			};
			fields: {
				email: "Email";
				password: "Password";
				confirmPassword: "Confirm Password";
				firstName: "First Name";
				lastName: "Last Name";
				name: "Name";
				role: "Role";
				status: "Status";
			};
			status: {
				active: "Active";
				inactive: "Inactive";
			};
			table: {
				actions: "Actions";
			};
			labels: {
				notAvailable: "Not available";
			};
			clipboard: {
				copied: "Copied to clipboard";
				copiedValue: "{{value}} copied";
				failed: "Unable to copy value";
				copyAria: "Copy {{value}}";
			};
			pagination: {
				next: "Next";
				previous: "Previous";
				page: "Page";
				showing: "Showing {{start}}–{{end}} of {{total}}";
				perPage: "{{count}} / page";
			};
			errors: {
				unknown: "Unknown error";
			};
			gender: {
				male: "M";
				female: "F";
			};
			invalidDate: "Invalid date";
			loading: "Loading...";
			optional: "Optional";
			bulkActions: {
				clear: "Clear selection";
				confirmDelete: "Confirm deletion";
				deleteError: "Could not delete selected items";
				deleteSuccess: "Selected items deleted successfully";
				selectAll: "Select all";
				selected: "{{count}} selected";
				confirmDeleteTitle: "Delete selected items?";
			};
			noResults: "No results";
			search: "Search";
			select: "Select";
			loadMore: "Load more";
			cancel: "Cancel";
			all: "All";
			allYears: "All years";
			noData: "No data";
			selectAll: "Select all";
			selectedCount: "{{count}} selected";
			active: "Active";
			inactive: "Inactive";
			created: "Created";
			saved: "Saved";
			deleted: "Deleted";
			save: "Save";
			delete: "Delete";
			none: "None";
			confirmDelete: "Confirm deletion";
			create: "Create";
			yes: "Yes";
			no: "No";
			add: "Add";
			error: "Error";
			hide: "Hide";
			total: "Total";
			confirmDeleteDesc: "This action cannot be undone.";
			clearFilters: "Clear filters";
			back: "Back";
			done: "Done";
			filters: {
				all: "All";
				allStatuses: "All statuses";
			};
			notFound: "Not found";
			saving: "Saving…";
			suspended: "Suspended";
			documentPreview: {
				frameTitle: "Document preview";
			};
			cascadeDelete: {
				title: "Delete {{name}}";
				willDelete: "This action will permanently delete:";
				irreversible: "This action cannot be undone.";
				deleting: "Deleting...";
				deleteAll: "Delete all";
			};
			logo: "Logo";
			a11y: {
				breadcrumb: "Breadcrumb";
				more: "More";
				close: "Close";
				pagination: "Pagination";
				previousPage: "Go to previous page";
				nextPage: "Go to next page";
				previous: "Previous";
				next: "Next";
				morePages: "More pages";
				loading: "Loading";
				hidePassword: "Hide password";
				showPassword: "Show password";
				selectRow: "Select row";
				clearSearch: "Clear search";
			};
			itemCount_one: "{{count}} item";
			itemCount_other: "{{count}} items";
			validation: {
				required: "Required";
			};
		};
		teacher: {
			courses: {
				title: "My Courses";
				subtitle: "Manage your assigned courses and grades";
				delegatedBadge: "Delegated";
				delegatedDashboardBadge: "Delegated";
				actions: {
					viewGrades: "View Grades";
					fastEntry: "Fast Entry";
				};
				empty: {
					title: "No courses assigned";
					description: "You don't have any courses assigned for the active academic year.";
				};
				filters: {
					allClasses: "All Classes";
					allDelegations: "All Delegations";
					allExamTypes: "All exam types";
					allPrograms: "All Programs";
					allSemesters: "All Semesters";
					allStatuses: "All Statuses";
					allTeachers: "All Teachers";
					class: "Class";
					delegated: "Delegated";
					delegation: "Delegation";
					examType: "Exam Type";
					mine: "Mine";
					program: "Program";
					semester: "Semester";
					status: "Status";
					teacher: "Teacher";
				};
				noMatch: "No matching course";
				noMatchHint: "Try another search or clear the filters.";
				searchPlaceholder: "Search for a course or a class…";
				summary: "Summary";
				noExams: "No evaluation yet for this course. Evaluations (CC, exam) are scheduled by the registrar: once created, they appear here for grade entry.";
				hubTitle: "My courses & grades";
				hubDescription: "Grade entry, locking and submission per course";
				noSearchMatch: "No course matches your search.";
				examRow: {
					submit: "Submit";
					enter: "Enter grades";
					view: "View";
					average: "avg {{value}}";
				};
				toolbar: {
					actionRequired: "Action required";
					sort: {
						relevance: "Relevance";
						name: "Name A→Z";
						class: "Class";
					};
				};
			};
			"courses.manage": {
				title: "Course Management";
				subtitle: "Manage courses for programs and faculties";
				actions: {
					add: "Add Course";
				};
				table: {
					code: "Code";
					name: "Name";
					program: "Program";
					hours: "Hours";
					teacher: "Default Teacher";
					cycleInfo: "Cycle: {{value}}";
				};
				form: {
					createTitle: "Add New Course";
					editTitle: "Edit Course";
					nameLabel: "Course name";
					namePlaceholder: "Enter course name";
					codeLabel: "Course code";
					codePlaceholder: "INF111";
					hoursLabel: "Hours";
					hoursPlaceholder: "Enter hours";
					programLabel: "Program";
					programPlaceholder: "Select a program";
					programCycleSummary: "Cycle: {{value}}";
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
					hours: "Hours must be at least 1";
					code: "Code is required";
					program: "Please select a program";
					teacher: "Please select a teacher";
				};
				delete: {
					title: "Delete Course";
					message: "Are you sure you want to delete this course? This action cannot be undone.";
				};
			};
			exams: {
				title: "Exam Management";
				subtitle: "Create and manage course exams";
				actions: {
					add: "Add Exam";
					reviewGrades: "Review grades";
				};
				filters: {
					academicYear: "Academic year";
					search: "Search";
					searchPlaceholder: "Search exams, classes, or courses...";
					class: "Class";
					classPlaceholder: "All classes";
					semester: "Semester";
					semesterPlaceholder: "All semesters";
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
					approved: "Approved";
					draft: "Draft";
					rejected: "Rejected";
					scheduled: "Scheduled";
					submitted: "Submitted";
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
					retakeSuccess: "Retake exam created successfully";
					retakeError: "Could not create retake exam";
					resubmitError: "Resubmit Error";
					resubmitSuccess: "Resubmit Success";
				};
				delete: {
					title: "Delete Exam";
					message: "Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades.";
				};
				pagination: {
					loadMore: "Load more exams";
				};
				sessionType: {
					normal: "Normal";
					retake: "Retake";
				};
				scoringPolicy: {
					replace: "Replace original";
					best_of: "Keep best grade";
				};
				rejection: {
					fixGrades: "Fix Grades";
					label: "Label";
					resubmit: "Resubmit";
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
				context: {
					ue: "Teaching Unit (UE)";
					ec: "Course (EC)";
				};
				selectCourse: {
					label: "Select class course";
					empty: "Choose a class course";
					emptyState: "No class courses assigned. Contact an administrator.";
				};
				selectExam: {
					label: "Select exam";
					empty: "No exams available";
					lockedTag: "Locked";
					prompt: "Select an exam to start entering grades.";
				};
				lockedChip: "Grades locked";
				actions: {
					lock: "Lock grades";
					save: "Save grades";
					saving: "Saving...";
					exportTemplate: "Export Template";
					importGrades: "Import Grades";
					submit: "Submit for approval";
					resubmit: "Submit again";
				};
				info: {
					title: "Grading information";
					description: "Grades are out of 20 (12.5 or 12,5). Save, then submit them for approval: you can correct them until the dean approves.";
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
					range: "Enter a grade between 0 and 20 (e.g. 12.5)";
				};
				emptyStudents: {
					title: "No students found";
					description: "There are no students enrolled in this class.";
				};
				readOnly: {
					title: "Read-only mode";
					description: "You can view this exam but cannot modify grades.";
				};
				delegates: {
					title: "Delegated editors";
					description: "Manage who can edit grades for this exam.";
					add: "Add editor";
					dialogTitle: "Assign delegated editor";
					dialogDescription: "Grant access to another teacher or staff member.";
					selectLabel: "Editor profile";
					selectPlaceholder: "Select a team member";
					unknownEmail: "No email";
					empty: "No delegated editors yet.";
					grantedAt: "Granted on {{date}}";
					grantedBy: "Granted by {{name}}";
					revoke: "Revoke";
					revokeSelf: "Leave delegation";
					manageRestriction: "Only the course owner can manage other delegates.";
					assignSuccess: "Delegate added successfully.";
					assignError: "Unable to add delegate.";
					revokeSuccess: "Delegate removed successfully.";
					revokeError: "Unable to remove delegate.";
					readOnlyToast: "You cannot edit this exam.";
				};
				toast: {
					fetchCourseError: "Could not load course information";
					fetchGradesError: "Could not load grades";
					saveSuccess: "Grades saved successfully";
					saveError: "Could not save grades";
					lockSuccess: "Exam locked successfully. Grades can no longer be modified.";
					lockError: "Could not lock the exam";
					exportError: "Please select an exam with students";
					exportSuccess: "Template exported successfully";
					importSuccess: "{{count}} grades imported and saved";
					importError: "Failed to import grades";
					noChanges: "No change to save";
					importPartial: "{{count}} grades imported and saved, {{skipped}} rows skipped";
					importEmpty: "No grade found in this file. Use the template exported from this page.";
					importMore: "… and {{count}} more";
					importSkip: {
						unknownStudent: "Row {{row}}: {{label}} is not in this class";
						invalidScore: 'Row {{row}}: {{label}}, "{{value}}" is not a grade between 0 and 20';
					};
					submitSuccess: "Grades sent to the dean for approval";
					submitError: "Could not submit the grades";
				};
				template: {
					registrationNumber: "Registration Number";
					firstName: "First Name";
					lastName: "Last Name";
					score: "Score";
					sheetName: "Grades";
					filePrefix: "grades";
				};
				awaitingApproval: "Awaiting the dean's approval";
				submitConfirm: {
					title: "Submit the grades for approval?";
					message: "The dean will review them. Until they are approved, you can still correct a grade; once approved, they are final.";
					missing_one: "{{count}} student has no grade yet.";
					missing_other: "{{count}} students have no grade yet.";
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
				error: "Could not load alerts";
			};
			timetable: {
				title: "Timetable";
				subtitle: "Manage weekly course sessions";
				newSession: "New session";
				editSession: "Edit session";
				create: "Create";
				save: "Save";
				cancel: "Cancel";
				delete: "Delete";
				day: "Day";
				startTime: "Start";
				endTime: "End";
				room: "Room";
				noRoom: "No room";
				validity: "Validity";
				validFrom: "Valid from";
				validUntil: "Valid until";
				export: "Export";
				import: {
					title: "Import Timetable";
					description: "Download the template to get a pre-filled list of courses. Fill in dayOfWeek (mon–sun), startTime/endTime (HH:MM), optional room data, and optional validFrom/validUntil dates. Use update mode when rows contain existing session IDs.";
					mode: "Import mode";
					createMode: "Create new sessions";
					updateMode: "Update existing sessions";
					downloadTemplate: "Download CSV template";
					file: "CSV file";
					preview: "Preview";
					execute: "Import {{count}} session(s)";
					skipDuplicates: "Skip existing sessions";
					validRows: "valid row(s)";
					errorRows: "error(s)";
					success: "{{count}} session(s) created, {{updated}} updated, {{skipped}} skipped";
					row: "Row";
					error: "Error";
					schedule: "Time";
					noErrors: "No errors";
				};
				filterByYear: "Filter by year";
				filterByCourse: "Filter by course";
				filterByClass: "Filter by class";
				filterByTeacher: "Filter by teacher";
				allClasses: "All classes";
				allTeachers: "All teachers";
				allCourses: "All courses";
				conflicts: {
					room: "Room conflict";
					teacher: "Teacher conflict";
					class: "Class conflict";
				};
				warnings: {
					missingTeacher: "This class course has no teacher assigned. Please assign a teacher before scheduling.";
					missingSessions: "{{count}} session(s) have no room assigned.";
					noRoomSelected: "No room selected — this session will be saved without a room assignment.";
				};
				toast: {
					created: "Session created";
					updated: "Session updated";
					deleted: "Session deleted";
				};
				myTitle: "My Timetable";
				mySubtitle: "Your weekly course sessions";
				studentSubtitle: "Your weekly classes";
				studentNoSessionsDesc: "Your weekly classes will appear here once scheduled.";
				noSessions: "No sessions";
				noSessionsDesc: "No sessions scheduled for this period.";
				selectCourse: "Select a course";
				selectCourseDesc: "Choose an academic year and a course to view and manage its sessions.";
				filterBySemester: "Semester";
				importCsv: "Import CSV";
				capacityWarning: "Room capacity warning: {{classSize}} students for {{roomCapacity}} seats";
				course: "Course";
				class: "Class";
				days: {
					mon: "Monday";
					tue: "Tuesday";
					wed: "Wednesday";
					thu: "Thursday";
					fri: "Friday";
					sat: "Saturday";
					sun: "Sunday";
				};
				errors: {
					endBeforeStart: "End time must be after start time.";
					timeFormat: "Time must be in HH:MM format";
					validUntilBeforeValidFrom: "Valid until must be after valid from";
				};
				importDialog: {
					description: "Description";
					errorRows: "Error Rows";
					execute: "Execute";
					noErrors: "No Errors";
					preview: "Preview";
					skipDuplicates: "Skip Duplicates";
					success: "Success";
					title: "Title";
					validRows: "Valid Rows";
				};
				confirmDelete: "Delete this session?";
				confirmDeleteDesc: "This action cannot be undone.";
				allYears: "All years";
				print: "Print";
				copyFromYear: "Copy from another year";
				sessionCount_one: "{{count}} session";
				sessionCount_other: "{{count}} sessions";
				printDoc: {
					classCount_one: "{{count}} class";
					classCount_other: "{{count}} classes";
					generatedOn: "Generated on {{date}}";
					time: "Time";
				};
			};
			rooms: {
				title: "Rooms";
				subtitle: "Manage classrooms and lecture halls";
				newRoom: "New room";
				editRoom: "Edit room";
				create: "Create";
				save: "Save";
				cancel: "Cancel";
				delete: "Delete";
				code: "Code";
				name: "Name";
				capacity: "Capacity";
				building: "Building";
				campus: "Campus";
				isActive: "Active";
				active: "Active";
				inactive: "Inactive";
				seats: "seats";
				toast: {
					created: "Room created";
					updated: "Room updated";
					deleted: "Room deleted";
				};
				description: "Manage rooms and lecture halls per institution";
				add: "New room";
				edit: "Edit room";
				empty: {
					title: "No rooms";
					description: "Add a room so it can be assigned to course sessions.";
				};
				fields: {
					code: "Code";
					name: "Name";
					capacity: "Capacity";
					building: "Building";
					campus: "Campus";
				};
				placeholders: {
					roomName: "Lecture Hall A";
					building: "Main building";
					campus: "Central campus";
				};
			};
			attendanceManagement: {
				title: "Attendance";
				subtitle: "Track presence per session";
				newSession: "New session";
				createSession: "Create session";
				deleteSession: "Delete session";
				bulkMarkPresent: "Mark all present";
				bulkMarkAbsent: "Mark all absent";
				bulkMarkLate: "Mark all late";
				excuse: "Excuse absence";
				excuseReason: "Reason";
				submit: "Submit";
				cancel: "Cancel";
				filterByYear: "Filter by year";
				filterByCourse: "Filter by course";
				noSession: "No session selected";
				status: {
					present: "Present";
					absent: "Absent";
					late: "Late";
					excused: "Excused";
				};
				toast: {
					sessionCreated: "Session created";
					sessionDeleted: "Session deleted";
					marked: "Marked";
					excused: "Absence excused";
					documentUploaded: "Justification document uploaded";
				};
				course: "Course";
				student: "Student";
				presentCount: "{{present}}/{{total}} present";
				excuseCategory: "Category";
				excuseCategoryPlaceholder: "Select a category";
				excusePlaceholder: "Illness, family event…";
				justificationDocument: "Justification document";
				justificationDocumentPlaceholder: "Paste a document URL or upload a file";
				uploadingDocument: "Uploading document…";
				submitExcuse: "Submit excuse";
				marked: "Mark all";
				absentOrLate: "Absent / Late";
				timetableSlot: "Timetable slot";
				timetableSlotPlaceholder: "Select a slot";
				noSlots: "No timetable slots configured for this course";
				isExceptional: "Unscheduled session";
				isExceptionalHint: "Check if this session is not in the timetable";
			};
			attendanceRates: {
				title: "Attendance rates";
				subtitle: "Overview of attendance rates across your courses";
				selectYear: "Select an academic year";
				selectYearPrompt: "Select an academic year to view attendance rates.";
				empty: "No courses found for this academic year.";
				columns: {
					course: "Course";
					class: "Class";
					sessions: "Sessions";
					threshold: "Threshold";
					belowThreshold: "Below threshold";
					excusedCountsAsAbsent: "Excused = absent";
				};
			};
			gradeAccessGrants: {
				title: "Grade Delegation";
				subtitle: "Grant institution-wide grade entry access to specific users";
				info: "Users listed here can submit grades for any exam in this institution, regardless of course assignment.";
				actions: {
					add: "Add delegate";
					grant: "Grant access";
					revoke: "Revoke access";
				};
				columns: {
					user: "User";
					email: "Email";
					grantedBy: "Granted by";
					since: "Since";
				};
				empty: {
					title: "No delegates";
					description: "No users have been granted institution-wide grade access yet.";
				};
				dialog: {
					title: "Add grade delegate";
					description: "Select a user to grant institution-wide grade entry access.";
					selectLabel: "User";
					selectPlaceholder: "Select a user...";
				};
				revoke: {
					title: "Revoke access";
					message: "This user will no longer be able to submit grades unless they are the assigned teacher or have per-exam delegation.";
				};
				toast: {
					granted: "Grade access granted successfully.";
					revoked: "Grade access revoked.";
				};
			};
			gradeExport: {
				title: "Grade Export";
				subtitle: "Export student grades by class and course";
				filtersCard: {
					title: "Configuration";
					description: "Choose the academic year and class before exporting.";
				};
				filters: {
					academicYear: "Academic year";
					academicYearPlaceholder: "Select academic year";
					class: "Class";
					classPlaceholder: "Select class";
				};
				actions: {
					label: "Export";
					combinedLabel: "Combined grades";
					combinedExport: "Download combined workbook";
					pvLabel: "Verbal report";
					pvExport: "Download PV (Excel)";
					examGroup: {
						label: "Per-exam exports ({{count}})";
						sheetName: "Exam grades";
						filePrefix: "exam-grades";
						scoreColumn: "Score";
					};
					export: "Export grades";
				};
				pv: {
					sheetName: "Verbal report";
					filePrefix: "pv-grades";
					table: {
						title: "Results table";
						rank: "Rank";
						fullName: "Full name";
						average: "Average";
					};
					stats: {
						title: "Statistics";
						students: "Students";
						validated: "Passed";
						notValidated: "Failed";
						successRate: "Pass rate";
						average: "Cohort average";
					};
					legend: {
						title: "Legend";
						headers: {
							course: "Course";
							exam: "Exam";
							weight: "Weight";
						};
					};
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
					code: "Code";
					name: "Name";
					faculty: "Faculty";
					description: "Description";
					noDescription: "No description";
					cycle: "Cycle";
				};
				form: {
					createTitle: "Add New Program";
					editTitle: "Edit Program";
					nameLabel: "Program name";
					namePlaceholder: "Enter program name";
					codeLabel: "Program code";
					codePlaceholder: "INF-LIC";
					facultyLabel: "Faculty";
					facultyPlaceholder: "Select a faculty";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Optional description (objectives, focus)";
					submit: "Save program";
					cycleLabel: "Study cycle";
					cyclePlaceholder: "Select cycle";
					selectFacultyFirst: "Select a faculty to load available cycles.";
					cloneFrom: "Clone curriculum from (optional)";
					cloneFromHint: "Teaching units and courses from the source program will be copied after creation.";
					cloneFromNone: "None";
					cloneFromPlaceholder: "Select source program";
					submitWithClone: "Create and clone";
				};
				validation: {
					name: "Name must be at least 2 characters";
					code: "Code is required";
					faculty: "Please select a faculty";
					cycle: "Please select a study cycle";
				};
				toast: {
					createSuccess: "Program created successfully";
					createError: "Could not create the program";
					updateSuccess: "Program updated successfully";
					updateError: "Could not update the program";
					deleteSuccess: "Program deleted successfully";
					deleteError: "Could not delete the program";
					cloneError: "Could not clone curriculum";
					cloneSuccess: "Curriculum cloned: {{units}} units and {{courses}} courses copied";
				};
				delete: {
					title: "Delete Program";
					message: "Are you sure you want to delete this program? This action cannot be undone.";
				};
				options: {
					cancelEdit: "Cancel edit";
					delete: "Delete option";
					edit: "Edit option";
					editing: "Editing option {{name}}";
					empty: "No options yet. Add one below.";
					form: {
						code: "Code";
						description: "Description";
						name: "Option name";
						submit: "Add option";
						updateSubmit: "Save changes";
					};
					manage: "Manage options";
					subtitle: "Options represent the different tracks/specializations offered within this program.";
					title: "Manage options for {{value}}";
					toast: {
						create: "Option added";
						createError: "Could not add option";
						delete: "Option deleted";
						deleteError: "Could not delete option";
						update: "Option updated";
						updateError: "Could not update option";
					};
				};
			};
			faculties: {
				title: "Faculties";
				subtitle: "Manage faculties and schools within the institution.";
				actions: {
					add: "Add faculty";
				};
				empty: {
					title: "No faculties yet";
					description: "Create your first faculty to start organizing your academic structure.";
				};
				table: {
					title: "All faculties";
					description: "List of all faculties and schools registered in the system.";
					code: "Code";
					nameFr: "Name (FR)";
					nameEn: "Name (EN)";
					shortName: "Short name";
					name: "Name";
					noDescription: "No description";
				};
				form: {
					createTitle: "Create faculty";
					editTitle: "Edit faculty";
					codeLabel: "Code";
					shortNameLabel: "Short name";
					nameFrLabel: "Name (French)";
					nameEnLabel: "Name (English)";
					descriptionFrLabel: "Description (French)";
					descriptionEnLabel: "Description (English)";
					nameFrRequired: "French name is required";
					nameEnRequired: "English name is required";
					codeRequired: "Code is required";
					parentInstitutionLabel: "Parent institution";
					noParentInstitution: "None (top-level)";
					submit: "Create";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Optional description";
					nameLabel: "Faculty name";
					namePlaceholder: "Enter faculty name";
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
				validation: {
					name: "Name must be at least 2 characters";
				};
			};
			institutions: {
				title: "Institutions";
				subtitle: "Manage universities, faculties and schools.";
				actions: {
					add: "Add institution";
				};
				empty: {
					title: "No institutions yet";
					description: "Create your first institution to start organizing your academic structure.";
				};
				table: {
					code: "Code";
					type: "Type";
					nameFr: "Name (FR)";
					nameEn: "Name (EN)";
					shortName: "Short name";
				};
				form: {
					createTitle: "Create institution";
					editTitle: "Edit institution";
					submit: "Create";
				};
				toast: {
					createSuccess: "Institution created successfully";
					createError: "Could not create the institution";
					updateSuccess: "Institution updated successfully";
					updateError: "Could not update the institution";
					deleteSuccess: "Institution deleted successfully";
					deleteError: "Could not delete the institution";
				};
				delete: {
					title: "Delete institution";
					message: "Are you sure you want to delete this institution? This action cannot be undone.";
				};
			};
			classCourses: {
				title: "Course Assignments";
				subtitle: "Manage course assignments for classes";
				validation: {
					class: "Please select a class";
					course: "Please select a course";
					teacher: "Please select a teacher";
					code: "Please provide a code";
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
					code: "Code";
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
					semesterLabel: "Semester";
					semesterPlaceholder: "Select a semester";
					codeLabel: "Code";
					codePlaceholder: "INF11-CLS24-01";
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
					credits: "credits";
					decision: "decision";
					mention: "mention";
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
				decision: {
					noData: "noData";
				};
				lastLevel: "lastLevel";
				emptyState: {
					title: "title";
					description: "description";
				};
				confirm: {
					title: "Promote selected students?";
					message: "message";
				};
			};
			retake: {
				title: "Retake Eligibility";
				subtitle: "View and manage students eligible for retake exams";
				selectExam: "Select an approved exam";
				selectExamPlaceholder: "Choose an exam to view eligibility";
				featureDisabled: "Retake feature is currently disabled";
				eligible: "Eligible";
				ineligible: "Not Eligible";
				eligibleCount: "{{count}} eligible";
				ineligibleCount: "{{count}} not eligible";
				table: {
					student: "Student";
					registrationNumber: "Registration No.";
					attempt: "Attempt";
					grade: "Current Grade";
					status: "Status";
					reasons: "Reasons";
					override: "Override";
				};
				reasons: {
					NO_GRADE: "No grade recorded";
					FAILED_EXAM: "Failed exam";
					PASSED_EXAM: "Passed exam";
					ATTEMPT_LIMIT_REACHED: "Attempt limit reached";
					OVERRIDE_FORCE_ELIGIBLE: "Forced eligible (override)";
					OVERRIDE_FORCE_INELIGIBLE: "Forced ineligible (override)";
				};
				override: {
					forceEligible: "Force Eligible";
					forceIneligible: "Block";
					remove: "Remove Override";
					reason: "Override reason";
					reasonPlaceholder: "Enter reason for override...";
					confirmTitle: "Confirm Override";
					confirmMessage: "Are you sure you want to {{action}} this student for retake?";
				};
				empty: {
					title: "No students found";
					description: "Select an approved exam to view student eligibility.";
				};
				toast: {
					overrideSuccess: "Override applied successfully";
					overrideError: "Could not apply override";
					removeSuccess: "Override removed";
					removeError: "Could not remove override";
				};
				actions: {
					createRetake: "Create Retake Exam";
					viewEligibility: "View Eligibility";
				};
				createRetake: {
					title: "Create Retake Exam";
					subtitle: "Create a retake session linked to the original exam";
					parentExam: "Original Exam";
					date: "Retake Date";
					scoringPolicy: "Scoring Policy";
					scoringPolicyHelp: "How to calculate the final grade when retake is completed";
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
				rejectionReason: "Rejection reason";
			};
			spreadsheet: {
				errors: "errors";
				filled: "filled";
				invalidScore: "Score must be between 0 and 20";
				legend: {
					hint: "Tab/Enter/arrows to move. Clear a cell to delete the grade. Saved automatically when leaving the cell.";
					title: "Fast entry — autosave";
					readOnlyTitle: "Read only — grades are locked";
					readOnlyHint: "These evaluations are approved and locked. To correct a grade, ask the registrar or the dean to reopen the evaluation.";
				};
				matricule: "Registration no.";
				noCourse: "No course selected";
				noExams: "No evaluation for this course yet. The registrar schedules evaluations; they will appear here once created.";
				noStudents: "No student matches the search.";
				pending: "pending";
				perExamMode: "Per-exam mode";
				searchStudent: "Search for a student…";
				studentCol: "Student";
				lockedExam: "Locked: approved evaluation, grades can no longer be edited";
			};
		};
		navigation: {
			breadcrumbs: {
				admin: "Administration";
				teacher: "Teacher";
				dean: "Dean";
				student: "Student";
				configuration: "Configuration";
				examList: "Exams";
				examTypes: "Exam types";
				participation: "Participation";
				gradeExport: "Grade export";
				gradeAccess: "Grade access";
				retakes: "Retakes";
				templates: "Templates";
				classDocuments: "Class documents";
				accounts: "Accounts";
				apiKeys: "API Keys";
				deliberations: "Deliberations";
				promotion: "Year transition";
				results: "Results";
				jury: "Jury";
				activity: "Activity";
				overview: "Overview";
				faculties: "Faculties";
				cycles: "Cycles";
				assignments: "Assignments";
				regNumbers: "Registration numbers";
				gradeScale: "Grade scale";
				schedule: "Schedule";
				rooms: "Rooms";
				attendanceRates: "Attendance rates";
				feeStructures: "Fee structures";
				feeGating: "Fee gating";
				profiles: "Profiles";
				identity: "Identity";
				finances: "Finances";
				details: "Details";
				logos: "Logos";
				authorization: "Authorization";
				instances: "Instances";
				contact: "Contact";
				importLegacy: "Advanced import";
				importCycles: "Cycles & levels";
				importPrograms: "Programmes & options";
				importCurriculum: "UE & EC";
				setup: "Setup & data import";
			};
			command: {
				placeholder: "Search a page…";
				title: "Quick search";
				description: "Quickly navigate to a page";
				empty: 'No results for "{{query}}"';
				hint: {
					navigate: "navigate";
					open: "open";
					close: "close";
				};
				groups: {
					main: "Main";
				};
			};
			header: {
				adminDashboard: "Admin dashboard";
				teacherDashboard: "Teacher dashboard";
				notificationsAria: "Open notifications";
				toggleSidebarAria: "Toggle sidebar";
				languageSelectAria: "Change language";
				languageSelectPlaceholder: "Select language";
				profileMenuAria: "Open profile menu";
				search: "Search…";
				language: "Language";
				lightMode: "Light mode";
				darkMode: "Dark mode";
				dashboard: "Dashboard";
				sound: {
					aria: "Sound settings";
					volume: "Volume";
					disable: "Turn off";
					enable: "Turn on";
					theme: "Sound theme";
					themes: {
						default: "Default";
						soft: "Soft";
						playful: "Lively";
						minimal: "Minimal";
					};
				};
			};
			sidebar: {
				search: "Search...";
				noResults: "No results";
				admin: {
					dashboard: "Overview";
					academicYears: "Academic years";
					exams: "Exams";
					users: "Users";
					classCourses: "Class courses";
					gradeExport: "Grade export";
					gradeAccess: "Grade delegation";
					gradeEntry: "Grade entry";
					exportTemplates: "Export templates";
					classDocumentTemplates: "Per-class documents";
					documentBatch: "Bulk generation";
					monitoring: "Monitoring";
					notifications: "Notifications";
					batchJobs: "Batch Jobs";
					dataImport: "Data Import";
					feeClearance: "Fee Clearance";
					statistics: "Statistics";
					students: "Students";
					studentPromotion: "Student promotion";
					courses: "Courses";
					classes: "Classes";
					faculties: "Institutions";
					institution: "Institution";
					studyCycles: "Study cycles";
					centers: "Our centers";
					programs: "Programs";
					teachers: "Teachers";
					courseAssignments: "Course assignments";
					teachingUnits: "Teaching units";
					enrollments: "Enrollments";
					examTypes: "Exam types";
					examScheduler: "Exam scheduler";
					retakeEligibility: "Retake eligibility";
					rules: "Rule center";
					registrationNumbers: "Registration numbers";
					promotionRules: "Promotion rules";
					deliberations: "Deliberations";
					deliberationRules: "Deliberation rules";
					apiKeys: "API Keys";
					gradeManagement: "Grade management";
					promotion: "Year transition";
					configuration: "Configuration";
					timetable: "Timetable";
					admissions: "Admissions";
					guardians: "Guardians";
					academicResults: "Results & Promotion";
					setup: "Setup & data import";
				};
				groups: {
					overview: "Overview";
					structure: "Academic Structure";
					users: "Users";
					teaching: "Teaching";
					evaluation: "Evaluation";
					promotion: "Rules & Promotion";
					system: "System";
					assessment: "Assessment";
					people: "People";
					inscriptions: "Enrollments & Admissions";
					results: "Results & Promotion";
					analytics: "Analytics";
				};
				teacher: {
					dashboard: "Overview";
					exams: "Exams";
					grades: "Grades";
					courses: "Courses";
					attendance: "Attendance alerts";
					timetable: "Timetable";
					workflows: "Workflows";
					exports: "Exports";
					myCourses: "My courses";
					attendanceRates: "Attendance rates";
				};
				dean: {
					dashboard: "Dashboard";
					workflows: "Approvals";
					history: "History";
					monitoring: "Monitoring";
					pendingApprovals: "Pending approvals";
				};
				student: {
					dashboard: "My performance";
					exams: "Exam calendar";
					timetable: "Timetable";
					enrollments: "My courses";
					documents: "My documents";
					timeline: "Academic Timeline";
				};
			};
			roles: {
				guest: "Guest";
				student: "Student";
				staff: "Staff";
				grade_editor: "Grade Editor";
				dean: "Dean";
				teacher: "Teacher";
				administrator: "Administrator";
				super_admin: "Super admin";
				owner: "Owner";
			};
			pages: {
				people: "People";
				enrollments: "Enrollments";
				admissions: "Admissions";
				exams: "Exams";
				deliberations: "Deliberations";
				feeAssignments: "Fee assignments";
				academicYears: "Academic years";
				myFees: "My fees";
				courseEnrollment: "Course registration";
				examCalendar: "Exam calendar";
				documents: "Documents";
				notifications: "Notifications";
				openProfile: "Open the profile";
			};
			crumbs: {
				academicYears: "Academic years";
				institution: "Institution";
				overview: "Overview";
				faculties: "Faculties";
				cycles: "Cycles";
				levels: "Levels";
				centers: "Centres";
				logos: "Logos";
				authorization: "Authorization";
				instances: "Instances";
				contact: "Contact";
				programs: "Programs";
				teachingUnits: "Teaching units";
				courses: "Courses";
				options: "Options";
				programTemplates: "Templates";
				classes: "Classes";
				courseAssignments: "Course assignments";
				enrollments: "Enrollments";
				students: "Students";
				users: "Users";
				people: "People";
				guardians: "Guardians";
				apiKeys: "API keys";
				identity: "Identity";
				results: "Results";
				finances: "Finances";
				accountAccess: "Account access";
				exams: "Exams";
				examList: "Exams";
				examTypes: "Exam types";
				examScheduler: "Exam scheduling";
				participation: "Participation";
				gradeExport: "Grade export";
				gradeAccess: "Grade access";
				retakes: "Retakes";
				exportTemplates: "Export templates";
				classDocuments: "Class documents";
				academicResults: "Results & promotion";
				deliberations: "Deliberations";
				promotion: "Year transition";
				jury: "Jury";
				activity: "Activity";
				graduation: "Graduates";
				feeClearance: "Fees";
				feeStructures: "Fee structures";
				feeAssignments: "Fee assignments";
				installments: "Installments";
				impact: "Impact";
				history: "History";
				feeGating: "Access restriction";
				timetable: "Timetable";
				schedule: "Schedule";
				rooms: "Rooms";
				attendance: "Attendance";
				attendanceRates: "Attendance rates";
				attendanceAlerts: "Attendance alerts";
				configuration: "Configuration";
				regNumbers: "Registration numbers";
				gradeScale: "Grade scale";
				deliberationRules: "Deliberation rules";
				batchJobs: "Batch jobs";
				monitoring: "Monitoring";
				notifications: "Notifications";
				notificationCenter: "Notification center";
				admissions: "Admissions";
				setup: "Setup & data import";
				importCycles: "Cycles & levels";
				importPrograms: "Programs & options";
				importCurriculum: "Teaching units & courses";
				fastEntry: "Fast entry";
				new: "New";
				settings: "Settings";
				account: "Account";
				profile: "Profile";
				preferences: "Preferences";
				statistics: "Statistics";
				documents: "Documents";
				documentBatch: "Batch generation";
				exports: "Exports";
				myFees: "My fees";
				approvals: "Approvals";
				timeline: "History";
				workflows: "Workflows";
				details: "Details";
				myCourses: "My courses";
				importYears: "Academic years";
			};
			badges: {
				new: "New";
				updated: "Updated";
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
				notMember: "You are not a member of this organization. Contact your administrator.";
				rememberMe: "Remember me for 30 days";
				subtitle: "Sign in to access your institutions.";
				scopedSubtitle: "Sign in to your workspace.";
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
				subtitle: "Enter your email address to receive a password reset link.";
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
				subtitle: "Choose a strong new password for your account.";
				signInNow: "Sign in now";
				successMessage: "Redirecting to sign in in {{countdown}} seconds...";
				successTitle: "Password updated";
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
			orgPicker: {
				back: "Switch account";
				noOrgs: "No institution found for this account. Contact your administrator.";
				subtitle: "Select the institution you want to access.";
				title: "Choose your institution";
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
					subtitle: "Distribution of students across programs.";
				};
				stats: {
					faculties: "Faculties";
					programs: "Programs";
					courses: "Courses";
					exams: "Exams";
					students: "Students";
					teachers: "Teachers";
					institutions: "Institutions";
					activeEnrollments: "Active Enrollments";
					activeStudents: "Active students";
					enrollments: "Total enrollments";
					admissionsTotal: "Applications";
					examsPending: "Exams pending";
					deliberationsOpen: "Open deliberations";
					feeCollectionRate: "Collection rate";
				};
				subtitle: "Overview of your academic institution.";
				quickActions: {
					addStudent: "Add a student";
					scheduleExam: "Schedule an exam";
					enrollments: "Manage enrollments";
					academicYears: "Academic years";
					statistics: "Detailed statistics";
					title: "Shortcuts";
					exams: "Plan an exam";
				};
				alerts: {
					examsPending_one: "{{count}} exam awaiting approval";
					examsPending_other: "{{count}} exams awaiting approval";
					examsLink: "View submitted exams";
					deliberations_one: "{{count}} deliberation in progress";
					deliberations_other: "{{count}} deliberations in progress";
					deliberationsLink: "View deliberations";
				};
				fees: {
					title: "Tuition";
					viewAll: "View all";
					expected: "Expected";
					collected: "Collected";
					remaining: "Remaining";
					rate: "Collection rate";
				};
				statusStats: {
					title: "Enrollment status";
					subtitle: "Breakdown by status";
					empty: "No enrollments";
				};
			};
			statistics: {
				title: "Statistics";
				description: "Key performance indicators for the institution";
				export: "Export Excel";
				noData: "No data available";
				noDeliberations: "No deliberations recorded";
				noMentions: "No mentions assigned";
				tabs: {
					students: "Students";
					performance: "Performance";
					finances: "Finances";
					admissions: "Admissions";
				};
				gender: {
					male: "Male";
					female: "Female";
					other: "Other";
					unknown: "Not specified";
				};
				enrollment: {
					totalLabel: "Active enrollments";
					byProgram: "Students by program";
					byStatus: "Status breakdown";
					byGender: "Gender breakdown";
					status: {
						active: "Active";
						pending: "Pending";
						completed: "Completed";
						withdrawn: "Withdrawn";
					};
				};
				performance: {
					studentsDeliberated: "Students deliberated";
					avgGeneral: "General average";
					byDecision: "Results by decision";
					byMention: "Results by mention";
					decision: {
						passed: "Passed";
						failed: "Failed";
						repeating: "Repeating";
						excluded: "Excluded";
						deferred: "Deferred";
						unknown: "Unknown";
					};
					mention: {
						passable: "Pass";
						assez_bien: "Fairly good";
						bien: "Good";
						tres_bien: "Very good";
						excellent: "Excellent";
						unknown: "Not assigned";
					};
				};
				finances: {
					title: "Financial overview";
					expected: "Expected amount";
					collected: "Collected amount";
					outstanding: "Outstanding balance";
					collectionRate: "Collection rate";
					monthlyTrend: "Monthly collection trend";
					byMethod: "By payment method";
					method: {
						cash: "Cash";
						bank_transfer: "Bank transfer";
						mobile_money: "Mobile money";
						check: "Check";
						bank_import: "Bank import";
					};
				};
				admissions: {
					total: "Applications";
					conversionRate: "Conversion rate";
					converted: "Enrolled applicants";
					byProgram: "Applications by program";
					byStatus: "Status breakdown";
					status: {
						draft: "Draft";
						submitted: "Submitted";
						pending: "Pending";
						approved: "Approved";
						rejected: "Rejected";
						waitlisted: "Waitlisted";
						enrolled: "Enrolled";
					};
				};
				excel: {
					notAvailable: "N/A";
					files: {
						students: "student-statistics.xlsx";
						performance: "performance-statistics.xlsx";
						finances: "finance-statistics.xlsx";
						admissions: "admissions-statistics.xlsx";
					};
					sheets: {
						byProgram: "By program";
						byStatus: "By status";
						byGender: "By gender";
						byDecision: "By decision";
						byMention: "By mention";
						overview: "Overview";
						monthly: "Monthly";
						byMethod: "By method";
					};
					columns: {
						program: "Program";
						enrolled: "Enrolled";
						status: "Status";
						count: "Count";
						gender: "Gender";
						decision: "Decision";
						students: "Students";
						mention: "Mention";
						indicator: "Indicator";
						amount: "Amount";
						month: "Month";
						method: "Method";
						transactions: "Transactions";
						applications: "Applications";
					};
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
			rules: {
				title: "Promotion & Rule Center";
				subtitle: "Curate study cycles, tune credit thresholds, and preview upcoming changes.";
				actions: {
					clone: "Clone defaults";
					save: "Save override";
					attach: "View programs";
				};
				studyCycles: "Study cycles";
				faculty: "Faculty";
				selectFaculty: "Select faculty";
				cycle: "Study cycle";
				selectCycle: "Select cycle";
				totalCredits: "Total credits required: {{value}}";
				duration: "Duration: {{value}} years";
				levels: "Cycle levels";
				promotionRules: "Promotion rules";
				rulesHint: "Default rules come from the server. Clone them to craft faculty-level overrides.";
				selectLevel: "Select level";
				minCredits: "Required credits: {{value}}";
				toast: {
					saved: "Rule saved successfully";
				};
				previewWarning: "Overrides are stored soon. For now, keep a note of exported JSON until persistence arrives.";
			};
			registrationNumbers: {
				title: "Registration number formats";
				subtitle: "Design flexible matricule templates that pull context from classes, programs, and cohorts.";
				actions: {
					reset: "Reset form";
					save: "Save format";
					clear: "Clear form";
					new: "New format";
					activate: "Activate";
				};
				list: {
					title: "Existing formats";
					empty: "No formats yet. Start by creating one.";
					active: "Active";
					edit: "Edit";
					activate: "Activate";
					delete: "Delete";
					confirmDelete: "Delete this format permanently?";
					confirmDeleteTitle: "Delete format?";
				};
				form: {
					title: "Format designer";
					name: "Format name";
					activeLabel: "Activate on save";
					activeHelp: "When enabled, other templates will be deactivated.";
					description: "Description";
				};
				segments: {
					title: "Segments";
					addLiteral: "Add literal";
					addField: "Add field";
					addCounter: "Add counter";
					empty: "Combine literals, fields, and counters to define your matricule format.";
					segmentLabel: "Segment {{index}}";
					typeLabel: "Segment type";
					literal: "Literal text";
					field: "Data field";
					counter: "Counter";
					literalValue: "Text value";
					fieldSelect: "Select field";
					transform: "Transform";
					uppercase: "Uppercase";
					lowercase: "Lowercase";
					none: "Original";
					length: "Max length";
					fallback: "Fallback value";
					counterWidth: "Width";
					counterStart: "Start value";
					counterPad: "Pad character";
					counterScope: "Counter scope";
				};
				preview: {
					title: "Preview";
					subtitle: "Select a class and optional student info to preview the output.";
					class: "Class";
					classPlaceholder: "Select class";
					firstName: "First name";
					lastName: "Last name";
					nationality: "Nationality";
					run: "Generate preview";
					result: "Preview result";
				};
				table: {
					name: "Name";
					description: "Description";
					pattern: "Pattern";
				};
				dialog: {
					createTitle: "New format";
					editTitle: "Edit format";
				};
				toast: {
					saved: "Format saved";
					deleted: "Format deleted";
					activated: "Format activated";
				};
				errors: {
					missingName: "Name is required";
					missingSegments: "Add at least one segment";
					previewClass: "Select a class to preview";
					notFound: "Format not found";
				};
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
				pendingBadge: "{{count}} pending";
				viewAll: "View all notifications";
				results: "{{count}} results";
				selected: "{{count}} selected";
				deselect: "Deselect";
				selectAll: "Select all";
				status: {
					pending: "Pending";
					sent: "Sent";
					failed: "Failed";
					all: "All";
					retrying: "Retrying";
				};
				tabs: {
					all: "All";
					pending: "Pending";
					sent: "Sent";
					failed: "Failed";
				};
				timeAgo: {
					justNow: "Just now";
					minutes: "{{count}} min ago";
					hours: "{{count}}h ago";
					days: "{{count}}d ago";
				};
				actions: {
					flush: "Flush pending";
					ack: "Acknowledge";
					retry: "Retry";
				};
				toast: {
					flushed: "Pending notifications flushed";
					retried: "Notification requeued";
				};
				flushConfirmDesc: "This will immediately attempt delivery of all pending notifications. Continue?";
				channels: {
					email: "Email";
					webhook: "Webhook";
				};
			};
			apiKeys: {
				title: "API Keys";
				subtitle: "Manage API keys for the Diplomation integration";
				actions: {
					create: "New API Key";
					generate: "Generate Key";
					revoke: "Revoke";
					editWebhook: "Edit Webhook";
				};
				table: {
					label: "Label";
					status: "Status";
					webhook: "Webhook URL";
					lastUsed: "Last used";
					created: "Created";
				};
				status: {
					revoked: "Revoked";
				};
				form: {
					createTitle: "Create API Key";
					label: "Label";
					labelPlaceholder: "e.g. Diplomation production";
					webhookUrl: "Webhook URL (optional)";
					webhookSecret: "Webhook Secret (optional)";
					webhookSecretPlaceholder: "Leave empty to skip signing";
				};
				rawKey: {
					title: "Your new API Key";
					warning: "Copy this key now — it will never be shown again.";
					confirm: "I copied it";
				};
				webhook: {
					title: "Edit Webhook";
				};
				revoke: {
					title: "Revoke API Key";
					message: "Are you sure you want to revoke this key? It will stop working immediately.";
				};
				empty: {
					title: "No API keys";
					description: "Create an API key to allow Diplomation to fetch data from this system.";
				};
				toast: {
					createError: "Failed to create API key";
					revokeSuccess: "Key revoked";
					revokeError: "Failed to revoke key";
					webhookUpdated: "Webhook updated";
					webhookError: "Failed to update webhook";
					copied: "Copied to clipboard";
				};
				activity: {
					title: "Activity — last 30 days";
					empty: "No activity recorded.";
					unknownKey: "No key";
				};
				callActivity: {
					title: "API calls — last 30 days";
					empty: "No calls recorded.";
				};
			};
			batchJobs: {
				title: "Batch Jobs";
				subtitle: "Run and monitor mass operations across your institution";
				fields: {
					jobType: "Job type";
					academicYear: "Academic year";
					class: "Class";
					jobTypePlaceholder: "Select a job type...";
					classPlaceholder: "Select class...";
				};
				actions: {
					create: "New batch job";
					run: "Run";
					cancel: "Cancel";
					rollback: "Rollback";
					preview: "Preview";
					confirm: "Confirm & Run";
				};
				empty: {
					title: "No batch jobs yet";
					description: "Create a batch job to perform mass operations like credit recomputation or student facts refresh.";
				};
				columns: {
					type: "Type";
					status: "Status";
					progress: "Progress";
					createdBy: "Created by";
					createdAt: "Created";
					actions: "Actions";
				};
				status: {
					pending: "Pending";
					previewed: "Previewed";
					running: "Running";
					completed: "Completed";
					failed: "Failed";
					cancelled: "Cancelled";
					stale: "Stale";
					rolled_back: "Rolled back";
				};
				types: {
					"creditLedger.recompute": "Credit Ledger Recomputation";
					"studentFacts.refreshClass": "Student Facts Refresh (Class)";
					"academicYear.setup": "Academic Year Setup";
					"import.step": "Guided import";
					"import.academicStructure": "Academic structure import";
					"import.people": "People import";
					"import.enrollments": "Enrollments import";
					"import.gradesBulk": "Grades import";
					"promotion.applyBatch": "Batch promotion";
					"timetable.copyFromYear": "Timetable copy";
					"documents.generateBulk": "Batch document generation";
				};
				preview: {
					title: "Preview Batch Job";
					steps: "Steps";
					totalItems: "Total items";
					summary: "Summary";
					confirmRun: "Are you sure you want to execute this batch job? This operation may take several minutes.";
				};
				detail: {
					timedOut: "Job timed out";
					title: "Job Details";
					steps: "Steps";
					logs: "Logs";
					progress: "Progress";
					error: "Error";
					result: "Result";
					noLogs: "No logs yet";
					logLevel: {
						all: "All";
						info: "Info";
						warn: "Warn";
						error: "Error";
					};
					logStep: "Step";
					failed: "Failed: {{count}}";
					failureSummary: "Job failed";
					items: "items";
					notFound: "Job not found";
					originalJob: "View original job";
					processed: "Processed: {{count}}";
					rollbackJob: "View rollback job";
					skipped: "Skipped: {{count}}";
					step: "Step {{current}}/{{total}}";
					unknownError: "Unknown error";
				};
				toast: {
					previewSuccess: "Preview generated successfully";
					runSuccess: "Batch job started";
					cancelSuccess: "Batch job cancelled";
					rollbackSuccess: "Rollback initiated";
				};
				stepStatus: {
					pending: "Pending";
					running: "Running";
					completed: "Completed";
					failed: "Failed";
					skipped: "Skipped";
				};
				confirm: {
					cancelMessage: "Cancelling will stop the job immediately. Partially processed data will not be reverted.";
					cancelTitle: "Cancel job?";
					rollbackMessage: "A new rollback job will be created to undo the changes made by this job. This action cannot itself be undone.";
					rollbackTitle: "Roll back job?";
				};
			};
			academicYears: {
				title: "Academic Year Management";
				subtitle: "Create and manage academic years, and choose the active one";
				actions: {
					add: "Add academic year";
					createNextYear: "Create next year";
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
					createNextYearSuccess: "Next year created: {{name}}";
					createNextYearError: "Failed to create next year";
				};
				validation: {
					startDate: "Start date is required";
					endDate: "End date is required";
					name: "Name must be at least 2 characters";
					order: "End date must be after start date";
				};
				setup: {
					button: "Setup from year";
					title: "Academic year setup";
					description: "Copy classes and course assignments from a previous year into this one.";
					sourceYear: "Source year";
					sourceYearPlaceholder: "Select the year to copy from";
					previewSummary: '{{classCount}} classes and {{classCourseCount}} course assignments will be copied from "{{sourceYearName}}" to "{{targetYearName}}".';
					confirm: "Start setup";
					success: "Academic year setup started";
					noClasses: "No classes found in the selected year";
					includeTimetable: "Include timetable";
					timetableSummary_one: "{{count}} session to copy from source year";
					timetableSummary_other: "{{count}} sessions to copy from source year";
				};
			};
			classCourses: {
				title: "Class course assignments";
				subtitle: "Assign teachers and courses to classes";
				actions: {
					assign: "Assign course";
					assignUe: "Assign UE";
					autoEnroll: "Enroll students";
					exportPdf: "Exporter PDF";
					manage: "Manage all";
				};
				ueAssign: {
					title: "Assign a teaching unit";
					classLabel: "Class";
					classPlaceholder: "Select a class";
					ueLabel: "Teaching unit";
					uePlaceholder: "Select a UE";
					noUe: "No UE found for this program";
					hint: "All ECs from this UE will be assigned to the class with their default teacher and coefficient. ECs without a default teacher will be skipped.";
					submit: "Assign courses";
					skippedTitle: "Some courses were not assigned";
					skippedDesc: "The following courses have no default teacher and were skipped:";
				};
				empty: {
					title: "No course assignments yet";
					description: "Assign a course to a class to populate this list.";
				};
				table: {
					code: "Code";
					class: "Class";
					program: "Program";
					course: "Course";
					teacher: "Teacher";
					semester: "Semester";
					coefficient: "Coef.";
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
					semesterLabel: "Semester";
					semesterPlaceholder: "Select a semester";
					codeLabel: "Code";
					codePlaceholder: "INF11-CLS24-01";
					coefficientLabel: "Coefficient";
					coefficientPlaceholder: "1.00";
					coefficientHelp: "Weight for weighted average calculation within the Teaching Unit";
					createSubmit: "Assign course";
					autoEnrollOnCreate: "Auto-enroll class students after assigning this course";
				};
				toast: {
					createSuccess: "Course assignment created successfully";
					createError: "Could not create the assignment";
					updateSuccess: "Course assignment updated successfully";
					updateError: "Could not update the assignment";
					deleteSuccess: "Course assignment deleted successfully";
					deleteError: "Could not delete the assignment";
					bulkAssignSuccess: "{{count}} courses assigned successfully";
					bulkAssignError: "Error during assignment";
					autoEnrollSuccess: "{{count}} enrollment(s) created";
					autoEnrollError: "Failed to auto-enroll students";
				};
				delete: {
					title: "Delete course assignment";
					message: "Deleting this assignment will also remove related exams and grades. Continue?";
				};
				validation: {
					class: "Please select a class";
					course: "Please select a course";
					teacher: "Please select a teacher";
					code: "Code is required";
				};
				autoEnroll: {
					title: "Auto-enroll students";
					description: "Automatically enrolls all students of a class in their assigned courses for the selected academic year.";
					classLabel: "Class";
					classPlaceholder: "Select a class";
					yearLabel: "Academic Year";
					submit: "Enroll students";
				};
				export: {
					success: "Catalogue exported successfully";
					error: "Error during export";
					title: "Export the teaching unit / course catalogue";
					scopeLabel: "Scope";
					scopeYear: "All classes for the filtered year";
					noYearWarning: "no year selected";
					scopeSelection: "Specific classes";
					classesLabel: "Classes to include";
					selectedCount: "class(es) selected";
					generate: "Generate PDF";
				};
				deleteConfirm: {
					description: "This cannot be undone.";
					title: "Remove course assignment?";
				};
				fields: {
					code: "Code";
					course: "Course";
					teacher: "Teacher";
				};
			};
			classes: {
				title: "Class management";
				subtitle: "Create classes for each program and academic year";
				actions: {
					add: "Add class";
					bulkGenerate: "Bulk generate";
					bulkExport: "Bulk export";
				};
				empty: {
					title: "No classes yet";
					description: "Create classes to organise students by program and year.";
				};
				table: {
					name: "Class";
					code: "Code";
					program: "Program";
					academicYear: "Academic year";
					cycle: "Cycle / level";
					option: "Option";
					optionSemester: "Option / Semester";
					credits: "Credits";
					students: "Students";
					classProgram: "Class / Program";
				};
				export: {
					button: "Export student list (PDF)";
					excelButton: "Export student list (Excel)";
					title: "Student List";
					totalStudents: "Total students";
					page: "Page";
					generatedOn: "Generated on";
					success: "Student list exported successfully";
					error: "Failed to export student list";
					excelSuccess: "Student list exported successfully";
					excelError: "Failed to export student list";
					sheetName: "Students";
					templateUsed: "Template used: {{name}}";
					templateUsedCenter: "Template used: {{name}} (center)";
					templateFallback: "The official template could not be rendered ({{error}}). Falling back to a basic jsPDF export.";
					institutionFallback: "Institution";
				};
				form: {
					createTitle: "Add class";
					editTitle: "Edit class";
					createSubmit: "Create class";
					programLabel: "Program";
					programPlaceholder: "Select a program";
					programSummary: "Faculty: {{value}}";
					cycleSummary: "Cycle: {{value}}";
					academicYearLabel: "Academic year";
					academicYearPlaceholder: "Select an academic year";
					cycleLevelLabel: "Cycle level";
					cycleLevelPlaceholder: "Select cycle level";
					selectProgramFirst: "Select a program to load its cycle levels.";
					emptyCycleLevels: "No cycle levels available for the selected faculty.";
					programOptionLabel: "Program option";
					programOptionPlaceholder: "Select option";
					semesterLabel: "Semester";
					semesterPlaceholder: "Select a semester";
					codeLabel: "Code";
					codePlaceholder: "INF11-S1-01";
					labelLabel: "Generated class label";
					totalCreditsLabel: "Total credits";
					totalCreditsPlaceholder: "e.g. 30";
					programCycleSummary: "Cycle : {{value}}";
					emptyProgramOptions: "No options available";
				};
				toast: {
					createSuccess: "Class created successfully";
					createError: "Could not create the class";
					updateSuccess: "Class updated successfully";
					updateError: "Could not update the class";
					deleteSuccess: "Class deleted successfully";
					deleteError: "Could not delete the class";
					bulkGenerateSuccess: "Classes generated successfully";
					bulkGenerateResult: "{{created}} class(es) created, {{skipped}} skipped";
				};
				delete: {
					title: "Delete class";
					message: "This action cannot be undone and may remove related assignments.";
					messageWithStudents: "This class has {{count}} enrolled student(s). They will be transferred to another class automatically. This action cannot be undone.";
				};
				validation: {
					program: "Please select a program";
					academicYear: "Please select an academic year";
					cycleLevel: "Please select a cycle level";
					programOption: "Please select a program option";
					semester: "Please select a semester";
					code: "Please provide a class code";
					name: "Name must be at least 2 characters";
				};
				filters: {
					academicYear: "Academic Year";
					semester: "Semester";
					title: "Filters";
				};
				columns: {
					registration: "Reg. Number";
					lastName: "Last Name";
					firstName: "First Name";
					birthDate: "Birth Date";
					gender: "Gender";
				};
				students: "students";
				preview: {
					button: "View student list";
				};
				previewDescription: "List of students enrolled in this class";
				searchStudents: "Search students...";
				noStudents: "No students enrolled in this class";
				bulkGenerate: {
					description: "Generate multiple classes at once for the selected academic year.";
					submit: "Generate classes";
					title: "Bulk class generation";
					yearLabel: "Academic year";
					sourceYearLabel: "Clone assignments from (optional)";
					sourceYearHint: "If set, this year's teacher assignments are copied to the new classes.";
					sourceYearPlaceholder: "None (optional)";
				};
				studentsEmpty: {
					description: "Enroll students via the Enrollments tab.";
					title: "No students enrolled";
				};
			};
			institution: {
				title: "Institution settings";
				subtitle: "Store the bilingual identity, branding, and official contact information used in generated documents.";
				actions: {
					save: "Save institution";
				};
				toast: {
					saved: "Institution saved successfully";
				};
				attendanceExcusePolicy: {
					title: "Attendance excuse policy";
					description: "Define which absence excuses are accepted and whether a supporting document is required.";
					categories: "Accepted categories";
					categoriesPlaceholder: "Medical, Family emergency, Administrative";
					categoriesHint: "Comma-separated list. Leave empty to allow free categories.";
					requiresDocument: "Require supporting document";
					requiresDocumentHint: "When enabled, absence excuses cannot be approved without a document URL.";
					deadline: "Approval deadline (days)";
					deadlineHint: "Leave empty for no deadline.";
				};
				form: {
					identity: "Identity & branding";
					identityHint: "French and English fields are required to feed bilingual headers.";
					code: "Sigle / Code";
					shortName: "Short name";
					nameFr: "Official name (FR)";
					nameEn: "Official name (EN)";
					legalNameFr: "Legal name (FR)";
					legalNameEn: "Legal name (EN)";
					sloganFr: "Slogan (FR)";
					sloganEn: "Slogan (EN)";
					descriptionFr: "Description (FR)";
					descriptionEn: "Description (EN)";
					addressFr: "Address (FR)";
					addressEn: "Address (EN)";
					contactEmail: "Contact email";
					contactPhone: "Phone";
					fax: "Fax";
					postalBox: "Postal box";
					timezone: "Timezone";
					website: "Website URL";
					logoUrl: "Logo URL";
					coverImageUrl: "Cover image URL";
					logoUploadLabel: "Logo (PNG/JPG)";
					logoUploadDescription: "Used on transcripts, attestations, and diplomas.";
					logoUrlPlaceholder: "https://example.com/logo.png";
					coverUploadLabel: "Banner / header";
					coverUploadDescription: "Displayed on dashboards and PDF cover pages.";
					coverImageUrlPlaceholder: "https://example.com/banner.jpg";
					uploadCta: "Select or drop an image";
					uploadHint: "PNG/JPG up to 5 MB";
					uploading: "Uploading…";
					uploadDescription: "You can also paste a public URL directly.";
					clearImage: "Remove image";
					previewPlaceholder: "No image yet";
					uploadSuccess: "Image uploaded";
					uploadError: "Upload failed";
					defaultAcademicYear: "Default academic year";
					defaultAcademicYearPlaceholder: "Select academic year";
					registrationFormat: "Registration format";
					registrationFormatPlaceholder: "Use active format";
					type: "Type";
					typeUniversity: "University";
					typeFaculty: "Faculty/School";
					typeInstitution: "Institution/Institute";
					parentInstitution: "Parent Institution (University)";
					noParentInstitution: "None (Top-level)";
					supervisingFaculty: "Supervising Faculty/School";
					noSupervisingFaculty: "None";
					noDefaultYear: "No default year";
					noRegistrationFormat: "No registration format (use active)";
					abbreviation: "Abbreviation";
					typePlaceholder: "Select type";
					parentInstitutionPlaceholder: "Select parent institution";
					supervisingFacultyPlaceholder: "Select supervising faculty";
					defaultAcademicYearManagedHint: "Manage the active academic year from Academic Years.";
					registrationFormatManagedHint: "Manage the active registration format from Registration Formats.";
					signatoryName: "Signatory name";
					signatoryTitle: "Signatory title";
					city: "City (for document date line)";
					logoSvg: "SVG logo (source code)";
					logoSvgHint: "If set, the SVG takes priority over the PNG/URL logo in exports.";
					logoSvgAlternative: "…or SVG code (takes priority in exports)";
					signatoryTitlePlaceholder: "Director General";
					readFileError: "Failed to read file";
				};
				sections: {
					contact: "Contact & location";
					contactHint: "Phone, email, fax and postal address displayed on official documents.";
					media: "Media";
					mediaHint: "Logo and cover image used in generated reports and dashboards.";
					names: "Names & Identity";
					namesHint: "Official names in French and English, abbreviation and slogan.";
					system: "System";
					systemHint: "Default academic year and registration format.";
					documentParams: "Document Generation";
					documentParamsHint: "Signatory and city used on generated diplomas, attestations and transcripts. Automatically synced to Diplomation.";
				};
			};
			studyCycles: {
				title: "Study cycles";
				subtitle: "Group programs by cycle and tune credit thresholds per level.";
				tabs: {
					details: "Details";
					levels: "Levels";
				};
				actions: {
					add: "Add cycle";
					addLevel: "Add level";
					update: "Update cycle";
					updateLevel: "Update level";
					manageLevels: "Manage levels";
				};
				listTitle: "Cycles";
				empty: "No study cycles yet.";
				table: {
					name: "Name";
					faculty: "Faculty";
					credits: "Credits";
					duration: "Duration";
					years: "{{value}} years";
					actions: "Actions";
				};
				levelsTitle: "Cycle levels for {{cycle}}";
				levelsSubtitle: "Define how students progress across years.";
				levelsEmpty: "No levels defined yet.";
				levels: {
					defaultName: "Level {{value}}";
				};
				levelCredits: "Required credits: {{value}}";
				form: {
					faculty: "Faculty";
					selectFaculty: "Select faculty";
					name: "Name";
					code: "Code";
					description: "Description";
					credits: "Credits required";
					duration: "Duration (years)";
					minCredits: "Minimum credits";
					autoLevelsPreview: "Auto-generated levels preview";
					nameEn: "Name (English)";
					creditsShort: "{{value}} cr";
				};
				toast: {
					createSuccess: "Study cycle created";
					updateSuccess: "Study cycle updated";
					deleteSuccess: "Study cycle deleted";
					levelCreate: "Level added";
					levelUpdate: "Level updated";
					levelDelete: "Level removed";
				};
				delete: {
					title: "Delete study cycle";
					message: "Deleting a cycle will require programs and classes to be reassigned.";
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
					code: "Code";
					description: "Description";
					noDescription: "No description";
					nameEn: "Name (EN)";
					nameFr: "Name (FR)";
					shortName: "Short name";
					title: "All faculties";
				};
				form: {
					createTitle: "Add new faculty";
					editTitle: "Edit faculty";
					nameLabel: "Faculty name";
					namePlaceholder: "Enter faculty name";
					codeLabel: "Code";
					codePlaceholder: "SCI";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Enter faculty description";
					submit: "Save faculty";
					codeRequired: "Code is required";
					descriptionEnLabel: "Description (English)";
					descriptionFrLabel: "Description (French)";
					nameEnLabel: "Name (English)";
					nameEnRequired: "English name is required";
					nameFrLabel: "Name (French)";
					nameFrRequired: "French name is required";
					noParentInstitution: "None (top-level)";
					parentInstitutionLabel: "Parent institution";
					shortNameLabel: "Short name";
				};
				validation: {
					name: "Name must be at least 2 characters";
					code: "Code is required";
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
				search: "Search programs...";
				actions: {
					add: "Add program";
				};
				empty: {
					title: "No programs available";
					description: "Create a program to start organizing curricula.";
				};
				table: {
					code: "Code";
					name: "Program";
					faculty: "Faculty";
					cycle: "Cycle";
					options: "Options";
					description: "Description";
					noDescription: "No description";
				};
				form: {
					createTitle: "Add new program";
					editTitle: "Edit program";
					nameLabel: "Program name";
					namePlaceholder: "Enter program name";
					codeLabel: "Program code";
					codePlaceholder: "INF-LIC";
					facultyLabel: "Faculty";
					facultyPlaceholder: "Select a faculty";
					cycleLabel: "Study cycle";
					cyclePlaceholder: "Select cycle";
					selectFacultyFirst: "Select a faculty to load available cycles.";
					descriptionLabel: "Description";
					descriptionPlaceholder: "Describe this program";
					submit: "Save program";
					cloneFrom: "Clone curriculum from (optional)";
					cloneFromPlaceholder: "Select source program";
					cloneFromNone: "None";
					cloneFromHint: "Teaching units and courses from the source program will be copied after creation.";
					submitWithClone: "Create and clone";
					nameEnLabel: "Name (English)";
					abbreviationLabel: "Abbreviation";
					domainFrLabel: "Domain (FR)";
					domainEnLabel: "Domain (EN)";
					specialiteFrLabel: "Specialty (FR)";
					specialiteEnLabel: "Specialization (EN)";
					diplomaTitleFrLabel: "Diploma title (FR)";
					diplomaTitleEnLabel: "Diploma title (EN)";
					attestationValidityFrLabel: "Attestation validity (FR)";
					attestationValidityEnLabel: "Attestation validity (EN)";
					centerLabel: "Center";
					centerPlaceholder: "No center";
					centerNone: "None (general program)";
					isCenterProgramLabel: "Center program";
					isCenterProgramHint: "Mark this program as belonging to a center.";
					exportTemplatesLabel: "Export templates";
					exportTemplatesHint: "Choose the default template for each document type.";
					exportTemplatePlaceholder: "No template";
					exportTemplateNone: "None";
				};
				validation: {
					name: "Name must be at least 2 characters";
					code: "Code is required";
					faculty: "Please select a faculty";
					cycle: "Please select a study cycle";
					nameRequired: "Name is required";
				};
				toast: {
					createSuccess: "Program created successfully";
					createError: "Could not create the program";
					updateSuccess: "Program updated successfully";
					updateError: "Could not update the program";
					deleteSuccess: "Program deleted successfully";
					deleteError: "Could not delete the program";
					cloneSuccess: "Curriculum cloned: {{units}} units and {{courses}} courses copied";
					cloneError: "Could not clone curriculum";
				};
				delete: {
					title: "Delete program";
					message: "Are you sure you want to delete this program? This action cannot be undone.";
				};
				options: {
					manage: "Manage options";
					title: "Manage options for {{value}}";
					subtitle: "Options represent the different tracks/specializations offered within this program.";
					empty: "No options yet. Add one below.";
					delete: "Delete option";
					edit: "Edit option";
					editing: "Editing option {{name}}";
					cancelEdit: "Cancel edit";
					form: {
						name: "Option name";
						code: "Code";
						description: "Description";
						submit: "Add option";
						updateSubmit: "Save changes";
					};
					toast: {
						create: "Option added";
						createError: "Could not add option";
						delete: "Option deleted";
						deleteError: "Could not delete option";
						update: "Option updated";
						updateError: "Could not update option";
					};
					add: "Add option";
					deleteConfirm: {
						description: "This cannot be undone.";
						title: "Delete option?";
					};
					emptyState: {
						description: "Add specializations or tracks for this program.";
						title: "No options yet";
					};
					fields: {
						code: "Code";
						description: "Description";
						name: "Name";
					};
				};
				duplicate: {
					button: "Duplicate to cycle…";
					cloneCurriculum: "Also clone teaching units and courses";
					description: "{{count}} program(s) will be copied to each selected cycle. Code and name are prefixed with the cycle's.";
					noCycles: "No cycle available";
					submit: "Duplicate";
					targetCycles: "Target cycles";
					title: "Duplicate to another cycle";
					toast: {
						error: "Duplication failed";
						success: "{{created}} program(s) created, {{skipped}} skipped";
					};
				};
				fields: {
					center: "Center";
					cycle: "Cycle";
					description: "Description";
					isCenterProgram: "Center program";
					name: "Name (FR)";
					nameEn: "Name (EN)";
					code: "Code";
					abbreviation: "Abbreviation";
					domainFr: "Domain (FR)";
					domainEn: "Domain (EN)";
					specialiteFr: "Speciality (FR)";
					specialiteEn: "Speciality (EN)";
					diplomaTitleFr: "Diploma title (FR)";
					diplomaTitleEn: "Diploma title (EN)";
					attestationValidityFr: "Attestation validity (FR)";
					attestationValidityEn: "Attestation validity (EN)";
				};
				templateTypes: {
					diploma: "Diploma";
					transcript: "Transcript";
					attestation: "Attestation";
					enrollment_certificate: "Enrollment certificate";
					student_list: "Student list";
					pv: "Minutes (PV)";
					evaluation: "Evaluation publication";
					ec: "EC publication";
					ue: "UE publication";
					deliberation: "Deliberation";
					payment_order: "Payment order";
					payment_receipt: "Payment receipt";
					financial_clearance: "Financial clearance";
				};
			};
			courses: {
				title: "Course management";
				subtitle: "Manage courses, workloads, and default teachers.";
				actions: {
					add: "Add course";
				};
				table: {
					code: "Code";
					name: "Course";
					program: "Program";
					hours: "Hours";
					teacher: "Default teacher";
					facultyInfo: "Faculty: {{value}}";
					cycleInfo: "Cycle : {{value}}";
				};
				form: {
					createTitle: "Add course";
					editTitle: "Edit course";
					createSubmit: "Create course";
					nameLabel: "Course name";
					namePlaceholder: "Enter course name";
					codeLabel: "Course code";
					codePlaceholder: "INF111";
					hoursLabel: "Hours";
					hoursPlaceholder: "Enter total hours";
					programLabel: "Program";
					programPlaceholder: "Select a program";
					programFacultySummary: "Faculty: {{value}}";
					teacherLabel: "Default teacher";
					teacherPlaceholder: "Select a teacher";
					programCycleSummary: "Cycle : {{value}}";
					teachingUnitPlaceholder: "Select a teaching unit";
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
					hours: "Hours must be at least 1";
					code: "Code is required";
					program: "Please select a program";
					teacher: "Please select a teacher";
				};
			};
			exams: {
				title: "Exam management";
				subtitle: "Create and manage exams for each class course";
				actions: {
					add: "Add exam";
					submit: "Submit";
					approve: "Approve";
					reject: "Reject";
					reviewGrades: "Grades";
					retake: "Retake";
				};
				rejectReasonLabel: "Rejection reason (visible to the teacher)";
				rejectReasonPlaceholder: "Explain why the grades were rejected…";
				filters: {
					academicYear: "Academic year";
					class: "Class";
					classPlaceholder: "All classes";
					search: "Search";
					searchPlaceholder: "Search exams, classes or courses...";
					semester: "Semester";
					semesterPlaceholder: "All semesters";
					dateFrom: "Start date";
					dateFromPlaceholder: "From...";
					dateTo: "End date";
					dateToPlaceholder: "Until...";
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
					draft: "Draft";
					scheduled: "Scheduled";
					submitted: "Submitted";
					approved: "Approved";
					rejected: "Rejected";
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
					submitSuccess: "Exam submitted for approval";
					submitError: "Could not submit the exam";
					approveSuccess: "Exam approved successfully";
					rejectSuccess: "Exam rejected";
					validateError: "Could not validate the exam";
					retakeSuccess: "Retake exam created successfully";
					retakeError: "Could not create retake exam";
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
				pagination: {
					loadMore: "Load more exams";
				};
				scoringPolicy: {
					best_of: "Keep best grade";
					replace: "Replace original";
				};
				sessionType: {
					normal: "Normal";
					retake: "Retake";
				};
				rejection: {
					label: "Rejection reason:";
				};
			};
			examTypes: {
				title: "Exam types";
				subtitle: "Create reusable categories such as CC, TP, or final session.";
				actions: {
					add: "Add type";
				};
				table: {
					title: "Available types";
					description: "All scheduled exams can reuse the following types.";
					name: "Name";
					descriptionColumn: "Description";
					defaultPercentage: "Default weight";
				};
				empty: "No exam types yet.";
				form: {
					createTitle: "Create exam type";
					editTitle: "Edit exam type";
					nameLabel: "Name";
					descriptionLabel: "Description";
					defaultPercentageLabel: "Default weight (%)";
					submit: "Save exam type";
				};
				toast: {
					createSuccess: "Exam type created";
					createError: "Could not create exam type";
					updateSuccess: "Exam type updated";
					updateError: "Could not update exam type";
					deleteSuccess: "Exam type deleted";
					deleteError: "Could not delete exam type";
				};
				delete: {
					title: "Delete exam type";
					message: "Are you sure you want to delete this exam type?";
				};
			};
			exportTemplates: {
				title: "Export templates";
				subtitle: "Customize report layouts, columns, headers, and styling for grade exports.";
				filter: {
					all: "All types";
				};
				table: {
					title: "Available templates";
					description: "All export operations can use these templates for formatting.";
					name: "Name";
					type: "Type";
					status: "Status";
					columns: "Columns";
					columnsCount: "columns";
					actions: "Actions";
					default: "Default";
					custom: "Custom";
				};
				empty: {
					title: "No templates yet";
					description: "Create your first export template to customize your reports.";
				};
				form: {
					createTitle: "Create export template";
					editTitle: "Edit export template";
					renameTitle: "Rename template";
					renameDescription: "Enter a new name for this template.";
					description: "Define a template for customizing export outputs.";
					name: "Template name";
					namePlaceholder: "e.g., Standard PV Template";
					type: "Export type";
					typeDescription: "Type cannot be changed after creation.";
					isDefault: "Set as default";
					isDefaultDescription: "Use this template by default for this export type.";
				};
				validation: {
					name: "Name must be at least 2 characters";
				};
				toast: {
					createSuccess: "Export template created";
					createError: "Could not create export template";
					updateSuccess: "Export template updated";
					updateError: "Could not update export template";
					deleteSuccess: "Export template deleted";
					deleteError: "Could not delete export template";
					setDefaultSuccess: "Default template updated";
					setDefaultError: "Could not set default template";
				};
				delete: {
					title: "Delete export template";
					message: 'Are you sure you want to delete "{{name}}"? This action cannot be undone.';
				};
				actions: {
					setDefault: "Set as default";
					edit: "Edit template";
					rename: "Rename";
					add: "Add template";
					delete: "Delete";
				};
				editor: {
					notFound: "Template not found";
					createTitle: "Create New Export Template";
					createDescription: "Enter a name and select the export type to get started.";
					subtitle: "Editing {{type}} template";
					tabs: {
						columns: "Columns";
						header: "Header";
						style: "Style";
						template: "Template";
					};
					template: {
						editorTitle: "Template source";
						editorDescription: "Paste your Handlebars (.hbs) layout with static headers, logos, and styles.";
						placeholder: "<!-- Paste your template here -->";
						loadExample: "Load example";
						exampleLoaded: "Example template loaded successfully";
						generatePreview: "Generate preview";
						helpTitle: "Tips";
						helpHandlebars: "Handlebars helpers like {{formatNumber}} remain available.";
						helpVariables: "Common variables: program, students, semester, academicYear, signatures.";
						helpStatic: "Logos and headers should be part of your template (no dynamic builder).";
						previewTitle: "Preview";
						previewDescription: "Render the template with sample data.";
						download: "Download HTML";
						noPreview: "No preview yet";
						clickGenerate: 'Click "Generate preview" after providing template content.';
						required: "Template content cannot be empty.";
						resizeAria: "Resize height";
						resizeHint: "Drag to resize, double-click to reset";
					};
					columns: {
						title: "Column Configuration";
						description: "Define which columns to display, their order, and formatting.";
						addColumn: "Add Column";
						empty: "No columns configured yet. Add your first column to get started.";
						addTitle: "Add Column";
						editTitle: "Edit Column";
						dialogDescription: "Configure the column properties.";
						key: "Data Key";
						label: "Label";
						labelFr: "Label (FR)";
						labelEn: "Label (EN)";
						dataType: "Data Type";
						alignment: "Alignment";
						width: "Width (px)";
						format: "Format";
						formula: "Formula";
						visible: "Visible";
					};
					header: {
						title: "Header Configuration";
						description: "Customize the document header layout and information.";
						titles: "Document Titles";
						titleFr: "Title (FR)";
						titleEn: "Title (EN)";
						logoConfig: "Logo Configuration";
						showLogo: "Show Logo";
						logoPosition: "Logo Position";
						displayOptions: "Display Options";
						showInstitutionName: "Show Institution Name";
						showFacultyName: "Show Faculty Name";
						showAcademicYear: "Show Academic Year";
						showSemester: "Show Semester";
						showClassName: "Show Class Name";
					};
					style: {
						title: "Style Configuration";
						description: "Customize fonts, colors, page settings, and watermark.";
						typography: "Typography";
						fontFamily: "Font Family";
						fontSize: "Font Size";
						headerFontSize: "Header Font Size";
						colors: "Colors";
						primaryColor: "Primary Color";
						secondaryColor: "Secondary Color";
						headerBackgroundColor: "Header Background";
						headerTextColor: "Header Text";
						tableBorderColor: "Table Border";
						alternateRowColor: "Alternate Row";
						pageSettings: "Page Settings";
						pageSize: "Page Size";
						pageOrientation: "Orientation";
						tableBorderWidth: "Border Width";
						margins: "Margins (mm)";
						marginTop: "Top";
						marginRight: "Right";
						marginBottom: "Bottom";
						marginLeft: "Left";
						watermark: "Watermark";
						watermarkEnabled: "Enable Watermark";
						watermarkText: "Watermark Text";
						watermarkOpacity: "Opacity";
						watermarkFontSize: "Font Size";
						watermarkRotation: "Rotation (degrees)";
					};
					preview: {
						success: "Preview generated successfully";
						error: "Failed to generate preview";
					};
					livePreview: "Live preview";
					rendering: "rendering…";
					layout: "Layout:";
					sideBySide: "Side by side";
					stacked: "Stacked";
					hbs: {
						variable: "variable";
						ifCondition: "if condition";
						unlessCondition: "unless condition";
						iterate: "iterate";
						with: "scope into context";
						or: "(...args) → boolean: true if any arg is truthy";
						logo: "(svg=, url=, alt?, class?, style?) → renders the inline SVG if set, else <img src=url>";
						headerBilingual: "3-column header (FR + coat of arms + EN)";
						headerCenter: "Center variant header (institution + center)";
						studentsTable: "Student roster table";
						signatures3: "3-signature block (graduate / rector / minister)";
						watermarkBlock: "Watermark block (logo + text)";
					};
				};
				types: {
					pv: "PV (Minutes)";
					evaluation: "Evaluation";
					ue: "UE (Teaching unit)";
					deliberation: "Deliberation";
					diploma: "Diploma";
					transcript: "Transcript";
					attestation: "Attestation";
					student_list: "Student list";
				};
				system: {
					seedFailed: "Failures ({{count}}): {{details}}";
					seedCreated: "Official templates created: {{created}}";
					seedAllPresent: "All official templates are already present.";
					linked_one: "{{count}} program → template assignment (re)created (center variant for center programs, standard otherwise).";
					linked_other: "{{count}} program → template assignments (re)created (center variant for center programs, standard otherwise).";
					linkFailed_one: "{{count}} assignment failed: {{details}}";
					linkFailed_other: "{{count}} assignments failed: {{details}}";
					seedError: "Initialization failed";
					exportPartial: "{{count}} templates exported, {{failed}} failures: {{details}}";
					exportSuccess_one: "{{count}} template exported as PDF (ZIP)";
					exportSuccess_other: "{{count}} templates exported as PDF (ZIP)";
					exportError: "Template export failed";
					exportAllHint: "Generates one PDF per template (16 files: 8 types × standard + center) with the real institution and center details and a sample student. Downloaded as a ZIP.";
					exportAllPending: "Generating…";
					exportAll: "Download all templates (PDF)";
					seedHint: "Creates the 3 official templates (diploma, transcript, attestation) if missing";
					seed: "Initialize official templates";
					zipName: "templates-preview";
				};
			};
			examScheduler: {
				title: "Exam scheduler";
				subtitle: "Plan exams for entire faculties and academic years in a single step.";
				sessionMode: {
					label: "Scheduling type";
					normal: "Exams";
					normalDescription: "Schedule exams (CC, TP, SN, etc.) for class courses";
					retake: "Retakes";
					retakeDescription: "Schedule retakes for approved exams";
				};
				form: {
					title: "Schedule parameters";
					description: "Choose the faculty, academic year, exam type, weight, and time window.";
					facultyLabel: "Faculty";
					facultyPlaceholder: "Select faculty";
					academicYearLabel: "Academic year";
					academicYearPlaceholder: "Select academic year";
					examTypeLabel: "Exam type";
					examTypePlaceholder: "Select exam type";
					semesterLabel: "Semester";
					semesterPlaceholder: "Select semester";
					percentageLabel: "Weight (%)";
					dateStartLabel: "Start date";
					dateEndLabel: "End date";
					scoringPolicyLabel: "Scoring policy";
					scoringPolicyPlaceholder: "Select policy";
					scoringPolicyReplace: "Replace original grade";
					scoringPolicyBestOf: "Keep best grade";
					classFilterLabel: "Filter by class";
					classFilterPlaceholder: "All classes";
					examTypeFilterLabel: "Filter by exam type";
					examTypeFilterPlaceholder: "All types";
					configSection: "Configuration";
					dateRangeSection: "Date range";
					periodSection: "Scheduling period";
				};
				classes: {
					title: "Target classes";
					description: "All classes for the selected year are preselected. Deselect any you wish to exclude.";
					selectAll: "Select all classes";
					selectedCount_one: "{{count}} class selected";
					selectedCount_other: "{{count}} classes selected";
				};
				retakeExams: {
					title: "Exams eligible for retake";
					description: "Approved exams without a scheduled retake. Select the exams to schedule retakes for.";
					selectAll: "Select all exams";
					noExams: "No approved exams found without retakes for the selected criteria.";
					examCount: "{{count}} exams";
					examCount_one: "{{count}} exam";
					examCount_other: "{{count}} exams";
					selectedCount_one: "{{count}} exam selected";
					selectedCount_other: "{{count}} exams selected";
				};
				actions: {
					schedule: "Schedule exams";
					scheduleRetakes: "Schedule retakes";
					quickRetakes: "Quick retakes";
				};
				toast: {
					success: "Exams scheduled";
					error: "Unable to schedule exams";
					retakeSuccess: "Retakes scheduled ({{count}} created)";
					retakeError: "Unable to schedule retakes";
				};
				history: {
					title: "Scheduling history";
					description: "Review recent bulk scheduling runs and their outcomes.";
					emptyTitle: "No scheduling runs yet";
					emptyDescription: "Submit the scheduling form to generate the first entry.";
					table: {
						classes: "Classes";
						created: "Created";
						skipped: "Skipped";
						duplicates: "Duplicates";
						conflicts: "Conflicts";
					};
					actions: {
						view: "View exams";
					};
					details: {
						title: "Scheduled exams";
						subtitle: "Run executed on {{date}}";
						table: {
							exam: "Exam";
							course: "Course";
							class: "Class";
							type: "Type";
							date: "Date";
							status: "Status";
							locked: "Locked";
						};
					};
				};
			};
			gradeExport: {
				title: "Grade export";
				subtitle: "Export student grades by class and exam";
				filtersCard: {
					description: "Choose the academic year and class before exporting.";
					title: "Configuration";
				};
				filters: {
					academicYear: "Academic year";
					academicYearPlaceholder: "Select academic year";
					class: "Class";
					classPlaceholder: "Select class";
				};
				actions: {
					label: "Export";
					export: "Export grades";
					combinedLabel: "Combined grades";
					combinedExport: "Download combined workbook";
					examGroup: {
						filePrefix: "exam-grades";
						label: "Per-exam exports ({{count}})";
						scoreColumn: "Score";
						sheetName: "Exam scores";
					};
					pvLabel: "Grade report";
					pvExport: "Download grade report (Excel)";
				};
				exams: {
					title: "Select exams to include";
					emptyTitle: "No exams found";
					emptyDescription: "There are no exams created for this class yet.";
					loadingDescription: "Fetching all exams and their courses for this class.";
					loadingTitle: "Loading assessments…";
					selectedCount_one: "{{selected}} / {{count}} assessment selected";
					selectedCount_other: "{{selected}} / {{count}} assessments selected";
					searchPlaceholder: "Search a course or an assessment...";
					sort: {
						course: "By course";
						date: "By date";
						type: "By type";
					};
					courseCount_one: "{{selected}} / {{count}} assessment";
					courseCount_other: "{{selected}} / {{count}} assessments";
					noMatch: "No assessment found for “{{query}}”";
				};
				columns: {
					lastName: "Last name";
					firstName: "First name";
					registration: "Registration number";
					birthDate: "Birth date";
					birthPlace: "Birth place";
					gender: "Gender";
					code: "Code";
					title: "Title";
					coefficient: "Coef.";
					ueName: "UE name";
					credits: "Credits";
					course: "Course";
					type: "Type";
					date: "Date";
					excel: "Excel";
					pdf: "PDF";
				};
				sheetName: "Grades";
				filePrefix: "grades";
				unknownClass: "unknown-class";
				pv: {
					filePrefix: "pv-grades";
					legend: {
						headers: {
							course: "Course";
							exam: "Exam";
							weight: "Weight";
						};
						title: "Legend";
					};
					sheetName: "Verbal report";
					stats: {
						average: "Cohort average";
						notValidated: "Failed";
						students: "Students";
						successRate: "Pass rate";
						title: "Statistics";
						validated: "Passed";
					};
					table: {
						average: "Average";
						fullName: "Full name";
						rank: "Rank";
						title: "Results table";
					};
					title: "Verbal report";
					description: "Full report with every UE, averages and decisions";
					missingSemester: "Select a semester";
					semester: "Semester";
					semesterPlaceholder: "Select a semester";
					includeRetakes: "Include retake grades";
					previewPdf: "Preview PDF";
					generatePdf: "Generate PDF";
					excel: {
						documentTitle: "RESULTS VERBAL REPORT";
						ueHeader: "{{name}} ({{code}}) [{{credits}} cr.]";
						courseCc: "{{name}} CA";
						courseEx: "{{name}} EX";
						courseAverage: "Avg (×{{coefficient}})";
						ueAverage: "UE avg";
						credits: "Credits";
						decision: "Decision";
						totalCredits: "Total credits";
					};
				};
				toast: {
					semestersFetchError: "Could not load semesters";
					exportError: "Export failed";
					verbalReportError: "Verbal report export failed";
					examExportError: "Exam export failed";
					pvPreviewError: "Could not generate PV preview";
					pvGenerateError: "PV generation failed";
					evaluationPreviewError: "Could not generate evaluation preview";
					evaluationGenerateError: "Evaluation generation failed";
					uePreviewError: "Could not generate UE preview";
					ueGenerateError: "UE generation failed";
					bulkEvaluationsError: "Bulk evaluations generation failed";
					bulkUesError: "Bulk UE generation failed";
					ecGenerateError: "EC generation failed";
					ecPreviewError: "Could not generate EC preview";
					bulkExportError: "Bulk export failed";
				};
				bulk: {
					title: "Bulk export (ZIP)";
					description: "Generates a ZIP file holding every PDF, sorted by program and class. Filtered by the year and semester selected at the top of the page when set.";
					running: "Generating · {{seconds}}s";
					allClasses: "All classes";
					selectedClass: "Selected class";
					warning: "⚠️ Bulk generation can take several minutes depending on the volume (1 PDF ≈ 1-2 s). The server reuses a single Chromium browser to speed up the batch.";
					kinds: {
						eval: {
							title: "Assessments";
							short: "Assessments";
							description: "One PDF per exam. No eligibility check.";
						};
						ec: {
							title: "EC (course elements)";
							short: "EC";
							description: "One PDF per EC. Skipped automatically when weights ≠ 100%.";
						};
						ue: {
							title: "UE (teaching units)";
							short: "UE";
							description: "One PDF per UE × class × semester. Skipped automatically when the UE is incomplete.";
						};
					};
					report: {
						title: "Export report — {{kind}}";
						downloaded: "ZIP downloaded:";
						total: "Total candidates";
						generated: "Generated";
						skipped: "Skipped";
						skippedDetail: "Skipped items";
						id: "ID";
						reason: "Reason";
					};
				};
				ec: {
					title: "By EC";
					description: "PDF publication per course element (EC): combines every assessment (CA + practical + exam) with the EC average. The weights of the EC's exams must add up to 100%.";
				};
				ue: {
					title: "By teaching unit";
					description: "PDF publication per UE — requires a selected semester";
					creditsShort: "{{count}} cr.";
				};
				downloadAll: "Download all";
				evaluations: {
					title: "By assessment";
					description: "Individual export per selected assessment";
					downloadAllPdf: "Download all PDFs";
				};
				transcript: {
					description: "Combined Excel export with the average per course for the selected assessments";
					missingExams: "Select assessments";
					documentTitle: "TRANSCRIPT";
				};
				preview: {
					description: "HTML preview before PDF generation";
					pvWithRetakes: "Preview - Verbal report (with retakes)";
					pvWithoutRetakes: "Preview - Verbal report (without retakes)";
					evaluation: "Preview - Assessment publication";
					ue: "Preview - UE publication";
					ec: "Preview - EC publication";
				};
				header: {
					class: "Class:";
					program: "Program:";
					semester: "Semester:";
					academicYear: "Academic year:";
				};
				excel: {
					publicationTitle: "GRADE PUBLICATION - {{course}} ({{type}})";
					dateLine: "Date: {{date}}";
				};
				contextTitle: "Context";
			};
			students: {
				title: "Student management";
				actions: {
					openModal: "Add students";
				};
				filters: {
					allClasses: "All classes";
					searchPlaceholder: "Search by name or registration number";
					allGenders: "All genders";
					academicYear: "Academic year";
					class: "Class";
					search: "Search";
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
					actions: "Actions";
					viewLedger: "Credits";
					firstName: "First Name";
					lastName: "Last Name";
					registrationNumber: "Reg. Number";
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
						external: "External admission";
					};
				};
				form: {
					firstName: "First name";
					lastName: "Last name";
					email: "Email";
					dateOfBirth: "Date of birth";
					placeOfBirth: "Place of birth";
					gender: "Gender";
					genderPlaceholder: "Select gender";
					nationality: "Nationality";
					registration: "Registration number";
					registrationHint: "Leave blank to auto-generate the next available matricule.";
					registrationFormat: "Registration format";
					registrationFormatHint: "Choose a specific template to override the active format.";
					registrationFormatPlaceholder: "Use active format";
					registrationSection: "Registration";
					class: "Class";
					classPlaceholder: "Select class";
					submit: "Add student";
				};
				import: {
					classLabel: "Class for imported students";
					academicYearLabel: "Academic year (for auto-enrollment)";
					autoEnrollToggle: "Auto-enroll students in courses after import";
					formatLabel: "Registration format (optional)";
					fileLabel: "Upload CSV or XLSX file";
					downloadTemplate: "Download template";
					invalidFormat: "Missing required fields in this row";
					actions: {
						import: "Import students";
					};
					instructions: {
						gender: "Gender accepts: {{values}}.";
						admissionType: "Admission type accepts: {{values}}. Provide transfer columns for transfer/direct/equivalence admissions.";
						date: "Dates must use the ISO format YYYY-MM-DD.";
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
					errors: {
						invalidGender: 'Invalid gender "{{value}}". Allowed values: {{values}}.';
						invalidAdmissionType: 'Invalid admission type "{{value}}". Allowed values: {{values}}.';
						invalidTransferCredits: "Transfer credits must be a number between 0 and 300.";
						invalidDate: "Invalid date for {{field}}.";
						missingTransferData: "Missing required transfer data: {{fields}}.";
					};
					fields: {
						dateOfBirth: "Date of birth";
						admissionDate: "Admission date";
						transferInstitution: "Transfer institution";
						transferCredits: "Transfer credits";
						transferLevel: "Transfer level";
						admissionJustification: "Admission justification";
					};
					preview: {
						ready: "{{count}} row(s) ready to import.";
						errorsTitle: "Issues detected";
						noValidRows: "No valid rows detected. Check the errors above.";
					};
					autoEnrollError: "Auto-enrollment failed";
					autoEnrollSuccess: "Students auto-enrolled successfully";
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
				ledger: {
					title: "Credit overview";
					subtitle: "Tracking credits for {{student}}";
					loading: "Fetching ledger…";
					progressLabel: "Progress toward promotion";
					credits: "credits";
					required: "Required: {{required}}";
					inProgress: "In progress: {{value}}";
					ready: "Student is eligible for promotion 🎉";
					notReady: "Keep going! You're almost ready for promotion.";
					message: "Rules evaluated via json-rules-engine. Overrides will appear here once published.";
					entry: "Earned {{earned}} • In progress {{progress}}";
				};
				validation: {
					firstName: "First name is required";
					lastName: "Last name is required";
					email: "Enter a valid email address";
					registration: "Provide a registration number or leave the field blank";
					class: "Please select a class";
				};
				external: {
					info: {
						title: "External Student Admission";
						description: "Admit students from other institutions with transfer credits or direct admission";
					};
					form: {
						admissionType: "Admission type";
						admissionTypePlaceholder: "Select admission type";
						admissionTypeHint: "Choose the type of admission for this external student";
						transferInstitution: "Transfer institution";
						transferCredits: "Transfer credits";
						transferLevel: "Transfer level";
						admissionDate: "Admission date";
						admissionJustification: "Justification";
						admissionJustificationPlaceholder: "Explain the reason for this admission (minimum 10 characters)";
						admissionJustificationHint: "Provide a detailed justification for this external admission";
						studentInfoSection: "Student Information";
						submit: "Admit external student";
					};
					admissionTypes: {
						transfer: "Transfer";
						direct: "Direct admission";
						equivalence: "Equivalence";
					};
					toast: {
						success: "External student admitted successfully";
						error: "Could not admit external student";
					};
					validation: {
						admissionType: "Admission type is required";
						transferInstitution: "Transfer institution is required";
						transferCredits: "Transfer credits must be a number";
						transferLevel: "Transfer level is required (e.g., L1, L2, M1)";
						admissionDate: "Admission date is required";
						admissionJustification: "Justification must be at least 10 characters";
					};
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
					administrator: "Administrator";
					dean: "Dean";
					teacher: "Teacher";
					grade_editor: "Grade Editor";
					staff: "Staff";
					student: "Student";
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
					profileSection: "Profile";
					systemAccessSection: "System Access";
					canConnectLabel: "Can log in";
					canConnectDescription: "Creates a system account with login access";
					memberRoleLabel: "Role";
					memberRolePlaceholder: "Select a role";
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
					passwordMin: "Password must be at least 8 characters";
					memberRoleRequired: "Role is required when system access is enabled";
				};
			};
			enrollments: {
				title: "Enrollment management";
				subtitle: "Monitor cohorts and control enrollment windows.";
				selectYear: "Select academic year";
				selectClass: "Select class";
				selectSemester: "Select semester";
				allSemesters: "All semesters";
				filters: {
					year: "Academic year";
					class: "Class";
					summary: "Snapshot";
					studentsCount: "Students: {{value}}";
					cycle: "Cycle: {{value}}";
					cycleLevel: "Cycle level: {{value}}";
					option: "Option: {{value}}";
					window: "Window: {{status}}";
					semester: "Semester";
					labels: {
						students_one: "student";
						students_other: "students";
						cycle: "Cycle:";
						level: "Level:";
						option: "Option:";
						window: "Window:";
					};
				};
				listTitle: "Enrollments";
				fields: {
					student: "Student";
					status: "Status";
					dates: "Dates";
					actions: "Actions";
					statusValue: "{{value}}";
					enrolledAt: "Enrolled: {{value}}";
					exitedAt: "Exited: {{value}}";
					unknownStudent: "Unknown student";
					registrationFallback: "ID: {{value}}";
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
				autoEnroll: {
					button: "Enroll entire class";
					title: "Enroll every student?";
					description: "This action enrolls {{students}} students into {{courses}} courses. Existing enrollments remain untouched.";
					confirm: "Confirm enrollment";
				};
				toast: {
					updated: "Window updated";
					courseEnrolled: "Student enrolled in course";
					courseWithdrawn: "Enrollment updated";
					courseReactivated: "Enrollment restored";
					autoEnrollSuccess: "Class roster synced ({{count}} new records)";
				};
				courseRoster: {
					title: "Course roster (per student)";
					subtitle: "Select a student to review enrollment attempts, retakes, and status per course.";
					selected: "Managing: {{value}}";
					students: "Students in class";
					emptyStudents: "Select a class to view students.";
					courses: "Class courses";
					selectStudent: "Pick a student to manage course enrollments.";
					openModalBtn: "Open roster";
					teacher: "Teacher: {{value}}";
					notEnrolled: "Not enrolled";
					enrollBtn: "Enroll";
					reactivateBtn: "Restore enrollment";
					withdrawBtn: "Withdraw";
					retakeBtn: "Retake";
					noCourses: "This class has no courses assigned yet.";
					attemptBadge: "Attempt {{value}}";
					retakeEligible: "Retake eligible";
				};
				warnings: {
					title: "Prerequisite warnings";
					description: "Review these unmet prerequisites before confirming next steps.";
					mandatory: "Mandatory gap";
					recommended: "Recommended gap";
					corequisite: "Co-requisite in progress";
					courseFallback: "Course {{courseId}}";
					courseLabel: "{{name}} ({{code}})";
					appliesTo: "Required for {{course}}";
				};
				status: {
					all: "All statuses";
					active: "Active";
					pending: "Pending";
					completed: "Completed";
					withdrawn: "Withdrawn";
					graduated: "Graduated";
				};
				bulkEnroll: {
					classesLabel: "Classes ({{n}} selected)";
					description: "Select one or more classes. Every student of each class will be enrolled in all of its courses (all semesters). To target a specific semester, use “Enroll entire class” class by class.";
					noClasses: "No class for this year.";
					noSelection: "No selection";
					openButton: "Bulk enrollment";
					partial: "{{count}} enrollments created, {{err}} error(s).";
					requireYear: "Choose a year first";
					run: "Run enrollment";
					success: "{{count}} enrollments created across {{n}} class(es).";
					title: "Bulk enrollment";
					resultCreated: "{{created}} created";
					resultCreatedSkipped: "{{created}} created, {{skipped}} already existing";
				};
			};
			teachingUnits: {
				title: "Teaching units";
				subtitle: "Manage UE catalog, semesters, and prerequisites.";
				selectProgram: "Select program";
				programFacultySummary: "Faculty: {{value}}";
				new: "Create new UE";
				fields: {
					name: "Unit name";
					code: "Code";
					description: "Description";
					credits: "ECTS";
					programFaculty: "Faculty: {{value}}";
					programCycle: "Cycle : {{value}}";
					semester: "Semester";
					level: "Level";
				};
				semesters: {
					annual: "Annual";
					fall: "Semester 1";
					spring: "Semester 2";
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
				tabs: {
					details: "Details";
					courses: "Courses";
				};
				validation: {
					name: "Unit name is required.";
					code: "Unit code is required.";
					credits: "Credits must be zero or positive.";
					program: "Program is required.";
					required: "Select a teaching unit";
				};
				courses: {
					title: "Constitutive elements";
					subtitle: "Manage ECs tied to this teaching unit.";
					actions: {
						add: "Add element";
					};
					table: {
						name: "Name";
						code: "Code";
						hours: "Hours";
						teacher: "Default teacher";
						coefficient: "Coef.";
					};
					form: {
						createTitle: "Add element";
						editTitle: "Edit element";
						nameLabel: "Element name";
						namePlaceholder: "Enter the element name";
						codeLabel: "Code";
						codePlaceholder: "INF111";
						hoursLabel: "Hours";
						hoursPlaceholder: "Enter hours";
						teacherLabel: "Default teacher";
						teacherPlaceholder: "Select a teacher";
						coefficientLabel: "Default coefficient";
						coefficientPlaceholder: "1.00";
						coefficientHelp: "Default weight when assigning to a class";
						submit: "Save element";
					};
					empty: "No elements yet.";
					deleteTitle: "Delete element";
					deleteMessage: "This action cannot be undone.";
					validation: {
						name: "Element name is required.";
						code: "Course code is required.";
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
				programCycleSummary: "Cycle : {{value}}";
				noLevel: "Not set";
				levelHint: "Classes of this level receive the unit's courses when a year is imported.";
			};
			retake: {
				actions: {
					createRetake: "Create Retake Exam";
					viewEligibility: "View Eligibility";
				};
				createRetake: {
					date: "Retake Date";
					parentExam: "Exam original";
					scoringPolicy: "Scoring Policy";
					scoringPolicyHelp: "How to calculate the final grade when retake is completed";
					subtitle: "Create a retake session linked to the original exam";
					title: "Create Retake Exam";
				};
				eligible: "Eligible";
				eligibleCount: "{{count}} eligible";
				empty: {
					description: "Select an approved exam to view student eligibility.";
					title: "No students found";
				};
				featureDisabled: "Retake feature is currently disabled";
				ineligible: "Not Eligible";
				ineligibleCount: "{{count}} not eligible";
				override: {
					confirmMessage: "Are you sure you want to {{action}} this student for retake?";
					confirmTitle: "Confirm Override";
					forceEligible: "Force Eligible";
					forceIneligible: "Block";
					reason: "Override reason";
					reasonPlaceholder: "Enter reason for override...";
					remove: "Remove Override";
				};
				reasons: {
					ATTEMPT_LIMIT_REACHED: "Attempt limit reached";
					FAILED_EXAM: "Exam failed";
					NO_GRADE: "No grade recorded";
					OVERRIDE_FORCE_ELIGIBLE: "Forced eligible (override)";
					OVERRIDE_FORCE_INELIGIBLE: "Forced ineligible (override)";
					PASSED_EXAM: "Exam passed";
				};
				selectExam: "Select an approved exam";
				selectExamPlaceholder: "Choose an exam to view eligibility";
				subtitle: "View and manage students eligible for retake exams";
				table: {
					attempt: "Attempt";
					grade: "Score actuelle";
					override: "Override";
					reasons: "Reasons";
					registrationNumber: "Registration No.";
					status: "Status";
					student: "Student";
				};
				title: "Retake Eligibility";
				toast: {
					overrideError: "Could not apply override";
					overrideSuccess: "Override applied";
					removeError: "Could not remove override";
					removeSuccess: "Override removed";
				};
				searchPlaceholder: "Name or registration number…";
			};
			deliberations: {
				title: "Deliberations";
				subtitle: "Manage jury deliberations for classes";
				actions: {
					create: "New deliberation";
					open: "Open";
					close: "Close";
					sign: "Sign";
					reopen: "Reopen";
					compute: "Compute results";
					computing: "Computing...";
					export: "Export diplomation";
					exporting: "Exporting...";
					override: "Override decision";
					delete: "Delete";
				};
				columns: {
					class: "Class";
					semester: "Semester";
					year: "Academic year";
					type: "Type";
					status: "Status";
					date: "Date";
					actions: "Actions";
					createdAt: "Created";
				};
				status: {
					draft: "Draft";
					open: "Open";
					closed: "Closed";
					signed: "Signed";
				};
				type: {
					semester: "Semester";
					annual: "Annual";
					retake: "Retake";
				};
				decision: {
					admitted: "Admitted";
					compensated: "Compensated";
					deferred: "Deferred";
					repeat: "Repeat";
					excluded: "Excluded";
					pending: "Pending";
				};
				mention: {
					passable: "Pass";
					assez_bien: "Fairly good";
					bien: "Good";
					tres_bien: "Very good";
					excellent: "Excellent";
				};
				empty: {
					title: "No deliberations yet";
					description: "Create a deliberation to start evaluating student results for a class.";
				};
				form: {
					createTitle: "Create a deliberation";
					editTitle: "Edit deliberation";
					class: "Class";
					classPlaceholder: "Select a class";
					semester: "Semester";
					semesterPlaceholder: "Leave empty for annual";
					academicYear: "Academic year";
					type: "Type";
					typePlaceholder: "Select a type";
					deliberationDate: "Deliberation date";
					president: "President";
					presidentPlaceholder: "Select a president";
					juryMembers: "Jury members";
					quickStart: "Quick start";
					quickStartHint: "Creates the deliberation, opens it and computes results in one step";
					quickStartSubmit: "Create & compute";
					createDescription: "Configure and start a new deliberation session";
					tabSingle: "Single class";
					tabMulti: "Multi-classes";
					juryNumber: "Jury number";
					juryNumberPlaceholder: "e.g. J2024-001";
					classes: "Classes";
					selectYearFirst: "Select an academic year first";
					noClasses: "No class for this year";
					batchCreating: "Creating…";
					tabSingleClass: "Single class";
					tabMultiClass: "Multiple classes";
					batchSubmitCount_one: "Create for {{count}} class";
					batchSubmitCount_other: "Create for {{count}} classes";
					juryNumberExample: "e.g. J2024-001";
					batchErrorCount_one: "{{count}} error";
					batchErrorCount_other: "{{count}} errors";
					batchFailures: "Failed: {{names}}";
				};
				detail: {
					tabs: {
						results: "Results";
						jury: "Jury & Lifecycle";
						activity: "Activity";
					};
					back: "Back to deliberations";
					students: "Student results";
					noResults: "No results computed yet. Open the deliberation and compute results.";
					rank: "Rank";
					student: "Student";
					registrationNumber: "Reg. No.";
					average: "General avg.";
					credits: "Credits";
					creditsFormat: "{{earned}}/{{total}}";
					decision: "Decision";
					mention: "Mention";
					overridden: "Overridden";
					jury: "Jury composition";
					president: "President";
					noPresident: "Not assigned";
					stats: "Statistics";
					successRate: "Success rate";
					classAverage: "Class average";
					totalStudents: "Total students";
					lifecycle: "Lifecycle";
					openedAt: "Opened at";
					closedAt: "Closed at";
					signedAt: "Signed at";
					signedBy: "Signed by";
					notYet: "Not yet";
					juryNumber: "N° jury";
					fallbackTitle: "Deliberation";
				};
				override: {
					title: "Override decision";
					currentDecision: "Current decision";
					newDecision: "New decision";
					reason: "Reason";
					reasonPlaceholder: "Explain why you are overriding this decision...";
				};
				logs: {
					title: "Activity log";
					by: "by {{name}}";
					created: "Deliberation created";
					opened: "Deliberation opened";
					computed: "Results computed";
					override_decision: "Decision overridden";
					closed: "Results published to students";
					signed: "Deliberation signed";
					reopened: "Deliberation reopened (results hidden)";
					exported: "Diplomation exported";
					promoted: "Students promoted";
				};
				promote: {
					button: "Promote admitted";
					title: "Promote admitted students";
					description: "{{count}} admitted/compensated students will be enrolled in the target class";
					targetAcademicYear: "Target academic year";
					targetAcademicYearPlaceholder: "Select the next academic year";
					targetClass: "Target class";
					targetClassPlaceholder: "Select destination class";
					confirm: "Promote";
					success: "{{count}} students promoted successfully";
					noAdmitted: "No admitted students to promote";
					lastLevelTitle: "Last level of the cycle";
					lastLevelHint: "There is no next class: admitted students complete the cycle and are marked as graduated.";
					noTargetFound: {
						title: "title";
						searched: "searched";
						criteriaProgram: "Same program: {{program}}";
						criteriaLevel: "Next level after {{level}} (position {{nextIndex}})";
						criteriaYear: "criteriaYear";
						fix: "fix";
						goToClasses: "goToClasses";
					};
					ctaDesc: "Students with an 'Admitted' decision can be promoted to the next academic level.";
					ctaTitle: "Promote admitted students";
					targetClassHint_one: "{{count}} admitted student will be enrolled in this class.";
					targetClassHint_other: "{{count}} admitted students will be enrolled in this class.";
				};
				ueDecision: {
					ADM: "Acquired";
					CMP: "Compensated";
					AJ: "Failed";
					INC: "Incomplete";
				};
				toast: {
					createSuccess: "Deliberation created";
					updateSuccess: "Deliberation updated";
					deleteSuccess: "Deliberation deleted";
					transitionSuccess: "Status updated";
					computeSuccess: "Results computed successfully";
					overrideSuccess: "Decision overridden";
					exportSuccess: "Export ready";
					error: "An error occurred";
					initAndComputeSuccess: "Deliberation created and results computed";
					batchCreatedCount_one: "{{count}} deliberation created";
					batchCreatedCount_other: "{{count}} deliberations created";
					batchCreatedPartial_one: "{{created}} created, {{count}} error";
					batchCreatedPartial_other: "{{created}} created, {{count}} errors";
				};
				confirm: {
					delete: "Are you sure you want to delete this deliberation?";
					close: "Close this deliberation and publish results to students? Students will immediately see their deliberation decision. Grades will be locked.";
					sign: "Sign this deliberation? This marks it as officially validated.";
					reopen: "Reopen this deliberation? Results will be hidden from students and grades will become editable again.";
					closeTitle: "Close & publish to students?";
					signTitle: "Sign deliberation?";
					deleteTitle: "Delete deliberation?";
					reopenTitle: "Reopen deliberation?";
				};
				rules: {
					title: "Deliberation rules";
					subtitle: "Configure rules that automatically determine student decisions";
					create: "New rule";
					name: "Rule name";
					namePlaceholder: "e.g. Admission if average >= 10";
					description: "Description";
					category: "Category";
					categoryPlaceholder: "Select a category";
					categories: {
						admission: "Admission";
						compensation: "Compensation";
						deferral: "Deferral";
						repeat: "Repeat";
						exclusion: "Exclusion";
						other: "Other";
					};
					decision: "Decision produced";
					priority: "Priority";
					priorityHelp: "Lower number = evaluated first within the category";
					program: "Program scope";
					programPlaceholder: "All programs";
					cycleLevel: "Cycle level scope";
					cycleLevelPlaceholder: "All levels";
					deliberationType: "Deliberation type scope";
					deliberationTypePlaceholder: "All types";
					ruleset: "Rule definition (JSON)";
					rulesetHelp: "json-rules-engine format";
					active: "Active";
					inactive: "Inactive";
					invalidJson: "Invalid JSON ruleset";
					empty: {
						title: "No rules configured";
						description: "Add rules to automatically compute decisions during deliberations.";
					};
					toast: {
						createSuccess: "Rule created";
						updateSuccess: "Rule updated";
						deleteSuccess: "Rule deleted";
						error: "An error occurred";
					};
					confirmDelete: {
						title: "Delete this rule?";
						message: "message";
					};
				};
				filters: {
					allStatuses: "All statuses";
					allTypes: "All types";
					allYears: "All years";
				};
				excel: {
					program: "Program: {{value}}";
					class: "Class: {{value}}";
					academicYear: "Academic year: {{value}}";
					semester: "Semester: {{value}}";
					rank: "Rank";
					registrationNumber: "Registration no.";
					lastName: "Last name";
					firstName: "First name";
					ueAverage: "{{code}} Avg";
					ueDecision: "{{code}} Dec";
					ueCredits: "{{code}} Cr";
					generalAverage: "Overall avg";
					credits: "Credits";
					decision: "Decision";
					mention: "Mention";
					stats: "Success rate: {{rate}}% | Admitted: {{admitted}} | Compensated: {{compensated}} | Deferred: {{deferred}}";
					sheetName: "Deliberation";
					filePrefix: "Deliberation";
				};
			};
			gradeAccessGrants: {
				actions: {
					add: "Add delegate";
					grant: "Grant access";
					revoke: "Revoke access";
				};
				columns: {
					email: "Email";
					grantedBy: "Granted by";
					since: "Since";
					user: "User";
				};
				dialog: {
					description: "Select a user to grant institution-wide grade entry access.";
					selectLabel: "User";
					selectPlaceholder: "Select a user...";
					title: "Add grade delegate";
				};
				empty: {
					description: "No users have been granted institution-wide grade access yet.";
					title: "No delegates";
				};
				info: "Users listed here can submit grades for any exam in this institution, regardless of course assignment.";
				revoke: {
					message: "This user will no longer be able to submit grades unless they are the assigned teacher or have per-exam delegation.";
					title: "Revoke access";
				};
				subtitle: "Grant institution-wide grade entry access to specific users";
				title: "Grade Delegation";
				toast: {
					granted: "Grade access granted successfully.";
					revoked: "Grade access revoked.";
				};
			};
			institutions: {
				actions: {
					add: "Add institution";
				};
				delete: {
					message: "Are you sure you want to delete this institution? This action cannot be undone.";
					title: "Delete institution";
				};
				empty: {
					description: "Create your first institution to start organizing your academic structure.";
					title: "No institutions yet";
				};
				form: {
					createTitle: "Create institution";
					editTitle: "Edit institution";
					submit: "Create";
				};
				subtitle: "Manage universities, faculties and schools.";
				table: {
					code: "Code";
					nameEn: "Name (EN)";
					nameFr: "Name (FR)";
					shortName: "Short name";
					type: "Type";
				};
				title: "Institutions";
				toast: {
					createSuccess: "Institution created successfully";
					deleteSuccess: "Institution deleted successfully";
					updateSuccess: "Institution updated successfully";
					createError: "Could not create the institution";
					deleteError: "Could not delete the institution";
					updateError: "Could not update the institution";
				};
			};
			centers: {
				tabs: {
					identity: "Identity";
					logos: "Logos";
					instances: "Admin Instances";
					authorization: "Authorization";
					contact: "Contact";
				};
				detail: {
					title: "Center management";
					subtitle: "Configure vocational training centers";
					backToList: "Back to list";
				};
				sections: {
					identity: "General information";
					logos: "Logos";
					adminInstances: "Instances Administratives";
					authorization: "Authorization Texts";
					contact: "Contact details";
				};
				form: {
					shortName: "Center name (short)";
					city: "Location";
					name: "Full name (French)";
					nameEn: "Full name (English)";
					isActive: "Active center";
					logoUrl: "Center logo";
					logoUrlHint: "Shown in document headers.";
					adminInstanceLogoUrl: "Administrative instance logo (e.g. MINEFOP)";
					adminInstanceLogoUrlHint: "Main logo of the supervising authority.";
					watermarkLogoUrl: "Background logo (watermark)";
					watermarkLogoUrlHint: "Logo shown as a watermark on documents.";
					adminInstanceLogo: "Instance logo";
					showOnTranscripts: "Show the logo on transcripts";
					showOnTranscriptsHint: "The logo will appear in the header of transcripts";
					showOnCertificates: "Show the logo on attestations";
					showOnCertificatesHint: "The logo will appear in the header of certificates";
					authorizationOrderFr: "Authorization order (French)";
					authorizationOrderEn: "Authorization order (English)";
					postalBox: "P.O. box";
					contactPhone: "Phone";
					contactEmail: "Email";
					country: "Country";
					addressFr: "Address (FR)";
					addressEn: "Address (EN)";
					adminInstanceLogoSvg: "…or SVG code (takes priority)";
					logoSvg: "…or SVG code (takes priority)";
					watermarkLogoSvg: "…or SVG code (takes priority)";
					code: "Code";
					countryPlaceholder: "Cameroon";
				};
				actions: {
					addInstance: "Add an instance";
					addLegalText: "Ajouter";
					add: "Add a center";
				};
				adminInstances: {
					empty: "No administrative instance — click Add to create one.";
					itemTitle: "Instance #{{n}}";
					nameFr: "Name (French)";
					nameEn: "Name (English)";
					acronymFr: "Acronym (French)";
					acronymEn: "Acronym (English)";
				};
				legalTexts: {
					title: "Legal texts (Having regard to…)";
					empty: "No legal text";
					itemTitle: "Legal text #{{n}}";
					textFr: "Text (French)";
					textEn: "Text (English)";
				};
				toast: {
					deleteSuccess: "Center deleted";
					createSuccess: "Center created";
					updateSuccess: "Center updated";
				};
				title: "Nos centres";
				subtitle: "Configure your institution's professional training centers.";
				table: {
					logo: "Logo";
					code: "Code";
					name: "Name";
					city: "City";
					country: "Country";
					status: "Status";
				};
				empty: {
					title: "Aucun centre";
					description: "Create your first center to organize programs by campus.";
				};
				delete: {
					title: "Delete center";
					message: "Are you sure you want to delete this center? This action cannot be undone.";
				};
				validation: {
					required: "Required";
				};
			};
			graduation: {
				title: "Graduates";
				subtitle: "Students who completed their programme";
				totalGraduates: "Total graduates";
				searchPlaceholder: "Search by name or registration number…";
				table: {
					student: "Student";
					registration: "Registration no.";
					program: "Programme";
					level: "Level";
					credits: "Credits";
					graduatedAt: "Graduated on";
				};
				noResults: "No matching graduates";
				empty: "No graduates yet";
				noResultsHint: "Try another search.";
				emptyHint: "Students appear here once a deliberation graduates them.";
			};
			academicYearTransitions: {
				title: "Academic Year Transition";
				subtitle: "Prepare, review, approve, and execute the yearly destination of every student.";
				generatedAt: "Generated {{date}}";
				actions: {
					refresh: "Refresh";
					prepare: "Prepare plan";
					preparing: "Preparing...";
					submit: "Submit";
					approve: "Approve";
					execute: "Execute";
					cancel: "Cancel";
					resolve: "Resolve item";
					submitBlocked: "{{count}} blocked student(s) must be resolved first.";
					running: "Running…";
				};
				create: {
					title: "New transition";
					description: "Select the source year, target year, and scope. TKAMS will prepare every student outcome.";
				};
				plans: {
					title: "Plans";
				};
				fields: {
					sourceYear: "Source academic year";
					targetYear: "Target academic year";
					scope: "Scope";
					deferredPolicy: "Deferred decision policy";
				};
				placeholders: {
					sourceYear: "Select source year";
					targetYear: "Select target year";
					scope: "Select scope";
					search: "Search student or registration...";
					targetClass: "Select target class";
					reason: "Explain why this override is correct";
				};
				scope: {
					allClasses: "All classes in source year";
				};
				deferred: {
					review: "Send deferred students to review";
					repeat: "Treat deferred students as repeaters";
				};
				metrics: {
					students: "students";
				};
				summary: {
					total: "Total";
					promote: "Promoted";
					repeat: "Repeating";
					graduate: "Graduating";
					blocked: "Needs attention";
					overridden: "Overrides";
				};
				review: {
					title: "Review workspace";
					description: "Focus on blocked cases first. Open a row to inspect and resolve it.";
				};
				table: {
					student: "Student";
					decision: "Decision";
					source: "Source class";
					outcome: "Outcome";
					destination: "Destination";
					status: "Status";
				};
				item: {
					title: "Transition item";
				};
				resolve: {
					title: "Resolve exception";
					outcome: "Final outcome";
					targetClass: "Target class";
					reason: "Reason";
				};
				status: {
					draft: "Draft";
					ready: "Ready";
					pending_approval: "Pending approval";
					approved: "Approved";
					running: "Running";
					completed: "Completed";
					completed_with_errors: "Completed with errors";
					stale: "Stale";
					cancelled: "Cancelled";
				};
				itemStatus: {
					all: "All statuses";
					ready: "Ready";
					blocked: "Blocked";
					processing: "Processing";
					succeeded: "Succeeded";
					failed: "Failed";
					excluded: "Excluded";
				};
				outcome: {
					all: "All outcomes";
					promote: "Promote";
					repeat: "Repeat";
					graduate: "Graduate";
					exclude: "Exclude";
					transfer: "Transfer";
					suspend: "Suspend";
					review: "Needs attention";
				};
				decision: {
					admitted: "Admitted";
					compensated: "Admitted with compensation";
					deferred: "Deferred";
					repeat: "Repeat";
					excluded: "Excluded";
					pending: "Pending";
				};
				blocker: {
					missing_signed_deliberation: "Missing signed annual deliberation";
					missing_student_decision: "Missing student decision";
					existing_target_enrollment: "Existing target-year enrollment";
					missing_promotion_target: "Missing promotion target class";
					ambiguous_promotion_target: "Ambiguous promotion target";
					missing_repeat_target: "Missing repeat target class";
					ambiguous_repeat_target: "Ambiguous repeat target";
					deferred_requires_review: "Deferred decision requires review";
					pending_decision: "Pending decision";
				};
				empty: {
					noPlans: "No transition plan yet.";
					selectPlan: "Create or select a transition plan to start reviewing students.";
					noItems: "No students match the current filters.";
					notFound: "Transition plan not found.";
				};
				tabs: {
					students: "Students";
					readiness: "Readiness";
					audit: "Audit";
				};
				readiness: {
					comingSoon: "Class and student readiness diagnostics — coming soon.";
					title: "Class readiness";
					description: "Per-class breakdown of deliberation status and student blockers. Fix issues before submitting the plan.";
					classesReady: "classes ready";
					missingDeliberation: "missing deliberation";
					blockedStudents: "blocked students";
					class: "Class";
					deliberation: "Deliberation";
					ready: "Ready";
					blocked: "Blocked";
					total: "Total";
					issues: "Active blockers";
					signed: "Signed";
					missing: "Missing";
					empty: "No class data — plan has no items yet.";
					enrollments: "Enrolled students";
					incompleteCourses: "Course enrollments still in progress";
					preflightTitle: "Pre-launch check";
					signedDelibs: "Signed deliberations";
					unlockedExams: "Approved exams not locked";
				};
				audit: {
					comingSoon: "Audit trail — coming soon.";
					title: "Audit trail";
					description: "Chronological log of every action taken on this transition plan.";
					empty: "No audit events yet.";
					action: {
						created: "Plan created";
						submitted: "Submitted for approval";
						approved: "Approved";
						executed: "Execution started";
						completed: "Completed successfully";
						completed_with_errors: "Completed with errors";
						cancelled: "Cancelled";
						stale: "Marked stale";
						override: "Decision overridden";
					};
				};
				toast: {
					created: "Transition plan created";
					updated: "Transition updated";
					resolved: "Transition item resolved";
					submitted: "Plan submitted for approval.";
					approved: "Plan approved — ready to execute.";
					executed: "Execution started.";
					cancelled: "Plan cancelled.";
				};
				duplicateWarning: "An active plan already exists for this year pair.";
				duplicateWarningLink: "View existing plan";
				step: {
					draft: "Draft";
					pendingApproval: "Pending approval";
					approved: "Approved";
					running: "Running";
					completed: "Completed";
				};
			};
			gradeScale: {
				title: "Grade Scale";
				description: "Configure the validation threshold and mention bands used in deliberations, transcripts, and exports.";
				scopeLabel: "Apply to";
				institutionDefault: "Institution default";
				passThreshold: "Pass threshold (/20)";
				compensationThreshold: "Compensation threshold (/20)";
				mentionRanges: "Mention bands";
				rangeHint: "Each mention is assigned when the average ≥ the minimum threshold (descending order).";
				saved: "Scale saved.";
				key: "Key";
				labelFr: "Label (FR)";
				labelEn: "Label (EN)";
				letter: "Letter";
				min: "Min (/20)";
				preview: "Preview";
				previewPlaceholder: "Enter a score";
				previewNoMatch: "Below lowest threshold";
				overlapError: "Two mention bands share the same minimum — fix before saving.";
				inheritedFromInstitution: "No program override defined — displaying institution default.";
			};
			attendance: {
				overview: {
					classLabel: "Class";
					classPlaceholder: "Select a class";
					emptyTitle: "Select a class and year";
					emptyDescription: "Choose an academic year and class to see attendance rates for all courses.";
					noData: "No courses found for this class";
					course: "Course";
					code: "Code";
					sessions: "Sessions";
					rate: "Rate";
					threshold: "Threshold";
				};
			};
			examParticipation: {
				academicYear: "Academic year";
				classCourse: "Class course";
				classCourseLabel: "Select a class course";
				exam: "Exam";
				examPlaceholder: "Select an exam";
				emptyTitle: "Select an exam";
				emptyDescription: "Choose a class course and exam to view or generate the participation roster.";
				generate: "Generate Roster";
				lock: "Lock Roster";
				locked: "Roster locked";
				eligible: "eligible";
				exempted: "exempted";
				yes: "Eligible";
				no: "Ineligible";
				override: "Override";
				noRosterTitle: "No roster yet";
				noRosterDescription: 'Click "Generate Roster" to compute eligibility from attendance data.';
				columns: {
					student: "Student";
					regNumber: "Reg. No.";
					eligible: "Eligible";
					reason: "Reason";
					actions: "Actions";
				};
				overrideDialog: {
					title: "Override eligibility";
					reason: "Reason (optional)";
					reasonPlaceholder: "Explain the override...";
				};
			};
			timetable: {
				copyDialog: {
					title: "Copy Timetable";
					description: "Copies sessions from another academic year into the currently selected target year.";
					sourceYear: "Source year";
					sourceYearPlaceholder: "Select the year to copy from";
					previewSummary_one: '{{count}} session from "{{sourceYearName}}" to "{{targetYearName}}"';
					previewSummary_other: '{{count}} sessions from "{{sourceYearName}}" to "{{targetYearName}}"';
					confirm: "Start copy";
					success: "Copy started successfully";
					noTargetYear: "First select a target year in the filters";
				};
			};
			dataImport: {
				guided: {
					title: "Setup & data import";
					description: "Set up your institution step by step: its profile, its academic structure, then the data of each year. Each step can be done by Excel import or by hand.";
					how: {
						order: {
							title: "In order";
							text: "First the profile and the foundations (once), then each year, from the oldest to the most recent.";
						};
						template: {
							title: "One template per step";
							text: "The Excel template is pre-filled with your data and offers the known codes in dropdown lists.";
						};
						checked: {
							title: "Checked before saving";
							text: "Each file is checked row by row; you see what will be created or changed before confirming.";
						};
					};
					status: {
						done: "Done";
						skipped: "Skipped";
						todo: "To do";
					};
					steps: {
						foundation: {
							cycles: "Cycles & levels";
							programs: "Programs & options";
							curriculum: "Teaching units & courses";
						};
						year: {
							classes: "Classes";
							students: "Students & enrollments";
							courses: "Class courses";
							exams: "Exams";
							grades: "Grades";
							close: "Closing";
							decisions: "Official decisions";
							teachers: "Teachers";
							guardians: "Parents";
							fees: "Fees";
						};
					};
					stepDescriptions: {
						foundation: {
							cycles: "Study cycles (Bachelor, Master, BTS…) and their levels (L1, L2, L3…). Everything else depends on them.";
							programs: "Programs attached to a cycle, and their options or tracks.";
							curriculum: "The curriculum: the teaching units of each program and their courses.";
						};
						year: {
							classes: "The classes (cohorts) of the year: each one belongs to a program, an option and a level of its cycle.";
							students: "The students of the year and their class. A student already known from another year is found again by registration number, email, or name and date of birth: one record per person, one enrollment per year.";
							courses: "Each class receives the courses of its level in the curriculum, with a placeholder teacher when none is known. The file is optional: it gives teachers and coefficients, adds a course outside the curriculum or marks one not taught. Students are enrolled in the courses of their class.";
							exams: "Describe the evaluation model once (e.g. CA 40 %, Exam 60 %, Retake replacing the Exam): it creates the exams of every course. The Exceptions sheet adjusts one course.";
							grades: "The template has one sheet per class, like a results report: one row per student, one column per course and exam, already filled with the known grades.";
							close: "Once the grades are in, close the year: the deliberations of each class are computed and left open so you can review them.";
							decisions: "Optional: import the jury decisions of the results reports. Gaps with the computed decisions are listed; importing keeps the official decision, traced as an override.";
							teachers: "Optional: the teachers, created without an account (one can be given later from the users page). They are then found by email when assigning courses.";
							guardians: "Optional: the parents and guardians of the students of the year, one row per parent ↔ student link.";
							fees: "Optional: what each student owed for the year and what was paid, as a total or payment by payment. Statuses (paid, partial, unpaid) are recomputed.";
						};
					};
					yearSteps: {
						classes: "Classes";
						assignments: "Assignments";
						enrollments: "Enrollments";
						exams: "Exams";
						grades: "Grades";
					};
					progress: {
						title: "Setup: {{done}}/{{total}} steps";
						ready: "Your institution is ready";
						next: "Next step: {{label}}";
						readyHint: "You can bring in past years from the data import.";
						hide: "Hide";
						continue: "Continue";
						continueSetup: "Continue the setup";
					};
					milestones: {
						profile: "Institution profile";
						year: "Academic year";
						classes: "Classes {{year}}";
						classesNoYear: "Classes of the year";
						enrollments: "Enrollments {{year}}";
						enrollmentsNoYear: "Enrollments";
					};
					profile: {
						title: "1. Institution profile";
						text: "The name, logo and contact details appear on transcripts, certificates and lists. Faculties and centres are also created from the Institution page.";
						name: "Name";
						logo: "Logo";
						contact: "E-mail or phone";
						address: "Address";
						complete: "Complete the profile";
						edit: "Edit";
					};
					foundations: {
						title: "2. Foundations";
						text: "The academic structure of the institution, imported once and in this order. Each step builds on the previous one.";
						start: "Start";
						review: "Review / complete";
					};
					years: {
						title: "3. Academic years";
						text: "The data of each year, from the oldest to the most recent. The import of a year (classes, students and enrollments, courses, exams, grades) is being designed; for now each year shows what it already contains.";
						add: "Manage years";
						foundationsFirst: "Finish the foundations first: the classes of a year rely on programs and levels.";
						empty: "No academic year. Create the first one to start.";
						active: "Active";
						import: "Import";
						resume: "Resume";
					};
					stepPage: {
						back: "Setup & data import";
						position: "Foundations · step {{index}}/{{total}}";
						previousMissing: "The step “{{label}}” is not done yet: references to its data will be reported as errors.";
						goThere: "Go there";
						otherOptions: "Other options:";
						manual: "Enter manually";
						reactivate: "Reactivate this step";
						notApplicable: "This step does not apply to my institution";
					};
					phases: {
						prepare: "Prepare the file";
						review: "Check";
						done: "Imported";
					};
					prepare: {
						downloadTitle: "① Download the template";
						downloadText: "The template already contains the existing data: complete it, correct it if needed, then send it back. Existing rows are updated (matched by their code), new ones are created.";
						download: "Download the pre-filled template";
						sheet: "Sheet “{{name}}”";
						requiredNote: "* required. The template dropdowns offer the codes already known.";
						uploadTitle: "② Send the filled file";
						uploadText: "Nothing is saved at this stage: the file is first checked row by row, then you confirm the import.";
					};
					drop: {
						checking: "Checking {{name}}…";
						hint: "Drop the filled file here, or click to choose it";
						accept: "Excel (.xlsx), 10 MB max";
					};
					review: {
						create: "to create";
						update: "to update";
						unchanged: "unchanged";
						skipped: "ignored (errors)";
						errorRows: "{{count}} row(s) contain errors";
						errorRowsHint: "and will not be imported. Fix them in {{file}} and send it again, or import the valid rows now.";
						theFile: "the file";
						noError: "The file contains no error.";
						another: "Send another file";
						nothing: "Nothing to import";
						import: "Import {{count}} row(s)";
						annotated: "Download the annotated file";
						annotatedName: "{{name}} - annotated.xlsx";
					};
					issues: {
						errors: "Errors ({{count}})";
						warnings: "Warnings ({{count}})";
						sheet: "Sheet";
						row: "Row";
						column: "Column";
						problem: "Problem";
						codes: {
							missingSheet: 'Sheet "{{sheet}}" is missing from the file: nothing is imported from it.';
							missingColumn: 'Required column "{{column}}" not found in the header.';
							required: "Required value missing.";
							enum: '"{{value}}" is not allowed ({{allowed}}).';
							integer: '"{{value}}" must be a whole number.';
							number: '"{{value}}" must be a number.';
							email: '"{{value}}" is not a valid email address.';
							date: '"{{value}}" is not a date (dd/mm/yyyy or yyyy-mm-dd).';
							duplicate: "Duplicate: already on row {{row}}.";
							unknownProgram: 'Unknown program "{{value}}": import it in the Foundations first.';
							programWithoutCycle: "Program {{value}} has no cycle, so its levels are unknown: set its cycle in the Foundations.";
							unknownLevel: 'Level "{{value}}" is not a level of cycle {{cycle}} ({{allowed}}).';
							unknownOption: 'Option "{{value}}" does not exist in program {{program}}.';
							classNameTaken: "Name already used by class {{code}} in this program and year.";
							unknownClass: "Class {{value}} unknown for {{year}}: import it at the Classes step.";
							unknownGender: '"{{value}}" is not M or F: left empty.';
							ambiguousStudent: "Several known students match this row ({{candidates}}): give the registration number.";
							registrationMismatch: "This person is already known as {{student}}: registration number {{value}} does not match.";
							noRegistrationFormat: "No registration number given, and no active registration number format to generate one.";
							unknownCourse: "Course {{value}} is not in the curriculum of the program of {{class}}.";
							unknownTeacher: "No teacher with email {{value}}: the course is kept without teacher.";
							unitsWithoutLevel: "Teaching units without level, their courses are not proposed: {{units}}. Set their level in the Foundations (UE & EC).";
							coursesWithoutTeacher: "{{count}} course(s) without teacher: they can be assigned later.";
							unknownRetakeTarget: '"{{value}}" is not an exam type of the model.';
							weightsNot100: "The weights of the model add up to {{total}} %, not 100 %.";
							noClassCourses: "{{year}} has no class courses yet: import them at the Class courses step.";
							unknownClassCourse: "Course {{course}} is not taught in class {{class}}.";
							examLocked: "The {{type}} exam of {{course}} is locked: left unchanged.";
							sheetNotAClass: 'Sheet "{{sheet}}" is not a class of {{year}}: ignored.';
							unknownExam: 'Course {{course}} has no "{{value}}" exam: add it at the Exams step.';
							studentNotInClass: "No student {{value}} enrolled in {{class}} this year.";
							notEnrolledInCourse: "{{value}} is not enrolled in {{course}}.";
							invalidScore: '"{{value}}" is not a grade between 0 and {{max}} (or ABS).';
							duplicateGrade: "This grade is given twice in the file.";
							absencesAsZero: "{{count}} absence(s) (ABS) recorded as 0.";
							yearNotClosed: "{{year}} has no computed deliberation yet: close the year first.";
							unknownDecision: '"{{value}}" is not a known jury decision.';
							noDeliberationResult: "No deliberation result for {{value}} in {{year}}.";
							deliberationNotOpen: "The deliberation of this student is closed: it cannot be changed.";
							decisionGap: 'Official decision "{{value}}" differs from the computed one ({{computed}}).';
							ambiguousTeacher: "Several teachers are named {{name}}: give the email.";
							studentNotInYear: "No student {{value}} enrolled in {{year}}.";
							unknownRelationship: '"{{value}}" is not a known relationship (Father, Mother, Guardian, Uncle, Aunt, Other).';
							guardianContactMissing: "An email or a phone number is required.";
							invalidAmount: '"{{value}}" is not an amount.';
							noFeeForStudent: "No amount due for this student: add a row to the Frais sheet.";
							unknownUnit: 'Teaching unit "{{value}}" unknown for this program: add it to the {{sheet}} sheet.';
							unknownDefaultTeacher: 'No teacher "{{value}}": the course is imported without default teacher.';
							unknownCycleInFile: 'Unknown cycle "{{value}}": add it to the {{sheet}} sheet.';
							levelOrderTaken: "Order {{order}} is already taken by level {{level}} of this cycle.";
							unknownCycle: 'Unknown cycle "{{value}}": import it at the Cycles & levels step first.';
							programNameTaken: "This name is already used by program {{code}}.";
							programWithoutCycleWarning: "Without a cycle, the program's levels cannot be offered to its classes.";
							unknownProgramInFile: 'Unknown program "{{value}}": add it to the {{sheet}} sheet.';
							courseWeightsOver100: "{{course}}: with its other exams ({{exams}}) the weights add up to {{total}} %. Remove those exams or adjust the model.";
						};
						changes: "Changes ({{count}})";
					};
					done: {
						title: "Import complete";
						sheet: "{{sheet}}: {{created}} created, {{updated}} updated";
						another: "Import another file";
						log: "View the log";
						next: "Next step: {{label}}";
						back: "Back to the setup";
					};
					runFailed: "The import did not complete correctly. Check the job details.";
					manualTitle: {
						profile: "Institution profile";
						foundation: {
							cycles: "Study cycles";
							programs: "Programs";
							curriculum: "Teaching units";
						};
						year: "Academic years";
					};
					yearImport: {
						title: "Import {{year}}";
						steps: "Steps of the year";
						kind: {
							past: "Past year";
							current: "Current year";
						};
						kindText: {
							past: "This year is over: it is imported as history. Enrollments are closed and students keep their current class unless this year is their most recent one.";
							current: "This year is in progress: enrollments are active and students are placed in the imported class.";
						};
						count: {
							year: {
								classes_one: "{{count}} class";
								classes_other: "{{count}} classes";
								students_one: "{{count}} enrollment";
								students_other: "{{count}} enrollments";
								courses_one: "{{count}} course";
								courses_other: "{{count}} courses";
								exams_one: "{{count}} exam";
								exams_other: "{{count}} exams";
								grades_one: "{{count}} grade";
								grades_other: "{{count}} grades";
								close_one: "{{count}} deliberation";
								close_other: "{{count}} deliberations";
								decisions_one: "{{count}} official decision";
								decisions_other: "{{count}} official decisions";
								teachers_one: "{{count}} teacher assigned";
								teachers_other: "{{count}} teachers assigned";
								guardians_one: "{{count}} parent link";
								guardians_other: "{{count}} parent links";
								fees_one: "{{count}} fee record";
								fees_other: "{{count}} fee records";
							};
						};
						optional: "optional";
					};
					sheetHelp: {
						year: {
							classes: {
								"0": "One class per row, for the imported year.";
							};
							students: {
								"0": "One student per row, with their class of the year. A known student is found by registration number, email, or name, first name and date of birth.";
							};
							courses: {
								"0": "Optional: each class already receives the courses of its level in the curriculum. A row gives the teacher, fixes a coefficient, adds a course outside the curriculum or removes a course not taught this year.";
							};
							exams: {
								"0": "The evaluation model applied to every course of the year: one exam type per row with its weight. A retake names the exam it replaces.";
								"1": "Optional: one row per exam of a course that departs from the model (weight, date) or is not held.";
							};
							grades: {
								"0": 'One sheet per class, named by its code: one row per student (registration number), one column per course and exam ("INF111 | CA"). Grade from 0 to 20, comma or dot; ABS for an absent student (counts 0); empty = no grade.';
								"1": "Other accepted format: one grade per row, for exports of other software.";
							};
							decisions: {
								"0": "Optional, after closing the year: the jury decision of each student as written in the results report. Gaps with the computed decisions are reported; importing keeps the official decision.";
							};
							teachers: {
								"0": "Optional: one teacher per row. Found again by email, else by last and first name; created without an account (one can be given later).";
							};
							guardians: {
								"0": "Optional: one row per parent ↔ student link. A parent is found again by email, else by phone; one of the two is required.";
							};
							fees: {
								"0": "Optional: one row per student with the amount due for the year, the discount if any and the total paid (when payments are not detailed in the Paiements sheet).";
								"1": "Optional: payment details, one row per payment. A payment already recorded (same date, amount and reference) is not created again.";
							};
						};
						foundation: {
							cycles: {
								"0": "One cycle per row (Bachelor, Master, BTS…).";
								"1": "The levels of each cycle, in order (L1, L2, L3…).";
							};
							programs: {
								"0": "One program per row.";
								"1": 'The options (tracks) of each program. Each program automatically gets a "default" option when none is declared.';
							};
							curriculum: {
								"0": "The teaching units of each program.";
								"1": "The courses of each teaching unit.";
							};
						};
					};
					columnHelp: {
						year: {
							classes: {
								code: "E.g. IGL-L1. Unique within the year.";
								optionCode: "Empty: the program's default option.";
								levelCode: "Level of the program's cycle (e.g. L1, M2).";
							};
							students: {
								registrationNumber: "Empty: generated with the institution's registration number format.";
								dateOfBirth: "dd/mm/yyyy";
								gender: "M or F";
								classCode: "Class of the student for the imported year.";
							};
							courses: {
								remove: '"yes": the course is not created for this class (an existing course is never deleted).';
							};
							exams: {
								percentage: "Empty for a retake (it takes the weight of the exam it replaces).";
								retakeOf: "For a retake: the exam type it replaces (e.g. Exam).";
								policy: "Retake: its grade replaces the exam's, or the best of both is kept.";
								date: "dd/mm/yyyy";
								remove: '"yes": this exam is not created for this course.';
							};
							decisions: {
								decision: "Passed, Passed by compensation, Deferred, Repeat, Excluded (or ADM, ADC, AJ, RED, EXC).";
							};
							guardians: {
								relationship: "Father, Mother, Guardian, Uncle, Aunt, Other";
								primary: '"yes" for the parent to contact first.';
							};
							fees: {
								date: "dd/mm/yyyy";
								method: "Cash, Transfer, Mobile money, Check";
							};
						};
						foundation: {
							curriculum: {
								"0": {
									code: "E.g. INF111";
								};
								"1": {
									code: "E.g. INF111-EC1";
									coefficient: "1 by default";
									teacherEmail: "Default teacher";
								};
								levelCode: "Level where the unit is taught (e.g. L1): its courses are proposed to the classes of that level.";
							};
							cycles: {
								"0": {
									code: "E.g. LIC, MAS, BTS";
									credits: "180 for an LMD Bachelor";
								};
								"1": {
									code: "E.g. L1, L2, M1";
									order: "1 for the first year of the cycle";
									minCredits: "60 by default";
								};
							};
							programs: {
								"0": {
									code: "E.g. INF, GL, SIN";
									cycleCode: "Cycle imported at the Cycles & levels step";
								};
								"1": {
									code: "E.g. GEN, RES, AI";
								};
							};
						};
					};
					close: {
						title: "Close the year";
						text: "Computes the results of the year from the imported grades. You can run it again after a correction.";
						lock: "The exams of this past year are approved and locked.";
						credits: "The credits of every student are recomputed.";
						deliberations: "One annual deliberation per class is computed and left open for review.";
						noGrades: "No grade has been imported for this year yet.";
						run: "Close the year";
						again: "Recompute";
						done: "Year closed";
						report: "{{locked}} exam(s) locked, {{students}} student(s) recomputed, deliberations: {{created}} created, {{recomputed}} recomputed, {{skipped}} already closed.";
						review: "Review the deliberations";
						next: "Compare with official decisions";
					};
					changes: {
						none: "Nothing to create or update.";
						action: "Action";
						what: "Row";
						values: "Values (before → after)";
						create: "Create";
						update: "Update";
						truncated: "The first {{shown}} of {{total}} changes are shown.";
					};
					history: {
						title: "Imports of this year";
						counts: "{{created}} created, {{updated}} updated";
						undo: "Undo";
						undoTitle: "Undo the import « {{step}} »?";
						undoText: "What it created ({{created}}) is deleted and what it changed ({{updated}}) gets its former value back. It is refused while a later import depends on it.";
						undoFailed: "The import could not be undone.";
						undone: "Import undone";
						undoneBadge: "Undone";
						blocked: "Data added since depends on this import: undo the later imports first.";
						notUndoable: "Cannot be undone";
						undoConfirm: "Undo the import";
						keep: "Keep it";
					};
					workbook: {
						title: "All of the year in one workbook";
						text: "Optional: drop a workbook holding the sheets of several steps (Classes, Étudiants, Cours, Modèle, one sheet per class for grades…). Each step then checks its own sheets from it, in order.";
						covers: "covers: {{steps}}";
						forget: "Remove";
						nothing: "No sheet of this workbook matches a step of the year.";
						inWorkbook: "In the year's workbook";
						stepCovered: "The workbook {{name}} holds the sheets of this step.";
						check: "Check them";
					};
				};
			};
			documents: {
				kinds: {
					diploma: {
						label: "Diploma";
						description: "Official state diploma";
					};
					transcript: {
						label: "Transcript";
						description: "Official transcript of the student's grades";
					};
					student_list: {
						label: "Student list";
						description: "Roster for this class (configurable columns)";
					};
					attestation: {
						label: "Attestation";
						description: "Certificate of success or enrollment";
					};
				};
				classTemplates: {
					toast: {
						assigned: "Template assigned";
						assignError: "Assignment failed";
						removed: "Assignment removed: the class will use the default template";
						previewError: "Preview failed";
						seedCreated: "System templates created: {{created}}";
						seedCreatedWithSkipped: "System templates created: {{created}} (already present: {{skipped}})";
						seedAlreadyPresent: "System templates already present";
						seedError: "Failed to create the system templates";
						noTemplate: "No template available: create the system templates first";
					};
					previewSubtitle: '{{classLabel}} · sample data: use "Generate" on the student record to produce the final document';
					title: "Document templates per class";
					subtitle: "Choose the diploma, transcript and attestation template for each class. You can override the theme per class (colors, fonts, sizes, etc.) without changing the institution template.";
					seedCreate: "Create system templates";
					seedReset: "Reset system templates";
					targetClass: {
						title: "Target class";
						description: "Select the class to configure. If nothing is assigned, the program or institution default template applies.";
						placeholder: "Choose a class...";
					};
					card: {
						assigned: "Assigned";
						institutionDefault: "Institution default";
						templateUsed: "Template used";
						templatePlaceholder: "(institution default)";
						customTheme: "Custom theme for this class";
						noTemplateHint: "No template available: create the system templates first";
						editThemeHint: "Edit this class's theme";
						createThemeHint: "Create a customization for this class (uses the default template)";
						customizeTheme: "Customize theme";
						preview: "Preview";
						reset: "Reset";
					};
					editor: {
						title: "Customize · {{kind}}";
						subtitle: "{{classLabel}} · overrides apply to this class only";
						modifiedGroups_one: "{{count}} group modified";
						modifiedGroups_other: "{{count}} groups modified";
						preview: "Preview";
						refreshPreview: "Refresh preview";
						livePreview: "Live preview";
						previewHint: 'Click "Refresh preview" to render the document';
					};
				};
				preview: {
					title: "Document preview";
					downloadHtml: "Download HTML";
					frameTitle: "Preview";
					fileName: "document-preview";
				};
				bulk: {
					summary: "{{ok}} OK · {{error}} failed";
					failuresTitle_one: "{{count}} failure";
					failuresTitle_other: "{{count}} failures";
					status: {
						pending: "Pending";
						running: "Generating";
						ok: "OK";
						error: "Failed";
					};
					title: "Bulk generation";
					subtitle: "Generated in the browser. <strong>Do not close the tab</strong> during the operation.";
					previewTitle: "Preview: {{kind}} ({{student}})";
					templateUsed: "Template used: <strong>{{name}}</strong>";
					previewDescription: "HTML rendering with real data, without PDF rasterization.";
					toast: {
						previewError: "Preview failed";
						noSelection: "No student selected";
						zipError: "ZIP bundling failed: {{error}}";
						generated_one: "{{count}} document generated";
						generated_other: "{{count}} documents generated";
						noStudentToPreview: "No student to preview";
					};
					filters: {
						title: "Filters";
						description: "Choose the document type, the academic year and the class.";
						type: "Type";
						period: "Period";
						annual: "Annual";
						semester: "Semester-based";
						semesterLabel: "Semester";
						latest: "Most recent";
						academicYear: "Academic year";
						allYears: "All";
						class: "Class";
						classPlaceholder: "Choose a class…";
					};
					students: {
						title: "Students";
						count_one: "{{count}} student in this class.";
						count_other: "{{count}} students in this class.";
						selected_one: "{{count}} selected.";
						selected_other: "{{count}} selected.";
						zip: "ZIP";
						demoMode: "Demo mode";
						previewHint: "Preview the document for the first selected student";
						preview: "Preview";
						generate: "Generate {{count}}";
						generating: "Generating…";
						empty: "No students in this class.";
					};
					table: {
						selectAll: "Select all";
						selectOne: "Select {{name}}";
						registrationNumber: "Registration no.";
						lastName: "Last name";
						firstName: "First name(s)";
						status: "Status";
						preview: "Preview";
						previewFor: "Preview for {{name}}";
					};
				};
				generate: {
					trigger: "Generate an academic document";
					htmlPreviewTitle: "HTML preview: {{kind}}";
					toast: {
						success: "Document generated and downloaded";
						error: "Generation failed";
					};
					title: "Generate a document";
					description: "For <strong>{{name}}</strong>. The template used is the one assigned to the class (otherwise the institution default).";
					kind: "Document type";
					format: "Format";
					formatPdf: "PDF";
					formatHtml: "HTML (preview)";
					demoMode: "Demo mode";
					demoModeHint: 'Adds a "DEMO" watermark';
					submit: "Generate";
				};
				theme: {
					groups: {
						fonts: {
							label: "Fonts";
							description: "Choose the font for each area (title, body, header, etc.)";
						};
						sizes: {
							label: "Text sizes";
							description: "Sizes in points (pt): adjust for readability.";
						};
						colors: {
							label: "Colors";
							description: "Main colors and accents.";
						};
						borders: {
							label: "Borders";
							description: "Width of the decorative borders in pixels.";
						};
						logos: {
							label: "Logos";
							description: "Logo sizes and offsets in pixels.";
						};
						qrCode: {
							label: "QR code";
							description: "QR code display and size.";
						};
						titleEffects: {
							label: "Title effects";
							description: "Title shadow, spacing and height.";
						};
						spacing: {
							label: "Spacing";
							description: "Margins between sections (mm).";
						};
						display: {
							label: "Display";
							description: "Bilingual, main language, visual options.";
						};
						watermark: {
							label: "Watermark";
							description: "Watermark text and logo (ORIGINAL, etc.).";
						};
						page: {
							label: "Page format";
							description: "Paper size, orientation and margins (mm).";
						};
						table: {
							label: "Table";
							description: "Appearance of the tables in the transcript.";
						};
					};
					tabs: {
						typography: "Typography";
						colors: "Colors";
						sizes: "Sizes";
						options: "Options";
					};
					fields: {
						main: "Main";
						title: "Title";
						subtitle: "Subtitle";
						header: "Header";
						legalText: "Legal text";
						studentName: "Student name";
						studentInfo: "Student info";
						footer: "Footer";
						signature: "Signature";
						mention: "Honors";
						reference: "Reference";
						body: "Body";
						table: "Table";
						tableHeader: "Table header";
						tableBody: "Table body";
						primary: "Primary";
						secondary: "Secondary";
						accent: "Accent";
						fullName: "Full name";
						matricule: "Registration no.";
						diplomaTitle: "Diploma title";
						yearObtention: "Year obtained";
						juryDates: "Jury dates";
						outerBorder: "Outer border";
						innerBorder: "Inner border";
						tableHeaderBg: "Header background";
						tableHeaderText: "Header text";
						tableBorder: "Table border";
						alternateRow: "Alternate row";
						passingGrade: "Passing grade";
						failingGrade: "Failing grade";
						border: "Border";
						content: "Content";
						summary: "Summary";
						referenceNumber: "Reference no.";
						outerWidth: "Outer width";
						innerWidth: "Inner width";
						rowHeight: "Row height";
						borderWidth: "Border width";
						alternateRows: "Alternate rows";
						showCoefficient: "Coefficient";
						showCredits: "Credits";
						showAppreciation: "Appreciation";
						highlightFailures: "Highlight failures";
						institutionLogoSize: "Institution logo";
						facultyLogoSize: "Faculty logo";
						universityLogoSize: "University logo";
						ministryLogoSize: "Ministry logo";
						coatOfArmsSize: "Coat of arms";
						watermarkLogoSize: "Watermark logo";
						facultyLogoOffsetX: "Faculty logo X";
						facultyLogoOffsetY: "Faculty logo Y";
						coatOfArmsOffsetX: "Coat of arms X";
						coatOfArmsOffsetY: "Coat of arms Y";
						ministryLogoOffsetX: "Ministry logo X";
						ministryLogoOffsetY: "Ministry logo Y";
						enabled: "Enabled";
						compactPayload: "Compact QR";
						size: "Size";
						offsetX: "Offset X";
						offsetY: "Offset Y";
						lineHeight: "Line height";
						letterSpacing: "Letter spacing";
						shadow: "Shadow";
						shadowColor: "Shadow color";
						shadowOffsetX: "Shadow X";
						shadowOffsetY: "Shadow Y";
						shadowBlur: "Shadow blur";
						headerLineHeight: "Header line height";
						titleBlockMarginTop: "Title top margin";
						titleBlockMarginBottom: "Title bottom margin";
						ministerBlockMarginBottom: "Minister bottom margin";
						recipientBlockMarginBottom: "Recipient bottom margin";
						signatureBlockMarginTop: "Signature top margin";
						sectionSpacing: "Section spacing";
						bodyLineHeight: "Body line height";
						paragraphSpacing: "Paragraph spacing";
						bilingual: "Bilingual (FR/EN)";
						primaryLanguage: "Main language";
						showQRCode: "Show QR code";
						qrCodeSize: "QR code size";
						showSemesterBreakdown: "Breakdown by semester";
						showRanking: "Show ranking";
						showRefNumber: "Reference no.";
						showStamp: "Stamp";
						decorative: "Decorative";
						text: "Text";
						color: "Color";
						textOpacity: "Text opacity";
						logoOpacity: "Logo opacity";
						logoSize: "Logo size";
						textSize: "Text size";
						orientation: "Orientation";
						margins: "Margins";
						top: "Top";
						right: "Right";
						bottom: "Bottom";
						left: "Left";
					};
					preset: "Preset:";
					presetPlaceholder: "Apply a preset";
					resetAll: "Reset all";
					pageSize: {
						letter: "Letter";
					};
					orientation: {
						portrait: "Portrait";
						landscape: "Landscape";
					};
				};
				studentList: {
					trigger: "Export (template)";
					triggerHint: "Export this list with an official template";
					triggerDisabledHint: "Select a class, a program or a year first";
					toast: {
						templateUsed: "Template used: {{name}}";
						templateUsedCenter: "Template used: {{name}} (center)";
						error: "Generation failed";
					};
					previewTitle: "HTML preview: student list";
					title: "Export the student list";
					forClass: "For the selected class.";
					forProgram: "For the selected program.";
					forStudents_one: "For {{count}} selected student.";
					forStudents_other: "For {{count}} selected students.";
					forFilters: "According to the current filters.";
					template: "Template";
					templateDefault: "(institution default)";
					noTemplate: "No template: create one with Initialize official templates";
					defaultSuffix: " (default)";
					demoModeHint: '"DEMO" watermark';
				};
				bulkClassExport: {
					title: "Bulk export of lists";
					description: "Generates the student lists of the selected classes: as a single file (multi-sheet Excel) or one separate file per class (ZIP).";
					format: "Format";
					formatXlsx: "Excel (.xlsx)";
					formatPdf: "PDF (rendered from template)";
					mode: "Mode";
					unified: "Single file";
					excelOnly: " (Excel only)";
					separated: "Separate files (ZIP)";
					classesCount: "Classes ({{selected}} / {{total}})";
					table: {
						code: "Code";
						name: "Name";
						program: "Program";
						year: "Year";
						status: "Status";
					};
					progress: "Exporting…";
					submit: "Export ({{count}})";
					toast: {
						noSelection: "No class selected";
						success: "{{ok}} / {{total}} list(s) exported";
						error: "Export failed";
					};
					institutionFallback: "Institution";
					sheet: {
						title: "Student list: {{name}}";
						code: "Code: {{value}}";
						program: "Program: {{value}}";
						year: "Year: {{value}}";
						headcount: "Headcount: {{value}}";
						registrationNumber: "Registration no.";
						lastName: "Last name";
						firstName: "First name(s)";
						dateOfBirth: "Date of birth";
						gender: "Gender";
						genderOther: "Other";
						sheetName: "Students";
					};
					file: {
						unified: "class_lists";
						perClass: "list";
					};
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
					bulkValidate: "Bulk validate";
					reject: "Reject";
				};
				toast: {
					validated: "Exam approved";
					bulkValidated: "Exams validated successfully";
					rejected: "Exam rejected";
				};
				notificationsEmpty: "No notifications";
				windows: "Enrollment windows";
				confirm: {
					title: "Approve and lock?";
					bulkMessage: "bulkMessage";
					singleMessage: 'Approve and lock "{{name}}"? This cannot be undone: grades will no longer be editable.';
				};
				dateFrom: "Submitted from";
				rejectDialog: {
					subtitle: 'Provide a reason for rejecting "{{name}}". The teacher will see it.';
					title: "Title";
				};
			};
			cohort: {
				title: "Academic dashboard";
				subtitle: "Cohort overview — grading, results, success rates";
				students: "Students";
				pending: "Pending";
				avgProgress: "Avg. progress";
				avgSuccess: "Avg. success rate";
				gradingProgress: "Grading progress";
				approved: "approved";
				submitted: "pending";
				noData: "No cohorts";
				noDataHint: "Data will appear here once classes are created.";
				actionRequired: "Action required";
				noDeliberation: "No deliberation yet";
				avgGeneral: "Gen. avg.";
				successRate: "Success rate";
				totalExams: "{{count}} total";
				submittedExams_one: "{{count}} exam pending";
				submittedExams_other: "{{count}} exams pending";
			};
			approvals: {
				title: "Pending approvals";
				pendingCount: "{{count}} exam(s) awaiting validation";
				noPending: "No exams pending";
				allDone: "All up to date";
				reject: "Reject";
				approve: "Approve";
				rejectTitle: "Reject exam";
				rejectHint: "Please provide a reason for rejection.";
				rejectPlaceholder: "Rejection reason (required)...";
				rejectConfirm: "Confirm rejection";
				rejected: "Exam rejected";
				approved: "Exam approved";
				bulkApproved: "Exams approved";
				approveSelection: "Approve selection ({{count}})";
				viewGrades: "View grades";
				noGrades: "No grades recorded";
				avg: "Avg.";
				regNumber: "Reg. number";
				student: "Student";
				score: "Score";
				searchPlaceholder: "Search exams...";
				allClasses: "All classes";
				allYears: "All years";
				minMax: "min {{min}} · max {{max}}";
				selectAllExams: "Select all exams";
				selectExam: "Select {{name}}";
			};
			history: {
				title: "Approval history";
				subtitle: "Approved or rejected exams";
				approved: "Approved";
				rejected: "Rejected";
				empty: "No history";
				emptyHint: "No exams approved or rejected yet.";
				approvedOn: "Approved on {{date}}";
				rejectedOn: "Rejected on {{date}}";
				rejectionReason: "Reason";
				searchPlaceholder: "Search exams...";
				allClasses: "All classes";
				allYears: "All years";
				allTeachers: "All teachers";
				dateFrom: "From";
				dateTo: "To";
				teacherFilter: "All teachers";
			};
			auditHistory: {
				by: "by";
				empty: "No events recorded.";
				system: "System";
				title: "Audit trail";
				toggle: "Audit trail";
			};
		};
		student: {
			performance: {
				title: "Performance dashboard";
				subtitle: "Track your averages, credits, and course progress";
				cycleBadge: "Cycle: {{value}}";
				levelBadge: "Level: {{value}}";
				trendTitle: "Progression";
				trendSubtitle: "Weighted averages across enrolled courses";
				creditsProgress: "Credits earned";
				inProgress: "in progress";
				eligible: "Eligible for next level 🎉";
				notEligible: "Keep going! You're almost ready for promotion.";
				ruleNotice: "Evaluated with the promotion rules configured by your faculty.";
				courseAverages: "Course averages";
				courseSubtitle: "Latest scores for the active academic year";
				coursePlaceholder: "Detailed course averages will appear once instructors publish grades for the current session.";
				deliberationDecision: "Deliberation decision";
				downloadDocuments: "Download academic documents";
				average: "Average";
				projection: "Year-end projection";
				projectionNote: "Of graded UEs so far, {{rate}}% are above the passing threshold. Partial data.";
				noGrades: "No grades available";
				noGradesHint: "Your grades will appear here once your teachers publish results.";
				transcript: "Transcript";
				creditProgress: "Progress toward promotion";
				creditsEligible: "You meet the credit requirements to advance to the next level.";
				generalAverage: "General average";
				aboveThreshold: "Above passing threshold";
				belowThreshold: "Below passing threshold";
				creditsEarned: "Credits earned";
				validatedUEs: "Validated UEs";
				teachingUnits: "Teaching units";
				decisions: "Deliberation results";
				decisionHistory: "Decision history";
				latestDecision: "Latest decision";
				pendingResults: "Results not yet published";
				pendingResultsHint: "Your deliberation results will appear here once published by the academic committee.";
				ueBreakdown: "UE breakdown";
				validated: "Validated";
				notValidated: "Not validated";
				credits: "{{count}} credit";
				creditsPlural: "{{count}} credits";
				rank: "Rank {{rank}} in the class";
				mention: "Mention: {{mention}}";
				ueCredits_one: "{{count}} credit";
				ueCredits_other: "{{count}} credits";
				courseCount_one: "{{count}} course";
				courseCount_other: "{{count}} courses";
				coefficient: "Coeff. {{value}}";
				ueCreditsEarned: "{{earned}}/{{total}} credits";
			};
			exams: {
				title: "Exam calendar";
				upcoming: "Upcoming";
				past: "Past";
				noExams: "No exams scheduled";
				noExamsHint: "Your exams will appear here once created by your teachers.";
				today: "Today";
				tomorrow: "Tomorrow";
			};
			enrollments: {
				title: "Course enrollment";
				subtitle: "Manage your course registrations during the open enrollment window";
				windowOpen: "Enrollment window open";
				windowClosed: "Enrollment closed";
				windowOpenHint: "You can enroll in and withdraw from courses.";
				windowClosedHint: "Enrollment is currently closed. Contact your administration.";
				noCourses: "No courses available";
				noCoursesHint: "Your class has no courses assigned yet.";
				enrolled: "Enrolled";
				unenroll: "Withdraw";
				enroll: "Enroll";
				selected: "{{count}} course(s) selected of {{total}}";
				coefficient: "Coef. {{value}}";
			};
			dashboard: {
				title: "My Space";
				subtitle: "Overview of your academic and administrative status";
				pendingFees: "Tuition fees are pending. Please settle your account to avoid restrictions.";
				viewFees: "My Fees";
				upcomingExams: "Upcoming Exams";
				viewExams: "View Calendar";
			};
			pendingActions: {
				title: "Pending actions";
				viewAll: "View all";
				moreItems: "+{{count}} more";
				resultsPublished: "Deliberation results published";
				gradesApproved: "Grade sheet approved";
				gradesRejected: "Grade sheet rejected";
				paymentConfirmed: "Payment confirmed";
				paymentPending: "Payment required";
				enrollmentWindowOpen: "Enrollment window open";
				jobCompleted: "Background job completed";
				jobFailed: "Background job failed";
				generic: "New notification";
				documentAvailable: "Document available for download";
				empty: "No pending actions";
				sectionActions: "Required actions";
				sectionInfo: "Notifications";
				act: "Take action";
				categories: {
					academic: "Academic";
					financial: "Financial";
					enrollment: "Enrollment";
					documents: "Documents";
					system: "System";
				};
			};
			documents: {
				title: "My documents";
				description: "Download your academic documents";
				download: "Download PDF";
				generating: "Generating...";
				generateError: "Failed to generate document. Try again or contact administration.";
				transcript: {
					title: "Transcript";
					description: "Official record of your grades and academic results.";
					blocked: "Financial clearance required to download this document.";
				};
				attestation: {
					title: "Enrollment Attestation";
					description: "Attestation confirming your enrollment for the current academic year.";
					blocked: "Financial clearance required to download this document.";
				};
				enrollment_certificate: {
					title: "Enrollment Certificate";
					description: "Official certificate of enrollment (Certificat de scolarité) for the current academic year.";
					blocked: "Financial clearance required to download this document.";
				};
				history: {
					title: "Download history";
					empty: "No documents downloaded yet.";
				};
			};
			timeline: {
				title: "Academic Timeline";
				description: "Your full academic history — enrollments, decisions, and milestones";
				empty: "No events yet";
				emptyHint: "Your academic history will appear here as you progress through your studies.";
				allAcademicYears: "All academic years";
				eventCount_one: "{{count}} event";
				eventCount_other: "{{count}} events";
				average: "Avg.";
				event: {
					enrollment: "Enrolled";
					enrollment_transfer: "Transferred";
					enrollment_active: "Enrollment active";
					enrollment_completed: "Year completed";
					enrollment_withdrawn: "Withdrawn";
					promotion: "Promoted / Graduated";
					deliberation: "Deliberation result";
					fee_cleared: "Financial clearance obtained";
				};
				decision: {
					admitted: "Admitted";
					compensated: "Admitted (compensated)";
					deferred: "Deferred";
					repeat: "Year repeat";
					excluded: "Excluded";
					pending: "Pending";
				};
				eventCount: "{{count}} event(s)";
			};
			enrollment: {
				title: "Enrollment";
				program: "Program";
				class: "Class";
				year: "Academic year";
				level: "Level";
				windowOpen: "Course enrollment is open";
				windowOpenHint: "You can register for courses during the current enrollment window.";
				enroll: "Register for courses";
			};
		};
		retakes: {
			title: "Retake Eligibility";
			subtitle: "Manage retake exam eligibility for students";
			badge: {
				retake: "Retake";
				normal: "Normal";
			};
			actions: {
				createRetake: "Create Retake Exam";
			};
			form: {
				title: "Create Retake Exam";
				parentExamLabel: "Original Exam";
				nameLabel: "Retake Exam Name (optional)";
				namePlaceholder: "Leave empty to auto-generate";
				dateLabel: "Retake Date";
				scoringPolicyLabel: "Scoring Policy";
				submit: "Create Retake";
			};
			scoringPolicy: {
				replace: "Replace Original";
				best_of: "Keep Best Grade";
				replaceDescription: "The retake grade will replace the original grade";
				best_ofDescription: "The higher grade between original and retake will be used";
			};
			eligibility: {
				title: "Eligibility Status";
				eligible: "Eligible";
				ineligible: "Not Eligible";
				forced: "Forced";
				tabs: {
					eligible: "Eligible Students";
					ineligible: "Ineligible Students";
				};
				reasons: {
					failed: "Failed the original exam";
					noGrade: "No grade recorded";
					limitReached: "Attempt limit reached";
					passed: "Already passed";
					forceEligible: "Manually set as eligible";
					forceIneligible: "Manually set as ineligible";
				};
			};
			override: {
				title: "Override Eligibility";
				forceEligible: "Force Eligible";
				forceIneligible: "Force Ineligible";
				clear: "Clear Override";
				reason: "Reason";
				reasonPlaceholder: "Enter reason for override...";
			};
			empty: {
				title: "No Exam Selected";
				description: "Select an approved exam to view retake eligibility";
			};
			toast: {
				overrideSuccess: "Override applied successfully";
				overrideError: "Failed to apply override";
			};
		};
		settings: {
			menuLabel: "Settings";
			title: "Account Settings";
			subtitle: "Manage your profile, password, and sessions";
			tabs: {
				account: "Account";
				profile: "Profile";
				preferences: "Preferences";
			};
			account: {
				title: "Account Details";
				description: "Update your sign-in identity";
				save: "Save account";
				fields: {
					name: "Display name";
					email: "Email";
					image: "Avatar URL";
					imagePlaceholder: "https://example.com/avatar.png";
				};
				validation: {
					name: "Name is required";
					image: "Please provide a valid URL";
				};
				toast: {
					success: "Account updated";
					error: "Failed to update account";
				};
				avatar: {
					change: "Change avatar";
					uploading: "Uploading...";
					success: "Avatar updated";
					error: "Failed to upload avatar";
					cropTitle: "Crop profile picture";
					cropPreviewAlt: "Preview";
					cropError: "Could not crop the image";
				};
				email: {
					change: "Change email";
					newLabel: "New email";
					verificationSent: "A verification link has been sent to your new email";
					error: "Failed to send verification email";
				};
			};
			profile: {
				title: "Profile Information";
				description: "Update your personal details";
				save: "Save changes";
				fields: {
					firstName: "First name";
					lastName: "Last name";
					email: "Email";
					phone: "Phone";
					dateOfBirth: "Date of birth";
					dateOfBirthPlaceholder: "Select a date";
					placeOfBirth: "Place of birth";
					gender: "Gender";
					genderPlaceholder: "Select gender";
					nationality: "Nationality";
					nationalityPlaceholder: "Select a country";
					nationalitySearch: "Search countries...";
				};
				gender: {
					male: "Male";
					female: "Female";
					other: "Other";
				};
				validation: {
					firstName: "First name is required";
					lastName: "Last name is required";
				};
				toast: {
					success: "Profile updated";
					error: "Failed to update profile";
				};
			};
			password: {
				title: "Change Password";
				description: "Update your login credentials";
				save: "Update password";
				fields: {
					current: "Current password";
					new: "New password";
					confirm: "Confirm new password";
					revokeOthers: "Sign out of all other sessions";
				};
				validation: {
					current: "Current password is required";
					new: "Password must be at least 8 characters";
					confirm: "Please confirm your password";
					match: "Passwords do not match";
				};
				toast: {
					success: "Password updated";
					error: "Failed to update password";
				};
			};
			sessions: {
				title: "Active Sessions";
				description: "Manage your active devices";
				current: "Current session";
				revoke: "Revoke";
				revokeAll: "Revoke all other sessions";
				securityNote: "If you don't recognize a session, revoke it immediately.";
				empty: "No active sessions found.";
				unknownTime: "Unknown time";
				unknownIp: "Unknown IP";
				toast: {
					revoked: "Session revoked";
					revokedAll: "Other sessions revoked";
					error: "Unable to load sessions";
				};
				unknownBrowser: "Unknown browser";
				otherBrowser: "Browser";
			};
			preferences: {
				title: "Preferences";
				description: "Customize your experience";
				languageLabel: "Language";
				languageHint: "Language changes apply immediately across the app.";
				languages: {
					en: "English";
					fr: "French";
				};
			};
		};
		help: {
			title: "Help";
			openButton: "Help";
			footer: "OverBrand · Grades Manager";
			workflow: {
				title: "Setup progression";
				step: "Step";
				next: "Next step";
				done: "Setup complete";
			};
		};
		deliberation: {
			decision: {
				admitted: "Admitted — you advance to the next year.";
				compensated: "Admitted by compensation — you advance to the next year.";
				deferred: "Deferred — you must retake failing subjects.";
				repeat: "Repeating — you repeat the academic year.";
				excluded: "Excluded — please contact administration.";
				pending: "Decision pending.";
				unknown: "Unknown decision.";
				overridden: "Overridden";
			};
			publishedAt: "Published on {{date}}";
		};
		exam: {
			status: {
				approved: "Approved";
				submitted: "Submitted";
				locked: "Locked";
				draft: "Planned";
				rejected: "Rejected";
			};
			noDate: "Date not set";
		};
		feeClearance: {
			title: "Fee Clearance";
			subtitle: "Manage fee structures, student payments, and clearance status";
			bulkAssign: {
				mode: "Scope";
				modeClass: "By class";
				modeProgram: "By program";
				modeYear: "Whole academic year";
				program: "Program";
				computing: "Computing preview…";
				preview: "Preview";
				confirm: "Confirm ({{count}} student(s))";
				toAssign: "to assign";
				alreadyAssigned_one: "{{count}} already assigned — skipped";
				alreadyAssigned_other: "{{count}} already assigned — skipped";
				col: {
					student: "Student";
					registration: "Registration number";
					amount: "Amount";
				};
				allAssigned: "All students already have an assignment for this year.";
			};
			structures: {
				title: "Fee Structures";
				subtitle: "Define the fees applicable per academic year and program";
				create: "New structure";
				edit: "Edit structure";
				delete: "Delete structure";
				deleteConfirm: "Delete this fee structure? This action cannot be undone.";
				empty: {
					title: "No fee structures";
					description: "Create a fee structure to start assigning fees to students.";
				};
				fields: {
					name: "Name";
					academicYear: "Academic year";
					program: "Program (optional)";
					cycleLevel: "Cycle level (optional)";
					totalAmount: "Total amount";
					currency: "Currency";
					description: "Description";
					isActive: "Active";
					studyCycle: "Study cycle";
				};
				installments: {
					title: "Payment installments";
					add: "Add installment";
					label: "Label";
					amount: "Amount";
					dueDate: "Due date";
					empty: "No installments defined. Students can pay in one or multiple free-form payments.";
					edit: "Edit installment";
				};
				impact: {
					title: "Impact preview";
					preview: "Preview impact";
					totalStudents: "Students in scope";
					toAssign: "To assign";
					alreadyAssigned: "Already assigned this academic year";
					noClasses: "No classes match the scope of this structure.";
					class: "Class";
				};
				tabs: {
					details: "Details";
					installments: "Installments";
					impact: "Impact";
					assignments: "Assignments";
				};
			};
			bankImport: {
				button: "Bank import";
				title: "Bank statement import";
				csvLabel: "CSV data";
				csvPlaceholder: "reference,amount,date\nORD-2024-001,150000,2026-01-15\nORD-2024-002,200000,2026-01-15";
				csvHint: "Format: reference, amount, date (YYYY-MM-DD) — comma, semicolon or tab separator";
				uploadFile: "Load file";
				rowsParsed: "{{count}} row(s) parsed";
				method: "Payment method";
				preview: "Preview";
				confirm: "Confirm {{count}} match(es)";
				applySuccess: "{{applied}} payment(s) recorded, {{skipped}} skipped";
				applyError: "Bank import failed";
				col: {
					reference: "Reference";
					amount: "Amount";
					date: "Date";
					student: "Student";
					status: "Status";
				};
				forceMatch: "Force";
				forced: "Forced";
				xlsxLoaded: "{{count}} rows loaded from the Excel file";
				notes: "Batch note (optional)";
				notesPlaceholder: "E.g. bank transfer of July 15 2026";
				status: {
					matched: "Matched";
					duplicate: "Duplicate";
					unknown_ref: "Unknown reference";
					amount_mismatch: "Amount mismatch";
				};
				expectedAmount: "(expected: {{amount}})";
			};
			assignments: {
				title: "Student Payments";
				subtitle: "Track fee payment status for each student";
				assign: "Assign student";
				bulkAssign: "Assign entire class";
				bulkAssignSuccess: "{{assigned}} assigned, {{skipped}} skipped";
				exempt: "Mark as exempt";
				updateDiscount: "Update discount";
				empty: {
					title: "No assignments";
					description: "Assign students to a fee structure to start tracking their payment status.";
				};
				fields: {
					student: "Student";
					class: "Class";
					structure: "Fee structure";
					effectiveAmount: "Amount due";
					paidAmount: "Amount paid";
					balance: "Balance";
					discount: "Discount";
					discountReason: "Discount reason";
					status: "Status";
					clearedAt: "Cleared on";
					notes: "Notes";
				};
				status: {
					unpaid: "Unpaid";
					partial: "Partial";
					paid: "Paid";
					exempt: "Exempt";
				};
				assignStudentTitle: "Assign a student";
				assignStudentSubmit: "Assign";
				bulkAssignModeStudents: "Selected students";
				discountLabel: "Discount amount";
				discountReasonLabel: "Reason (optional)";
				exemptNotes: "Exemption reason (optional)";
				exemptConfirmTitle: "Mark student as exempt?";
				exemptConfirmDescription: "The student will be marked as exempt. You may enter an optional reason.";
				selectedStudents_one: "{{count}} student selected";
				selectedStudents_other: "{{count}} students selected";
			};
			payments: {
				title: "Payment history";
				record: "Record payment";
				delete: "Delete payment";
				deleteConfirm: "Delete this payment? The assignment status will be recalculated.";
				empty: "No payments recorded yet.";
				downloadReceipt: "Download receipt";
				fields: {
					amount: "Amount";
					paymentDate: "Payment date";
					paymentMethod: "Method";
					reference: "Reference / receipt number";
					notes: "Notes";
					recordedBy: "Recorded by";
				};
				methods: {
					cash: "Cash";
					bank_transfer: "Bank transfer";
					mobile_money: "Mobile money";
					check: "Check";
					other: "Other";
				};
			};
			gating: {
				title: "Academic Gates";
				subtitle: "Block specific academic actions for students who have not paid their fees";
				gates: {
					exam_registration: "Exam registration";
					transcript: "Transcript generation";
					diploma: "Diploma issuance";
					reenrollment: "Re-enrollment";
					document_generation: "Document generation";
				};
				enabledHint: "Students must be cleared to perform this action";
				disabledHint: "Gate disabled — all students have access";
			};
			orders: {
				title: "Payment orders";
				create: "Create order";
				generate: "Generate order";
				confirm: "Confirm payment";
				confirmed: "Order confirmed and payment recorded";
				confirmTitle: "Confirm this order?";
				confirmDescription: "Confirming will record the payment and update the student's fee status.";
				download: "Download payment order";
				fields: {
					reference: "Reference";
					amount: "Amount";
					status: "Status";
					notes: "Notes";
					createdAt: "Date";
					expiresAt: "Expires";
					paymentDate: "Payment date";
					paymentMethod: "Payment method";
				};
				status: {
					pending: "Pending";
					confirmed: "Confirmed";
					cancelled: "Cancelled";
				};
			};
			quitus: {
				title: "Quitus / Fee Clearance Certificate";
				download: "Download quitus";
				notCleared: "Not cleared";
				cleared: "Cleared";
				clearedOn: "Cleared on {{date}}";
			};
			student: {
				title: "My tuition fees";
				subtitle: "Your financial status with the institution";
				noAssignment: "No fee assignment found for your profile.";
				balance: "Remaining balance";
				totalDue: "Total due";
				paid: "Paid";
				academicYear: "Academic year";
				pendingOrders: "Pending orders";
				installmentStatus: {
					payable: "Payable";
					pending: "Order pending";
					paid: "Paid";
				};
			};
			history: {
				title: "Financial history";
				subtitle: "All payments and orders for this student";
				totalDue: "Total due";
				totalPaid: "Total paid";
				balance: "Remaining balance";
				empty: "No assignments found for this student.";
				noEvents: "No financial events.";
				viewDetail: "Detail";
				viewHistory: "Financial history";
				subtitleFor: "All payments and orders of {{name}}";
			};
			payment: {
				methods: {
					bank_transfer: "Bank transfer";
					cash: "Cash";
					check: "Check";
					mobile_money: "Mobile money";
				};
			};
		};
		notifications: {
			title: "Notifications";
			empty: "No notifications";
			markRead: "Mark read";
			markAllRead: "Mark all as read";
			timeAgo: {
				justNow: "Just now";
				minutes: "{{count}} min";
				hours: "{{count}} h";
				days: "{{count}} d";
			};
			types: {
				fee_payment_confirmed: "Payment confirmed";
				grade_approved: "Grades approved";
				grade_rejected: "Grades rejected";
				deliberation_published: "Results published";
				batch_job_completed: "Job completed";
				batch_job_failed: "Job failed";
				generic: "Notification";
				payment_pending: "Payment pending";
				enrollment_window_open: "Enrollment window open";
				document_available: "Document available";
			};
			batchJob: {
				completedSubtitle: "{{jobType}} — {{itemsProcessed}} items";
				failedSubtitle: "{{jobType}} — {{error}}";
			};
			viewAll: "View all";
			page: {
				title: "My notifications";
				description: "All your recent notifications";
				unreadOnly: "Unread only";
				all: "All";
			};
		};
		attendanceRates: {
			regNumber: "Reg. N°";
			sessions: "session(s)";
			present: "Present";
			late: "Late";
			absent: "Absent";
			excused: "Excused";
			totalSessions: "Total sessions";
			ratePercent: "Rate (%)";
			name: "Name";
			empty: "Select a course to view attendance rates.";
			noData: "No attendance sessions recorded for this course.";
			title: "Attendance rates";
			exportFilename: "attendance-rates.xlsx";
			export: "Export";
			rate: "Attendance rate";
			student: "Student";
			subtitle: "Attendance rate per student";
		};
		timetableHub: {
			title: "Timetable & Attendance";
			description: "Manage schedules, rooms, attendance tracking and rates";
			tabs: {
				timetable: "Timetable";
				rooms: "Rooms";
				attendance: "Attendance";
				rates: "Rates";
				overview: "Class Overview";
			};
		};
		examsHub: {
			title: "Exams & Grades";
			description: "Manage exams, scheduling, grade exports, access delegation and document templates";
			tabs: {
				exams: "Exams";
				types: "Exam Types";
				scheduler: "Scheduler";
				participation: "Participation";
				gradeExport: "Grade Export";
				gradeAccess: "Grade Access";
				retakes: "Retakes";
				gradeTemplates: "Export Templates";
				classDocuments: "Class Documents";
			};
		};
		guardians: {
			fields: {
				firstName: "First name";
				lastName: "Last name";
				email: "Email";
				phone: "Phone";
				relationshipType: "Relationship";
				isPrimary: "Primary contact";
				isEmergencyContact: "Emergency contact";
			};
			relationships: {
				mother: "Mother";
				father: "Father";
				guardian: "Guardian";
				uncle: "Uncle";
				aunt: "Aunt";
				other: "Other";
			};
			preferences: {
				resultsPublished: "Results publication";
				attendanceThreshold: "Attendance alerts";
				feeClearance: "Fee clearance";
				documentsAvailable: "Documents available";
			};
			admin: {
				title: "Guardians";
				subtitle: "Create parent profiles, link them to students, and control communication preferences.";
				students: "Students";
				noMatricule: "No registration number";
				createTitle: "Create or link a guardian";
				save: "Save guardian";
				linkedTitle: "Guardians linked to {{name}}";
				copyPortalLink: "Copy portal link";
				empty: "No guardians in this institution yet.";
				selectStudent: "Select student…";
				toasts: {
					saved: "Guardian saved";
					preferencesSaved: "Preferences updated";
					linkCopied: "Portal link copied";
				};
				addGuardian: "Add guardian";
				searchPlaceholder: "Search by name or email…";
				linkedStudents: "Linked to";
				student: "student";
				editPreferences: "Edit preferences";
				removeFromStudent: "Remove from student";
				deleteConfirm: "This will permanently delete the guardian and all student links.";
			};
			portal: {
				badge: "Guardian portal";
				title: "Follow the students linked to your profile";
				subtitle: "Use the secure access token provided by the institution to view linked students and their communication settings.";
				tokenPlaceholder: "Access token";
				open: "Open";
				invalid: "This guardian access token is invalid or inactive.";
				profile: "Guardian profile";
				students: "Linked students";
				noMatricule: "No registration number";
				empty: "No student is linked to this guardian profile.";
			};
		};
		admissions: {
			fields: {
				firstName: "First name(s)";
				lastName: "Last name";
				email: "Email address";
				phone: "Primary phone";
				dateOfBirth: "Date of birth";
				nationality: "Nationality";
				previousDiploma: "Previous diploma";
				previousInstitution: "Previous institution";
				program: "1st choice — Program";
				academicYear: "Academic year";
				class: "Preferred class";
				personalStatement: "Personal statement / motivation letter";
				gender: "Gender";
				placeOfBirth: "Place of birth";
				countryOfBirth: "Country of birth";
				exactDateOfBirth: "Exact date on birth certificate";
				idCardNumber: "National ID / Passport number";
				maritalStatus: "Marital status";
				employmentStatus: "Employment status";
				primaryLanguage: "Primary language";
				hasDisability: "Disability status";
				photo: "Identity photo";
				whatsapp: "WhatsApp";
				address: "Residential address";
				city: "City";
				postalBox: "P.O. Box";
				originCountry: "Country of origin";
				originRegion: "Region of origin";
				originDepartment: "Department of origin";
				studentStatus: "Student status";
				entryDiplomaType: "Entry diploma type";
				bacSeries: "Series / Stream";
				bacYear: "Year obtained";
				bacMention: "Grade / Mention";
				bacAverage: "Overall average";
				bacInstitution: "Issuing institution";
				bacCountry: "Country of issue";
				bacMatricule: "Registration number";
				hasPriorHigherEd: "Have you previously studied in higher education?";
				priorInstitution: "Institution";
				priorField: "Field / Speciality";
				priorLevel: "Last level reached";
				priorStartYear: "Start year";
				priorEndYear: "End year";
				priorResult: "Results";
				secondChoiceProgram: "2nd choice";
				thirdChoiceProgram: "3rd choice";
				academicLevel: "Desired entry level";
				trainingType: "Training type";
				fatherName: "Father's full name";
				fatherProfession: "Father's profession";
				fatherPhone: "Father's phone";
				fatherAlive: "Father is alive";
				motherName: "Mother's full name";
				motherProfession: "Mother's profession";
				motherPhone: "Mother's phone";
				motherAlive: "Mother is alive";
				guardianName: "Guardian's full name";
				guardianRelation: "Relationship";
				guardianPhone: "Guardian's phone";
				emergencyContactName: "Emergency contact name";
				emergencyContactPhone: "Emergency contact phone";
				emergencyContactCity: "Emergency contact city";
			};
			steps: {
				"1": {
					title: "Identity";
					subtitle: "Personal identity information";
				};
				"2": {
					title: "Contact";
					subtitle: "Contact details and geographic origin";
				};
				"3": {
					title: "Baccalauréat";
					subtitle: "Higher education entry diploma";
				};
				"4": {
					title: "Higher Education";
					subtitle: "Prior academic history";
				};
				"5": {
					title: "Program Choices";
					subtitle: "Programs and training preferences";
				};
				"6": {
					title: "Family";
					subtitle: "Parent and emergency contacts";
				};
				"7": {
					title: "Documents";
					subtitle: "Required supporting documents";
				};
				"8": {
					title: "Review";
					subtitle: "Final check before submission";
				};
			};
			options: {
				gender: {
					masculin: "Male";
					feminin: "Female";
				};
				maritalStatus: {
					celibataire: "Single";
					marie: "Married";
					divorce: "Divorced";
					veuf: "Widowed";
				};
				employmentStatus: {
					sans_emploi: "Unemployed";
					employe: "Employed";
					fonctionnaire: "Civil servant";
					commercant: "Self-employed / Trader";
					autre: "Other";
				};
				studentStatus: {
					camerounais: "Cameroonian";
					etranger_cemac: "Foreign (CEMAC zone)";
					etranger_hors_cemac: "Foreign (outside CEMAC)";
				};
				diplomaType: {
					bac_camerounais: "Cameroonian Baccalauréat";
					gce_alevel: "GCE A-Level";
					equivalent_etranger: "Foreign equivalent";
					autre: "Other diploma";
				};
				bacMention: {
					tres_bien: "Distinction";
					bien: "Merit";
					assez_bien: "Credit";
					passable: "Pass";
					admis: "Admitted";
				};
				academicLevel: {
					L1: "Bachelor Year 1 (L1)";
					L2: "Bachelor Year 2 (L2)";
					L3: "Bachelor Year 3 (L3)";
					M1: "Master Year 1 (M1)";
					M2: "Master Year 2 (M2)";
					Doctorat: "Doctorate";
				};
				trainingType: {
					initiale: "Initial training";
					professionnalisante: "Vocational training";
					continue: "Continuing education";
				};
				priorResult: {
					admis: "Passed";
					non_admis: "Failed";
					en_cours: "In progress";
				};
				language: {
					francais: "French";
					anglais: "English";
				};
			};
			wizard: {
				next: "Next";
				back: "Back";
				submit: "Submit my application";
				submitting: "Submitting...";
				stepOf: "Step {{current}} of {{total}}";
				draftNotice: "You have an unfinished application.";
				resumeDraft: "Resume";
				newForm: "Start over";
				optional: "optional";
				certify: "I hereby certify that all information provided in this application form is accurate and complete.";
				certifyRequired: "You must certify the accuracy of your information before submitting.";
				editStep: "Edit";
				noValue: "Not provided";
				priorHigherEdYes: "Yes, I have previously studied in higher education";
				priorHigherEdNo: "No, this is my first time in higher education";
				optionalShort: "opt.";
				resumeOrRestart: "Pick up where you left off or start over from the beginning.";
			};
			recap: {
				identity: "Identity";
				contact: "Contact & Origin";
				diploma: "Baccalauréat";
				higherEd: "Higher Education";
				programs: "Program Choices";
				family: "Family & Emergency";
				noPriorHigherEd: "First time in higher education";
				noGuardian: "No guardian provided";
			};
			documents: {
				title: "Documents to prepare";
				subtitle: "Prepare these documents for your dossier submission. Some may be uploaded now if available.";
				required: "Required";
				recommended: "Recommended";
				items: {
					photo: "4×4 cm identity photos (white or red background, name on back)";
					cni: "Copy of National ID (Cameroonians) or Passport (foreigners)";
					birthCert: "Birth certificate (original + certified copy, less than 3 months old)";
					bacCert: "BAC / GCE A-Level success certificate";
					bacTranscript: "BAC / GCE A-Level transcript";
					priorTranscript: "Last year transcript + success certificate (if prior higher ed)";
				};
				physicalNotice: "These documents will be requested when you submit your physical file.";
			};
			validation: {
				firstNameRequired: "First name is required";
				lastNameRequired: "Last name is required";
				emailRequired: "Email address is required";
				emailInvalid: "Invalid email format";
				phoneRequired: "Phone number is required";
				genderRequired: "Gender is required";
				dateOfBirthRequired: "Date of birth is required";
				placeOfBirthRequired: "Place of birth is required";
				idCardRequired: "National ID or passport number is required";
				maritalStatusRequired: "Marital status is required";
				nationalityRequired: "Nationality is required";
				studentStatusRequired: "Student status is required";
				originCountryRequired: "Country of origin is required";
				diplomaTypeRequired: "Diploma type is required";
				bacSeriesRequired: "Series is required";
				bacYearRequired: "Year obtained is required";
				bacMentionRequired: "Grade / mention is required";
				bacInstitutionRequired: "Issuing institution is required";
				bacCountryRequired: "Country of issue is required";
				academicYearRequired: "Academic year is required";
				programRequired: "First choice program is required";
				academicLevelRequired: "Entry level is required";
				fatherNameRequired: "Father's name is required";
				fatherProfessionRequired: "Father's profession is required";
				motherNameRequired: "Mother's name is required";
				motherProfessionRequired: "Mother's profession is required";
				emergencyNameRequired: "Emergency contact name is required";
				emergencyPhoneRequired: "Emergency contact phone is required";
				emergencyCityRequired: "Emergency contact city is required";
				priorInstitutionRequired: "Institution is required";
				priorFieldRequired: "Field of study is required";
				priorLevelRequired: "Level is required";
			};
			statuses: {
				draft: "Draft";
				submitted: "Submitted";
				under_review: "Under review";
				accepted: "Accepted";
				rejected: "Rejected";
				waitlisted: "Waitlisted";
				converted: "Converted";
			};
			documentStatuses: {
				pending: "Pending review";
				valid: "Valid";
				invalid: "Invalid";
			};
			public: {
				title: "Online pre-registration";
				subtitle: "Complete your application form online. You will receive a reference code to track your application.";
				selectProgram: "Select a program";
				selectYear: "Select an academic year";
				selectClass: "Select a class";
				noClass: "No preference";
				submit: "Submit application";
				submitting: "Submitting...";
				submitSuccess: "Application submitted successfully";
				successTitle: "Application received";
				successDescription: "Your application has been recorded. Keep this reference code — use it to track progress and submit your documents.";
				referenceLabel: "Your reference code";
				trackApplication: "Track my application";
			};
			status: {
				title: "Application tracking";
				subtitle: "Enter your reference code to follow the review process and manage your documents.";
				search: "Search";
				checklist: "Document checklist";
				noRequirements: "No document requirement configured for this program.";
				missingDocuments: "Missing required documents";
				invalidDocuments: "Invalid documents";
				reference: "Reference";
				required: "Required";
				missing: "Missing";
				fileName: "File name";
				fileUrl: "File URL";
				submitDocument: "Submit document";
				documentSubmitted: "Document submitted";
			};
			admin: {
				title: "Admissions management";
				subtitle: "Review applications, validate documents, make decisions and convert accepted candidates.";
				searchPlaceholder: "Search by name, email or reference…";
				allStatuses: "All statuses";
				allPrograms: "All programs";
				allYears: "All years";
				cols: {
					reference: "Reference";
					name: "Applicant";
					status: "Status";
					date: "Submitted";
				};
				queue: "Application queue";
				empty: "No application found.";
				selectApplication: "Select an application from the list to review it.";
				reviewTitle: "Decision";
				reviewNotes: "Decision notes (required for rejection)";
				markUnderReview: "Mark under review";
				accept: "Accept";
				waitlist: "Waitlist";
				reject: "Reject";
				documentsTitle: "Supporting documents";
				missingFile: "No file submitted";
				valid: "Valid";
				invalid: "Invalid";
				convertTitle: "Convert to student";
				useApplicationClass: "Use application class";
				registrationNumber: "Registration number";
				autoRegistration: "Auto-generate if left empty";
				convert: "Convert to student";
				converted: "Converted";
				applicantProfile: "Applicant profile";
				secondChoice: "2nd choice";
				thirdChoice: "3rd choice";
				academicInfo: "Academic information";
				familyInfo: "Family & emergency";
				fullDossier: "View full dossier";
				notFound: "Application not found";
				terminalState: "No further action available";
				convertExplain: "This action will create in one step:";
				convertStep1: "An institutional profile";
				convertStep2: "A student record with a registration number";
				convertStep3: "An enrollment in the cohort";
				convertIrreversible: "This operation is irreversible. Once done, the applicant becomes an active student.";
				assignClass: "Assign a class";
				assignClassHint: "Select the cohort in which to enroll the student.";
				selectClass: "Choose a class…";
				noClassesWarning: "No class available for this program / academic year.";
				noClassesHint: "First create a class for this program and academic year in the Catalog section.";
				registrationHint: "If left empty, the registration number will be auto-generated based on the configured format.";
				converting: "Converting…";
				tabs: {
					dossier: "Dossier";
					documents: "Documents";
					decision: "Decision";
				};
				toasts: {
					updated: "Application updated";
					reviewed: "Decision saved";
					documentReviewed: "Document reviewed";
					converted: "Application converted to student record";
				};
				totalCount_one: "{{count}} application in total";
				totalCount_other: "{{count}} applications in total";
				filteredCount_one: "{{count}} application matching the filters";
				filteredCount_other: "{{count}} applications matching the filters";
			};
			sections: {
				father: "Father";
				mother: "Mother";
				guardian: "Legal guardian";
				emergency: "Emergency contact";
				contact: "Contact";
				nationalityOrigin: "Nationality & origin";
				programChoices: "Program preferences";
			};
			placeholders: {
				example: "e.g. {{value}}";
				guardianRelation: "e.g. Uncle, Elder brother";
				email: "your@email.com";
				whatsapp: "If different from the phone number";
				nationality: "e.g. Cameroonian";
				bacSeries: "e.g. C, D, A-Level...";
				bacInstitution: "e.g. Lycée Général Leclerc";
				bacMatricule: "OBC registration number";
				priorInstitution: "e.g. University of Yaoundé I";
				priorField: "e.g. Computer science";
				personalStatement: "Describe your career plans and your motivation...";
			};
		};
		institutionHub: {
			title: "Institution & Structure";
			description: "Manage your institution profile, faculties, academic cycles and centres";
			tabs: {
				overview: "Institution";
				faculties: "Faculties";
				cycles: "Study Cycles";
				centers: "Centres";
			};
		};
		programsHub: {
			title: "Programs & Curriculum";
			description: "Manage programs, teaching units and courses";
			tabs: {
				programs: "Programs";
				teachingUnits: "Teaching Units";
				courses: "Courses";
			};
		};
		classesHub: {
			title: "Classes & Enrollments";
			description: "Manage classes, course assignments and student enrollments";
			tabs: {
				classes: "Classes";
				assignments: "Course Assignments";
				enrollments: "Enrollments";
			};
		};
		usersHub: {
			title: "Users & Students";
			description: "Manage accounts, students, guardians and API keys";
			tabs: {
				people: "People";
				guardians: "Guardians";
				apiKeys: "API Keys";
			};
			people: {
				title: "People";
				subtitle: "All profiles in this institution.";
				add: "Add person";
				searchPlaceholder: "Search by name or email…";
				class: "Class";
				regNumber: "Reg. number";
				enrollmentStatus: "Enrollment";
				empty: "No people found.";
				deleteConfirm: "This will permanently delete the profile and cannot be undone.";
				account: "Account";
				created: "Person created.";
				hasAccount: "Active";
				manageAccess: "Manage access";
				noAccount: "None";
			};
			account: {
				overview: {
					title: "Login account";
					description: "Status of the login account linked to this profile.";
					emailVerified: "Email verified";
					emailNotVerified: "Email not verified";
					suspended: "Suspended";
					active: "Active";
					role: "Role";
					memberSince: "Member since";
					noAccountTitle: "No login account";
					noAccountDescription: "This profile is not linked to a login account. The user cannot sign in to the platform.";
				};
				provisioning: {
					title: "Provisioning";
					description: "Create a new account or link an existing account to this profile.";
					createTab: "Create an account";
					linkTab: "Link an existing account";
				};
				security: {
					title: "Security actions";
					description: "Manage this user's account access and security.";
					resetTitle: "Reset password";
					resetDescription: "Sends a password reset email to";
					sendEmail: "Send email";
					reactivateTitle: "Reactivate account";
					suspendTitle: "Suspend account";
					reactivateDescription: "Lets the user sign in to the platform again.";
					suspendDescription: "Immediately blocks every sign-in of this user.";
					reactivate: "Reactivate";
					suspend: "Suspend";
				};
				create: {
					emailPlaceholder: "firstname.lastname@example.com";
					rolePlaceholder: "Choose a role";
					submit: "Create account";
				};
				link: {
					emailLabel: "Email of the existing account";
					emailPlaceholder: "user@example.com";
					hint: "The user must already be a member of the organization. Their profile will be linked to this login account.";
					submit: "Link account";
				};
				validation: {
					emailInvalid: "Invalid email";
					passwordMin: "Password must be at least 8 characters";
					roleRequired: "Role is required";
				};
				errors: {
					emailExists: "An account with this email already exists.";
					createFailed: "Could not create the account.";
					notMember: "This user is not a member of the organization.";
					alreadyLinked: "This account is already linked to another profile.";
					linkFailed: "Could not link the account.";
				};
				toast: {
					created: "Account created successfully.";
					linked: "Account linked successfully.";
					resetSent: "Password reset email sent.";
					resetFailed: "Could not send the email.";
					suspended: "Account suspended.";
					reactivated: "Account reactivated.";
					statusFailed: "Could not update the account status.";
				};
			};
		};
		profileHub: {
			studentBadge: "Student";
			tabs: {
				identity: "Identity";
				enrollments: "Enrollments";
				results: "Results";
				finances: "Finances";
				guardians: "Guardians";
				access: "Access & Security";
			};
			identity: {
				personalInfo: "Personal Information";
				birthInfo: "Birth Information";
				studentInfo: "Student Information";
				firstName: "First Name";
				lastName: "Last Name";
				email: "Email";
				phone: "Phone";
				gender: "Gender";
				dateOfBirth: "Date of Birth";
				placeOfBirth: "Place of Birth";
				nationality: "Nationality";
				registrationNumber: "Registration Number";
			};
			enrollments: {
				academicYear: "Academic Year";
				class: "Class";
				enrolledAt: "Enrolled At";
				status: "Status";
				empty: "No enrollments found.";
			};
			results: {
				course: "Course";
				teachingUnit: "Teaching Unit";
				academicYear: "Year";
				credits: "Credits";
				status: "Status";
				empty: "No course results found.";
			};
			finances: {
				academicYear: "Academic Year";
				amount: "Amount";
				discount: "Discount";
				status: "Status";
				clearedAt: "Cleared At";
				empty: "No fee records found.";
			};
			guardians: {
				name: "Name";
				relationship: "Relationship";
				email: "Email";
				phone: "Phone";
				flags: "Flags";
				primary: "Primary";
				emergency: "Emergency";
				empty: "No guardians linked.";
			};
		};
		gradesHub: {
			title: "Grades & Documents";
			description: "Export grades, delegate access, manage retake eligibility and document templates";
			tabs: {
				export: "Export";
				access: "Access Delegation";
				retake: "Retake Eligibility";
				templates: "Export Templates";
				classDocuments: "Class Documents";
			};
		};
		configurationHub: {
			title: "Configuration";
			description: "Registration number formats, grade scale, export templates and rules engine";
			tabs: {
				regNumbers: "Registration Numbers";
				gradeScale: "Grade Scale";
				templates: "Export Templates";
				rules: "Deliberation rules";
			};
		};
		academicResultsHub: {
			title: "Results & Promotion";
			description: "Manage deliberations and year-end promotions";
			tabs: {
				deliberations: "Deliberations";
				promotion: "Year Promotion";
			};
		};
		programs: {
			hub: {
				tabs: {
					details: "Details";
					options: "Options";
					templates: "Export Templates";
				};
			};
		};
		classes: {
			hub: {
				tabs: {
					details: "Details";
					students: "Students";
					courses: "Courses";
				};
			};
		};
	};
}

export default Resources;
