/**
 * Usage examples for CodedEntitySelect component
 *
 * This file demonstrates how to use the CodedEntitySelect component
 * with different entity types (programs, classes, courses, etc.)
 */

import { BookIcon, BuildingIcon, GraduationCapIcon, SchoolIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { CodedEntitySelect } from "./coded-entity-select";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

/**
 * Example 1: Program Select
 * Basic usage with programs, showing faculty info as subtitle
 */
export function ProgramSelectExample() {
	const form = useForm({
		defaultValues: {
			programCode: "",
		},
	});

	// Fetch programs (100 most recent)
	const { data: programs = [], isLoading } = trpc.programs.list.useQuery({
		limit: 100,
	});

	// Server search (triggered by debounced search input)
	const [searchQuery, setSearchQuery] = React.useState("");
	const { data: searchResults = [] } = trpc.programs.search.useQuery(
		{ query: searchQuery },
		{ enabled: searchQuery.length >= 2 }, // Only search when 2+ characters
	);

	// Use search results if available, otherwise use default list
	const items = searchQuery.length >= 2 ? searchResults : programs;

	return (
		<form>
			<CodedEntitySelect
				items={items}
				isLoading={isLoading}
				onSearch={setSearchQuery}
				value={form.watch("programCode")}
				onChange={(code) => form.setValue("programCode", code)}
				label="Program"
				placeholder="Select a program..."
				icon={<GraduationCapIcon className="h-4 w-4" />}
				getItemIcon={() => <GraduationCapIcon className="h-4 w-4" />}
				getItemSubtitle={(program) => `Faculty: ${program.faculty?.name || "N/A"}`}
				error={form.formState.errors.programCode?.message}
				searchMode="hybrid"
			/>
		</form>
	);
}

/**
 * Example 2: Class Select
 * With cycle/level badge and academic year subtitle
 */
export function ClassSelectExample() {
	const form = useForm({
		defaultValues: {
			classCode: "",
		},
	});

	const { data: classes = [], isLoading } = trpc.classes.list.useQuery({
		limit: 100,
	});

	const [searchQuery, setSearchQuery] = React.useState("");
	const { data: searchResults = [] } = trpc.classes.search.useQuery(
		{ query: searchQuery },
		{ enabled: searchQuery.length >= 2 },
	);

	const items = searchQuery.length >= 2 ? searchResults : classes;

	return (
		<CodedEntitySelect
			items={items}
			isLoading={isLoading}
			onSearch={setSearchQuery}
			value={form.watch("classCode")}
			onChange={(code) => form.setValue("classCode", code)}
			label="Class"
			placeholder="Search for a class..."
			icon={<SchoolIcon className="h-4 w-4" />}
			getItemBadge={(cls) => cls.cycleLevel?.name || ""}
			getItemSubtitle={(cls) =>
				`${cls.program?.name || ""} • ${cls.academicYear?.name || ""}`
			}
			searchMode="hybrid"
			allowClear
		/>
	);
}

/**
 * Example 3: Course Select
 * With program badge and hours subtitle
 */
export function CourseSelectExample() {
	const form = useForm({
		defaultValues: {
			courseCode: "",
		},
	});

	const { data: courses = [], isLoading } = trpc.courses.list.useQuery({
		limit: 100,
	});

	const [searchQuery, setSearchQuery] = React.useState("");
	const { data: searchResults = [] } = trpc.courses.search.useQuery(
		{ query: searchQuery },
		{ enabled: searchQuery.length >= 2 },
	);

	const items = searchQuery.length >= 2 ? searchResults : courses;

	return (
		<CodedEntitySelect
			items={items}
			isLoading={isLoading}
			onSearch={setSearchQuery}
			value={form.watch("courseCode")}
			onChange={(code) => form.setValue("courseCode", code)}
			label="Course"
			placeholder="Search by code (e.g. INF111) or name..."
			icon={<BookIcon className="h-4 w-4" />}
			getItemBadge={(course) => course.program?.code || ""}
			getItemSubtitle={(course) =>
				`${course.hours || 0}h • ${course.defaultTeacher?.name || "No teacher"}`
			}
			searchMode="hybrid"
			required
		/>
	);
}

/**
 * Example 4: Faculty Select (Simple)
 * Minimal configuration for simple entities
 */
export function FacultySelectExample() {
	const form = useForm({
		defaultValues: {
			facultyCode: "",
		},
	});

	const { data: faculties = [], isLoading } = trpc.faculties.list.useQuery({
		limit: 100,
	});

	return (
		<CodedEntitySelect
			items={faculties}
			isLoading={isLoading}
			value={form.watch("facultyCode")}
			onChange={(code) => form.setValue("facultyCode", code)}
			label="Faculty"
			placeholder="Select a faculty..."
			icon={<BuildingIcon className="h-4 w-4" />}
			searchMode="local" // Only search in loaded items
		/>
	);
}

/**
 * Example 5: Disabled State
 * Showing how to disable the select
 */
export function DisabledSelectExample() {
	const form = useForm({
		defaultValues: {
			programCode: "",
		},
	});

	const { data: programs = [] } = trpc.programs.list.useQuery({
		limit: 100,
	});

	return (
		<CodedEntitySelect
			items={programs}
			value={form.watch("programCode")}
			onChange={(code) => form.setValue("programCode", code)}
			label="Program (disabled)"
			placeholder="Select a faculty first..."
			disabled
		/>
	);
}

/**
 * Example 6: Full Form Example
 * Complete form with validation
 */
export function FullFormExample() {
	const form = useForm({
		defaultValues: {
			facultyCode: "",
			programCode: "",
			classCode: "",
		},
	});

	const { data: faculties = [] } = trpc.faculties.list.useQuery({ limit: 100 });
	const { data: programs = [] } = trpc.programs.list.useQuery(
		{
			facultyId: form.watch("facultyCode") || undefined,
			limit: 100,
		},
		{
			enabled: !!form.watch("facultyCode"),
		},
	);
	const { data: classes = [] } = trpc.classes.list.useQuery(
		{
			programId: form.watch("programCode") || undefined,
			limit: 100,
		},
		{
			enabled: !!form.watch("programCode"),
		},
	);

	const onSubmit = (data: typeof form) => {
		console.log("Form data:", data);
	};

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
			<CodedEntitySelect
				items={faculties}
				value={form.watch("facultyCode")}
				onChange={(code) => {
					form.setValue("facultyCode", code);
					// Reset dependent fields
					form.setValue("programCode", "");
					form.setValue("classCode", "");
				}}
				label="Faculty"
				placeholder="Select a faculty..."
				required
			/>

			<CodedEntitySelect
				items={programs}
				value={form.watch("programCode")}
				onChange={(code) => {
					form.setValue("programCode", code);
					// Reset dependent field
					form.setValue("classCode", "");
				}}
				label="Program"
				placeholder={
					form.watch("facultyCode")
						? "Select a program..."
						: "Select a faculty first..."
				}
				disabled={!form.watch("facultyCode")}
				required
			/>

			<CodedEntitySelect
				items={classes}
				value={form.watch("classCode")}
				onChange={(code) => form.setValue("classCode", code)}
				label="Class"
				placeholder={
					form.watch("programCode")
						? "Select a class..."
						: "Select a program first..."
				}
				disabled={!form.watch("programCode")}
				required
			/>

			<Button type="submit">Save</Button>
		</form>
	);
}
