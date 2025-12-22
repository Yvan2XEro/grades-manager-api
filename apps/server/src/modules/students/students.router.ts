import {
	router,
	tenantAdminProcedure,
	tenantProtectedProcedure,
} from "../../lib/trpc";
import * as service from "./students.service";
import {
	baseSchema,
	bulkCreateSchema,
	externalAdmissionSchema,
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
	create: tenantAdminProcedure.input(baseSchema).mutation(({ ctx, input }) =>
		service.createStudent(
			{
				classId: input.classId,
				registrationNumber: input.registrationNumber,
				registrationFormatId: input.registrationFormatId,
				profile: mapProfile(input),
				admissionType: input.admissionType,
				transferInstitution: input.transferInstitution,
				transferCredits: input.transferCredits,
				transferLevel: input.transferLevel,
				admissionJustification: input.admissionJustification,
				admissionDate: input.admissionDate,
			},
			ctx.institution.id,
		),
	),
	admitExternal: tenantAdminProcedure
		.input(externalAdmissionSchema)
		.mutation(({ ctx, input }) =>
			service.admitExternalStudent(
				{
					classId: input.classId,
					registrationNumber: input.registrationNumber,
					registrationFormatId: input.registrationFormatId,
					profile: mapProfile(input),
					admissionType: input.admissionType,
					transferInstitution: input.transferInstitution,
					transferCredits: input.transferCredits,
					transferLevel: input.transferLevel,
					admissionJustification: input.admissionJustification,
					admissionDate: input.admissionDate,
				},
				ctx.institution.id,
			),
		),
	update: tenantAdminProcedure
		.input(updateSchema)
		.mutation(({ ctx, input }) => {
			const profilePayload = mapProfile(input) as Partial<ServiceProfileInput>;
			return service.updateStudent(
				input.id,
				{
					classId: input.classId,
					registrationNumber: input.registrationNumber,
					profile: hasProfileData(profilePayload) ? profilePayload : undefined,
				},
				ctx.institution.id,
			);
		}),
	bulkCreate: tenantAdminProcedure
		.input(bulkCreateSchema)
		.mutation(({ ctx, input }) =>
			service.bulkCreateStudents(
				{
					classId: input.classId,
					registrationFormatId: input.registrationFormatId,
					students: input.students.map((student) => ({
						registrationNumber: student.registrationNumber,
						profile: mapProfile(student) as ServiceProfileInput,
					})),
				},
				ctx.institution.id,
			),
		),
	list: tenantProtectedProcedure
		.input(listSchema)
		.query(({ ctx, input }) => service.listStudents(input, ctx.institution.id)),
	getById: tenantProtectedProcedure
		.input(idSchema)
		.query(({ ctx, input }) =>
			service.getStudentById(input.id, ctx.institution.id),
		),
});
