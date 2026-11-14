import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "@/lib/toast";
import { trpc, trpcClient } from "@/utils/trpc";
import type { ProgramData } from "../types";
import { useStudyCycles } from "./use-study-cycles";

const schema = z.object({
	name: z.string().min(1, "Name is required"),
	nameEn: z.string().optional().nullable(),
	code: z.string().min(1, "Code is required"),
	abbreviation: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	domainFr: z.string().optional().nullable(),
	domainEn: z.string().optional().nullable(),
	specialiteFr: z.string().optional().nullable(),
	specialiteEn: z.string().optional().nullable(),
	diplomaTitleFr: z.string().optional().nullable(),
	diplomaTitleEn: z.string().optional().nullable(),
	attestationValidityFr: z.string().optional().nullable(),
	attestationValidityEn: z.string().optional().nullable(),
	cycleId: z.string().nullable().optional(),
	centerId: z.string().nullable().optional(),
	isCenterProgram: z.boolean().optional(),
});

export type ProgramDetailsFormData = z.infer<typeof schema>;

const emptyValues: ProgramDetailsFormData = {
	name: "",
	nameEn: "",
	code: "",
	abbreviation: "",
	description: "",
	domainFr: "",
	domainEn: "",
	specialiteFr: "",
	specialiteEn: "",
	diplomaTitleFr: "",
	diplomaTitleEn: "",
	attestationValidityFr: "",
	attestationValidityEn: "",
	cycleId: null,
	centerId: null,
	isCenterProgram: false,
};

const toFormValues = (program: ProgramData): ProgramDetailsFormData => ({
	name: program.name ?? "",
	nameEn: program.nameEn ?? "",
	code: program.code ?? "",
	abbreviation: program.abbreviation ?? "",
	description: program.description ?? "",
	domainFr: program.domainFr ?? "",
	domainEn: program.domainEn ?? "",
	specialiteFr: program.specialiteFr ?? "",
	specialiteEn: program.specialiteEn ?? "",
	diplomaTitleFr: program.diplomaTitleFr ?? "",
	diplomaTitleEn: program.diplomaTitleEn ?? "",
	attestationValidityFr: program.attestationValidityFr ?? "",
	attestationValidityEn: program.attestationValidityEn ?? "",
	cycleId: program.cycleId ?? null,
	centerId: program.centerId ?? null,
	isCenterProgram: program.isCenterProgram ?? false,
});

/** Edit form of a program's details, its select options and its save mutation. */
export function useProgramDetailsForm(
	programId: string,
	program: ProgramData,
	refetch: () => void,
) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { data: cycles } = useStudyCycles();
	const { data: centersData } = useQuery({
		queryKey: ["centers", "select"],
		queryFn: () => trpcClient.centers.list.query({ limit: 200 }),
	});

	const form = useForm<ProgramDetailsFormData>({
		resolver: zodResolver(schema),
		defaultValues: emptyValues,
	});

	useEffect(() => {
		if (program) form.reset(toFormValues(program));
	}, [program, form]);

	const update = useMutation({
		mutationFn: (data: ProgramDetailsFormData) =>
			trpcClient.programs.update.mutate({ id: programId, ...data }),
		onSuccess: () => {
			toast.success(
				t("admin.programs.toast.updateSuccess", {
					defaultValue: "Program updated",
				}),
			);
			queryClient.invalidateQueries(
				trpc.programs.getById.queryOptions({ id: programId }),
			);
			refetch();
		},
		onError: (err: Error) => toast.error(err.message),
	});

	return {
		form,
		update,
		cycles: cycles?.items ?? [],
		centers: centersData?.items ?? [],
		selectedCenterId: form.watch("centerId"),
	};
}

export type ProgramDetailsFormController = ReturnType<
	typeof useProgramDetailsForm
>;
