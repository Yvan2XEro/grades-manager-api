import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { createTRPCProxyClient } from "@trpc/client";
import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { appRouter, type AppRouter } from "../index";
import { asAdmin, createProfile } from "../../lib/test-utils";

const app = new Hono();

// mount tRPC on Hono (in-memory)
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: () => asAdmin(),
  }),
);
app.get("/", (c) => c.text("OK"));

// ✅ make fetch always return Promise<Response> and accept RequestInfo
const honoFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const req =
    typeof input === "string" || input instanceof URL
      ? new Request(input.toString(), init)
      : (input as Request);
  return await app.request(req); // ensures Promise<Response>
};

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      // can be any URL; it's only used to build the Request we hand to Hono
      url: "http://test.local/trpc",
      fetch: honoFetch,
    }),
  ],
});

describe("e2e http", () => {
  it("health check", async () => {
    const res = await app.request("/");
    expect(await res.text()).toBe("OK");
  });

  it("creates full flow", async () => {
    const faculty = await client.faculties.create.mutate({ name: "F" });

    const program = await client.programs.create.mutate({
      name: "P",
      faculty: faculty.id,
    });

    const year = await client.academicYears.create.mutate({
      name: "2025",
      startDate: new Date().toISOString(), // 👈 if your Zod expects string
      endDate: new Date(Date.now() + 86400000).toISOString(),
    });

    const klass = await client.classes.create.mutate({
      name: "C",
      program: program.id,
      academicYear: year.id,
    });

    const teacher = await createProfile();

    const course = await client.courses.create.mutate({
      name: "Math",
      credits: 3,
      hours: 30,
      program: program.id,
      defaultTeacher: teacher.id,
    });

    const cc = await client.classCourses.create.mutate({
      class: klass.id,
      course: course.id,
      teacher: teacher.id,
    });

    const exam = await client.exams.create.mutate({
      name: "Mid",
      type: "WRITTEN",
      date: new Date().toISOString(), // 👈 as above
      percentage: 50,
      classCourseId: cc.id,
    });

    const student = await client.students.create.mutate({
      firstName: "A",
      lastName: "B",
      email: "e2e@example.com",
      registrationNumber: "R1",
      classId: klass.id,
    });

    if (exam) {
      await client.grades.upsertNote.mutate({
        studentId: student.id,
        examId: exam.id,
        score: 90,
      });

      const list = await client.grades.listByExam.query({ examId: exam.id });
      expect(list.items.length).toBe(1);
    }
  });
});
