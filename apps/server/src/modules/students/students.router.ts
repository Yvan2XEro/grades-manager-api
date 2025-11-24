import { adminProcedure, protectedProcedure, router } from "../../lib/trpc";
import * as service from "./students.service";
import {
	baseSchema,
	bulkCreateSchema,
	idSchema,
	listSchema,
	type StudentProfilePayload,
	updateSchema,
} from "./students.zod";

type CreateStudentInput = Parameters<typeof service.createStudent>[0];
type ServiceProfileInput = CreateStudentInput["profile"];

function mapProfile(payload: StudentProfilePayload): ServiceProfileInput;
function mapProfile(
	payload: Partial<StudentProfilePayload>,
): Partial<ServiceProfileInput>;
function mapProfile(payload: Partial<StudentProfilePayload>) {
	return {
		firstName: payload.firstName,
		lastName: payload.lastName,
		primaryEmail: payload.email,
		dateOfBirth: payload.dateOfBirth,
		placeOfBirth: payload.placeOfBirth,
		gender: payload.gender,
		phone: payload.phone,
		nationality: payload.nationality,
		authUserId: payload.authUserId,
	};
}

const hasProfileData = (payload: Partial<ServiceProfileInput>) =>
	Object.values(payload).some((value) => value !== undefined);

export const studentsRouter = router({
	create: adminProcedure.input(baseSchema).mutation(({ input }) =>
		service.createStudent({
			classId: input.classId,
			registrationNumber: input.registrationNumber,
			profile: mapProfile(input),
		}),
	),
	update: adminProcedure.input(updateSchema).mutation(({ input }) => {
		const profilePayload = mapProfile(input) as Partial<ServiceProfileInput>;
		return service.updateStudent(input.id, {
			classId: input.classId,
			registrationNumber: input.registrationNumber,
			profile: hasProfileData(profilePayload) ? profilePayload : undefined,
		});
	}),
	bulkCreate: adminProcedure.input(bulkCreateSchema).mutation(({ input }) =>
		service.bulkCreateStudents({
			classId: input.classId,
			students: input.students.map((student) => ({
				registrationNumber: student.registrationNumber,
				profile: mapProfile(student) as ServiceProfileInput,
			})),
		}),
	),
	list: protectedProcedure
		.input(listSchema)
		.query(({ input }) => service.listStudents(input)),
	getById: protectedProcedure
		.input(idSchema)
		.query(({ input }) => service.getStudentById(input.id)),
});
