import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const segmentLabels: Record<string, string> = {
  admin: "navigation.breadcrumbs.admin",
  teacher: "navigation.breadcrumbs.teacher",
  dean: "navigation.breadcrumbs.dean",
  student: "navigation.breadcrumbs.student",
  "academic-years": "navigation.sidebar.admin.academicYears",
  institution: "navigation.sidebar.admin.institution",
  "study-cycles": "navigation.sidebar.admin.studyCycles",
  programs: "navigation.sidebar.admin.programs",
  "teaching-units": "navigation.sidebar.admin.teachingUnits",
  classes: "navigation.sidebar.admin.classes",
  users: "navigation.sidebar.admin.users",
  students: "navigation.sidebar.admin.students",
  courses: "navigation.sidebar.teacher.courses",
  "class-courses": "navigation.sidebar.admin.courseAssignments",
  enrollments: "navigation.sidebar.admin.enrollments",
  exams: "navigation.sidebar.admin.exams",
  "exam-types": "navigation.sidebar.admin.examTypes",
  "exam-scheduler": "navigation.sidebar.admin.examScheduler",
  "grade-export": "navigation.sidebar.admin.gradeExport",
  "export-templates": "navigation.sidebar.admin.exportTemplates",
  "promotion-rules": "navigation.sidebar.admin.promotionRules",
  rules: "navigation.sidebar.admin.rules",
  "registration-numbers": "navigation.sidebar.admin.registrationNumbers",
  monitoring: "navigation.sidebar.admin.monitoring",
  notifications: "navigation.sidebar.admin.notifications",
  "batch-jobs": "navigation.sidebar.admin.batchJobs",
  "retake-eligibility": "navigation.sidebar.admin.retakeEligibility",
  workflows: "navigation.sidebar.dean.workflows",
  attendance: "navigation.sidebar.teacher.attendance",
  grades: "navigation.sidebar.teacher.grades",
};

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: BreadcrumbItem[] = [];

  // Find the last non-UUID segment index for correct "current page" detection
  let lastNonUuidIndex = segments.length - 1;
  while (lastNonUuidIndex >= 0 && UUID_REGEX.test(segments[lastNonUuidIndex])) {
    lastNonUuidIndex--;
  }

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip UUID segments
    if (UUID_REGEX.test(segment)) continue;

    const labelKey = segmentLabels[segment];
    const isLast = i === lastNonUuidIndex;

    crumbs.push({
      label: labelKey ? t(labelKey) : segment.replace(/-/g, " "),
      href: isLast ? undefined : currentPath,
    });
  }

  return crumbs;
}
