import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockExam = {
	id: string;
	name: string;
	type: string;
	date: string;
	percentage: number;
	classCourse: string;
	status: string;
	isLocked: boolean;
};

type MockGrade = {
	id: string;
	examId: string;
	student: string;
	score: number;
};

type MockNotification = {
	id: string;
	type: string;
	status: string;
	payload: Record<string, unknown>;
};

type MockEnrollmentWindow = {
	id: string;
	classId: string;
	academicYearId: string;
	status: string;
};

type MockState = {
	classCourses: Array<{ id: string; class: string; course: string }>;
	classes: Array<{ id: string; name: string; program: string }>;
	courses: Array<{ id: string; name: string }>;
	programs: Array<{ id: string; name: string }>;
	students: Array<{
		id: string;
		firstName: string;
		lastName: string;
		registrationNumber: string;
		classId: string;
	}>;
	exams: MockExam[];
	grades: MockGrade[];
	notifications: MockNotification[];
	enrollmentWindows: MockEnrollmentWindow[];
};

const CLASS_COURSE_ID = "class-course-1";
const CLASS_ID = "class-1";
const COURSE_ID = "course-1";
const PROGRAM_ID = "program-1";

const buildInitialState = (): MockState => ({
	classCourses: [{ id: CLASS_COURSE_ID, class: CLASS_ID, course: COURSE_ID }],
	classes: [{ id: CLASS_ID, name: "L1 Computer Science", program: PROGRAM_ID }],
	courses: [{ id: COURSE_ID, name: "Algorithms" }],
	programs: [{ id: PROGRAM_ID, name: "Engineering" }],
	students: [
		{
			id: "student-1",
			firstName: "Alice",
			lastName: "Martin",
			registrationNumber: "REG-001",
			classId: CLASS_ID,
		},
		{
			id: "student-2",
			firstName: "Noah",
			lastName: "Kouame",
			registrationNumber: "REG-002",
			classId: CLASS_ID,
		},
	],
	exams: [],
	grades: [],
	notifications: [
		{
			id: "notif-1",
			type: "exam_submission",
			status: "pending",
			payload: { examId: "pending" },
		},
	],
	enrollmentWindows: [
		{ id: "window-1", classId: CLASS_ID, academicYearId: "2024", status: "open" },
	],
});

const mockState: MockState = buildInitialState();

let examCounter = 1;
let gradeCounter = 1;

const resetMockState = () => {
	const fresh = buildInitialState();
	Object.assign(mockState, fresh);
	examCounter = 1;
	gradeCounter = 1;
};

const findById = <T extends { id: string }>(collection: T[], id: string): T => {
	const entity = collection.find((item) => item.id === id);
	if (!entity) {
		throw new Error(`Entity ${id} not found`);
	}
	return entity;
};

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("../../utils/trpc", () => {
	const findExam = (examId: string) => findById(mockState.exams, examId);

	const trpcClient = {
		exams: {
			list: {
				query: vi.fn(async (input: { classCourseId?: string } = {}) => {
					const filtered = input.classCourseId
						? mockState.exams.filter((exam) => exam.classCourse === input.classCourseId)
						: mockState.exams;
					return { items: filtered };
				}),
			},
			create: {
				mutate: vi.fn(async (data: {
					classCourseId: string;
					name: string;
					type: string;
					date: Date;
					percentage: number;
				}) => {
					const exam: MockExam = {
						id: `exam-${examCounter++}`,
						name: data.name,
						type: data.type,
						date: data.date.toISOString(),
						percentage: data.percentage,
						classCourse: data.classCourseId,
						status: "draft",
						isLocked: false,
					};
					mockState.exams.push(exam);
					return exam;
				}),
			},
			update: {
				mutate: vi.fn(async ({ id, ...changes }: { id: string } & Partial<MockExam>) => {
					Object.assign(findExam(id), changes);
				}),
			},
			delete: {
				mutate: vi.fn(async ({ id }: { id: string }) => {
					const index = mockState.exams.findIndex((exam) => exam.id === id);
					if (index >= 0) {
						mockState.exams.splice(index, 1);
					}
				}),
			},
			submit: {
				mutate: vi.fn(async ({ examId }: { examId: string }) => {
					findExam(examId).status = "submitted";
				}),
			},
			lock: {
				mutate: vi.fn(async ({ examId, lock }: { examId: string; lock: boolean }) => {
					findExam(examId).isLocked = lock;
				}),
			},
		},
		classCourses: {
			list: {
				query: vi.fn(async () => ({ items: mockState.classCourses })),
			},
			getById: {
				query: vi.fn(async ({ id }: { id: string }) => findById(mockState.classCourses, id)),
			},
		},
		classes: {
			list: {
				query: vi.fn(async () => ({ items: mockState.classes })),
			},
			getById: {
				query: vi.fn(async ({ id }: { id: string }) => findById(mockState.classes, id)),
			},
		},
		courses: {
			list: {
				query: vi.fn(async () => ({ items: mockState.courses })),
			},
			getById: {
				query: vi.fn(async ({ id }: { id: string }) => findById(mockState.courses, id)),
			},
		},
		programs: {
			getById: {
				query: vi.fn(async ({ id }: { id: string }) => findById(mockState.programs, id)),
			},
		},
		students: {
			list: {
				query: vi.fn(async ({ classId }: { classId: string }) => ({
					items: mockState.students.filter((student) => student.classId === classId),
				})),
			},
		},
		grades: {
			listByExam: {
				query: vi.fn(async ({ examId }: { examId: string }) => ({
					items: mockState.grades.filter((grade) => grade.examId === examId),
				})),
			},
			upsertNote: {
				mutate: vi.fn(async ({
					studentId,
					examId,
					score,
				}: {
					studentId: string;
					examId: string;
					score: number;
				}) => {
					const existing = mockState.grades.find(
						(grade) => grade.examId === examId && grade.student === studentId,
					);
					if (existing) {
						existing.score = score;
						return existing;
					}
					const next: MockGrade = {
						id: `grade-${gradeCounter++}`,
						examId,
						student: studentId,
						score,
					};
					mockState.grades.push(next);
					return next;
				}),
			},
		},
		workflows: {
			validateGrades: {
				mutate: vi.fn(async ({ examId }: { examId: string }) => {
					findExam(examId).status = "approved";
				}),
			},
		},
		notifications: {
			list: {
				query: vi.fn(async ({ status }: { status?: string } = {}) =>
					status
						? mockState.notifications.filter((notification) => notification.status === status)
						: mockState.notifications,
				),
			},
		},
	};

	const createQueryOptions = (
		key: string,
		queryFn: (input?: Record<string, unknown>) => Promise<unknown>,
	) => ({
		queryOptions: (input?: Record<string, unknown>) => ({
			queryKey: [key, input ?? {}],
			queryFn: () => queryFn(input ?? {}),
		}),
		queryKey: (input?: Record<string, unknown>) => [key, input ?? {}],
	});

	const trpc = {
		classCourses: {
			list: createQueryOptions("classCourses", () => trpcClient.classCourses.list.query({})),
		},
		exams: {
			list: createQueryOptions("exams", (input) => trpcClient.exams.list.query(input)),
		},
		notifications: {
			list: createQueryOptions("notifications", (input) =>
				trpcClient.notifications.list.query(input),
			),
		},
		workflows: {
			enrollmentWindows: {
				queryOptions: () => ({
					queryKey: ["enrollment-windows"],
					queryFn: () => Promise.resolve(mockState.enrollmentWindows),
				}),
				queryKey: () => ["enrollment-windows"],
			},
		},
		healthCheck: {
			queryOptions: () => ({
				queryKey: ["health"],
				queryFn: () => Promise.resolve({ ok: true }),
			}),
			queryKey: () => ["health"],
		},
	};

	return { trpcClient, trpc, queryClient: {} };
});

import { useStore } from "../../store";
import { trpcClient } from "../../utils/trpc";
import AdminExamManagement from "../admin/ExamManagement";
import WorkflowApprovals from "../dean/WorkflowApprovals";
import GradeEntry from "../teacher/GradeEntry";
import WorkflowManager from "../teacher/WorkflowManager";

const renderWithProviders = (
	ui: ReactElement,
	options?: { route?: string; path?: string },
) => {
	const client = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});

	const route = options?.route ?? "/";

	return render(
		<QueryClientProvider client={client}>
			<MemoryRouter initialEntries={[route]}>
				{options?.path ? (
					<Routes>
						<Route path={options.path} element={ui} />
					</Routes>
				) : (
					ui
				)}
			</MemoryRouter>
		</QueryClientProvider>,
	);
};

describe("exam workflow UI e2e", () => {
	beforeEach(() => {
		resetMockState();
		useStore.setState((state) => ({
			...state,
			user: {
				profileId: "teacher-1",
				authUserId: "teacher-1",
				email: "teacher@example.com",
				firstName: "Tessa",
				lastName: "Ngoma",
				role: "teacher",
				permissions: {
					canManageCatalog: false,
					canManageStudents: false,
					canGrade: true,
					canAccessAnalytics: false,
				},
			},
		}));
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("schedules, submits, validates, and grades an exam", async () => {
		const examName = "Algorithms Midterm";

		const examManagement = renderWithProviders(<AdminExamManagement />);
		const addButton = await screen.findByRole("button", { name: /Add Exam/i });
		fireEvent.click(addButton);

		const courseSelect = await screen.findByLabelText("Linked course");
		fireEvent.change(courseSelect, { target: { value: CLASS_COURSE_ID } });
		fireEvent.change(screen.getByLabelText("Exam name"), {
			target: { value: examName },
		});
		fireEvent.change(screen.getByLabelText("Type"), {
			target: { value: "Midterm" },
		});
		fireEvent.change(screen.getByLabelText("Date"), {
			target: { value: "2024-03-01" },
		});
		fireEvent.change(screen.getByLabelText("Weight (1-100)"), {
			target: { value: "40" },
		});

		fireEvent.click(screen.getByRole("button", { name: /Save exam/i }));
		await screen.findByText(examName);
		examManagement.unmount();

		const workflowManager = renderWithProviders(<WorkflowManager />);
		const classCourseSelect = await screen.findByRole("combobox");
		fireEvent.change(classCourseSelect, { target: { value: CLASS_COURSE_ID } });
		await screen.findByText(examName);

		fireEvent.click(screen.getByRole("button", { name: /Submit/i }));
		await waitFor(() => {
			expect(screen.getByText("submitted")).toBeInTheDocument();
		});
		workflowManager.unmount();

		const approvals = renderWithProviders(<WorkflowApprovals />);
		const approveButton = await screen.findByRole("button", { name: /Approve & lock/i });
		fireEvent.click(approveButton);
		await waitFor(() => {
			expect(screen.getByText("No pending exams.")).toBeInTheDocument();
		});
		approvals.unmount();

		const gradeEntry = renderWithProviders(<GradeEntry />, {
			route: `/teacher/grades/${CLASS_COURSE_ID}`,
			path: "/teacher/grades/:courseId",
		});
		await screen.findByText("REG-001");

		const scoreInputs = screen.getAllByRole("spinbutton");
		fireEvent.change(scoreInputs[0], { target: { value: "15" } });
		fireEvent.change(scoreInputs[1], { target: { value: "17" } });
		fireEvent.click(screen.getByRole("button", { name: /Save grades/i }));

		await waitFor(() => {
			expect(trpcClient.grades.upsertNote.mutate).toHaveBeenCalledTimes(2);
		});
		await waitFor(() => {
			expect(screen.getAllByText("Graded")).toHaveLength(2);
		});

		const lockButton = screen.getByRole("button", { name: /Lock grades/i });
		fireEvent.click(lockButton);
		await waitFor(() => {
			expect(trpcClient.exams.lock.mutate).toHaveBeenCalledWith({
				examId: mockState.exams[0].id,
				lock: true,
			});
		});
		await screen.findByText("Grades locked");
		gradeEntry.unmount();
	});
});
