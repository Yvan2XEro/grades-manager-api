import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, PlusIcon } from "lucide-react";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { z } from "zod";
import FormModal from "../../components/modals/FormModal";
import { trpcClient } from "../../utils/trpc";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  registrationNumber: string;
  class: string;
}

interface Class {
  id: string;
  name: string;
}

const buildStudentSchema = (t: TFunction) =>
  z.object({
    firstName: z
      .string()
      .min(1, t("admin.students.validation.firstName")),
    lastName: z
      .string()
      .min(1, t("admin.students.validation.lastName")),
    email: z.string().email(t("admin.students.validation.email")),
    registrationNumber: z
      .string()
      .min(1, t("admin.students.validation.registration")),
    classId: z
      .string()
      .min(1, t("admin.students.validation.class")),
  });

type StudentForm = z.infer<ReturnType<typeof buildStudentSchema>>;
type BulkStudent = Omit<StudentForm, "classId">;

export default function StudentManagement() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [classFilter, setClassFilter] = useState("");
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [prevCursors, setPrevCursors] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "import">("single");
  const [importClass, setImportClass] = useState("");
  const [importResult, setImportResult] = useState<
    | {
        createdCount: number;
        conflicts: Array<{ row: number; reason: string }>;
        errors: Array<{ row: number; reason: string }>;
      }
    | null
  >(null);

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { items } = await trpcClient.classes.list.query({});
      return items as Class[];
    },
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students", classFilter, search, cursor],
    queryFn: async () =>
      trpcClient.students.list.query({
        classId: classFilter || undefined,
        q: search || undefined,
        cursor,
        limit: 20,
      }),
  });

  const studentSchema = useMemo(() => buildStudentSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentForm>({ resolver: zodResolver(studentSchema) });

  const createMutation = useMutation({
    mutationFn: (data: StudentForm) => trpcClient.students.create.mutate(data),
    onSuccess: () => {
      toast.success(t("admin.students.toast.createSuccess"));
      queryClient.invalidateQueries({ queryKey: ["students"] });
      closeModal();
    },
    onError: (err: any) => toast.error(err.message || t("admin.students.toast.createError")),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { classId: string; students: BulkStudent[] }) =>
      trpcClient.students.bulkCreate.mutate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (err: any) => toast.error(err.message || t("admin.students.toast.importError")),
  });

  const onSubmit = (data: StudentForm) => createMutation.mutate(data);

  const handleNext = () => {
    if (studentsData?.nextCursor) {
      setPrevCursors((p) => [...p, cursor ?? ""]);
      setCursor(studentsData.nextCursor);
    }
  };
  const handlePrev = () => {
    const prev = prevCursors[prevCursors.length - 1];
    setPrevCursors((p) => p.slice(0, -1));
    setCursor(prev || undefined);
  };

  const handleDownloadTemplate = () => {
    const header = "firstName,lastName,email,registrationNumber\n";
    const csvBlob = new Blob([header], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(csvBlob);
    a.download = `${t("admin.students.templates.filePrefix")}.csv`;
    a.click();

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["firstName", "lastName", "email", "registrationNumber"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, t("admin.students.templates.sheetName"));
    XLSX.writeFile(wb, `${t("admin.students.templates.filePrefix")}.xlsx`);
  };

  const handleImport = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const rows: BulkStudent[] = [];
    const formatErrors: Array<{ row: number; reason: string }> = [];

    if (ext === "csv") {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      parsed.data.forEach((row, idx) => {
        if (row.firstName && row.lastName && row.email && row.registrationNumber) {
          rows.push({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            registrationNumber: row.registrationNumber,
          });
        } else {
          formatErrors.push({
            row: idx + 2,
            reason: t("admin.students.import.invalidFormat"),
          });
        }
      });
    } else {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
      json.forEach((row, idx) => {
        if (row.firstName && row.lastName && row.email && row.registrationNumber) {
          rows.push({
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            registrationNumber: row.registrationNumber,
          });
        } else {
          formatErrors.push({
            row: idx + 2,
            reason: t("admin.students.import.invalidFormat"),
          });
        }
      });
    }

    bulkMutation.mutate(
      { classId: importClass, students: rows },
      {
        onSuccess: (res) => {
          setImportResult({
            createdCount: res.createdCount,
            conflicts: res.conflicts.map((c) => ({
              row: c.row,
              reason: c.reason,
            })),
            errors: [...formatErrors, ...res.errors],
          });
        },
      },
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTab("single");
    setImportClass("");
    setImportResult(null);
    reset();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("admin.students.title")}</h1>
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <PlusIcon className="mr-2 h-5 w-5" />
          {t("admin.students.actions.openModal")}
        </button>
      </div>

      <div className="mb-4 flex gap-4">
        <select
          className="select select-bordered"
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setCursor(undefined);
            setPrevCursors([]);
          }}
        >
          <option value="">{t("admin.students.filters.allClasses")}</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="input input-bordered"
          placeholder={t("admin.students.filters.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            setCursor(undefined);
            setPrevCursors([]);
            queryClient.invalidateQueries({ queryKey: ["students"] });
          }}
        >
          {t("common.actions.search")}
        </button>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t("admin.students.table.name")}</th>
                <th>{t("admin.students.table.email")}</th>
                <th>{t("admin.students.table.registration")}</th>
              </tr>
            </thead>
            <tbody>
              {studentsData?.items.map((s: Student) => (
                <tr key={s.id}>
                  <td>
                    {s.firstName} {s.lastName}
                  </td>
                  <td>{s.email}</td>
                  <td>{s.registrationNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between p-4">
          <button
            className="btn"
            disabled={prevCursors.length === 0}
            onClick={handlePrev}
          >
            {t("common.pagination.previous")}
          </button>
          <button
            className="btn"
            disabled={!studentsData?.nextCursor}
            onClick={handleNext}
          >
            {t("common.pagination.next")}
          </button>
        </div>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={t("admin.students.modal.title")}
      >
        <div role="tablist" className="tabs tabs-bordered mb-4">
          <a
            role="tab"
            className={`tab ${activeTab === "single" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("single")}
          >
            {t("admin.students.modal.tabs.single")}
          </a>
          <a
            role="tab"
            className={`tab ${activeTab === "import" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("import")}
          >
            {t("admin.students.modal.tabs.import")}
          </a>
        </div>

        {activeTab === "single" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("admin.students.form.firstName")}
                </span>
              </label>
              <input className="input input-bordered" {...register("firstName")} />
              {errors.firstName && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.firstName.message}
                  </span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("admin.students.form.lastName")}
                </span>
              </label>
              <input className="input input-bordered" {...register("lastName")} />
              {errors.lastName && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.lastName.message}
                  </span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("admin.students.form.email")}
                </span>
              </label>
              <input className="input input-bordered" {...register("email")} />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.email.message}
                  </span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("admin.students.form.registration")}
                </span>
              </label>
              <input
                className="input input-bordered"
                {...register("registrationNumber")}
              />
              {errors.registrationNumber && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.registrationNumber.message}
                  </span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">
                  {t("admin.students.form.class")}
                </span>
              </label>
              <select className="select select-bordered" {...register("classId")}>
                <option value="">{t("admin.students.form.classPlaceholder")}</option>
                {classes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.classId && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.classId.message}
                  </span>
                </label>
              )}
            </div>
            <div className="modal-action">
              <button type="button" className="btn" onClick={closeModal}>
                {t("common.actions.cancel")}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  t("admin.students.form.submit")
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === "import" && (
          <div className="space-y-4">
            {!importResult && (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">
                      {t("admin.students.import.classLabel")}
                    </span>
                  </label>
                  <select
                    className="select select-bordered"
                    value={importClass}
                    onChange={(e) => setImportClass(e.target.value)}
                  >
                    <option value="">
                      {t("admin.students.form.classPlaceholder")}
                    </option>
                    {classes?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImport(f);
                  }}
                  disabled={!importClass || bulkMutation.isPending}
                />
                <button
                  className="btn"
                  type="button"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("admin.students.import.downloadTemplate")}
                </button>
              </>
            )}
            {importResult && (
              <div className="space-y-2">
                <p>
                  {t("admin.students.import.summary.created", {
                    count: importResult.createdCount,
                  })}
                </p>
                {importResult.conflicts.length > 0 && (
                  <div>
                    <p className="font-bold">
                      {t("admin.students.import.summary.conflicts.title")}
                    </p>
                    <ul className="ml-4 list-disc">
                      {importResult.conflicts.map((c, i) => (
                        <li key={i}>
                          {t("admin.students.import.summary.conflicts.item", {
                            row: c.row,
                            reason: c.reason,
                          })}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div>
                    <p className="font-bold">
                      {t("admin.students.import.summary.errors.title")}
                    </p>
                    <ul className="ml-4 list-disc">
                      {importResult.errors.map((c, i) => (
                        <li key={i}>
                          {t("admin.students.import.summary.errors.item", {
                            row: c.row,
                            reason: c.reason,
                          })}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="modal-action">
                  <button className="btn" onClick={closeModal}>
                    {t("common.actions.close")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </FormModal>
    </div>
  );
}
