import z from "zod";

export const baseSchema = z.object({ firstName: z.string(), lastName: z.string(), email: z.email(), registrationNumber: z.string(), classId: z.string() });
export const updateSchema = baseSchema.partial().extend({ id: z.string() });
export const listSchema = z.object({ classId: z.string().optional(), q: z.string().optional(), cursor: z.string().optional(), limit: z.number().optional() });
export const idSchema = z.object({ id: z.string() });
export const bulkCreateSchema = z.object({
  classId: z.string(),
  students: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.email(),
      registrationNumber: z.string(),
    }),
  ),
});
