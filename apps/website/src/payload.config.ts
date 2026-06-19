import path from "node:path";
import { fileURLToPath } from "node:url";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { resendAdapter } from "@payloadcms/email-resend";
import { buildConfig, type PayloadRequest } from "payload";
import sharp from "sharp";
import { defaultLexical } from "@/fields/defaultLexical";
import { Categories } from "./collections/Categories";
import { InstanceEvents } from "./collections/InstanceEvents";
import { InstanceRequests } from "./collections/InstanceRequests";
import { Invoices } from "./collections/Invoices";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Payments } from "./collections/Payments";
import { Posts } from "./collections/Posts";
import { Subscriptions } from "./collections/Subscriptions";
import { SupportTickets } from "./collections/SupportTickets";
import { Users } from "./collections/Users";
import { Footer } from "./Footer/config";
import { DeploySettings } from "./globals/DeploySettings";
import { Header } from "./Header/config";
import { plugins } from "./plugins";
import { getServerSideURL } from "./utilities/getURL";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
	admin: {
		meta: {
			titleSuffix: "— TKAMS",
			icons: { icon: "/favicon.ico" },
			openGraph: {
				images: [{ url: "/logo-tkams.png" }],
				title: "TKAMS Admin",
				description: "Panneau d'administration TKAMS",
			},
		},
		theme: "light",
		components: {
			graphics: {
				Logo: "@/components/admin/Logo",
				Icon: "@/components/admin/Icon",
			},
			beforeLogin: ["@/components/BeforeLogin"],
			beforeDashboard: ["@/components/BeforeDashboard"],
		},
		importMap: {
			baseDir: path.resolve(dirname),
		},
		user: Users.slug,
		livePreview: {
			breakpoints: [
				{
					label: "Mobile",
					name: "mobile",
					width: 375,
					height: 667,
				},
				{
					label: "Tablet",
					name: "tablet",
					width: 768,
					height: 1024,
				},
				{
					label: "Desktop",
					name: "desktop",
					width: 1440,
					height: 900,
				},
			],
		},
	},
	// Email — Resend when API key present, nodemailer (SMTP) otherwise
	email: process.env.RESEND_API_KEY
		? resendAdapter({
				defaultFromAddress: process.env.EMAIL_FROM ?? "noreply@tkams.com",
				defaultFromName: "TKAMS",
				apiKey: process.env.RESEND_API_KEY,
			})
		: nodemailerAdapter({
				defaultFromAddress: process.env.EMAIL_FROM ?? "noreply@tkams.com",
				defaultFromName: "TKAMS",
				transportOptions: {
					host: process.env.SMTP_HOST ?? "mail.privateemail.com",
					port: Number(process.env.SMTP_PORT ?? 587),
					secure: Number(process.env.SMTP_PORT ?? 587) === 465,
					...(process.env.SMTP_USER && process.env.SMTP_PASS
						? {
								auth: {
									user: process.env.SMTP_USER,
									pass: process.env.SMTP_PASS,
								},
							}
						: {}),
					tls: { rejectUnauthorized: false },
				},
			}),
	// This config helps us configure global or default features that the other editors can inherit
	editor: defaultLexical,
	db: mongooseAdapter({
		url: process.env.DATABASE_URL || "",
	}),
	collections: [
		Pages,
		Posts,
		Media,
		Categories,
		Users,
		InstanceRequests,
		InstanceEvents,
		Invoices,
		Payments,
		Subscriptions,
		SupportTickets,
	],
	cors: [getServerSideURL()].filter(Boolean),
	globals: [Header, Footer, DeploySettings],
	plugins,
	secret: process.env.PAYLOAD_SECRET,
	sharp,
	typescript: {
		outputFile: path.resolve(dirname, "payload-types.ts"),
	},
	jobs: {
		access: {
			run: ({ req }: { req: PayloadRequest }): boolean => {
				// Allow logged in users to execute this endpoint (default)
				if (req.user) return true;

				const secret = process.env.CRON_SECRET;
				if (!secret) return false;

				// If there is no logged in user, then check
				// for the Vercel Cron secret to be present as an
				// Authorization header:
				const authHeader = req.headers.get("authorization");
				return authHeader === `Bearer ${secret}`;
			},
		},
		tasks: [],
	},
});
