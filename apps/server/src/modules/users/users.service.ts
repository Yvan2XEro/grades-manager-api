import type {
  BusinessRole,
  DomainUserStatus,
  Gender,
} from "@/db/schema/app-schema";
import { domainUsersRepo } from "@/modules/domain-users";
import * as repo from "./users.repo";

type CreateProfileInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: BusinessRole;
  phone?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  status?: DomainUserStatus;
  authUserId?: string;
};

type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: BusinessRole;
  phone?: string | null;
  dateOfBirth?: Date | null;
  placeOfBirth?: string | null;
  gender?: Gender;
  nationality?: string | null;
  status?: DomainUserStatus;
  authUserId?: string | null;
};

const normalizeDate = (value?: Date | null) => {
  if (!value) return null;
  return value.toISOString().split("T")[0];
};

export async function listUsers(opts: Parameters<typeof repo.list>[0]) {
  return repo.list(opts);
}

export async function createUserProfile(data: CreateProfileInput) {
  return domainUsersRepo.create({
    businessRole: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    primaryEmail: data.email,
    phone: data.phone ?? null,
    dateOfBirth: normalizeDate(data.dateOfBirth),
    placeOfBirth: data.placeOfBirth ?? null,
    gender: data.gender ?? "other",
    nationality: data.nationality ?? null,
    status: data.status ?? "active",
    authUserId: data.authUserId ?? null,
  });
}

export async function updateUserProfile(id: string, data: UpdateProfileInput) {
  const payload: Record<string, unknown> = {};
  if (data.firstName !== undefined) payload.firstName = data.firstName;
  if (data.lastName !== undefined) payload.lastName = data.lastName;
  if (data.email !== undefined) payload.primaryEmail = data.email;
  if (data.role !== undefined) payload.businessRole = data.role;
  if (data.phone !== undefined) payload.phone = data.phone ?? null;
  if (data.dateOfBirth !== undefined)
    payload.dateOfBirth = normalizeDate(data.dateOfBirth);
  if (data.placeOfBirth !== undefined)
    payload.placeOfBirth = data.placeOfBirth ?? null;
  if (data.gender !== undefined) payload.gender = data.gender;
  if (data.nationality !== undefined)
    payload.nationality = data.nationality ?? null;
  if (data.status !== undefined) payload.status = data.status;
  if (data.authUserId !== undefined)
    payload.authUserId = data.authUserId ?? null;
  if (!Object.keys(payload).length) {
    return domainUsersRepo.findById(id);
  }
  await domainUsersRepo.update(id, payload);
  return domainUsersRepo.findById(id);
}

export async function deleteUserProfile(id: string) {
  await domainUsersRepo.remove(id);
}
