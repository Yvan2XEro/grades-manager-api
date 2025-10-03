interface Resources {
  "translation": {
    "admin": {
      "academicYears": {
        "actions": {
          "add": "Add academic year"
        },
        "confirmDelete": "Delete this academic year?",
        "empty": {
          "description": "Start by creating an academic year for your institution.",
          "title": "No academic years yet"
        },
        "modal": {
          "createTitle": "Add academic year",
          "editTitle": "Edit academic year",
          "endDate": "End date",
          "label": "Academic year label",
          "startDate": "Start date"
        },
        "subtitle": "Create and manage academic years, and choose the active one",
        "table": {
          "endDate": "End date",
          "name": "Name",
          "startDate": "Start date",
          "status": "Status"
        },
        "title": "Academic Year Management",
        "toast": {
          "createError": "Could not create the academic year",
          "createSuccess": "Academic year created successfully",
          "deleteError": "Could not delete the academic year",
          "deleteSuccess": "Academic year deleted successfully",
          "statusError": "Could not update the academic year status",
          "statusSuccess": "Academic year status updated",
          "updateError": "Could not update the academic year",
          "updateSuccess": "Academic year updated successfully"
        },
        "validation": {
          "endDate": "End date is required",
          "name": "Name must be at least 2 characters",
          "order": "End date must be after start date",
          "startDate": "Start date is required"
        }
      },
      "classCourses": {
        "actions": {
          "assign": "Assign course"
        },
        "delete": {
          "message": "Deleting this assignment will also remove related exams and grades. Continue?",
          "title": "Delete course assignment"
        },
        "empty": {
          "description": "Assign a course to a class to populate this list.",
          "title": "No course assignments yet"
        },
        "form": {
          "classLabel": "Class",
          "classPlaceholder": "Select a class",
          "courseLabel": "Course",
          "coursePlaceholder": "Select a course",
          "createSubmit": "Assign course",
          "createTitle": "New course assignment",
          "editTitle": "Edit course assignment",
          "teacherLabel": "Teacher",
          "teacherPlaceholder": "Select a teacher"
        },
        "subtitle": "Assign teachers and courses to classes",
        "table": {
          "class": "Class",
          "course": "Course",
          "program": "Program",
          "teacher": "Teacher"
        },
        "title": "Class course assignments",
        "toast": {
          "createError": "Could not create the assignment",
          "createSuccess": "Course assignment created successfully",
          "deleteError": "Could not delete the assignment",
          "deleteSuccess": "Course assignment deleted successfully",
          "updateError": "Could not update the assignment",
          "updateSuccess": "Course assignment updated successfully"
        },
        "validation": {
          "class": "Please select a class",
          "course": "Please select a course",
          "teacher": "Please select a teacher"
        }
      },
      "classes": {
        "actions": {
          "add": "Add class"
        },
        "delete": {
          "message": "This action cannot be undone and may remove related assignments.",
          "title": "Delete class"
        },
        "empty": {
          "description": "Create classes to organise students by program and year.",
          "title": "No classes yet"
        },
        "form": {
          "academicYearLabel": "Academic year",
          "academicYearPlaceholder": "Select an academic year",
          "createSubmit": "Create class",
          "createTitle": "Add class",
          "editTitle": "Edit class",
          "labelLabel": "Generated class label",
          "programLabel": "Program",
          "programPlaceholder": "Select a program"
        },
        "subtitle": "Create classes for each program and academic year",
        "table": {
          "academicYear": "Academic year",
          "name": "Class",
          "program": "Program",
          "students": "Students"
        },
        "title": "Class management",
        "toast": {
          "createError": "Could not create the class",
          "createSuccess": "Class created successfully",
          "deleteError": "Could not delete the class",
          "deleteSuccess": "Class deleted successfully",
          "updateError": "Could not update the class",
          "updateSuccess": "Class updated successfully"
        },
        "validation": {
          "academicYear": "Please select an academic year",
          "name": "Name must be at least 2 characters",
          "program": "Please select a program"
        }
      },
      "courses": {
        "actions": {
          "add": "Add course"
        },
        "delete": {
          "message": "Deleting this course will remove related assignments and exams.",
          "title": "Delete course"
        },
        "form": {
          "createSubmit": "Create course",
          "createTitle": "Add course",
          "creditsLabel": "Credits",
          "creditsPlaceholder": "Enter credits",
          "editTitle": "Edit course",
          "hoursLabel": "Hours",
          "hoursPlaceholder": "Enter total hours",
          "nameLabel": "Course name",
          "namePlaceholder": "Enter course name",
          "programLabel": "Program",
          "programPlaceholder": "Select a program",
          "teacherLabel": "Default teacher",
          "teacherPlaceholder": "Select a teacher"
        },
        "table": {
          "credits": "Credits",
          "hours": "Hours",
          "name": "Course",
          "program": "Program",
          "teacher": "Default teacher"
        },
        "title": "Course management",
        "toast": {
          "createError": "Could not create the course",
          "createSuccess": "Course created successfully",
          "deleteError": "Could not delete the course",
          "deleteSuccess": "Course deleted successfully",
          "updateError": "Could not update the course",
          "updateSuccess": "Course updated successfully"
        },
        "validation": {
          "credits": "Credits must be at least 1",
          "hours": "Hours must be at least 1",
          "name": "Name must be at least 2 characters",
          "program": "Please select a program",
          "teacher": "Please select a teacher"
        }
      },
      "dashboard": {
        "activeYear": "Active Year: {{year}}",
        "noActiveYear": "No active year",
        "programStats": {
          "empty": "No data available for the selected year",
          "title": "Students per program"
        },
        "stats": {
          "courses": "Courses",
          "exams": "Exams",
          "faculties": "Faculties",
          "programs": "Programs",
          "students": "Students",
          "teachers": "Teachers"
        },
        "title": "Admin Dashboard"
      },
      "exams": {
        "actions": {
          "add": "Add exam"
        },
        "delete": {
          "message": "Deleting this exam will also remove related grades.",
          "title": "Delete exam"
        },
        "empty": {
          "description": "Create an exam to start collecting grades.",
          "title": "No exams yet"
        },
        "form": {
          "classCourseLabel": "Linked course",
          "classCoursePlaceholder": "Select a class course",
          "classLabel": "Class",
          "courseLabel": "Course",
          "coursePlaceholder": "Select a course and class",
          "createTitle": "Add exam",
          "dateLabel": "Date",
          "editTitle": "Edit exam",
          "nameLabel": "Exam name",
          "namePlaceholder": "Enter exam name",
          "percentageLabel": "Weight (1-100)",
          "percentagePlaceholder": "Enter weight",
          "submit": "Save exam",
          "typeLabel": "Type",
          "typePlaceholder": "e.g. Midterm, Final"
        },
        "status": {
          "locked": "Locked",
          "open": "Open"
        },
        "subtitle": "Create and manage exams for each class course",
        "table": {
          "class": "Class",
          "course": "Course",
          "date": "Date",
          "name": "Exam",
          "percentage": "Weight",
          "percentageValue": "{{value}}%",
          "status": "Status",
          "type": "Type"
        },
        "title": "Exam management",
        "toast": {
          "createError": "Could not create the exam",
          "createSuccess": "Exam created successfully",
          "deleteError": "Could not delete the exam",
          "deleteSuccess": "Exam deleted successfully",
          "updateError": "Could not update the exam",
          "updateSuccess": "Exam updated successfully"
        },
        "validation": {
          "classCourse": "Please select a class course",
          "date": "Date is required",
          "name": "Name must be at least 2 characters",
          "percentage": {
            "max": "Weight cannot exceed 100",
            "min": "Weight must be at least 1"
          },
          "type": "Type must be at least 2 characters"
        }
      },
      "gradeExport": {
        "actions": {
          "export": "Export grades",
          "label": "Export"
        },
        "columns": {
          "birthDate": "Birth date",
          "birthPlace": "Birth place",
          "firstName": "First name",
          "gender": "Gender",
          "lastName": "Last name",
          "registration": "Registration number"
        },
        "exams": {
          "emptyDescription": "There are no exams created for this class yet.",
          "emptyTitle": "No exams found",
          "title": "Select exams to include"
        },
        "filePrefix": "grades",
        "filters": {
          "academicYear": "Academic year",
          "academicYearPlaceholder": "Select academic year",
          "class": "Class",
          "classPlaceholder": "Select class"
        },
        "sheetName": "Grades",
        "subtitle": "Export student grades by class and exam",
        "title": "Grade export",
        "unknownClass": "unknown-class"
      },
      "students": {
        "actions": {
          "openModal": "Add students"
        },
        "filters": {
          "allClasses": "All classes",
          "searchPlaceholder": "Search by name or registration number"
        },
        "form": {
          "class": "Class",
          "classPlaceholder": "Select class",
          "email": "Email",
          "firstName": "First name",
          "lastName": "Last name",
          "registration": "Registration number",
          "submit": "Add student"
        },
        "import": {
          "classLabel": "Class for imported students",
          "downloadTemplate": "Download template",
          "invalidFormat": "Missing required fields in this row",
          "summary": {
            "conflicts": {
              "item": "Row {{row}}: {{reason}}",
              "title": "Conflicts"
            },
            "created": "{{count}} students imported successfully",
            "errors": {
              "item": "Row {{row}}: {{reason}}",
              "title": "Errors"
            }
          }
        },
        "modal": {
          "tabs": {
            "import": "Import file",
            "single": "Single student"
          },
          "title": "Add students"
        },
        "table": {
          "email": "Email",
          "name": "Student",
          "registration": "Registration number"
        },
        "templates": {
          "filePrefix": "students-template",
          "sheetName": "Students"
        },
        "title": "Student management",
        "toast": {
          "createError": "Could not create the student",
          "createSuccess": "Student created successfully",
          "importError": "Could not import students"
        },
        "validation": {
          "class": "Please select a class",
          "email": "Enter a valid email address",
          "firstName": "First name is required",
          "lastName": "Last name is required",
          "registration": "Registration number is required"
        }
      },
      "users": {
        "actions": {
          "ban": "Ban user",
          "create": "Create user",
          "edit": "Edit user",
          "unban": "Unban user"
        },
        "ban": {
          "reason": "Banned by an administrator"
        },
        "confirm": {
          "ban": {
            "message": "The user will be blocked from signing in until unbanned. Continue?",
            "title": "Ban user"
          },
          "delete": {
            "message": "Are you sure you want to delete this user? This action cannot be undone.",
            "title": "Delete user"
          },
          "unban": {
            "message": "Allow this user to sign in again?",
            "title": "Unban user"
          }
        },
        "empty": "No users match the current filters.",
        "filters": {
          "email": {
            "all": "All emails",
            "unverified": "Unverified",
            "verified": "Verified"
          },
          "roles": {
            "admin": "Administrators",
            "all": "All roles",
            "teacher": "Teachers"
          },
          "searchPlaceholder": "Search by name or email",
          "status": {
            "active": "Active",
            "all": "All statuses",
            "banned": "Banned"
          }
        },
        "form": {
          "createSubmit": "Create user",
          "createTitle": "Create user",
          "editTitle": "Edit user",
          "emailLabel": "Email address",
          "generatePassword": "Generate",
          "nameLabel": "Full name",
          "newPasswordLabel": "New password",
          "passwordLabel": "Password",
          "passwordPlaceholder": "Leave blank to keep current password",
          "roleLabel": "Role"
        },
        "roles": {
          "admin": "Admin",
          "teacher": "Teacher"
        },
        "status": {
          "active": "Active",
          "banned": "Banned",
          "emailUnverified": "Pending verification",
          "emailVerified": "Verified"
        },
        "table": {
          "email": "Email",
          "emailVerified": "Email verified",
          "name": "Name",
          "role": "Role",
          "status": "Status"
        },
        "title": "User management",
        "toast": {
          "banError": "Could not ban the user",
          "banSuccess": "User banned successfully",
          "createError": "Could not create the user",
          "createSuccess": "User created successfully",
          "deleteError": "Could not delete the user",
          "deleteSuccess": "User deleted successfully",
          "passwordCopied": "Password copied to clipboard",
          "unbanError": "Could not unban the user",
          "unbanSuccess": "User unbanned successfully",
          "updateError": "Could not update the user",
          "updateSuccess": "User updated successfully"
        },
        "validation": {
          "email": "Enter a valid email address",
          "name": "Name is required",
          "passwordRequired": "Password is required",
          "role": "Please select a role"
        }
      }
    },
    "auth": {
      "forgot": {
        "backToLogin": "Back to sign in",
        "emailPlaceholder": "you@example.com",
        "error": "Unable to send the reset email",
        "submit": "Send reset link",
        "submitting": "Sending email...",
        "success": "Password reset email sent",
        "title": "Reset your password"
      },
      "layout": {
        "subtitle": "Sign in to manage academic records and grades",
        "title": "Welcome back"
      },
      "login": {
        "emailPlaceholder": "you@example.com",
        "error": "Unable to sign in. Check your credentials.",
        "forgotPassword": "Forgot password?",
        "noAccount": "Don't have an account?",
        "passwordPlaceholder": "Your password",
        "registerLink": "Create one",
        "submit": "Sign in",
        "submitting": "Signing you in...",
        "success": "Signed in successfully",
        "title": "Sign in to your account"
      },
      "logout": {
        "aria": "Sign out",
        "error": "Unable to sign out",
        "success": "Signed out successfully"
      },
      "register": {
        "error": "Unable to create the account",
        "haveAccount": "Already registered?",
        "loginLink": "Sign in",
        "placeholders": {
          "confirmPassword": "Repeat your password",
          "email": "you@example.com",
          "firstName": "First name",
          "lastName": "Last name",
          "password": "Choose a strong password"
        },
        "submit": "Sign up",
        "submitting": "Creating your account...",
        "success": "Account created successfully",
        "title": "Create your account"
      },
      "reset": {
        "backToLogin": "Return to sign in",
        "confirmPasswordPlaceholder": "Confirm your new password",
        "error": "Unable to update the password",
        "newPassword": "New password",
        "passwordPlaceholder": "Enter a new password",
        "submit": "Update password",
        "submitting": "Updating password...",
        "success": "Password updated successfully",
        "title": "Choose a new password"
      },
      "validation": {
        "confirmPassword": "Confirm password is required",
        "email": "Enter a valid email address",
        "firstName": "First name must be at least 2 characters",
        "lastName": "Last name must be at least 2 characters",
        "passwordMin": "Password must be at least {{count}} characters",
        "passwordsMismatch": "Passwords do not match"
      }
    },
    "common": {
      "actions": {
        "cancel": "Cancel",
        "close": "Close",
        "confirm": "Confirm",
        "delete": "Delete",
        "save": "Save",
        "saveChanges": "Save Changes",
        "saving": "Saving...",
        "search": "Search"
      },
      "fields": {
        "confirmPassword": "Confirm Password",
        "email": "Email",
        "firstName": "First Name",
        "lastName": "Last Name",
        "password": "Password"
      },
      "invalidDate": "Invalid date",
      "loading": "Loading...",
      "pagination": {
        "next": "Next",
        "previous": "Previous"
      },
      "status": {
        "active": "Active",
        "inactive": "Inactive"
      },
      "table": {
        "actions": "Actions"
      }
    },
    "navigation": {
      "header": {
        "adminDashboard": "Admin dashboard",
        "notificationsAria": "Open notifications",
        "teacherDashboard": "Teacher dashboard",
        "toggleSidebarAria": "Toggle sidebar"
      }
    },
    "teacher": {
      "classCourses": {
        "actions": {
          "add": "Assign Course"
        },
        "delete": {
          "message": "Are you sure you want to delete this course assignment? This action cannot be undone and will also delete all associated exams and grades.",
          "title": "Delete Course Assignment"
        },
        "empty": {
          "description": "Get started by assigning a course to a class.",
          "title": "No course assignments"
        },
        "form": {
          "classLabel": "Class",
          "classPlaceholder": "Select a class",
          "courseLabel": "Course",
          "coursePlaceholder": "Select a course",
          "createTitle": "New Course Assignment",
          "editTitle": "Edit Course Assignment",
          "submit": "Save assignment",
          "teacherLabel": "Teacher",
          "teacherPlaceholder": "Select a teacher"
        },
        "subtitle": "Manage course assignments for classes",
        "table": {
          "class": "Class",
          "course": "Course",
          "program": "Program",
          "teacher": "Teacher"
        },
        "title": "Course Assignments",
        "toast": {
          "createError": "Could not create the assignment",
          "createSuccess": "Course assignment created successfully",
          "deleteError": "Could not delete the assignment",
          "deleteSuccess": "Course assignment deleted successfully",
          "updateError": "Could not update the assignment",
          "updateSuccess": "Course assignment updated successfully"
        },
        "validation": {
          "class": "Please select a class",
          "course": "Please select a course",
          "teacher": "Please select a teacher"
        }
      },
      "courses": {
        "actions": {
          "viewGrades": "View Grades"
        },
        "empty": {
          "description": "You don't have any courses assigned for the active academic year.",
          "title": "No courses assigned"
        },
        "subtitle": "Manage your assigned courses and grades",
        "title": "My Courses"
      },
      "courses.manage": {
        "actions": {
          "add": "Add Course"
        },
        "delete": {
          "message": "Are you sure you want to delete this course? This action cannot be undone.",
          "title": "Delete Course"
        },
        "form": {
          "createTitle": "Add New Course",
          "creditsLabel": "Credits",
          "creditsPlaceholder": "Enter credits",
          "editTitle": "Edit Course",
          "hoursLabel": "Hours",
          "hoursPlaceholder": "Enter hours",
          "nameLabel": "Course name",
          "namePlaceholder": "Enter course name",
          "programLabel": "Program",
          "programPlaceholder": "Select a program",
          "submit": "Save course",
          "teacherLabel": "Default teacher",
          "teacherPlaceholder": "Select a teacher"
        },
        "table": {
          "credits": "Credits",
          "hours": "Hours",
          "name": "Name",
          "program": "Program",
          "teacher": "Default Teacher"
        },
        "title": "Course Management",
        "toast": {
          "createError": "Could not create the course",
          "createSuccess": "Course created successfully",
          "deleteError": "Could not delete the course",
          "deleteSuccess": "Course deleted successfully",
          "updateError": "Could not update the course",
          "updateSuccess": "Course updated successfully"
        },
        "validation": {
          "credits": "Credits must be at least 1",
          "hours": "Hours must be at least 1",
          "name": "Name must be at least 2 characters",
          "program": "Please select a program",
          "teacher": "Please select a teacher"
        }
      },
      "dashboard": {
        "activeYear": "Active Year: {{year}}",
        "courses": {
          "empty": {
            "description": "You have no assigned courses for the active academic year.",
            "title": "No courses found"
          },
          "title": "My Courses",
          "view": "View →",
          "viewAll": "View all courses →"
        },
        "exams": {
          "empty": {
            "description": "You have no scheduled exams coming up.",
            "title": "No upcoming exams"
          },
          "percentage": "{{value}}%",
          "title": "Upcoming Exams"
        },
        "noActiveYear": "No active year",
        "programStats": {
          "empty": "No program data available for the active academic year",
          "title": "Students per Program"
        },
        "stats": {
          "classes": "Classes",
          "courses": "My Courses",
          "exams": "Exams",
          "students": "Students"
        },
        "subtitle": "Welcome back, {{name}}",
        "title": "Teacher Dashboard"
      },
      "exams": {
        "actions": {
          "add": "Add Exam"
        },
        "delete": {
          "message": "Are you sure you want to delete this exam? This action cannot be undone and will also delete all associated grades.",
          "title": "Delete Exam"
        },
        "empty": {
          "description": "Get started by adding your first exam.",
          "title": "No exams found"
        },
        "form": {
          "classCourseLabel": "Linked course",
          "classCoursePlaceholder": "Select a course",
          "createTitle": "Add New Exam",
          "dateLabel": "Date",
          "editTitle": "Edit Exam",
          "nameLabel": "Exam name",
          "namePlaceholder": "Enter exam name",
          "percentageLabel": "Weight (1-100)",
          "percentagePlaceholder": "Enter percentage",
          "submit": "Save exam",
          "typeLabel": "Type",
          "typePlaceholder": "e.g. Midterm, Final"
        },
        "status": {
          "locked": "Locked",
          "open": "Open"
        },
        "subtitle": "Create and manage course exams",
        "table": {
          "class": "Class",
          "course": "Course",
          "date": "Date",
          "name": "Name",
          "percentage": "Percentage",
          "percentageValue": "{{value}}%",
          "status": "Status",
          "type": "Type"
        },
        "title": "Exam Management",
        "toast": {
          "createError": "Could not create the exam",
          "createSuccess": "Exam created successfully",
          "deleteError": "Could not delete the exam",
          "deleteSuccess": "Exam deleted successfully",
          "updateError": "Could not update the exam",
          "updateSuccess": "Exam updated successfully"
        },
        "validation": {
          "classCourse": "Please select a course",
          "date": "Date is required",
          "name": "Name must be at least 2 characters",
          "percentage": {
            "max": "Percentage cannot exceed 100",
            "min": "Percentage must be at least 1"
          },
          "type": "Type must be at least 2 characters"
        }
      },
      "faculties": {
        "actions": {
          "add": "Add Faculty"
        },
        "delete": {
          "message": "Are you sure you want to delete this faculty? This action cannot be undone.",
          "title": "Delete Faculty"
        },
        "empty": {
          "description": "Get started by adding your first faculty.",
          "title": "No faculties found"
        },
        "form": {
          "createTitle": "Add New Faculty",
          "descriptionLabel": "Description",
          "descriptionPlaceholder": "Enter faculty description",
          "editTitle": "Edit Faculty",
          "nameLabel": "Faculty name",
          "namePlaceholder": "Enter faculty name",
          "submit": "Save faculty"
        },
        "subtitle": "Create and manage academic faculties",
        "table": {
          "description": "Description",
          "name": "Name",
          "noDescription": "No description"
        },
        "title": "Faculty Management",
        "toast": {
          "createError": "Could not create the faculty",
          "createSuccess": "Faculty created successfully",
          "deleteError": "Could not delete the faculty",
          "deleteSuccess": "Faculty deleted successfully",
          "updateError": "Could not update the faculty",
          "updateSuccess": "Faculty updated successfully"
        },
        "validation": {
          "name": "Name must be at least 2 characters"
        }
      },
      "gradeEntry": {
        "actions": {
          "lock": "Lock grades",
          "save": "Save grades",
          "saving": "Saving..."
        },
        "emptyStudents": {
          "description": "There are no students enrolled in this class.",
          "title": "No students found"
        },
        "info": {
          "description": "Grades should be entered on a scale of 0-20. Once grades are locked, they cannot be modified. Please review carefully before locking.",
          "title": "Grading information"
        },
        "lockedChip": "Grades locked",
        "selectExam": {
          "empty": "No exams available",
          "label": "Select exam",
          "lockedTag": "Locked"
        },
        "status": {
          "graded": "Graded",
          "notGraded": "Not graded"
        },
        "table": {
          "registration": "Registration #",
          "score": "Score (0-20)",
          "status": "Status",
          "student": "Student name"
        },
        "title": "Grade Entry",
        "toast": {
          "fetchCourseError": "Could not load course information",
          "fetchGradesError": "Could not load grades",
          "lockError": "Could not lock the exam",
          "lockSuccess": "Exam locked successfully. Grades can no longer be modified.",
          "saveError": "Could not save grades",
          "saveSuccess": "Grades saved successfully"
        },
        "validation": {
          "max": "Maximum score is 20",
          "min": "Minimum score is 0"
        }
      },
      "gradeExport": {
        "actions": {
          "export": "Export grades",
          "label": "Export"
        },
        "columns": {
          "birthDate": "Birth date",
          "birthPlace": "Birth place",
          "firstName": "First name",
          "gender": "Gender",
          "lastName": "Last name",
          "registration": "Registration number"
        },
        "exams": {
          "emptyDescription": "There are no exams created for this class yet.",
          "emptyTitle": "No exams found",
          "title": "Select exams to include"
        },
        "filePrefix": "grades",
        "filters": {
          "academicYear": "Academic year",
          "academicYearPlaceholder": "Select academic year",
          "class": "Class",
          "classPlaceholder": "Select class"
        },
        "sheetName": "Grades",
        "subtitle": "Export student grades by class and course",
        "title": "Grade Export",
        "unknownClass": "unknown-class"
      },
      "programs": {
        "actions": {
          "add": "Add Program"
        },
        "delete": {
          "message": "Are you sure you want to delete this program? This action cannot be undone.",
          "title": "Delete Program"
        },
        "empty": {
          "description": "Get started by adding your first program.",
          "title": "No programs found"
        },
        "form": {
          "createTitle": "Add New Program",
          "descriptionLabel": "Description",
          "descriptionPlaceholder": "Optional description (objectives, focus)",
          "editTitle": "Edit Program",
          "facultyLabel": "Faculty",
          "facultyPlaceholder": "Select a faculty",
          "nameLabel": "Program name",
          "namePlaceholder": "Enter program name",
          "submit": "Save program"
        },
        "subtitle": "Manage academic programs",
        "table": {
          "description": "Description",
          "faculty": "Faculty",
          "name": "Name",
          "noDescription": "No description"
        },
        "title": "Program Management",
        "toast": {
          "createError": "Could not create the program",
          "createSuccess": "Program created successfully",
          "deleteError": "Could not delete the program",
          "deleteSuccess": "Program deleted successfully",
          "updateError": "Could not update the program",
          "updateSuccess": "Program updated successfully"
        },
        "validation": {
          "faculty": "Please select a faculty",
          "name": "Name must be at least 2 characters"
        }
      },
      "promotion": {
        "actions": {
          "promote": "Promote",
          "promoteSelected": "Promote selected"
        },
        "emptyStudents": {
          "description": "There are no students in this class.",
          "title": "No students found"
        },
        "sourceClassLabel": "Source class ({{year}})",
        "sourceClassPlaceholder": "Select source class",
        "students": {
          "autoSelect": "Select average ≥ 10",
          "average": "Average grade: {{value}}",
          "listTitle": "Students",
          "selectedCount": "({{count}} selected)",
          "title": "Eligible students"
        },
        "subtitle": "Promote students to their next class",
        "summary": {
          "hint": "Average ≥ 10 will be auto-selected",
          "selected": "{{count}} selected"
        },
        "table": {
          "courseAverages": "Course averages",
          "name": "Name",
          "overallAverage": "Overall average",
          "registration": "Registration #"
        },
        "targetClassLabel": "Target class ({{year}})",
        "targetClassPlaceholder": "Select target class",
        "title": "Student Promotion",
        "toast": {
          "error": "Could not promote students",
          "missingSelection": "Please select students and a target class",
          "success": "Successfully promoted {{count}} students"
        },
        "unknownYear": "Unknown"
      }
    }
  }
}

export default Resources;
