import type { RouterOutputs } from "@/utils/trpc";
import type { Session } from "../types";

type Institution = RouterOutputs["institutions"]["get"];

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS: Record<string, string> = {
	mon: "Lundi",
	tue: "Mardi",
	wed: "Mercredi",
	thu: "Jeudi",
	fri: "Vendredi",
	sat: "Samedi",
	sun: "Dimanche",
};

/**
 * Opens a printable A4 landscape timetable (institution header, one column
 * per day, one row per start time) in a new window and prints it.
 */
export function printTimetable(
	sessions: Session[],
	inst: Institution | null | undefined,
	yearName: string,
) {
	if (sessions.length === 0) return;

	// Unique sorted time slots (start times)
	const timeSlots = [...new Set(sessions.map((s) => s.startTime))].sort();

	// Days present in filtered sessions, sorted by natural week order
	const days = [...new Set(sessions.map((s) => s.dayOfWeek))].sort(
		(a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b),
	);

	// Context metadata
	const uniqueClasses = [
		...new Set(
			sessions.map((s) => s.classCourse?.classRef?.name).filter(Boolean),
		),
	];
	const contextLabel = [
		uniqueClasses.length <= 3
			? uniqueClasses.join(", ")
			: `${uniqueClasses.length} classes`,
		yearName,
	]
		.filter(Boolean)
		.join(" — ");

	// Institution branding
	const logoHtml = inst?.logoSvg
		? `<div class="logo">${inst.logoSvg}</div>`
		: inst?.logoUrl
			? `<img class="logo" src="${inst.logoUrl}" alt="Logo" />`
			: inst?.nameFr
				? `<div class="logo-initials">${inst.nameFr.slice(0, 2).toUpperCase()}</div>`
				: "";

	const instName = inst?.nameFr ?? inst?.nameEn ?? "";
	const instSub = [inst?.addressFr, inst?.contactPhone, inst?.contactEmail]
		.filter(Boolean)
		.join(" · ");

	// Build grid
	const headerCells = days
		.map((d) => `<th>${DAY_LABELS[d] ?? d}</th>`)
		.join("");

	const bodyRows = timeSlots
		.map((slot) => {
			const slotSessions = sessions.filter((s) => s.startTime === slot);
			const latestEnd =
				slotSessions
					.map((s) => s.endTime)
					.sort()
					.at(-1) ?? "";

			const cells = days
				.map((day) => {
					const daySessions = slotSessions.filter((s) => s.dayOfWeek === day);
					if (daySessions.length === 0) return "<td></td>";

					const cards = daySessions
						.map((s) => {
							const course = s.classCourse?.courseRef?.name ?? "";
							const cls =
								uniqueClasses.length > 1
									? (s.classCourse?.classRef?.name ?? "")
									: "";
							const tr = s.classCourse?.teacherRef as
								| { firstName?: string; lastName?: string }
								| null
								| undefined;
							const teacher = tr
								? `${tr.firstName ?? ""} ${tr.lastName ?? ""}`.trim()
								: "";
							const room = s.roomRef?.name ?? s.room ?? "";
							return `<div class="card">
  <div class="course">${course}</div>
  ${cls ? `<div class="meta">${cls}</div>` : ""}
  ${teacher ? `<div class="meta">${teacher}</div>` : ""}
  ${room ? `<div class="room">📍 ${room}</div>` : ""}
</div>`;
						})
						.join("");

					return `<td>${cards}</td>`;
				})
				.join("");

			return `<tr>
  <td class="time-col">
    <span class="ts">${slot}</span>
    ${latestEnd ? `<span class="te">${latestEnd}</span>` : ""}
  </td>
  ${cells}
</tr>`;
		})
		.join("");

	const printDate = new Date().toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});

	const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Emploi du temps${contextLabel ? ` — ${contextLabel}` : ""}</title>
<style>
@page { size: A4 landscape; margin: 1.2cm; }
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:Arial,Helvetica,sans-serif;font-size:9pt;color:#111;}

/* Header */
.header{display:flex;align-items:center;gap:14px;border-bottom:2.5px solid #1e293b;padding-bottom:10px;margin-bottom:12px;}
.logo{width:60px;height:60px;object-fit:contain;flex-shrink:0;}
.logo svg{width:60px;height:60px;}
.logo-initials{width:60px;height:60px;border-radius:8px;background:#1e293b;color:#fff;font-size:20pt;font-weight:bold;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.inst{flex:1;}
.inst-name{font-size:13pt;font-weight:bold;color:#1e293b;line-height:1.2;}
.inst-sub{font-size:7.5pt;color:#64748b;margin-top:3px;}
.print-date{font-size:7.5pt;color:#94a3b8;text-align:right;align-self:flex-end;}

/* Title */
.title{text-align:center;font-size:12pt;font-weight:bold;color:#1e293b;margin-bottom:10px;}

/* Table */
table{width:100%;border-collapse:collapse;table-layout:fixed;}
col.tc{width:58px;}
th{background:#1e293b;color:#fff;padding:6px 5px;font-size:9pt;text-align:center;border:1px solid #334155;}
th.th-time{background:#334155;}
td{border:1px solid #e2e8f0;vertical-align:top;padding:3px;}
td.time-col{background:#f8fafc;text-align:center;vertical-align:middle;padding:4px;border-color:#cbd5e1;}
.ts{display:block;font-weight:bold;font-size:9pt;color:#334155;}
.te{display:block;font-size:7pt;color:#94a3b8;}

/* Cards */
.card{background:#eff6ff;border-left:3px solid #3b82f6;border-radius:2px;padding:4px 5px;margin-bottom:3px;}
.card:last-child{margin-bottom:0;}
.course{font-weight:bold;font-size:8.5pt;color:#1e3a5f;line-height:1.3;}
.meta{font-size:7.5pt;color:#475569;margin-top:1px;}
.room{font-size:7pt;color:#6366f1;margin-top:1px;}

/* Footer */
.footer{margin-top:12px;border-top:1px solid #e2e8f0;padding-top:7px;display:flex;justify-content:space-between;font-size:7.5pt;color:#94a3b8;}
</style>
</head>
<body>
<div class="header">
  ${logoHtml}
  <div class="inst">
    ${instName ? `<div class="inst-name">${instName}</div>` : ""}
    ${instSub ? `<div class="inst-sub">${instSub}</div>` : ""}
  </div>
  <div class="print-date">Généré le ${printDate}</div>
</div>

<div class="title">Emploi du Temps${contextLabel ? ` — ${contextLabel}` : ""}</div>

<table>
  <colgroup>
    <col class="tc"/>
    ${days.map(() => "<col/>").join("")}
  </colgroup>
  <thead>
    <tr><th class="th-time">Heure</th>${headerCells}</tr>
  </thead>
  <tbody>${bodyRows}</tbody>
</table>

<div class="footer">
  <span>${[uniqueClasses.slice(0, 5).join(", "), yearName].filter(Boolean).join(" · ")}</span>
  <span>${sessions.length} séance${sessions.length > 1 ? "s" : ""}</span>
</div>

<script>window.addEventListener("load",function(){window.print();});</script>
</body>
</html>`;

	const w = window.open("", "_blank", "width=1200,height=800");
	if (!w) return;
	w.document.write(html);
	w.document.close();
}
